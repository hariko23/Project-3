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
// PUT /api/menu/:id/ingredients/:ingredientId - Update ingredient quantity for a menu item
router.put('/:id/ingredients/:ingredientId', menuController.updateMenuItemIngredient);
// POST /api/menu/:id/ingredients - Add an ingredient to a menu item
router.post('/:id/ingredients', menuController.addMenuItemIngredient);
// DELETE /api/menu/:id/ingredients/:ingredientId - Remove an ingredient from a menu item
router.delete('/:id/ingredients/:ingredientId', menuController.removeMenuItemIngredient);

module.exports = router;