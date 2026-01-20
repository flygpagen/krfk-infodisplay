import { useState, useEffect } from 'react';

interface LocationConfig {
  icao: string;
  location: {
    lat: number;
    lon: number;
    timezone: string;
  };
}

const DEFAULT_CONFIG: LocationConfig = {
  icao: 'ESMK',
  location: {
    lat: 55.92,
    lon: 14.08,
    timezone: 'Europe/Stockholm',
  },
};

export function useConfig() {
  const [config, setConfig] = useState<LocationConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/config-public.php')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => console.warn('Using default config'))
      .finally(() => setIsLoading(false));
  }, []);

  return { config, isLoading };
}
