const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Analytics routes
// GET /api/analytics/product-usage - Get product usage data for last 30 days
router.get('/product-usage', analyticsController.getProductUsageData);
// GET /api/analytics/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD - Get total sales for date range
router.get('/sales', analyticsController.getTotalSales);

module.exports = router;