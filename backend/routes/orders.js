const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validate, createOrderSchema, idParamSchema, orderItemIdParamSchema, orderIdParamSchema } = require('../middleware/validation');

// Order routes
// GET /api/orders - Get all orders
router.get('/', orderController.getAllOrders);
// POST /api/orders - Create a new order
router.post('/', validate(createOrderSchema), orderController.createOrder);

// Specific routes must be defined before parameterized routes to avoid route conflicts
// GET /api/orders/items/:orderItemId - Get a specific order item
router.get('/items/:orderItemId', validate(orderItemIdParamSchema, 'params'), orderController.getOrderItemById);
// PATCH /api/orders/items/:orderItemId/complete - Mark order item as complete/incomplete
router.patch('/items/:orderItemId/complete', validate(orderItemIdParamSchema, 'params'), orderController.markOrderItemComplete);
// PATCH /api/orders/:id/status - Update order completion status (must be before /:orderId/items)
router.patch('/:id/status', validate(idParamSchema, 'params'), orderController.updateOrderStatus);
// GET /api/orders/:orderId/items - Get all items for a specific order
router.get('/:orderId/items', validate(orderIdParamSchema, 'params'), orderController.getOrderItems);

module.exports = router;