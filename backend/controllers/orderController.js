const pool = require('../config/database');

/**
 * Get all orders
 * @route GET /api/orders
 * @returns {Array} Array of all orders sorted by time of order (newest first)
 */
const getAllOrders = async (req, res) => {
    try {
        const query = 'SELECT orderid, timeoforder, customerid, employeeid, totalcost, orderweek, is_complete FROM orders ORDER BY timeoforder DESC';
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Create a new order
 * This function handles the complete order creation process:
 * 1. Validates inventory availability
 * 2. Creates the order record
 * 3. Creates order item records
 * 4. Updates inventory quantities
 * All operations are wrapped in a database transaction
 * @route POST /api/orders
 * @param {string} timeoforder - Order timestamp (ISO string)
 * @param {number|null} customerid - Customer ID (optional)
 * @param {number} employeeid - Employee ID who created the order
 * @param {number} totalcost - Total cost of the order
 * @param {number} orderweek - Week number of the order
 * @param {Array} orderItems - Array of order items with menuitemid and quantity
 * @returns {Object} The newly created order
 */
const createOrder = async (req, res) => {
    const client = await pool.connect();
    
    try {
        // Start database transaction
        await client.query('BEGIN');

        const { timeoforder, customerid, employeeid, totalcost, orderweek, orderItems } = req.body;

        // Validate that order has items
        if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
            return res.status(400).json({ success: false, error: 'Order must contain at least one item' });
        }

        // Validate inventory availability for all items
        for (const orderItem of orderItems) {
            const checkQuery = `
                SELECT i.ingredientID, i.ingredientCount, mi.ingredientQty 
                FROM inventory i 
                INNER JOIN MenuItemIngredients mi ON i.ingredientID = mi.ingredientID 
                WHERE mi.menuItemID = $1
            `;
            const ingredientResult = await client.query(checkQuery, [orderItem.menuitemid]);
            
            for (const row of ingredientResult.rows) {
                const available = row.ingredientcount;
                const requiredPerDrink = row.ingredientqty;
                const totalRequired = requiredPerDrink * orderItem.quantity;
                
                if (available < totalRequired) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ 
                        success: false, 
                        error: `Insufficient inventory for ingredient ID: ${row.ingredientid}` 
                    });
                }
            }
        }

        // Get next order ID using advisory lock to prevent race conditions
        // Lock ID 1 for order ID generation
        await client.query('SELECT pg_advisory_xact_lock(1)');
        const orderIdResult = await client.query('SELECT COALESCE(MAX(orderid), 0) + 1 as next_id FROM orders');
        const orderId = orderIdResult.rows[0].next_id;

        // Insert order
        const orderQuery = 'INSERT INTO orders (orderid, timeoforder, customerid, employeeid, totalcost, orderweek, is_complete) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
        const orderResult = await client.query(orderQuery, [
            orderId,
            timeoforder || new Date(),
            customerid || null,
            employeeid,
            totalcost,
            orderweek,
            false // New orders are incomplete by default
        ]);

        // Insert order items
        // Lock ID 2 for order item ID generation (different from order ID lock)
        await client.query('SELECT pg_advisory_xact_lock(2)');
        const itemQuery = 'INSERT INTO orderitems (orderitemid, orderid, menuitemid, quantity, is_complete) VALUES ($1, $2, $3, $4, $5)';
        for (const item of orderItems) {
            const itemIdResult = await client.query('SELECT COALESCE(MAX(orderitemid), 0) + 1 as next_id FROM orderitems');
            const itemId = itemIdResult.rows[0].next_id;
            await client.query(itemQuery, [itemId, orderId, item.menuitemid, item.quantity, false]);
        }

        // Update inventory
        for (const orderItem of orderItems) {
            const ingredientQuery = 'SELECT ingredientID, ingredientQty FROM MenuItemIngredients WHERE menuItemID = $1';
            const ingredientResult = await client.query(ingredientQuery, [orderItem.menuitemid]);
            
            for (const row of ingredientResult.rows) {
                const totalNeeded = row.ingredientqty * orderItem.quantity;
                const updateQuery = 'UPDATE inventory SET ingredientCount = ingredientCount - $1 WHERE ingredientID = $2';
                await client.query(updateQuery, [totalNeeded, row.ingredientid]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, data: orderResult.rows[0] });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
};

