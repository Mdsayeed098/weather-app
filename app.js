// ─── DOM ELEMENTS ─────────────────────────────────────────────────────────────
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const searchDropdown = document.getElementById('search-dropdown');
const unitToggle = document.getElementById('unit-toggle');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const appContainer = document.getElementById('app-container');
const appLoader = document.getElementById('app-loader');

// Details
const tempEl = document.getElementById('temperature');
const unitEl = document.getElementById('current-unit');
const conditionEl = document.getElementById('condition-text');
const locationEl = document.getElementById('location-name');
const dateTimeEl = document.getElementById('date-time');
const weatherIconMain = document.getElementById('weather-icon-main');
const iconSkel = document.getElementById('icon-skel');

// Cards
const uvVal = document.getElementById('uv-val');
const uvDesc = document.getElementById('uv-desc');
const windSpeed = document.getElementById('wind-speed');
const windDirText = document.getElementById('wind-dir-text');
const windDirIcon = document.getElementById('wind-dir-icon');
const humidity = document.getElementById('humidity');
const humBar = document.getElementById('hum-bar');
const dewPoint = document.getElementById('dew-point');
const feelsLike = document.getElementById('feels-like');
const feelsDesc = document.getElementById('feels-desc');
const aqiVal = document.getElementById('aqi-val');
const aqiBadge = document.getElementById('aqi-badge');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const moonPhaseEl = document.getElementById('moon-phase');
const pressureEl = document.getElementById('pressure');
const visibilityEl = document.getElementById('visibility');
const visDesc = document.getElementById('vis-desc');

// ─── STATE & CONFIG ───────────────────────────────────────────────────────────
let isCelsius = localStorage.getItem('unitPref') !== 'F';
// Theme: 'dark' | 'light' | 'auto' (temperature-based)
let currentTheme = localStorage.getItem('theme') || 'dark';
if (!['dark','light','auto'].includes(currentTheme)) currentTheme = 'dark';
let map = null;
let tileLayer = null;
let tempChartInstance = null;
let currentMarker = null;
let isInitialGPS = false;
let recentSearches = [];
try {
    const stored = localStorage.getItem('weatherRecent');
    if (stored) recentSearches = JSON.parse(stored);
} catch(e) {
    localStorage.removeItem('weatherRecent');
}
if (!Array.isArray(recentSearches)) recentSearches = [];

let currentDataCache = null;
let forecastDataCache = null;

const API_KEY = 'YOUR_NEW_API_KEY_HERE'; // Replace with your new key and restrict it in OWM dashboard
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// ─── CACHE LAYER ──────────────────────────────────────────────────────────────
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const WeatherCache = {
    makeKey(lat, lon) { return `wc_${Math.round(lat*100)}_${Math.round(lon*100)}`; },
    get(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const { data, ts } = JSON.parse(raw);
            if (Date.now() - ts > CACHE_DURATION) { localStorage.removeItem(key); return null; }
            return data;
        } catch { return null; }
    },
    set(key, data) {
        try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch {}
    }
};

// ─── INITIALIZATION ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    applyTheme();

    // 1. Auth Check
    let session = null;
    try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000));
        session = await Promise.race([getSession(), timeout]);
    } catch (err) {
        console.warn('Auth check failed:', err);
        window.location.href = 'login.html';
        return;
    }

    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Set user info
    const user = session.user;
    const displayName = user.user_metadata?.full_name || user.email.split('@')[0];
    document.getElementById('user-display').textContent = displayName;

    // Hide auth overlay, show app
    document.getElementById('auth-overlay').remove();
    appContainer.style.display = 'flex';

    // 2. Event Listeners
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await signOut();
        window.location.href = 'login.html';
    });

    themeToggle.addEventListener('click', () => {
        // Cycle: dark → light → auto → dark
        if (currentTheme === 'dark') currentTheme = 'light';
        else if (currentTheme === 'light') currentTheme = 'auto';
        else currentTheme = 'dark';
        applyTheme();
        if (tempChartInstance) renderTemperatureChart(forecastDataCache);
    });

    unitToggle.addEventListener('click', () => {
        isCelsius = !isCelsius;
        if (currentDataCache && forecastDataCache) {
            updateCurrentUI(currentDataCache);
            renderHourlyStrip(forecastDataCache);
            render5DayForecast(forecastDataCache);
            renderTemperatureChart(forecastDataCache);
        }
    });

    searchBtn.addEventListener('click', () => handleSearch(cityInput.value));
    cityInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(cityInput.value); });
    cityInput.addEventListener('input', debounce(handleAutocomplete, 500));
    cityInput.addEventListener('focus', () => { if (!cityInput.value.trim()) renderDropdown(recentSearches, true); });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) searchDropdown.classList.add('hidden');
    });

    // 3. Initial Data Fetch
    const defaultLocation = localStorage.getItem('defaultLocation');
    if (defaultLocation) {
        fetchAllDataByCity(defaultLocation);
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                isInitialGPS = true;
                fetchAllData(pos.coords.latitude, pos.coords.longitude);
            },
            () => fetchAllDataByCity('Mumbai') // Fallback
        );
    } else {
        fetchAllDataByCity('Mumbai');
    }
});

