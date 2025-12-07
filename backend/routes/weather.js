const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// Weather routes
// GET /api/weather - Get weather data (proxy to external weather API)
// Query params: ?lat=XX&lon=YY or ?city=CityName
router.get('/', weatherController.getWeather);

module.exports = router;

