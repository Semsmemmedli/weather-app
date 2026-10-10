
const apiKey = "d5e495bfb42fe734e9205048ace9311d";

let currentUnit = "metric";
const input = document.getElementById("cityInput");
const listContainer = document.getElementById("autocompleteList");

const globalMegaCities = [
  "Tokyo", "Toronto", "Toledo", "Toulouse", "Turin", "Tomsk",
  "Baku", "London", "New York", "Paris", "Berlin", "Moscow", "Istanbul", "Beijing"
];

function setUnit(unit) {
  if (currentUnit === unit) return;
  currentUnit = unit;

  document.getElementById("unitC").classList.toggle("active", unit === "metric");
  document.getElementById("unitF").classList.toggle("active", unit === "imperial");

  if (input.value.trim() !== "") {
    getWeather();
  }
}

input.addEventListener("input", async function () {
  const query = this.value.trim();
  listContainer.innerHTML = "";

  if (!query || query.length < 1) return;

  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=10&appid=${apiKey}`;
    const response = await fetch(geoUrl);
    let cities = await response.json();

    cities.sort((a, b) => {
      const aIndex = globalMegaCities.findIndex(c => c.toLowerCase() === a.name.toLowerCase());
      const bIndex = globalMegaCities.findIndex(c => c.toLowerCase() === b.name.toLowerCase());

      const aRank = aIndex !== -1 ? aIndex : 999;
      const bRank = bIndex !== -1 ? bIndex : 999;

      return aRank - bRank;
    });

    const uniqueCities = [];
    const seen = new Set();

    cities.forEach(city => {
      const key = `${city.name.toLowerCase()}-${city.country.toLowerCase()}`;
      if (!seen.has(key) && uniqueCities.length < 5) {
        seen.add(key);
        uniqueCities.push(city);
      }
    });

    uniqueCities.forEach(city => {
      const item = document.createElement("div");
      const cityName = `${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}`;
      item.innerHTML = `<strong>${cityName}</strong>`;

      item.addEventListener("click", function () {
        input.value = city.name;
        listContainer.innerHTML = "";
        getWeather();
      });

      listContainer.appendChild(item);
    });
  } catch (error) {
    console.log(error);
  }
});

document.addEventListener("click", function (e) {
  if (e.target !== input) {
    listContainer.innerHTML = "";
  }
});

async function getWeather() {
  const city = input.value;
  const resultDiv = document.getElementById("weatherResult");
  listContainer.innerHTML = "";

  if (!city) return;

  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${currentUnit}&lang=en`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${currentUnit}&lang=en`;

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl)
    ]);

    if (!currentRes.ok || !forecastRes.ok) throw new Error("City not found");

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    updateBackground(currentData.weather[0].main);
    renderWeather(currentData, forecastData);
  } catch (error) {
    resultDiv.innerHTML = `<p style="text-align:center; padding: 20px; color: #ffe6e6;">${error.message}</p>`;
  }
}

function updateBackground(weatherCondition) {
  const body = document.body;
  body.className = "";

  switch (weatherCondition.toLowerCase()) {
    case "clear": body.classList.add("bg-clear"); break;
    case "clouds": body.classList.add("bg-clouds"); break;
    case "rain":
    case "drizzle": body.classList.add("bg-rain"); break;
    case "snow": body.classList.add("bg-snow"); break;
    case "thunderstorm": body.classList.add("bg-thunder"); break;
    default: body.classList.add("bg-default"); break;
  }
}

function renderWeather(current, forecast) {
  const resultDiv = document.getElementById("weatherResult");
  const unitSymbol = currentUnit === "metric" ? "°C" : "°F";

  let hourlyHTML = forecast.list.slice(0, 8).map(item => {
    const time = new Date(item.dt * 1000).getHours() + ":00";
    const icon = item.weather[0].icon;
    return `
      <div class="hourly-item">
        <span>${time}</span>
        <img src="https://openweathermap.org/img/wn/${icon}.png" width="35">
        <strong>${Math.round(item.main.temp)}°</strong>
      </div>
    `;
  }).join("");

  const dailyList = forecast.list.filter(item => item.dt_txt.includes("12:00:00"));
  let dailyHTML = dailyList.map(item => {
    const dateObj = new Date(item.dt * 1000);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const dayDate = dateObj.getDate() + " " + dateObj.toLocaleDateString("en-US", { month: "short" });
    const icon = item.weather[0].icon;
    return `
      <div class="daily-item">
        <span style="width: 80px; text-align: left;">${dayName}, ${dayDate}</span>
        <img src="https://openweathermap.org/img/wn/${icon}.png" width="35">
        <span style="text-transform: capitalize;">${item.weather[0].main}</span>
        <strong">${Math.round(item.main.temp)}${unitSymbol}</strong>
      </div>
    `;
  }).join("");

  resultDiv.innerHTML = `
    <div class="main-info">
      <h2>${current.name}, ${current.sys.country}</h2>
      <div class="temp-big">${Math.round(current.main.temp)}${unitSymbol}</div>
      <div class="desc">${current.weather[0].description}</div>
    </div>

    <div class="section-title"><i class="fa-regular fa-clock"></i> Hourly Forecast</div>
    <div class="hourly-container">${hourlyHTML}</div>

    <div class="section-title"><i class="fa-regular fa-calendar"></i> 5-Day Forecast</div>
    <div class="daily-container">${dailyHTML}</div>
  `;
}

input.addEventListener("keypress", function (e) {
  if (e.key === "Enter") getWeather();
});