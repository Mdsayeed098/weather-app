require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

if (!API_KEY) {
    console.error('FATAL ERROR: OPENWEATHER_API_KEY is not defined in .env file');
    process.exit(1);
}

// Helper to construct URL and attach the API key
const fetchFromOWM = async (req, res, baseUrl, endpoint) => {
    try {
        // req.query contains all query params like ?lat=xxx&lon=yyy
        const params = new URLSearchParams({
            ...req.query,
            appid: API_KEY
        });
        
        const url = `${baseUrl}${endpoint}?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenWeatherMap API error: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Proxy Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch weather data.' });
    }
};

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// Weather Data
app.get('/api/weather', (req, res) => fetchFromOWM(req, res, BASE_URL, '/weather'));
app.get('/api/forecast', (req, res) => fetchFromOWM(req, res, BASE_URL, '/forecast'));
app.get('/api/air_pollution', (req, res) => fetchFromOWM(req, res, BASE_URL, '/air_pollution'));

// Geo Data
app.get('/api/geo/direct', (req, res) => fetchFromOWM(req, res, GEO_URL, '/direct'));

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Secure Weather Backend running on http://localhost:${PORT}`);
});
