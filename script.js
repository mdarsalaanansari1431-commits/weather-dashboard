// OpenWeatherMap API Configuration
const API_KEY = 'b6fd43b51ba2a8532e4268d39e8b0ffb'; // Free tier API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const currentWeatherDiv = document.getElementById('currentWeather');
const forecastDiv = document.getElementById('forecast');
const lastUpdateSpan = document.getElementById('lastUpdate');

// Weather icons mapping
const weatherIcons = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '🌤️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️'
};

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Try to get user's location on page load
    getWeatherByLocation();
    
    // Event listeners
    searchBtn.addEventListener('click', searchWeather);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchWeather();
    });
    locationBtn.addEventListener('click', getWeatherByLocation);
});

// Search weather by city name
function searchWeather() {
    const city = searchInput.value.trim();
    if (city) {
        fetchWeatherData(city);
        searchInput.value = '';
    }
}

// Get weather by geolocation
function getWeatherByLocation() {
    if (navigator.geolocation) {
        locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherDataByCoords(latitude, longitude);
                locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
            },
            (error) => {
                console.log('Geolocation error:', error);
                // Default to London if geolocation fails
                fetchWeatherData('London');
                locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
            }
        );
    }
}

// Fetch weather data by city name
async function fetchWeatherData(city) {
    try {
        currentWeatherDiv.innerHTML = '<div class="loading">Loading weather data...</div>';
        forecastDiv.innerHTML = '<div class="loading">Loading forecast...</div>';
        
        const currentResponse = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        
        if (!currentResponse.ok) {
            throw new Error('City not found');
        }
        
        const currentData = await currentResponse.json();
        const { lat, lon } = currentData.coord;
        
        // Fetch forecast data
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastResponse.json();
        
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        updateAdditionalDetails(currentData);
        updateLastUpdate();
        
    } catch (error) {
        currentWeatherDiv.innerHTML = `<div class="error"><i class="fas fa-exclamation-circle"></i> ${error.message}. Please try another city.</div>`;
        console.error('Error fetching weather:', error);
    }
}

// Fetch weather data by coordinates
async function fetchWeatherDataByCoords(lat, lon) {
    try {
        currentWeatherDiv.innerHTML = '<div class="loading">Loading weather data...</div>';
        forecastDiv.innerHTML = '<div class="loading">Loading forecast...</div>';
        
        const currentResponse = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const currentData = await currentResponse.json();
        
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastResponse.json();
        
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        updateAdditionalDetails(currentData);
        updateLastUpdate();
        
    } catch (error) {
        currentWeatherDiv.innerHTML = `<div class="error">Error loading weather data</div>`;
        console.error('Error fetching weather:', error);
    }
}

// Display current weather
function displayCurrentWeather(data) {
    const { name, sys, main, weather, wind, visibility, clouds } = data;
    const icon = weatherIcons[weather[0].icon] || '🌤️';
    const temp = Math.round(main.temp);
    const feelsLike = Math.round(main.feels_like);
    const tempMax = Math.round(main.temp_max);
    const tempMin = Math.round(main.temp_min);
    
    currentWeatherDiv.innerHTML = `
        <div class="weather-card">
            <div class="city-name">${name}, ${sys.country}</div>
            <div class="weather-description">${weather[0].description}</div>
            <div class="weather-main">
                <div class="weather-icon">${icon}</div>
                <div>
                    <div class="temperature">${temp}°C</div>
                    <div class="temp-range">High: ${tempMax}°C | Low: ${tempMin}°C</div>
                </div>
            </div>
        </div>
    `;
}

// Display 5-day forecast
function displayForecast(data) {
    const forecasts = {};
    
    // Group forecasts by day
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        if (!forecasts[date]) {
            forecasts[date] = [];
        }
        forecasts[date].push(item);
    });
    
    let forecastHTML = '';
    let dayCount = 0;
    
    for (const [date, items] of Object.entries(forecasts)) {
        if (dayCount >= 5) break;
        
        // Get average temp and most common weather for the day
        const temps = items.map(item => item.main.temp);
        const avgTemp = Math.round(temps.reduce((a, b) => a + b) / temps.length);
        const weatherDescriptions = items.map(item => item.weather[0].description);
        const mostCommon = weatherDescriptions[0]; // Simplified
        const iconCode = items[0].weather[0].icon;
        const icon = weatherIcons[iconCode] || '🌤️';
        const maxTemp = Math.round(Math.max(...temps));
        const minTemp = Math.round(Math.min(...temps));
        
        forecastHTML += `
            <div class="forecast-card">
                <div class="forecast-day">${date}</div>
                <div class="forecast-icon">${icon}</div>
                <div class="forecast-temp">${avgTemp}°C</div>
                <div class="forecast-desc">${mostCommon}</div>
                <div style="font-size: 12px; margin-top: 5px; opacity: 0.8;">H: ${maxTemp}° L: ${minTemp}°</div>
            </div>
        `;
        
        dayCount++;
    }
    
    forecastDiv.innerHTML = forecastHTML;
}

// Update additional weather details
function updateAdditionalDetails(data) {
    const { main, wind, visibility, clouds } = data;
    
    document.getElementById('humidity').textContent = `${main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${(wind.speed * 3.6).toFixed(1)} km/h`;
    document.getElementById('pressure').textContent = `${main.pressure} mb`;
    document.getElementById('feelsLike').textContent = `${Math.round(main.feels_like)}°C`;
    document.getElementById('visibility').textContent = `${(visibility / 1000).toFixed(1)} km`;
    document.getElementById('uvIndex').textContent = `${clouds.all}%`; // Using cloud coverage as proxy
}

// Update last update time
function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    lastUpdateSpan.textContent = timeString;
}