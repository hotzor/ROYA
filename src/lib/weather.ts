import type { WeatherForecast } from "./store";

const MOCK_FORECASTS: Record<string, WeatherForecast> = {};

function generateMockForecast(date: string, location: string): WeatherForecast {
  const key = `${date}_${location}`;
  if (MOCK_FORECASTS[key]) return MOCK_FORECASTS[key];

  const seed = hashString(date + location);
  const conditions = ["Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Overcast", "Sunny"];
  const icons = ["☀️", "⛅", "☁️", "🌧️", "☁️", "☀️"];
  const rainChances = [5, 20, 35, 65, 40, 8];
  const temps = [18, 22, 20, 16, 19, 25];

  const idx = seed % conditions.length;
  const forecast: WeatherForecast = {
    date,
    location,
    temp: temps[idx] + (seed % 5),
    conditions: conditions[idx],
    rainPercent: rainChances[idx] + ((seed * 7) % 15) - 7,
    icon: icons[idx],
  };

  MOCK_FORECASTS[key] = forecast;
  return forecast;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function getWeatherForecast(
  location: string,
  date: string
): Promise<WeatherForecast> {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return generateMockForecast(date, location);
  }

  try {
    const query = encodeURIComponent(location.split("—")[0].trim());
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${query}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      return generateMockForecast(date, location);
    }

    const data = await response.json();
    const targetDt = new Date(date).getTime() / 1000;

    let closest = data.list[0];
    let minDiff = Math.abs(closest.dt - targetDt);
    for (const entry of data.list) {
      const diff = Math.abs(entry.dt - targetDt);
      if (diff < minDiff) {
        minDiff = diff;
        closest = entry;
      }
    }

    return {
      date,
      location,
      temp: Math.round(closest.main.temp),
      conditions: closest.weather[0]?.description || "Unknown",
      rainPercent: Math.round((closest.pop || 0) * 100),
      icon: getWeatherIcon(closest.weather[0]?.main),
    };
  } catch {
    return generateMockForecast(date, location);
  }
}

function getWeatherIcon(main: string): string {
  const map: Record<string, string> = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
  };
  return map[main || ""] || "🌤️";
}

export async function getWeatherForDates(
  location: string,
  dates: string[]
): Promise<WeatherForecast[]> {
  const forecasts = await Promise.all(
    dates.map((d) => getWeatherForecast(location, d))
  );
  return forecasts;
}
