const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/', inventoryController.getAllInventory);
router.post('/', inventoryController.addInventoryItem);
router.put('/:id/quantity', inventoryController.updateInventoryQuantity);

module.exports = router;