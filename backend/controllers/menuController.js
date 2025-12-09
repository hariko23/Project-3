const pool = require('../config/database');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Get all menu items
 * @route GET /api/menu
 * @returns {Array} Array of menu items with menuitemid, drinkcategory, menuitemname, price, and image_url
 */
const getAllMenuItems = asyncHandler(async (req, res) => {
    const query = 'SELECT menuitemid, drinkcategory, menuitemname, price, image_url FROM menuitems ORDER BY menuitemname';
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
});

/**
 * Add a new menu item
 * @route POST /api/menu
 * @param {string} drinkcategory - Category of the drink (e.g., "Milk Tea", "Fruit Tea")
 * @param {string} menuitemname - Name of the menu item
 * @param {number} price - Price of the menu item
 * @param {string} image_url - Optional image URL for the menu item
 * @returns {Object} The newly created menu item
 */
const addMenuItem = asyncHandler(async (req, res) => {
    const { drinkcategory, menuitemname, price, image_url } = req.body;
    
    // Validate required fields
    if (!drinkcategory || !menuitemname || price === undefined) {
        throw new AppError('Missing required fields', 400);
    }

    // Generate next available ID
    const idResult = await pool.query('SELECT COALESCE(MAX(menuitemid), 0) + 1 as next_id FROM menuitems');
    const nextId = idResult.rows[0].next_id;

    const query = 'INSERT INTO menuitems (menuitemid, drinkcategory, menuitemname, price, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const result = await pool.query(query, [nextId, drinkcategory, menuitemname, price, image_url || null]);
    
    res.status(201).json({ success: true, data: result.rows[0] });
});

/**
 * Update the price of a menu item
 * @route PUT /api/menu/:id/price
 * @param {number} id - Menu item ID (from URL params)
 * @param {number} newPrice - New price value (from request body)
 * @returns {Object} Updated menu item
 */
const updateMenuItemPrice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newPrice } = req.body;

    // Validate required parameter
    if (newPrice === undefined) {
        throw new AppError('newPrice is required', 400);
    }

    // Update menu item price
    const query = 'UPDATE menuitems SET price = $1 WHERE menuitemid = $2 RETURNING *';
    const result = await pool.query(query, [newPrice, id]);

    if (result.rows.length === 0) {
        throw new AppError('Menu item not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
});

/**
 * Update a menu item (name, category, price, image_url)
 * @route PUT /api/menu/:id
 * @param {number} id - Menu item ID (from URL params)
 * @param {string} drinkcategory - Category of the drink (optional)
 * @param {string} menuitemname - Name of the menu item (optional)
 * @param {number} price - Price of the menu item (optional)
 * @param {string} image_url - Image URL of the menu item (optional)
 * @returns {Object} Updated menu item
 */
const updateMenuItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { drinkcategory, menuitemname, price, image_url } = req.body;

    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (drinkcategory !== undefined) {
        updates.push(`drinkcategory = $${paramCount}`);
        values.push(drinkcategory);
        paramCount++;
    }

    if (menuitemname !== undefined) {
        updates.push(`menuitemname = $${paramCount}`);
        values.push(menuitemname);
        paramCount++;
    }

    if (price !== undefined) {
        updates.push(`price = $${paramCount}`);
        values.push(price);
        paramCount++;
    }

    if (image_url !== undefined) {
        updates.push(`image_url = $${paramCount}`);
        values.push(image_url);
        paramCount++;
    }

    if (updates.length === 0) {
        throw new AppError('At least one field must be provided for update', 400);
    }

    values.push(id);
    const query = `UPDATE menuitems SET ${updates.join(', ')} WHERE menuitemid = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
        throw new AppError('Menu item not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
});

/**
 * Delete a menu item
 * @route DELETE /api/menu/:id
 * @param {number} id - Menu item ID (from URL params)
 * @returns {Object} Success confirmation
 */
const deleteMenuItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // First, delete associated menu item ingredients
    await pool.query('DELETE FROM menuitemingredients WHERE menuitemid = $1', [id]);

    // Then delete the menu item
    const query = 'DELETE FROM menuitems WHERE menuitemid = $1 RETURNING *';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
        throw new AppError('Menu item not found', 404);
    }

    res.json({ success: true, message: 'Menu item deleted successfully' });
});

/**
 * Get ingredients for a specific menu item
 * @route GET /api/menu/:id/ingredients
 * @param {number} id - Menu item ID (from URL params)
 * @returns {Array} Array of ingredients with ingredientid, ingredientname, and ingredientqty
 */
const getMenuItemIngredients = asyncHandler(async (req, res) => {
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
});

/**
 * Update ingredient quantity for a menu item
 * @route PUT /api/menu/:id/ingredients/:ingredientId
 * @param {number} id - Menu item ID (from URL params)
 * @param {number} ingredientId - Ingredient ID (from URL params)
 * @param {number} ingredientqty - New quantity value (from request body)
 * @returns {Object} Updated menu item ingredient
 */
const updateMenuItemIngredient = asyncHandler(async (req, res) => {
    const { id, ingredientId } = req.params;
    const { ingredientqty } = req.body;

    // Validate required parameter
    if (ingredientqty === undefined || ingredientqty < 0) {
        throw new AppError('ingredientqty is required and must be non-negative', 400);
    }

    // Update menu item ingredient quantity
    const query = 'UPDATE menuitemingredients SET ingredientqty = $1 WHERE menuitemid = $2 AND ingredientid = $3 RETURNING *';
    const result = await pool.query(query, [ingredientqty, id, ingredientId]);

    if (result.rows.length === 0) {
        throw new AppError('Menu item ingredient not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
});

/**
 * Add an ingredient to a menu item
 * @route POST /api/menu/:id/ingredients
 * @param {number} id - Menu item ID (from URL params)
 * @param {number} ingredientid - Ingredient ID (from request body)
 * @param {number} ingredientqty - Quantity value (from request body)
 * @returns {Object} Newly created menu item ingredient
 */
const addMenuItemIngredient = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { ingredientid, ingredientqty } = req.body;

    // Validate required fields
    if (ingredientid === undefined || ingredientqty === undefined || ingredientqty < 0) {
        throw new AppError('ingredientid and ingredientqty are required, and ingredientqty must be non-negative', 400);
    }

    // Check if ingredient already exists for this menu item
    const checkQuery = 'SELECT * FROM menuitemingredients WHERE menuitemid = $1 AND ingredientid = $2';
    const checkResult = await pool.query(checkQuery, [id, ingredientid]);
    
    if (checkResult.rows.length > 0) {
        throw new AppError('Ingredient already exists for this menu item. Use update instead.', 400);
    }

    // Generate next available ID
    const idResult = await pool.query('SELECT COALESCE(MAX(menuitemingredientid), 0) + 1 as next_id FROM menuitemingredients');
    const nextId = idResult.rows[0].next_id;

    // Add menu item ingredient
    const query = 'INSERT INTO menuitemingredients (menuitemingredientid, menuitemid, ingredientid, ingredientqty) VALUES ($1, $2, $3, $4) RETURNING *';
    const result = await pool.query(query, [nextId, id, ingredientid, ingredientqty]);

    res.status(201).json({ success: true, data: result.rows[0] });
});

/**
 * Remove an ingredient from a menu item
 * @route DELETE /api/menu/:id/ingredients/:ingredientId
 * @param {number} id - Menu item ID (from URL params)
 * @param {number} ingredientId - Ingredient ID (from URL params)
 * @returns {Object} Success confirmation
 */
const removeMenuItemIngredient = asyncHandler(async (req, res) => {
    const { id, ingredientId } = req.params;

    // Delete menu item ingredient
    const query = 'DELETE FROM menuitemingredients WHERE menuitemid = $1 AND ingredientid = $2 RETURNING *';
    const result = await pool.query(query, [id, ingredientId]);

    if (result.rows.length === 0) {
        throw new AppError('Menu item ingredient not found', 404);
    }

    res.json({ success: true, message: 'Ingredient removed successfully' });
});

module.exports = {
    getAllMenuItems,
    addMenuItem,
    updateMenuItemPrice,
    updateMenuItem,
    deleteMenuItem,
    getMenuItemIngredients,
    updateMenuItemIngredient,
    addMenuItemIngredient,
    removeMenuItemIngredient
};