/**
 * Get all items for a specific order
 * @route GET /api/orders/:orderId/items
 * @param {number} orderId - Order ID (from URL params)
 * @returns {Array} Array of order items with menu item details
 */
const getOrderItems = async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log('Fetching order items for orderId:', orderId);
        
        // Verify order exists before fetching items
        const orderCheck = await pool.query('SELECT orderid FROM orders WHERE orderid = $1', [orderId]);
        if (orderCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // Check if is_complete column exists
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'orderitems' AND column_name = 'is_complete'
        `);
        const hasIsCompleteColumn = columnCheck.rows.length > 0;

        // Query order items - handle case where is_complete might not exist
        let query;
        if (hasIsCompleteColumn) {
            query = `
                SELECT oi.orderitemid, oi.orderid, oi.menuitemid, oi.quantity, 
                       COALESCE(oi.is_complete, false) as is_complete,
                       mi.menuitemname, mi.price
                FROM orderitems oi
                INNER JOIN menuitems mi ON oi.menuitemid = mi.menuitemid
                WHERE oi.orderid = $1
                ORDER BY oi.orderitemid
            `;
        } else {
            // Fallback query if is_complete column doesn't exist
            query = `
                SELECT oi.orderitemid, oi.orderid, oi.menuitemid, oi.quantity, 
                       false as is_complete,
                       mi.menuitemname, mi.price
                FROM orderitems oi
                INNER JOIN menuitems mi ON oi.menuitemid = mi.menuitemid
                WHERE oi.orderid = $1
                ORDER BY oi.orderitemid
            `;
        }
        
        const result = await pool.query(query, [orderId]);
        console.log(`Found ${result.rows.length} order items for order ${orderId}`);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching order items:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get a single order item by ID
 * @route GET /api/orders/items/:orderItemId
 * @param {number} orderItemId - Order item ID (from URL params)
 * @returns {Object} Order item with menu item details
 */
const getOrderItemById = async (req, res) => {
    try {
        const { orderItemId } = req.params;
        // Get order item with menu item details
        const query = `
            SELECT oi.*, mi.menuitemname, mi.price
            FROM orderitems oi
            INNER JOIN menuitems mi ON oi.menuitemid = mi.menuitemid
            WHERE oi.orderitemid = $1
        `;
        const result = await pool.query(query, [orderItemId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Order item not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching order item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Mark an order item as complete or incomplete
 * Also checks if all items in the order are complete and updates the order status accordingly
 * @route PATCH /api/orders/items/:orderItemId/complete
 * @param {number} orderItemId - Order item ID (from URL params)
 * @param {boolean} isComplete - Completion status (from request body)
 * @returns {Object} Updated order item
 */
const markOrderItemComplete = async (req, res) => {
    try {
        const { orderItemId } = req.params;
        const { isComplete } = req.body;
        
        // Update the order item completion status
        const updateQuery = 'UPDATE orderitems SET is_complete = $1 WHERE orderitemid = $2 RETURNING *';
        const result = await pool.query(updateQuery, [isComplete !== false, orderItemId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Order item not found' });
        }
        
        // Check if all items in the order are complete, and update order status if so
        const orderId = result.rows[0].orderid;
        const checkQuery = `
            SELECT COUNT(*) as total, SUM(CASE WHEN is_complete = true THEN 1 ELSE 0 END) as completed
            FROM orderitems
            WHERE orderid = $1
        `;
        const checkResult = await pool.query(checkQuery, [orderId]);
        const { total, completed } = checkResult.rows[0];
        
        if (parseInt(completed) === parseInt(total)) {
            // All items are complete, mark the order as complete
            await pool.query('UPDATE orders SET is_complete = true WHERE orderid = $1', [orderId]);
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating order item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getAllOrders,
    createOrder,
    getOrderItems,
    getOrderItemById,
    markOrderItemComplete
};