// ─── UTILS ────────────────────────────────────────────────────────────────────
function getWeatherThemeName(tempC) {
    if (tempC > 35) return 'weather-hot';
    if (tempC > 25) return 'weather-warm';
    if (tempC > 15) return 'weather-mild';
    if (tempC > 5) return 'weather-cool';
    if (tempC > 0) return 'weather-cold';
    return 'weather-freezing';
}

function isThemeDark() {
    // For chart rendering: weather themes are dark, 'light' is not
    return currentTheme !== 'light';
}

function applyTheme() {
    localStorage.setItem('theme', currentTheme);
    if (currentTheme === 'auto') {
        // Apply weather-based theme from last known temp
        const lastTemp = parseFloat(localStorage.getItem('lastTempC'));
        const weatherTheme = isNaN(lastTemp) ? 'weather-mild' : getWeatherThemeName(lastTemp);
        document.documentElement.setAttribute('data-theme', weatherTheme);
        themeIcon.className = 'fa-solid fa-temperature-half';
    } else {
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeIcon.className = currentTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }

    // Update tooltip on toggle button
    const labels = { dark: 'Dark Mode', light: 'Light Mode', auto: 'Weather Mode' };
    themeToggle.title = labels[currentTheme] || 'Toggle Theme';
}

function applyWeatherTheme(tempK) {
    // Store temperature for other pages and for theme reapplication
    const tempC = Math.round(tempK - 273.15);
    localStorage.setItem('lastTempC', tempC);
    if (currentTheme === 'auto') {
        document.documentElement.setAttribute('data-theme', getWeatherThemeName(tempC));
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

function debounce(func, delay) {
    let timeoutId;
    return (...args) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => func(...args), delay); };
}

function getTemp(k) {
    if (isCelsius) return Math.round(k - 273.15);
    return Math.round((k - 273.15) * 9/5 + 32);
}

function removeSkeletons() {
    document.querySelectorAll('.skeleton').forEach(el => {
        el.classList.remove('skeleton');
        el.style.minHeight = '';
        el.style.width = '';
        el.style.display = '';
    });
    iconSkel.style.display = 'none';
    weatherIconMain.style.display = 'block';
    unitEl.style.display = 'inline-block';
}

function showLoaders() {
    appLoader.classList.remove('hidden');
}

