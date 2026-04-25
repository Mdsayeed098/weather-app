# ⛅ WeatherIQ — Intelligent Weather Dashboard

> A premium, real-time weather intelligence platform featuring smart alerts, city comparison, AI-powered insights, and stunning glassmorphic design.

[![Live Demo](https://img.shields.io/badge/Live-Demo-00f2fe?style=for-the-badge&logo=vercel&logoColor=white)](https://mdsayeed098.github.io/weather-app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Mdsayeed098/weather-app)

---

## ✨ Signature Features

### 🔥 Weather Alerts System
Contextual, severity-based weather alerts generated from live data — heatwave warnings, freezing conditions, thunderstorm alerts, high wind advisories, fog, poor air quality, and extreme UV.

### 🌍 Compare Cities
A dedicated comparison page where you select two cities and get a full side-by-side breakdown with **dynamic temperature-based color themes** for each city. Compare temp, feels like, humidity, wind, AQI, pressure, visibility, sunrise/sunset, and more.

### 📊 Smart Weather Insights
Actionable advice panels including:
- ☀️ **Best time to go outside** — based on hourly forecast
- 🫁 **Air quality advice** — based on AQI level
- 👕 **What to wear** — based on temp, wind, and conditions
- 🏃 **Exercise recommendation** — based on temp, humidity, and AQI
- 🌂 **Rain prediction** — scans next 24h forecast
- 📸 **Golden hour** — calculated from sunrise/sunset

---

## 🚀 Core Features

| Feature | Description |
|---------|-------------|
| 🌡️ Real-Time Weather | Current conditions for any city worldwide via OpenWeatherMap API |
| 📈 Temperature Chart | Interactive 24-hour temperature trend with Chart.js |
| 🕐 Hourly Forecast | Next 24 hours of weather data |
| 📅 5-Day Forecast | Extended daily outlook |
| 🗺️ Live Radar | Interactive Leaflet.js map with precipitation overlay |
| 🌙 Sun & Moon | Sunrise, sunset, and calculated moon phase |
| 💨 Detail Cards | Wind, humidity, pressure, visibility, feels like, UV index, AQI |
| 🔐 Authentication | Full signup/login flow with Supabase Auth |
| 👤 User Profile | Persistent preferences: default location, units, notifications |
| 🎨 Theme Toggle | Dark/Light mode with smooth transitions |
| 🌡️ Unit Toggle | Celsius/Fahrenheit switch (persisted) |
| 🔍 Search Autocomplete | City search with recent history |

---

## ⚡ Performance

- **API Response Caching** — Weather data is cached in `localStorage` for 10 minutes to avoid redundant API calls
- **Parallel API Calls** — Weather, forecast, and AQI data fetched simultaneously with `Promise.all()`
- **Skeleton Loading** — Smooth skeleton screens while data loads
- **Lazy Map Rendering** — Map tiles loaded efficiently with Leaflet

---

## 🎨 Design & UX

- **Glassmorphism** — Frosted glass cards with `backdrop-filter` throughout
- **Dynamic Backgrounds** — Weather-reactive gradient backgrounds
- **Custom Map Marker** — Gradient pulsing dot with glassmorphic popup
- **Fade-in Animations** — Staggered card entrance animations
- **Button Ripple Effects** — Material-style click feedback
- **Responsive Design** — Fully responsive from 4K to mobile

---

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Semantic structure |
| **CSS3** | Glassmorphism, animations, responsive grid |
| **JavaScript ES6+** | Core logic, DOM manipulation, async/await |
| **OpenWeatherMap API** | Weather data, forecasts, air quality, geocoding |
| **Chart.js** | Temperature trend visualization |
| **Leaflet.js** | Interactive radar map |
| **Supabase** | Authentication & session management |
| **Google Fonts** | Inter + Outfit typography |
| **Font Awesome 6** | Icon system |

---

## 📁 Project Structure

```
weather-app/
├── index.html          # Main dashboard
├── compare.html        # City comparison page
├── login.html          # Sign-in page
├── signup.html         # Sign-up / landing page
├── profile.html        # User settings & preferences
├── styles.css          # Dashboard styles
├── signup.css          # Signup page styles
├── app.js              # Dashboard logic (weather, charts, alerts, insights)
├── compare.js          # City comparison logic
├── auth.js             # Supabase auth helper
├── hero_tech.png       # Signup hero image
├── gallery_grid.png    # Gallery section image
├── world_map_bg.png    # World map background
└── README.md           # This file
```

---

## 🏁 Getting Started

### Prerequisites
- A modern web browser
- A local development server (any of the following):
  - Python: `python -m http.server 8888`
  - Node.js: `npx serve`
  - VS Code: Live Server extension

### Run Locally

```bash
# Clone the repository
git clone https://github.com/Mdsayeed098/weather-app.git
cd weather-app

# Start a local server (Python example)
python -m http.server 8888

# Open in browser
# Navigate to http://localhost:8888
```

---

## 🔒 API Key Security

The OpenWeatherMap API key is currently embedded in the frontend JavaScript. For a static site, this is standard practice, but you should **restrict the key** to prevent misuse:

1. Go to [OpenWeatherMap API Keys](https://home.openweathermap.org/api_keys)
2. Click your API key → Edit
3. Under **Restrict by HTTP referrer**, add your domain (e.g., `https://yourusername.github.io/*`)

> **Note**: For full API key security, you would need a backend proxy (e.g., Vercel Serverless Functions, Cloudflare Workers) to keep the key server-side. This is documented but not implemented since this is a frontend-only project.

---

## 🌐 Deployment

### GitHub Pages (Recommended)
1. Push your code to GitHub
2. Go to **Settings → Pages**
3. Set source to `main` branch, root directory
4. Your app will be live at `https://yourusername.github.io/weather-app/`

### Netlify
1. Connect your GitHub repo
2. Set build command to empty (static site)
3. Deploy!

### Vercel
1. Import your GitHub repo
2. Framework: Other (static)
3. Deploy!

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <strong>Md Sayeed</strong> — Powered by <strong>OpenWeatherMap</strong>
</p>
