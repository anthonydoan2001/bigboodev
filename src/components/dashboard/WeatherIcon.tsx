import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudSun,
  CloudMoon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherIconProps {
  iconCode: string;
  className?: string;
}

export function WeatherIcon({ iconCode, className }: WeatherIconProps) {
  // Map OpenWeatherMap icon codes to Lucide icons
  const getIcon = () => {
    const code = iconCode.substring(0, 2);
    const isDay = iconCode.endsWith('d');

    const baseProps = {
      strokeWidth: 1.5,
    };

    switch (code) {
      case '01': // clear sky
        return isDay ? (
          <Sun
            {...baseProps}
            className={cn(
              'w-full h-full text-amber-500 dark:text-amber-400',
              'animate-[spin_30s_linear_infinite] drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]',
              className
            )}
          />
        ) : (
          <Moon
            {...baseProps}
            className={cn(
              'w-full h-full text-blue-300 dark:text-blue-200',
              'drop-shadow-[0_0_8px_rgba(147,197,253,0.3)]',
              className
            )}
          />
        );

      case '02': // few clouds
        return isDay ? (
          <CloudSun
            {...baseProps}
            className={cn(
              'w-full h-full text-amber-500 dark:text-amber-400',
              'drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]',
              className
            )}
          />
        ) : (
          <CloudMoon
            {...baseProps}
            className={cn(
              'w-full h-full text-blue-300 dark:text-blue-200',
              'drop-shadow-[0_0_6px_rgba(147,197,253,0.2)]',
              className
            )}
          />
        );

      case '03': // scattered clouds
      case '04': // broken clouds
        return (
          <Cloud
            {...baseProps}
            className={cn(
              'w-full h-full text-gray-400 dark:text-gray-300',
              'animate-[float_6s_ease-in-out_infinite]',
              className
            )}
          />
        );

      case '09': // shower rain
        return (
          <CloudDrizzle
            {...baseProps}
            className={cn(
              'w-full h-full text-blue-500 dark:text-blue-400',
              'drop-shadow-[0_0_6px_rgba(59,130,246,0.3)]',
              className
            )}
          />
        );

      case '10': // rain
        return (
          <CloudRain
            {...baseProps}
            className={cn(
              'w-full h-full text-blue-600 dark:text-blue-400',
              'drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]',
              className
            )}
          />
        );

      case '11': // thunderstorm
        return (
          <CloudLightning
            {...baseProps}
            className={cn(
              'w-full h-full text-purple-600 dark:text-purple-400',
              'animate-pulse drop-shadow-[0_0_10px_rgba(147,51,234,0.4)]',
              className
            )}
          />
        );

      case '13': // snow
        return (
          <CloudSnow
            {...baseProps}
            className={cn(
              'w-full h-full text-cyan-300 dark:text-cyan-200',
              'animate-[float_4s_ease-in-out_infinite] drop-shadow-[0_0_6px_rgba(165,243,252,0.3)]',
              className
            )}
          />
        );

      case '50': // mist/fog
        return (
          <CloudFog
            {...baseProps}
            className={cn(
              'w-full h-full text-gray-400 dark:text-gray-300',
              'opacity-80',
              className
            )}
          />
        );

      default:
        return (
          <Cloud
            {...baseProps}
            className={cn(
              'w-full h-full text-gray-400 dark:text-gray-300',
              className
            )}
          />
        );
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {getIcon()}
    </div>
  );
}