// ─── API CALLS ────────────────────────────────────────────────────────────────
async function fetchAllDataByCity(city) {
    showLoaders();
    try {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`);
        const geoData = await geoRes.json();
        if (!geoData.length) throw new Error('City not found');
        const { lat, lon, name, state, country } = geoData[0];
        
        saveRecentSearch(`${name}, ${country}`);
        await fetchAllData(lat, lon, name, country);
    } catch (err) {
        showToast(err.message);
        appLoader.classList.add('hidden');
    }
}

async function fetchAllData(lat, lon, overrideName = null, overrideCountry = null) {
    showLoaders();
    try {
        const cacheKey = WeatherCache.makeKey(lat, lon);
        let cached = WeatherCache.get(cacheKey);
        let currentData, forecastData, aqiData;

        if (cached) {
            currentData = cached.current;
            forecastData = cached.forecast;
            aqiData = cached.aqi;
            console.log('📦 Using cached data');
        } else {
            const [currentRes, forecastRes, aqiRes] = await Promise.all([
                fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`),
                fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`),
                fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
            ]);

            if (!currentRes.ok) throw new Error('Failed to fetch weather data');

            currentData = await currentRes.json();
            forecastData = await forecastRes.json();
            aqiData = await aqiRes.json();

            WeatherCache.set(cacheKey, { current: currentData, forecast: forecastData, aqi: aqiData });
        }

        if (overrideName) currentData.name = overrideName;
        if (overrideCountry && currentData.sys) currentData.sys.country = overrideCountry;

        currentDataCache = currentData;
        forecastDataCache = forecastData;

        const aqi = aqiData.list[0].main.aqi;

        removeSkeletons();
        applyWeatherTheme(currentData.main.temp);
        updateCurrentUI(currentData);
        updateDetailCards(currentData, aqi);
        renderHourlyStrip(forecastData);
        render5DayForecast(forecastData);
        renderTemperatureChart(forecastData);
        renderMap(lat, lon, currentData);
        generateWeatherAlerts(currentData, aqi);
        generateInsights(currentData, forecastData, aqi);

    } catch (err) {
        showToast(err.message);
    } finally {
        appLoader.classList.add('hidden');
    }
}

// ─── SEARCH & AUTOCOMPLETE ────────────────────────────────────────────────────
async function handleAutocomplete() {
    const q = cityInput.value.trim();
    if (!q) return renderDropdown(recentSearches, true);

    try {
        const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${q}&limit=5&appid=${API_KEY}`);
        const data = await res.json();
        renderDropdown(data, false);
    } catch (err) { console.error(err); }
}

function renderDropdown(items, isRecent) {
    searchDropdown.innerHTML = '';
    if (!items.length) { searchDropdown.classList.add('hidden'); return; }

    items.forEach(item => {
        const li = document.createElement('li');
        let text = typeof item === 'string' ? item : `${item.name}${item.state ? ', '+item.state : ''}, ${item.country}`;
        
        li.innerHTML = `<span>${text}</span> <i class="fa-solid ${isRecent ? 'fa-clock-rotate-left' : 'fa-location-dot'}"></i>`;
        li.onclick = () => { cityInput.value = text; searchDropdown.classList.add('hidden'); fetchAllDataByCity(text); };
        searchDropdown.appendChild(li);
    });
    searchDropdown.classList.remove('hidden');
}

function handleSearch(q) {
    if (!q.trim()) return;
    cityInput.blur();
    searchDropdown.classList.add('hidden');
    fetchAllDataByCity(q.trim());
}

function saveRecentSearch(city) {
    if (!recentSearches.includes(city)) {
        recentSearches.unshift(city);
        if (recentSearches.length > 5) recentSearches.pop();
        localStorage.setItem('weatherRecent', JSON.stringify(recentSearches));
    }
}

// ─── UI UPDATES ───────────────────────────────────────────────────────────────
function updateDynamicBackground(iconCode) {
    const bg = document.getElementById('weather-bg');
    const isDay = iconCode.includes('d');
    
    if (!isDay) bg.style.background = 'var(--grad-night)';
    else if (iconCode.includes('01') || iconCode.includes('02')) bg.style.background = 'var(--grad-sunny)';
    else if (iconCode.includes('09') || iconCode.includes('10') || iconCode.includes('11')) bg.style.background = 'var(--grad-rain)';
    else bg.style.background = 'var(--grad-cloudy)';
}

function updateCurrentUI(data) {
    updateDynamicBackground(data.weather[0].icon);
    
    locationEl.textContent = `${data.name}, ${data.sys.country || ''}`;
    tempEl.textContent = getTemp(data.main.temp);
    unitEl.textContent = isCelsius ? '°C' : '°F';
    conditionEl.textContent = data.weather[0].description;
    
    weatherIconMain.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;

    const d = new Date(Date.now() + (data.timezone * 1000));
    dateTimeEl.textContent = d.toUTCString().replace(' GMT', '');
}

