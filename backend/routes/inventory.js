const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { validate, updateInventorySchema, idParamSchema } = require('../middleware/validation');

// Inventory routes
// GET /api/inventory - Get all inventory items
router.get('/', inventoryController.getAllInventory);
// POST /api/inventory - Add a new inventory item
router.post('/', inventoryController.addInventoryItem);
// PUT /api/inventory/:id/quantity - Update inventory item quantity
router.put('/:id/quantity', validate(idParamSchema, 'params'), validate(updateInventorySchema), inventoryController.updateInventoryQuantity);

module.exports = router;