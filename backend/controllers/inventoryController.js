const pool = require('../config/database');

/**
 * Get all inventory items
 * @route GET /api/inventory
 * @returns {Array} Array of inventory items with ingredientid, ingredientname, and ingredientcount
 */
const getAllInventory = async (req, res) => {
    try {
        const query = 'SELECT ingredientid, ingredientname, ingredientcount FROM inventory ORDER BY ingredientname';
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Add a new inventory item
 * @route POST /api/inventory
 * @param {string} ingredientname - Name of the ingredient
 * @param {number} ingredientcount - Initial quantity of the ingredient
 * @returns {Object} The newly created inventory item
 */
const addInventoryItem = async (req, res) => {
    try {
        const { ingredientname, ingredientcount } = req.body;
        
        // Validate required fields
        if (!ingredientname || ingredientcount === undefined) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Generate next available ID
        const idResult = await pool.query('SELECT COALESCE(MAX(ingredientid), 0) + 1 as next_id FROM inventory');
        const nextId = idResult.rows[0].next_id;

        const query = 'INSERT INTO inventory (ingredientid, ingredientname, ingredientcount) VALUES ($1, $2, $3) RETURNING *';
        const result = await pool.query(query, [nextId, ingredientname, ingredientcount]);
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error adding inventory item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Update the quantity of an inventory item
 * @route PUT /api/inventory/:id/quantity
 * @param {number} id - Inventory item ID (from URL params)
 * @param {number} newQuantity - New quantity value (from request body)
 * @returns {Object} Updated inventory item
 */
const updateInventoryQuantity = async (req, res) => {
    try {
        const { id } = req.params;
        const { newQuantity } = req.body;

        // Validate required parameter
        if (newQuantity === undefined) {
            return res.status(400).json({ success: false, error: 'newQuantity is required' });
        }

        // Update inventory quantity
        const query = 'UPDATE inventory SET ingredientcount = $1 WHERE ingredientid = $2 RETURNING *';
        const result = await pool.query(query, [newQuantity, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Inventory item not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating inventory quantity:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getAllInventory,
    addInventoryItem,
    updateInventoryQuantity
};