function updateDetailCards(data, aqi) {
    // Wind
    const speed = isCelsius ? Math.round(data.wind.speed * 3.6) : Math.round(data.wind.speed * 2.237);
    windSpeed.textContent = `${speed} ${isCelsius ? 'km/h' : 'mph'}`;
    windDirIcon.style.transform = `rotate(${data.wind.deg - 45}deg)`; // -45 because FA icon points top-right natively
    windDirText.textContent = getWindDirection(data.wind.deg);

    // Humidity & Dew Point
    const hum = data.main.humidity;
    humidity.textContent = `${hum}%`;
    humBar.style.width = `${hum}%`;
    const dp = data.main.temp - ((100 - hum) / 5); // Simple approx
    dewPoint.textContent = getTemp(dp);

    // Feels Like
    feelsLike.textContent = `${getTemp(data.main.feels_like)}°`;
    feelsDesc.textContent = data.main.feels_like > data.main.temp ? 'Humidity is making it feel warmer.' : 'Wind is making it feel cooler.';

    // Pressure & Vis
    pressureEl.textContent = data.main.pressure;
    const visKm = data.visibility / 1000;
    visibilityEl.textContent = isCelsius ? `${visKm} km` : `${Math.round(visKm * 0.621371)} mi`;
    visDesc.textContent = visKm >= 10 ? "Clear visibility." : "Haze or fog affecting visibility.";

    // AQI
    const aqiLabels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    aqiVal.textContent = aqi;
    aqiBadge.textContent = aqiLabels[aqi-1] || 'Unknown';
    aqiBadge.className = `aqi-badge aqi-${aqi}`;

    // Sunrise/Sunset
    if (data.sys.sunrise && data.sys.sunset) {
        const sr = new Date((data.sys.sunrise + data.timezone) * 1000);
        const ss = new Date((data.sys.sunset + data.timezone) * 1000);
        sunriseEl.textContent = sr.toISOString().substr(11,5);
        sunsetEl.textContent = ss.toISOString().substr(11,5);
    }

    // Moon Phase (Calculated approx)
    moonPhaseEl.textContent = getMoonPhase(new Date());

    // UV (Fake it based on cloud cover and time since OWM free doesn't have it directly in /weather)
    const cloudCover = data.clouds.all;
    let uv = 8 - (cloudCover / 15);
    if (data.weather[0].icon.includes('n')) uv = 0; // night
    uvVal.textContent = Math.max(0, uv).toFixed(1);
    uvDesc.textContent = uv > 5 ? 'High. Use protection.' : 'Low level.';
}

function renderHourlyStrip(data) {
    const strip = document.getElementById('hourly-strip');
    strip.innerHTML = '';
    
    // Get next 8 items (24 hours)
    data.list.slice(0, 8).forEach(item => {
        const date = new Date((item.dt + data.city.timezone) * 1000);
        const time = date.toISOString().substr(11,5);
        const icon = item.weather[0].icon;
        
        strip.innerHTML += `
            <div class="hourly-item">
                <span class="hourly-time">${time}</span>
                <img class="hourly-icon" src="https://openweathermap.org/img/wn/${icon}.png" alt="icon">
                <span class="hourly-temp">${getTemp(item.main.temp)}°</span>
            </div>
        `;
    });
}

function render5DayForecast(data) {
    const grid = document.getElementById('daily-grid');
    grid.innerHTML = '';

    // Extract one reading per day (e.g. at 12:00)
    const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00'));

    dailyData.forEach(day => {
        const date = new Date((day.dt + data.city.timezone) * 1000);
        const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getUTCDay()];
        
        grid.innerHTML += `
            <div class="daily-item">
                <span class="daily-day">${dayName}</span>
                <img class="daily-icon" src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="icon">
                <span class="daily-desc">${day.weather[0].description}</span>
                <div class="daily-temps">
                    <span class="min">${getTemp(day.main.temp_min)}°</span>
                    <span class="max">${getTemp(day.main.temp_max)}°</span>
                </div>
            </div>
        `;
    });
}

function renderTemperatureChart(data) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    
    const labels = [];
    const temps = [];
    data.list.slice(0, 8).forEach(item => {
        const d = new Date((item.dt + data.city.timezone) * 1000);
        labels.push(d.toISOString().substr(11,5));
        temps.push(getTemp(item.main.temp));
    });

    const dark = isThemeDark();
    const textColor = dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
    const gridColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    if (tempChartInstance) tempChartInstance.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(79, 172, 254, 0.5)');
    gradient.addColorStop(1, 'rgba(79, 172, 254, 0.0)');

    tempChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature',
                data: temps,
                borderColor: '#4facfe',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4facfe',
                pointBorderColor: dark ? '#0a0e1a' : '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: { label: (ctx) => `${ctx.parsed.y}°` },
                    backgroundColor: dark ? 'rgba(16,22,38,0.9)' : 'rgba(255,255,255,0.9)',
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: gridColor,
                    borderWidth: 1
                }
            },
            scales: {
                x: { grid: { display: false, drawBorder: false }, ticks: { color: textColor, font: { family: 'Inter' } } },
                y: { grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor, stepSize: 2, callback: (v) => v + '°' } }
            }
        }
    });
}

