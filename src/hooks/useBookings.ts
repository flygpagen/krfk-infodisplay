import { useState, useEffect, useCallback } from 'react';

export interface Booking {
  id: string;
  time: string;
  aircraft: string;
  pilot: string;
  remark: string;
  status: 'completed' | 'active' | 'upcoming' | 'maintenance';
}

interface BookingsResponse {
  bookings: Booking[];
  fetchedAt: string;
  count: number;
}

interface UseBookingsResult {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refetch: () => Promise<void>;
}

// Use relative path for production, or fallback for development
const API_URL = '/api/bookings.php';

export function useBookings(refreshInterval = 2 * 60 * 1000): UseBookingsResult {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data: BookingsResponse = await response.json();
      
      setBookings(data.bookings);
      setLastUpdate(new Date(data.fetchedAt));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      // Keep existing data on error, just set error message
      if (bookings.length === 0) {
        setError('Kunde inte hämta bokningar');
      }
    } finally {
      setLoading(false);
    }
  }, [bookings.length]);

  useEffect(() => {
    fetchBookings();
    
    const interval = setInterval(fetchBookings, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchBookings, refreshInterval]);

  return {
    bookings,
    loading,
    error,
    lastUpdate,
    refetch: fetchBookings
  };
}
