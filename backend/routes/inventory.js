const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Inventory routes
// GET /api/inventory - Get all inventory items
router.get('/', inventoryController.getAllInventory);
// POST /api/inventory - Add a new inventory item
router.post('/', inventoryController.addInventoryItem);
// PUT /api/inventory/:id/quantity - Update inventory item quantity
router.put('/:id/quantity', inventoryController.updateInventoryQuantity);

module.exports = router;