function renderMap(lat, lon, currentData) {
    if (!map) {
        map = L.map('map', { zoomControl: false }).setView([lat, lon], 10);
        L.control.zoom({ position: 'bottomright' }).addTo(map);
        
        // Using standard map tiles to look like Google Maps
        const basemap = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

        L.tileLayer(basemap, { attribution: '© Google Maps' }).addTo(map);

        tileLayer = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`, {
            opacity: 0.6, attribution: '© OpenWeatherMap'
        }).addTo(map);

        map.on('click', (e) => {
            fetchAllData(e.latlng.lat, e.latlng.lng);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    } else {
        map.flyTo([lat, lon], 10, { animate: true, duration: 1 });
        const basemap = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
        
        map.eachLayer(layer => {
            if (layer._url && layer._url.includes('google.com')) {
                layer.setUrl(basemap);
            }
        });
    }
    
    // Custom marker icon
    const customIcon = L.divIcon({
        className: '',
        html: '<div class="custom-marker"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -14]
    });

    // Add Marker
    if (currentMarker) map.removeLayer(currentMarker);
    if (currentData) {
        const temp = getTemp(currentData.main.temp);
        const unit = isCelsius ? '°C' : '°F';
        const desc = currentData.weather[0].description;
        const iconUrl = `https://openweathermap.org/img/wn/${currentData.weather[0].icon}.png`;
        
        let markerTitle = currentData.name;
        if (isInitialGPS) {
            markerTitle = 'Your Current Location';
            isInitialGPS = false;
        }

        currentMarker = L.marker([lat, lon], { icon: customIcon }).addTo(map)
            .bindPopup(`<div style="text-align:center; min-width: 140px;">
                <div class="popup-city">${markerTitle}</div>
                <div class="popup-temp-row">
                    <img src="${iconUrl}" style="width:36px; height:36px;">
                    <span class="popup-temp">${temp}${unit}</span>
                </div>
                <div class="popup-desc">${desc}</div>
            </div>`)
            .openPopup();
    }

    setTimeout(() => map.invalidateSize(), 300);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getWindDirection(deg) {
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round((deg % 360) / 22.5)];
}

function getMoonPhase(date) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    if (month < 3) { year--; month += 12; }
    let a = Math.floor(year / 100);
    let b = Math.floor(a / 4);
    let c = 2 - a + b;
    let e = Math.floor(365.25 * (year + 4716));
    let f = Math.floor(30.6001 * (month + 1));
    let jd = c + day + e + f - 1524.5;
    let daysSinceNew = jd - 2451549.5;
    let newMoons = daysSinceNew / 29.53;
    let phase = newMoons - Math.floor(newMoons);
    
    if (phase < 0.03) return "New Moon";
    if (phase < 0.22) return "Waxing Crescent";
    if (phase < 0.28) return "First Quarter";
    if (phase < 0.47) return "Waxing Gibbous";
    if (phase < 0.53) return "Full Moon";
    if (phase < 0.72) return "Waning Gibbous";
    if (phase < 0.78) return "Last Quarter";
    return "Waning Crescent";
}

