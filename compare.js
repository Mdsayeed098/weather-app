// ─── Compare Cities Logic ─────────────────────────────────────────────────────
const API_KEY = 'YOUR_NEW_API_KEY_HERE';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

let isCelsius = localStorage.getItem('unitPref') !== 'F';

// ─── CACHE LAYER (shared pattern with app.js) ─────────────────────────────────
const CACHE_DURATION = 10 * 60 * 1000;
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

// ─── DOM ──────────────────────────────────────────────────────────────────────
const cityAInput = document.getElementById('city-a');
const cityBInput = document.getElementById('city-b');
const dropdownA = document.getElementById('dropdown-a');
const dropdownB = document.getElementById('dropdown-b');
const compareBtn = document.getElementById('compare-btn');
const resultsDiv = document.getElementById('compare-results');
const emptyDiv = document.getElementById('compare-empty');
const heroesDiv = document.getElementById('city-heroes');
const metricsDiv = document.getElementById('metrics-table');

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Apply theme (3-mode support)
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'auto') {
        const lastTemp = parseFloat(localStorage.getItem('lastTempC'));
        let wt = 'weather-mild';
        if (!isNaN(lastTemp)) {
            if (lastTemp > 35) wt = 'weather-hot';
            else if (lastTemp > 25) wt = 'weather-warm';
            else if (lastTemp > 15) wt = 'weather-mild';
            else if (lastTemp > 5) wt = 'weather-cool';
            else if (lastTemp > 0) wt = 'weather-cold';
            else wt = 'weather-freezing';
        }
        document.documentElement.setAttribute('data-theme', wt);
    } else {
        document.documentElement.setAttribute('data-theme', savedTheme === 'light' ? 'light' : 'dark');
    }

    // Auth check
    let session = null;
    try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000));
        session = await Promise.race([getSession(), timeout]);
    } catch { window.location.href = 'login.html'; return; }
    if (!session) { window.location.href = 'login.html'; return; }

    document.getElementById('auth-overlay').remove();
    document.getElementById('main-content').style.display = 'block';

    // Autocomplete
    cityAInput.addEventListener('input', debounce(() => handleAutocomplete(cityAInput, dropdownA), 400));
    cityBInput.addEventListener('input', debounce(() => handleAutocomplete(cityBInput, dropdownB), 400));

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.compare-input-group')) {
            dropdownA.classList.remove('open');
            dropdownB.classList.remove('open');
        }
    });

    // Compare button
    compareBtn.addEventListener('click', doCompare);

    // Enter key triggers compare
    cityAInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doCompare(); });
    cityBInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doCompare(); });
});

// ─── UTILS ────────────────────────────────────────────────────────────────────
function debounce(fn, delay) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3500);
}

function getTemp(k) {
    return isCelsius ? Math.round(k - 273.15) : Math.round((k - 273.15) * 9/5 + 32);
}

function getTempUnit() { return isCelsius ? '°C' : '°F'; }

function getWindSpeed(ms) {
    return isCelsius ? `${Math.round(ms * 3.6)} km/h` : `${Math.round(ms * 2.237)} mph`;
}

function getWindDir(deg) {
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round((deg % 360) / 22.5)] || 'N';
}

function getVisibility(vis) {
    const km = vis / 1000;
    return isCelsius ? `${km.toFixed(1)} km` : `${(km * 0.621371).toFixed(1)} mi`;
}

function formatTime(unix, tz) {
    const d = new Date((unix + tz) * 1000);
    return d.toISOString().substr(11, 5);
}

function getTempTheme(tempC) {
    if (tempC > 40) return 'theme-hot';
    if (tempC > 30) return 'theme-warm';
    if (tempC > 20) return 'theme-mild';
    if (tempC > 10) return 'theme-cool';
    if (tempC > 0) return 'theme-cold';
    return 'theme-freezing';
}

