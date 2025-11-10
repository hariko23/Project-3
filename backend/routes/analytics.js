const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/product-usage', analyticsController.getProductUsageData);
router.get('/sales', analyticsController.getTotalSales);

module.exports = router;