// ─── WEATHER ALERTS ───────────────────────────────────────────────────────────
function generateWeatherAlerts(data, aqi) {
    const container = document.getElementById('alerts-container');
    container.innerHTML = '';
    const alerts = [];
    const tempC = Math.round(data.main.temp - 273.15);
    const windKmh = Math.round(data.wind.speed * 3.6);
    const visKm = data.visibility / 1000;
    const condition = data.weather[0].main.toLowerCase();
    const desc = data.weather[0].description.toLowerCase();

    if (tempC > 40) alerts.push({ icon: 'fa-fire', title: 'Extreme Heatwave', severity: 'critical', desc: `Temperature is ${tempC}°C. Stay indoors, stay hydrated, and avoid direct sunlight.` });
    else if (tempC > 35) alerts.push({ icon: 'fa-temperature-arrow-up', title: 'Heat Advisory', severity: 'warning', desc: `Temperature is ${tempC}°C. Limit outdoor activities and drink plenty of water.` });

    if (tempC < 0) alerts.push({ icon: 'fa-snowflake', title: 'Freezing Conditions', severity: 'critical', desc: `Temperature is ${tempC}°C. Roads may be icy. Wear layers and limit exposure.` });
    else if (tempC < 5) alerts.push({ icon: 'fa-temperature-arrow-down', title: 'Cold Weather Alert', severity: 'warning', desc: `Temperature is ${tempC}°C. Dress warmly and beware of wind chill.` });

    if (condition === 'thunderstorm') alerts.push({ icon: 'fa-cloud-bolt', title: 'Thunderstorm Warning', severity: 'critical', desc: 'Active thunderstorm detected. Seek shelter and avoid open areas.' });
    else if (condition === 'rain' || desc.includes('heavy rain')) alerts.push({ icon: 'fa-cloud-showers-heavy', title: 'Rain Alert', severity: 'warning', desc: 'Rain detected in the area. Carry an umbrella and drive carefully.' });

    if (windKmh > 60) alerts.push({ icon: 'fa-wind', title: 'High Wind Warning', severity: 'critical', desc: `Wind speed is ${windKmh} km/h. Secure loose objects and avoid driving high-profile vehicles.` });
    else if (windKmh > 40) alerts.push({ icon: 'fa-wind', title: 'Wind Advisory', severity: 'warning', desc: `Wind speed is ${windKmh} km/h. Be cautious outdoors.` });

    if (visKm < 1) alerts.push({ icon: 'fa-smog', title: 'Dense Fog', severity: 'critical', desc: 'Visibility below 1 km. Use fog lights and drive very slowly.' });
    else if (visKm < 3) alerts.push({ icon: 'fa-eye-low-vision', title: 'Low Visibility', severity: 'warning', desc: `Visibility is ${visKm} km. Drive with caution.` });

    if (aqi >= 5) alerts.push({ icon: 'fa-lungs', title: 'Hazardous Air Quality', severity: 'critical', desc: 'AQI is Very Poor. Avoid all outdoor activity. Wear a mask if necessary.' });
    else if (aqi >= 4) alerts.push({ icon: 'fa-mask-face', title: 'Poor Air Quality', severity: 'warning', desc: 'AQI is Poor. Sensitive groups should limit outdoor exposure.' });

    const cloudCover = data.clouds.all;
    let uv = 8 - (cloudCover / 15);
    if (data.weather[0].icon.includes('n')) uv = 0;
    if (uv > 8) alerts.push({ icon: 'fa-sun', title: 'Extreme UV Index', severity: 'warning', desc: 'UV is dangerously high. Apply SPF 50+ and wear sunglasses.' });

    if (alerts.length === 0) {
        container.innerHTML = '<div class="no-alerts"><i class="fa-solid fa-circle-check"></i> No weather alerts — conditions are normal.</div>';
        return;
    }

    alerts.forEach((a, i) => {
        const el = document.createElement('div');
        el.className = `alert-banner severity-${a.severity}`;
        el.style.animationDelay = `${i * 0.1}s`;
        el.innerHTML = `
            <div class="alert-icon"><i class="fa-solid ${a.icon}"></i></div>
            <div class="alert-content">
                <div class="alert-title">${a.title} <span class="alert-severity-badge">${a.severity}</span></div>
                <div class="alert-desc">${a.desc}</div>
            </div>`;
        container.appendChild(el);
    });
}

