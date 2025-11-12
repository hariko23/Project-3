const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Order routes
// GET /api/orders - Get all orders
router.get('/', orderController.getAllOrders);
// POST /api/orders - Create a new order
router.post('/', orderController.createOrder);

// Specific routes must be defined before parameterized routes to avoid route conflicts
// GET /api/orders/items/:orderItemId - Get a specific order item
router.get('/items/:orderItemId', orderController.getOrderItemById);
// PATCH /api/orders/items/:orderItemId/complete - Mark order item as complete/incomplete
router.patch('/items/:orderItemId/complete', orderController.markOrderItemComplete);
// GET /api/orders/:orderId/items - Get all items for a specific order
router.get('/:orderId/items', orderController.getOrderItems);

module.exports = router;