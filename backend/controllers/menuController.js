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

/**
 * Get ingredients for a specific menu item
 * @route GET /api/menu/:id/ingredients
 * @param {number} id - Menu item ID (from URL params)
 * @returns {Array} Array of ingredients with ingredientid, ingredientname, and ingredientqty
 */
const getMenuItemIngredients = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                mi.ingredientid,
                i.ingredientname,
                mi.ingredientqty
            FROM menuitemingredients mi
            INNER JOIN inventory i ON mi.ingredientid = i.ingredientid
            WHERE mi.menuitemid = $1
            ORDER BY i.ingredientname
        `;
        const result = await pool.query(query, [id]);
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching menu item ingredients:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Update ingredient quantity for a menu item
 * @route PUT /api/menu/:id/ingredients/:ingredientId
 * @param {number} id - Menu item ID (from URL params)
 * @param {number} ingredientId - Ingredient ID (from URL params)
 * @param {number} ingredientqty - New quantity value (from request body)
 * @returns {Object} Updated menu item ingredient
 */
const updateMenuItemIngredient = async (req, res) => {
    try {
        const { id, ingredientId } = req.params;
        const { ingredientqty } = req.body;

        // Validate required parameter
        if (ingredientqty === undefined || ingredientqty < 0) {
            return res.status(400).json({ success: false, error: 'ingredientqty is required and must be non-negative' });
        }

        // Update menu item ingredient quantity
        const query = 'UPDATE menuitemingredients SET ingredientqty = $1 WHERE menuitemid = $2 AND ingredientid = $3 RETURNING *';
        const result = await pool.query(query, [ingredientqty, id, ingredientId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Menu item ingredient not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating menu item ingredient:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Add an ingredient to a menu item
 * @route POST /api/menu/:id/ingredients
 * @param {number} id - Menu item ID (from URL params)
 * @param {number} ingredientid - Ingredient ID (from request body)
 * @param {number} ingredientqty - Quantity value (from request body)
 * @returns {Object} Newly created menu item ingredient
 */
const addMenuItemIngredient = async (req, res) => {
    try {
        const { id } = req.params;
        const { ingredientid, ingredientqty } = req.body;

        // Validate required fields
        if (ingredientid === undefined || ingredientqty === undefined || ingredientqty < 0) {
            return res.status(400).json({ success: false, error: 'ingredientid and ingredientqty are required, and ingredientqty must be non-negative' });
        }

        // Check if ingredient already exists for this menu item
        const checkQuery = 'SELECT * FROM menuitemingredients WHERE menuitemid = $1 AND ingredientid = $2';
        const checkResult = await pool.query(checkQuery, [id, ingredientid]);
        
        if (checkResult.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Ingredient already exists for this menu item. Use update instead.' });
        }

        // Generate next available ID
        const idResult = await pool.query('SELECT COALESCE(MAX(menuitemingredientid), 0) + 1 as next_id FROM menuitemingredients');
        const nextId = idResult.rows[0].next_id;

        // Add menu item ingredient
        const query = 'INSERT INTO menuitemingredients (menuitemingredientid, menuitemid, ingredientid, ingredientqty) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await pool.query(query, [nextId, id, ingredientid, ingredientqty]);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error adding menu item ingredient:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Remove an ingredient from a menu item
 * @route DELETE /api/menu/:id/ingredients/:ingredientId
 * @param {number} id - Menu item ID (from URL params)
 * @param {number} ingredientId - Ingredient ID (from URL params)
 * @returns {Object} Success confirmation
 */
const removeMenuItemIngredient = async (req, res) => {
    try {
        const { id, ingredientId } = req.params;

        // Delete menu item ingredient
        const query = 'DELETE FROM menuitemingredients WHERE menuitemid = $1 AND ingredientid = $2 RETURNING *';
        const result = await pool.query(query, [id, ingredientId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Menu item ingredient not found' });
        }

        res.json({ success: true, message: 'Ingredient removed successfully' });
    } catch (error) {
        console.error('Error removing menu item ingredient:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getAllMenuItems,
    addMenuItem,
    updateMenuItemPrice,
    getMenuItemIngredients,
    updateMenuItemIngredient,
    addMenuItemIngredient,
    removeMenuItemIngredient
};