// ─── AUTOCOMPLETE ─────────────────────────────────────────────────────────────
async function handleAutocomplete(input, dropdown) {
    const q = input.value.trim();
    if (!q || q.length < 2) { dropdown.classList.remove('open'); return; }

    try {
        const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${q}&limit=5&appid=${API_KEY}`);
        const data = await res.json();
        dropdown.innerHTML = '';
        if (!data.length) { dropdown.classList.remove('open'); return; }

        data.forEach(item => {
            const li = document.createElement('li');
            const text = `${item.name}${item.state ? ', ' + item.state : ''}, ${item.country}`;
            li.innerHTML = `<span>${text}</span><i class="fa-solid fa-location-dot"></i>`;
            li.addEventListener('click', () => {
                input.value = text;
                dropdown.classList.remove('open');
            });
            dropdown.appendChild(li);
        });
        dropdown.classList.add('open');
    } catch (err) { console.error(err); }
}

// ─── FETCH & COMPARE ──────────────────────────────────────────────────────────
async function doCompare() {
    const cityA = cityAInput.value.trim();
    const cityB = cityBInput.value.trim();

    if (!cityA || !cityB) return showToast('Please enter both city names.');
    if (cityA.toLowerCase() === cityB.toLowerCase()) return showToast('Please enter two different cities.');

    compareBtn.disabled = true;
    compareBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Comparing...';

    try {
        const [dataA, dataB] = await Promise.all([
            fetchCityData(cityA),
            fetchCityData(cityB)
        ]);

        renderResults(dataA, dataB);
    } catch (err) {
        showToast(err.message || 'Failed to fetch data.');
    } finally {
        compareBtn.disabled = false;
        compareBtn.innerHTML = '<i class="fa-solid fa-scale-balanced"></i> Compare';
    }
}

async function fetchCityData(city) {
    // Geocode first
    const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`);
    const geoData = await geoRes.json();
    if (!geoData.length) throw new Error(`City "${city}" not found.`);
    const { lat, lon, name, country } = geoData[0];

    // Check cache
    const cacheKey = WeatherCache.makeKey(lat, lon);
    const cached = WeatherCache.get(cacheKey);
    if (cached) {
        cached.current.name = name;
        if (cached.current.sys) cached.current.sys.country = country;
        return { current: cached.current, aqi: cached.aqi.list[0].main.aqi };
    }

    // Fetch fresh
    const [weatherRes, aqiRes] = await Promise.all([
        fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`),
        fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    ]);

    if (!weatherRes.ok) throw new Error('Failed to fetch weather data.');

    const weather = await weatherRes.json();
    const aqiData = await aqiRes.json();

    weather.name = name;
    if (weather.sys) weather.sys.country = country;

    return { current: weather, aqi: aqiData.list[0].main.aqi };
}

// ─── RENDER ───────────────────────────────────────────────────────────────────
function renderResults(dataA, dataB) {
    emptyDiv.style.display = 'none';
    resultsDiv.classList.add('visible');

    const a = dataA.current;
    const b = dataB.current;
    const tempA = Math.round(a.main.temp - 273.15);
    const tempB = Math.round(b.main.temp - 273.15);

    // Hero Cards
    heroesDiv.innerHTML = `
        <div class="city-hero ${getTempTheme(tempA)}">
            <div class="city-hero-name">${a.name}</div>
            <div class="city-hero-country">${a.sys.country || ''}</div>
            <div class="city-hero-temp-row">
                <img class="city-hero-icon" src="https://openweathermap.org/img/wn/${a.weather[0].icon}@4x.png" alt="Weather">
                <span class="city-hero-temp">${getTemp(a.main.temp)}${getTempUnit()}</span>
            </div>
            <div class="city-hero-desc">${a.weather[0].description}</div>
        </div>
        <div class="city-hero ${getTempTheme(tempB)}">
            <div class="city-hero-name">${b.name}</div>
            <div class="city-hero-country">${b.sys.country || ''}</div>
            <div class="city-hero-temp-row">
                <img class="city-hero-icon" src="https://openweathermap.org/img/wn/${b.weather[0].icon}@4x.png" alt="Weather">
                <span class="city-hero-temp">${getTemp(b.main.temp)}${getTempUnit()}</span>
            </div>
            <div class="city-hero-desc">${b.weather[0].description}</div>
        </div>
    `;

    // Metrics
    const aqiLabels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    const metrics = [
        {
            icon: 'fa-temperature-half', label: 'Temperature',
            valA: `${getTemp(a.main.temp)}${getTempUnit()}`, valB: `${getTemp(b.main.temp)}${getTempUnit()}`,
            winnerA: tempA > tempB, winnerB: tempB > tempA, subA: '', subB: ''
        },
        {
            icon: 'fa-temperature-half', label: 'Feels Like',
            valA: `${getTemp(a.main.feels_like)}${getTempUnit()}`, valB: `${getTemp(b.main.feels_like)}${getTempUnit()}`,
            winnerA: false, winnerB: false
        },
        {
            icon: 'fa-temperature-arrow-down', label: 'Min Temp',
            valA: `${getTemp(a.main.temp_min)}${getTempUnit()}`, valB: `${getTemp(b.main.temp_min)}${getTempUnit()}`,
            winnerA: false, winnerB: false
        },
        {
            icon: 'fa-temperature-arrow-up', label: 'Max Temp',
            valA: `${getTemp(a.main.temp_max)}${getTempUnit()}`, valB: `${getTemp(b.main.temp_max)}${getTempUnit()}`,
            winnerA: false, winnerB: false
        },
        {
            icon: 'fa-droplet', label: 'Humidity',
            valA: `${a.main.humidity}%`, valB: `${b.main.humidity}%`,
            winnerA: a.main.humidity < b.main.humidity, winnerB: b.main.humidity < a.main.humidity,
            subA: 'Lower is better', subB: 'Lower is better'
        },
        {
            icon: 'fa-wind', label: 'Wind Speed',
            valA: getWindSpeed(a.wind.speed), valB: getWindSpeed(b.wind.speed),
            winnerA: false, winnerB: false
        },
        {
            icon: 'fa-compass', label: 'Wind Direction',
            valA: `${getWindDir(a.wind.deg)} (${a.wind.deg}°)`, valB: `${getWindDir(b.wind.deg)} (${b.wind.deg}°)`,
            winnerA: false, winnerB: false
        },
        {
            icon: 'fa-gauge-high', label: 'Pressure',
            valA: `${a.main.pressure} hPa`, valB: `${b.main.pressure} hPa`,
            winnerA: false, winnerB: false
        },
        {
            icon: 'fa-eye', label: 'Visibility',
            valA: getVisibility(a.visibility), valB: getVisibility(b.visibility),
            winnerA: a.visibility > b.visibility, winnerB: b.visibility > a.visibility
        },
        {
            icon: 'fa-leaf', label: 'Air Quality',
            valA: `${dataA.aqi} — ${aqiLabels[dataA.aqi - 1] || '?'}`, valB: `${dataB.aqi} — ${aqiLabels[dataB.aqi - 1] || '?'}`,
            winnerA: dataA.aqi < dataB.aqi, winnerB: dataB.aqi < dataA.aqi,
            subA: 'Lower is better', subB: 'Lower is better'
        },
        {
            icon: 'fa-cloud', label: 'Cloud Cover',
            valA: `${a.clouds.all}%`, valB: `${b.clouds.all}%`,
            winnerA: false, winnerB: false
        },
        {
            icon: 'fa-sun', label: 'Sunrise',
            valA: a.sys.sunrise ? formatTime(a.sys.sunrise, a.timezone) : '—',
            valB: b.sys.sunrise ? formatTime(b.sys.sunrise, b.timezone) : '—',
            winnerA: false, winnerB: false
        },
        {
            icon: 'fa-moon', label: 'Sunset',
            valA: a.sys.sunset ? formatTime(a.sys.sunset, a.timezone) : '—',
            valB: b.sys.sunset ? formatTime(b.sys.sunset, b.timezone) : '—',
            winnerA: false, winnerB: false
        }
    ];

    // Header row
    let html = `
        <div class="metric-row metric-header">
            <div class="metric-val left">${a.name}</div>
            <div class="metric-label">Metric</div>
            <div class="metric-val right">${b.name}</div>
        </div>
    `;

    metrics.forEach(m => {
        const winA = m.winnerA ? ' metric-winner' : '';
        const winB = m.winnerB ? ' metric-winner' : '';
        html += `
            <div class="metric-row">
                <div class="metric-val left${winA}">${m.valA}${m.subA ? `<div class="metric-sub">${m.subA}</div>` : ''}</div>
                <div class="metric-label"><i class="fa-solid ${m.icon}"></i> ${m.label}</div>
                <div class="metric-val right${winB}">${m.valB}${m.subB ? `<div class="metric-sub">${m.subB}</div>` : ''}</div>
            </div>
        `;
    });

    metricsDiv.innerHTML = html;

    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
