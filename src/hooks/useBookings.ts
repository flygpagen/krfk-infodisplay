import { useState, useEffect, useCallback } from 'react';

export interface Booking {
  id: string;
  time: string;
  aircraft: string;
  pilot: string;
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

// Demo data for development environment when PHP is not available
const DEMO_BOOKINGS: Booking[] = [
  { id: '3', time: '13:00-14:30', aircraft: 'SE-KFR', pilot: 'Johan Berg', status: 'active' },
  { id: '4', time: '15:30-17:00', aircraft: 'SE-GKU', pilot: 'Maria Lindqvist', status: 'upcoming' },
  { id: '5', time: '17:00-18:30', aircraft: 'SE-MKL', pilot: 'Peter Holm', status: 'upcoming' },
  { id: '6', time: 'Heldag', aircraft: 'SE-GKU', pilot: '', status: 'maintenance' },
];

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
      
      const text = await response.text();
      
      // Check if we got PHP source code instead of JSON (dev environment)
      if (text.trim().startsWith('<?php') || text.trim().startsWith('<?')) {
        console.log('PHP not executed, using demo data');
        setBookings(DEMO_BOOKINGS);
        setLastUpdate(new Date());
        setError(null);
        setLoading(false);
        return;
      }
      
      const data: BookingsResponse = JSON.parse(text);
      
      setBookings(data.bookings);
      setLastUpdate(new Date(data.fetchedAt));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      // Use demo data as fallback on first load only
      setBookings(prev => {
        if (prev.length === 0) {
          setLastUpdate(new Date());
          return DEMO_BOOKINGS;
        }
        return prev;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    
    const interval = setInterval(fetchBookings, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return {
    bookings,
    loading,
    error,
    lastUpdate,
    refetch: fetchBookings
  };
}
