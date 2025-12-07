const axios = require('axios');

/**
 * Get weather data from external API
 * Supports location by lat/lon or city name
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getWeather = async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    const apiKey = process.env.WEATHER_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Weather API key not configured' 
      });
    }

    // Build API URL based on provided params
    let apiUrl;
    if (lat && lon) {
      apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
    } else if (city) {
      apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=imperial`;
    } else {
      // Default location (College Station, TX)
      apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=College Station,TX,US&appid=${apiKey}&units=imperial`;
    }

    const response = await axios.get(apiUrl);
    
    res.json({
      success: true,
      data: {
        temperature: response.data.main.temp,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        city: response.data.name,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind?.speed || 0,
        feelsLike: response.data.main.feels_like
      }
    });
  } catch (error) {
    console.error('Weather API error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to fetch weather data'
    });
  }
};

module.exports = {
  getWeather
};

