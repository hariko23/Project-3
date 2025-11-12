const pool = require('../config/database');

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

const createOrder = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const { timeoforder, customerid, employeeid, totalcost, orderweek, orderItems } = req.body;

        if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
            return res.status(400).json({ success: false, error: 'Order must contain at least one item' });
        }

        // Validate inventory
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

        // Get next order ID
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

const getOrderItems = async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log('Fetching order items for orderId:', orderId);
        
        // First check if order exists
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

const getOrderItemById = async (req, res) => {
    try {
        const { orderItemId } = req.params;
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