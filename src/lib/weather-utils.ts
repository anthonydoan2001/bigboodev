export interface WeatherBackground {
  gradient: string;
  animation: string;
  textColor: string;
}

export function getWeatherBackground(condition: string): WeatherBackground {
  const normalizedCondition = condition.toLowerCase();

  // Snow conditions
  if (normalizedCondition.includes('snow')) {
    return {
      gradient: 'from-slate-400 via-slate-500 to-slate-600',
      animation: 'animate-snow',
      textColor: 'text-white',
    };
  }

  // Heavy rain conditions
  if (normalizedCondition.includes('rain') || normalizedCondition.includes('drizzle')) {
    return {
      gradient: 'from-slate-500 via-slate-600 to-slate-700',
      animation: 'animate-rain',
      textColor: 'text-white',
    };
  }

  // Thunderstorm
  if (normalizedCondition.includes('thunder')) {
    return {
      gradient: 'from-indigo-700 via-purple-800 to-indigo-900',
      animation: 'animate-thunder',
      textColor: 'text-white',
    };
  }

  // Cloudy/Overcast
  if (normalizedCondition.includes('cloud') || normalizedCondition.includes('overcast')) {
    return {
      gradient: 'from-gray-400 via-gray-500 to-gray-600',
      animation: 'animate-clouds',
      textColor: 'text-white',
    };
  }

  // Partly cloudy
  if (normalizedCondition.includes('partly')) {
    return {
      gradient: 'from-blue-300 via-blue-400 to-blue-500',
      animation: 'animate-partly-cloudy',
      textColor: 'text-white',
    };
  }

  // Clear/Sunny
  if (normalizedCondition.includes('clear') || normalizedCondition.includes('sun')) {
    return {
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      animation: 'animate-sunny',
      textColor: 'text-white',
    };
  }

  // Mist/Fog
  if (normalizedCondition.includes('mist') || normalizedCondition.includes('fog') || normalizedCondition.includes('haze')) {
    return {
      gradient: 'from-gray-300 via-gray-400 to-gray-500',
      animation: 'animate-fog',
      textColor: 'text-gray-900',
    };
  }

  // Default (clear sky)
  return {
    gradient: 'from-blue-400 via-blue-500 to-blue-600',
    animation: 'animate-sunny',
    textColor: 'text-white',
  };
}

export function getWeatherSummary(condition: string, hourly: Array<{ condition: string; time: string; precipitation: number }>): string {
  const normalizedCondition = condition.toLowerCase();
  const nextFewHours = hourly.slice(0, 6);
  
  // Check for rain in next few hours
  const hasRain = nextFewHours.some(h => h.condition.toLowerCase().includes('rain') || h.precipitation > 30);
  const hasSnow = nextFewHours.some(h => h.condition.toLowerCase().includes('snow'));
  const hasClouds = nextFewHours.some(h => h.condition.toLowerCase().includes('cloud'));
  
  if (hasSnow) {
    return 'Snowy conditions expected, with heavy snow possible later.';
  }
  
  if (hasRain) {
    const rainHours = nextFewHours.filter(h => h.precipitation > 30);
    if (rainHours.length > 0) {
      return `Rainy conditions ${rainHours[0].time.toLowerCase()}, continuing through the morning.`;
    }
    return 'Rainy conditions expected throughout the day.';
  }
  
  if (hasClouds && normalizedCondition.includes('clear')) {
    return 'Cloudy conditions expected, with sunny conditions later.';
  }
  
  if (normalizedCondition.includes('wind')) {
    return 'Windy conditions expected throughout the day.';
  }
  
  if (normalizedCondition.includes('cloud')) {
    return 'Cloudy conditions expected, with some clearing later.';
  }
  
  return 'Clear conditions expected throughout the day.';
}

export function getWeatherIcon(iconCode: string): string {
  // Map OpenWeather icon codes to emoji or use the icon URL
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
