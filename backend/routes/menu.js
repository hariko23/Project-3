const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// Menu routes
// GET /api/menu - Get all menu items
router.get('/', menuController.getAllMenuItems);
// POST /api/menu - Add a new menu item
router.post('/', menuController.addMenuItem);
// PUT /api/menu/:id/price - Update menu item price
router.put('/:id/price', menuController.updateMenuItemPrice);
// GET /api/menu/:id/ingredients - Get ingredients for a menu item
router.get('/:id/ingredients', menuController.getMenuItemIngredients);

module.exports = router;