// ─── WEATHER INSIGHTS ─────────────────────────────────────────────────────────
function generateInsights(currentData, forecastData, aqi) {
    const container = document.getElementById('insights-list');
    container.innerHTML = '';
    const insights = [];
    const tempC = Math.round(currentData.main.temp - 273.15);
    const humidity = currentData.main.humidity;
    const windKmh = Math.round(currentData.wind.speed * 3.6);
    const condition = currentData.weather[0].main.toLowerCase();

    // Best time to go outside
    const comfortableHours = forecastData.list.slice(0, 8).filter(h => {
        const t = Math.round(h.main.temp - 273.15);
        const w = h.weather[0].main.toLowerCase();
        return t >= 18 && t <= 30 && w !== 'rain' && w !== 'thunderstorm';
    });
    if (comfortableHours.length > 0) {
        const best = comfortableHours[0];
        const d = new Date((best.dt + forecastData.city.timezone) * 1000);
        const time = d.toISOString().substr(11, 5);
        insights.push({ icon: 'fa-clock', cls: 'green', title: 'Best Time Outside', desc: `Around ${time} — ${Math.round(best.main.temp - 273.15)}°C with ${best.weather[0].description}.` });
    } else {
        insights.push({ icon: 'fa-clock', cls: '', title: 'Best Time Outside', desc: 'No ideal outdoor conditions in the next 24 hours.' });
    }

    // AQI advice
    const aqiAdvice = [
        { cls: 'green', text: 'Air quality is excellent. Great for outdoor activities!' },
        { cls: 'green', text: 'Air is acceptable. Sensitive individuals should take note.' },
        { cls: 'orange', text: 'Moderate air quality. Limit prolonged outdoor exertion.' },
        { cls: 'orange', text: 'Poor air. Sensitive groups should stay indoors.' },
        { cls: 'purple', text: 'Hazardous air! Avoid outdoor activities entirely.' }
    ];
    const aqiInfo = aqiAdvice[aqi - 1] || aqiAdvice[0];
    insights.push({ icon: 'fa-lungs', cls: aqiInfo.cls, title: 'Air Quality Advice', desc: aqiInfo.text });

    // What to wear
    let wearAdvice;
    if (tempC > 30) wearAdvice = 'Light, breathable clothing. Don\'t forget sunscreen and a hat.';
    else if (tempC > 20) wearAdvice = 'T-shirt and light layers. Comfortable for most activities.';
    else if (tempC > 10) wearAdvice = 'Jacket or sweater recommended. Layer up for wind.';
    else if (tempC > 0) wearAdvice = 'Heavy coat, scarf, and gloves. Protect against the cold.';
    else wearAdvice = 'Full winter gear — insulated jacket, thermal layers, and warm boots.';
    if (windKmh > 30) wearAdvice += ' Wind-resistant outer layer recommended.';
    insights.push({ icon: 'fa-shirt', cls: tempC > 25 ? 'warm' : 'cool', title: 'What to Wear', desc: wearAdvice });

    // Exercise recommendation
    let exerciseAdvice;
    if (tempC >= 15 && tempC <= 28 && humidity < 70 && aqi <= 2 && condition !== 'rain') {
        exerciseAdvice = 'Perfect conditions for outdoor exercise. Go for a run or bike ride!';
    } else if (aqi >= 4 || tempC > 38 || tempC < -5) {
        exerciseAdvice = 'Not recommended outdoors. Consider indoor workouts today.';
    } else {
        exerciseAdvice = 'Moderate conditions. Light walks are fine, but avoid intense workouts.';
    }
    insights.push({ icon: 'fa-person-running', cls: 'green', title: 'Exercise', desc: exerciseAdvice });

    // Rain prediction
    const rainHours = forecastData.list.slice(0, 8).filter(h => {
        const w = h.weather[0].main.toLowerCase();
        return w === 'rain' || w === 'drizzle' || w === 'thunderstorm';
    });
    if (rainHours.length > 0) {
        const firstRain = rainHours[0];
        const d = new Date((firstRain.dt + forecastData.city.timezone) * 1000);
        const time = d.toISOString().substr(11, 5);
        insights.push({ icon: 'fa-umbrella', cls: 'cool', title: 'Rain Expected', desc: `${firstRain.weather[0].description} expected around ${time}. Carry an umbrella!` });
    } else {
        insights.push({ icon: 'fa-umbrella', cls: 'green', title: 'No Rain Expected', desc: 'Dry conditions forecasted for the next 24 hours.' });
    }

    // Golden hour
    if (currentData.sys.sunrise && currentData.sys.sunset) {
        const sr = new Date((currentData.sys.sunrise + currentData.timezone) * 1000);
        const ss = new Date((currentData.sys.sunset + currentData.timezone) * 1000);
        const goldenAM = new Date(sr.getTime() - 30 * 60000);
        const goldenPM = new Date(ss.getTime() - 30 * 60000);
        insights.push({ icon: 'fa-camera', cls: 'warm', title: 'Golden Hour', desc: `Best photography light: ${goldenAM.toISOString().substr(11,5)} (morning) and ${goldenPM.toISOString().substr(11,5)} (evening).` });
    }

    insights.forEach(ins => {
        container.innerHTML += `
            <div class="insight-card">
                <div class="insight-icon ${ins.cls}"><i class="fa-solid ${ins.icon}"></i></div>
                <div>
                    <div class="insight-title">${ins.title}</div>
                    <div class="insight-desc">${ins.desc}</div>
                </div>
            </div>`;
    });
}
