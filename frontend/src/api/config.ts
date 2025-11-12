/**
 * API Base URL configuration
 * Uses environment variable VITE_API_BASE_URL if available,
 * otherwise defaults to localhost for development
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export default API_BASE_URL;