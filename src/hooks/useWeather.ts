import { useState, useEffect, useCallback } from 'react';
import { decodeMetar, type DecodedMetar } from '@/utils/weatherDecoder';

interface CheckWXResponse {
  metar: {
    raw_text: string;
    wind?: {
      degrees: number;
      speed_kts: number;
      gust_kts?: number;
    };
    visibility?: {
      meters: string;
    };
    clouds?: Array<{
      code: string;
      base_feet_agl?: number;
    }>;
    temperature?: {
      celsius: number;
    };
    dewpoint?: {
      celsius: number;
    };
    barometer?: {
      hpa: number;
    };
    flight_category?: string;
  } | null;
  metarRaw: string | null;
  taf: object | null;
  tafRaw: string | null;
  fetchedAt: string;
  error?: string;
}

interface UseWeatherResult {
  metar: DecodedMetar | null;
  metarRaw: string | null;
  tafRaw: string | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refetch: () => Promise<void>;
}

const API_URL = '/api/weather.php';

export function useWeather(refreshInterval = 5 * 60 * 1000): UseWeatherResult {
  const [metar, setMetar] = useState<DecodedMetar | null>(null);
  const [metarRaw, setMetarRaw] = useState<string | null>(null);
  const [tafRaw, setTafRaw] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchWeather = useCallback(async () => {
    try {
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data: CheckWXResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Store raw strings
      setMetarRaw(data.metarRaw);
      setTafRaw(data.tafRaw);
      
      // Decode METAR if we have raw text
      if (data.metarRaw) {
        const decoded = decodeMetar(data.metarRaw);
        setMetar(decoded);
      }
      
      setLastUpdate(new Date(data.fetchedAt));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      // Keep existing data on error
      if (!metar) {
        setError('Kunde inte hämta väderdata');
      }
    } finally {
      setLoading(false);
    }
  }, [metar]);

  useEffect(() => {
    fetchWeather();
    
    const interval = setInterval(fetchWeather, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchWeather, refreshInterval]);

  return {
    metar,
    metarRaw,
    tafRaw,
    loading,
    error,
    lastUpdate,
    refetch: fetchWeather
  };
}
