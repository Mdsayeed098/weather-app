// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const unitToggle = document.getElementById('unit-toggle');

const loadingContainer = document.getElementById('loading');
const errorContainer = document.getElementById('error-message');
const weatherInfoContainer = document.getElementById('weather-info');
const forecastContainer = document.getElementById('forecast-container');

// Weather DOM Elements
const tempEl = document.getElementById('temperature');
const unitEl = document.getElementById('current-unit');
const conditionEl = document.getElementById('condition');
const locationEl = document.getElementById('location');
const dateTimeEl = document.getElementById('date-time');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind-speed');
const feelsLikeEl = document.getElementById('feels-like');
const weatherIconEl = document.getElementById('weather-icon');

// State Setup
let isCelsius = true;
let currentWeatherData = null;
let currentForecastData = null;

// Placeholder openweathermap key (User needs to replace this)
const API_KEY = 'YOUR_API_KEY_HERE';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Weather App Initialized.");

    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    unitToggle.addEventListener('click', () => {
        isCelsius = !isCelsius;
        unitToggle.textContent = isCelsius ? '°C / °F' : '°F / °C';
        unitEl.textContent = isCelsius ? '°C' : '°F';
        
        if (currentWeatherData) {
            updateUI(currentWeatherData);
        }
        if (currentForecastData) {
            updateForecastUI(currentForecastData);
        }
    });

    // Auto location detection
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherByCoords(lat, lon);
            },
            (error) => {
                console.warn("Geolocation denied or failed. Loading default city.");
                fetchWeather('Mumbai');
            }
        );
    } else {
        fetchWeather('Mumbai');
    }
});

function handleSearch() {
    const query = cityInput.value.trim();
    if (query) {
        cityInput.blur();
        fetchWeather(query);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    showLoading();
    try {
        if (API_KEY === 'YOUR_API_KEY_HERE') {
            console.warn("Using MOCK data because API_KEY is not set!");
            await new Promise(resolve => setTimeout(resolve, 800));
            const mockData = getMockData(`Lat: ${lat.toFixed(1)}, Lon: ${lon.toFixed(1)}`);
            const mockForecast = getMockForecast();
            currentWeatherData = mockData;
            currentForecastData = mockForecast;
            updateUI(mockData);
            updateForecastUI(mockForecast);
            return;
        }

        const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error('Location not found');
        const data = await response.json();
        currentWeatherData = data;
        updateUI(data);

        // Fetch Forecast
        const forecastResponse = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json();
            currentForecastData = forecastData;
            updateForecastUI(forecastData);
        }
    } catch (error) {
        console.error("Error fetching by coords:", error);
        showError();
    }
}

async function fetchWeather(city) {
    showLoading();
    
    try {
        if (API_KEY === 'YOUR_API_KEY_HERE') {
            console.warn("Using MOCK data because API_KEY is not set!");
            await new Promise(resolve => setTimeout(resolve, 800)); // fake network delay
            if (city.toLowerCase() === 'error') throw new Error('Mock error');
            const mockData = getMockData(city);
            const mockForecast = getMockForecast();
            currentWeatherData = mockData;
            currentForecastData = mockForecast;
            updateUI(mockData);
            updateForecastUI(mockForecast);
            return;
        }

        const response = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`);
        
        if (!response.ok) {
            throw new Error('City not found or API error');
        }

        const data = await response.json();
        currentWeatherData = data;
        updateUI(data);

        // Fetch Forecast
        const forecastResponse = await fetch(`${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`);
        if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json();
            currentForecastData = forecastData;
            updateForecastUI(forecastData);
        }

    } catch (error) {
        console.error("Error fetching weather:", error);
        showError();
    }
}

function updateDynamicBackground(condition) {
    condition = condition.toLowerCase();
    let bgVariable = 'var(--bg-default)';
    
    if (condition.includes('clear')) {
        bgVariable = 'var(--bg-clear)';
    } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
        bgVariable = 'var(--bg-rain)';
    } else if (condition.includes('cloud') || condition.includes('overcast')) {
        bgVariable = 'var(--bg-cloudy)';
    }

    document.body.style.background = bgVariable;
}

function updateUI(data) {
    hideAll();
    
    // Update background based on weather type
    if (data.weather && data.weather[0]) {
        updateDynamicBackground(data.weather[0].description);
    }
    
    let temp = data.main.temp;
    let feelsLike = data.main.feels_like;
    
    if (!isCelsius) {
        temp = (temp * 9/5) + 32;
        feelsLike = (feelsLike * 9/5) + 32;
    }

    tempEl.textContent = Math.round(temp);
    conditionEl.textContent = data.weather[0].description;
    locationEl.textContent = `${data.name}, ${data.sys?.country || ''}`;
    
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' };
    dateTimeEl.textContent = now.toLocaleDateString('en-US', options);

    humidityEl.textContent = `${data.main.humidity}%`;
    windEl.textContent = `${data.wind.speed} km/h`;
    feelsLikeEl.textContent = `${Math.round(feelsLike)}°`;

    const iconCode = data.weather[0].icon; 
    weatherIconEl.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

    weatherInfoContainer.classList.remove('hidden');
    weatherInfoContainer.classList.add('fade-in');
}

function updateForecastUI(data) {
    const forecastGrid = document.getElementById('forecast-grid');
    forecastGrid.innerHTML = '';
    
    // OWM forecast API gives 3-hour intervals (40 items total).
    // We filter roughly one per day (every 8th item)
    const dailyData = data.list ? data.list.filter((item, index) => index % 8 === 0) : data.list;

    dailyData.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        let temp = day.main.temp;
        if (!isCelsius) {
            temp = (temp * 9/5) + 32;
        }

        const iconCode = day.weather[0].icon;
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <p>${dayName}</p>
            <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="Weather icon">
            <span class="forecast-temp">${Math.round(temp)}°</span>
        `;
        forecastGrid.appendChild(forecastItem);
    });
    
    forecastContainer.classList.remove('hidden');
    forecastContainer.classList.add('fade-in');
}

function showLoading() {
    errorContainer.classList.add('hidden');
    weatherInfoContainer.classList.add('hidden');
    forecastContainer.classList.add('hidden');
    loadingContainer.classList.remove('hidden');
}

function showError() {
    loadingContainer.classList.add('hidden');
    weatherInfoContainer.classList.add('hidden');
    forecastContainer.classList.add('hidden');
    errorContainer.classList.remove('hidden');
}

function hideAll() {
    loadingContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');
}

function getMockData(city) {
    return {
        name: city.charAt(0).toUpperCase() + city.slice(1),
        sys: { country: "IN" },
        weather: [
            { description: "clear sky", icon: "01d" } // clear sky for better demo
        ],
        main: {
            temp: 32.5,
            feels_like: 34.2,
            humidity: 55
        },
        wind: {
            speed: 8.5
        }
    };
}

function getMockForecast() {
    const now = Math.floor(Date.now() / 1000);
    return {
        list: [
            { dt: now + 86400 * 1, main: { temp: 31 }, weather: [{icon: "01d"}] },
            { dt: now + 86400 * 2, main: { temp: 29 }, weather: [{icon: "02d"}] },
            { dt: now + 86400 * 3, main: { temp: 27 }, weather: [{icon: "10d"}] },
            { dt: now + 86400 * 4, main: { temp: 28 }, weather: [{icon: "03d"}] },
            { dt: now + 86400 * 5, main: { temp: 30 }, weather: [{icon: "01d"}] }
        ]
    };
}
