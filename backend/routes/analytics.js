const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Analytics routes
// GET /api/analytics/product-usage - Get product usage data for last 30 days
router.get('/product-usage', analyticsController.getProductUsageData);
// GET /api/analytics/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD - Get total sales for date range
router.get('/sales', analyticsController.getTotalSales);
// GET /api/analytics/product-usage-chart - Get inventory usage for time window
router.get('/product-usage-chart', analyticsController.getProductUsageChart);
// GET /api/analytics/x-report - Get X-Report (current day hourly sales)
router.get('/x-report', analyticsController.getXReport);
// GET /api/analytics/z-report/last-run - Check last Z-Report run date
router.get('/z-report/last-run', analyticsController.getZReportLastRun);
// POST /api/analytics/z-report - Generate Z-Report (end of day)
router.post('/z-report', analyticsController.generateZReport);
// GET /api/analytics/sales-report - Get sales by item for time window
router.get('/sales-report', analyticsController.getSalesReport);

module.exports = router;