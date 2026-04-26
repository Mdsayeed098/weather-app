# ⛅ WeatherIQ — Reflect Edition

> A premium, full-stack weather intelligence platform inspired by **Apple Vision Pro** aesthetics. Featuring cinematic glassmorphism, AI-powered insights, and a secure Node.js backend.

[![Live Demo](https://img.shields.io/badge/Live-Demo-00f2fe?style=for-the-badge&logo=vercel&logoColor=white)](https://mdsayeed098.github.io/weather-app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Mdsayeed098/weather-app)

---

## ✨ Signature Features (Reflect Edition)

### 💎 Cinematic Glassmorphism
Immersive "Reflect" design system with 40px backdrop blurs, grainy noise textures, and dynamic border glows. Inspired by modern spatial computing interfaces.

### 🌌 Gemini Portal Background
A custom-generated high-fidelity cosmic background (`bg-dark.png`) that scrolls naturally with the dashboard, creating a deep sense of spatial depth.

### 🌡️ Refined Weather Mode
Dynamic temperature-based theme engine that shifts the entire dashboard's lighting and accents based on real-time conditions:
- 🔵 **Very Cold (≤ 10°C)**: Deep Icy Navy
- ☁️ **Cool (10°C–20°C)**: Fresh Night Sky
- 🟢 **Mild (20°C–30°C)**: Balanced Premium (Signature Look)
- 🟠 **Warm (30°C–40°C)**: Amber Midnight
- 🔴 **Hot (≥ 40°C)**: Controlled Charcoal-Red

### 📅 10-Day Deep Forecast
Integrated **Open-Meteo API** to provide an extended 10-day detailed outlook with humidity levels, weather codes, and temperature variance.

---

## 🚀 Core Features

| Feature | Description |
|---------|-------------|
| 🔒 **Secure Backend** | Node.js Express proxy to shield API keys from the frontend. |
| 🌍 **City Comparison** | Side-by-side city breakdown with dynamic theme synchronization. |
| 📈 **Temp Trends** | Interactive 24-hour temperature charts with Peak/Low indicators. |
| 🗺️ **Live Radar** | High-contrast Leaflet maps with real-time precipitation overlays. |
| ⚡ **Performance** | Multi-layer caching and skeleton loading for near-instant interaction. |
| 🔐 **Authentication** | Full SaaS-grade Auth flow via **Supabase**. |

---

## 🛠 Tech Stack

- **Frontend**: HTML5, Vanilla CSS (Glassmorphism), JavaScript (ES6+)
- **Backend**: Node.js, Express (Proxy Layer)
- **APIs**: OpenWeatherMap (Current), Open-Meteo (10-Day), Leaflet (Maps)
- **Database**: Supabase (Auth & Session Management)
- **Visualization**: Chart.js

---

## 📁 Project Structure

```
weather-app/
├── server.js           # Secure Node.js Backend Proxy
├── .env                # Private API Keys (Shielded)
├── index.html          # Premium Landing Page (Sign Up)
├── dashboard.html      # Main Dashboard (Reflect UI)
├── compare.html        # Multi-City Comparison
├── app.js              # Dashboard Logic & Theme Engine
├── styles.css          # Dashboard Design System
└── bg-dark.png         # Gemini-Generated Spatial Background
```

---

## 🏁 Getting Started

### 1. Prerequisites
- Node.js (v14+)
- OpenWeatherMap API Key

### 2. Setup Environment
Create a `.env` file in the root directory:
```env
OPENWEATHER_API_KEY=your_key_here
PORT=3000
```

### 3. Install & Run
```bash
# Install dependencies
npm install

# Start the secure backend
npm start

# Open in browser
# Navigate to http://localhost:3000 (or your local dev port)
```

---

## 🌐 Deployment

### Secure Backend (Recommended)
Deploy the Node.js server to **Render**, **Railway**, or **Vercel** to ensure your API keys remain hidden.

### Frontend
The frontend can be hosted on **GitHub Pages**, but it must point to your deployed backend URL in `app.js`.

---

<p align="center">
  Built with ❤️ by <strong>Md Sayeed</strong> — Elevating Weather Intelligence
</p>
