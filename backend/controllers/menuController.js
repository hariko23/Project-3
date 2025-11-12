const pool = require('../config/database');

/**
 * Get all menu items
 * @route GET /api/menu
 * @returns {Array} Array of menu items with menuitemid, drinkcategory, menuitemname, and price
 */
const getAllMenuItems = async (req, res) => {
    try {
        const query = 'SELECT menuitemid, drinkcategory, menuitemname, price FROM menuitems ORDER BY menuitemname';
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Add a new menu item
 * @route POST /api/menu
 * @param {string} drinkcategory - Category of the drink (e.g., "Milk Tea", "Fruit Tea")
 * @param {string} menuitemname - Name of the menu item
 * @param {number} price - Price of the menu item
 * @returns {Object} The newly created menu item
 */
const addMenuItem = async (req, res) => {
    try {
        const { drinkcategory, menuitemname, price } = req.body;
        
        // Validate required fields
        if (!drinkcategory || !menuitemname || price === undefined) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Generate next available ID
        const idResult = await pool.query('SELECT COALESCE(MAX(menuitemid), 0) + 1 as next_id FROM menuitems');
        const nextId = idResult.rows[0].next_id;

        const query = 'INSERT INTO menuitems (menuitemid, drinkcategory, menuitemname, price) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await pool.query(query, [nextId, drinkcategory, menuitemname, price]);
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error adding menu item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Update the price of a menu item
 * @route PUT /api/menu/:id/price
 * @param {number} id - Menu item ID (from URL params)
 * @param {number} newPrice - New price value (from request body)
 * @returns {Object} Updated menu item
 */
const updateMenuItemPrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPrice } = req.body;

        // Validate required parameter
        if (newPrice === undefined) {
            return res.status(400).json({ success: false, error: 'newPrice is required' });
        }

        // Update menu item price
        const query = 'UPDATE menuitems SET price = $1 WHERE menuitemid = $2 RETURNING *';
        const result = await pool.query(query, [newPrice, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Menu item not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating menu item price:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getAllMenuItems,
    addMenuItem,
    updateMenuItemPrice
};