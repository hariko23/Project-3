const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/', orderController.getAllOrders);
router.post('/', orderController.createOrder);
// Specific routes before parameterized routes
router.get('/items/:orderItemId', orderController.getOrderItemById);
router.patch('/items/:orderItemId/complete', orderController.markOrderItemComplete);
router.get('/:orderId/items', orderController.getOrderItems);

module.exports = router;