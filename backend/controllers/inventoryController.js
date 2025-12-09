const pool = require('../config/database');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Get all inventory items
 * @route GET /api/inventory
 * @returns {Array} Array of inventory items with ingredientid, ingredientname, and ingredientcount
 */
const getAllInventory = asyncHandler(async (req, res) => {
    const query = 'SELECT ingredientid, ingredientname, ingredientcount FROM inventory ORDER BY ingredientname';
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
});

/**
 * Add a new inventory item
 * @route POST /api/inventory
 * @param {string} ingredientname - Name of the ingredient
 * @param {number} ingredientcount - Initial quantity of the ingredient
 * @returns {Object} The newly created inventory item
 */
const addInventoryItem = asyncHandler(async (req, res) => {
    const { ingredientname, ingredientcount } = req.body;
    
    // Validate required fields
    if (!ingredientname || ingredientcount === undefined) {
        throw new AppError('Missing required fields', 400);
    }

    // Generate next available ID
    const idResult = await pool.query('SELECT COALESCE(MAX(ingredientid), 0) + 1 as next_id FROM inventory');
    const nextId = idResult.rows[0].next_id;

    const query = 'INSERT INTO inventory (ingredientid, ingredientname, ingredientcount) VALUES ($1, $2, $3) RETURNING *';
    const result = await pool.query(query, [nextId, ingredientname, ingredientcount]);
    
    res.status(201).json({ success: true, data: result.rows[0] });
});

/**
 * Update the quantity of an inventory item
 * @route PUT /api/inventory/:id/quantity
 * @param {number} id - Inventory item ID (from URL params)
 * @param {number} newQuantity - New quantity value (from request body)
 * @returns {Object} Updated inventory item
 */
const updateInventoryQuantity = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newQuantity } = req.body;

    // Validate required parameter
    if (newQuantity === undefined) {
        throw new AppError('newQuantity is required', 400);
    }

    // Update inventory quantity
    const query = 'UPDATE inventory SET ingredientcount = $1 WHERE ingredientid = $2 RETURNING *';
    const result = await pool.query(query, [newQuantity, id]);

    if (result.rows.length === 0) {
        throw new AppError('Inventory item not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
});

module.exports = {
    getAllInventory,
    addInventoryItem,
    updateInventoryQuantity
};