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

// Demo data for development environment when PHP is not available
const DEMO_BOOKINGS: Booking[] = [
  { id: '1', time: '08:00', aircraft: 'SE-KFR', pilot: 'Erik Andersson', remark: 'Skolflygning', status: 'completed' },
  { id: '2', time: '10:30', aircraft: 'SE-MKL', pilot: 'Anna Svensson', remark: 'XC ESSA', status: 'completed' },
  { id: '3', time: '13:00', aircraft: 'SE-KFR', pilot: 'Johan Berg', remark: 'Lokalflygning', status: 'active' },
  { id: '4', time: '15:30', aircraft: 'SE-GKU', pilot: 'Maria Lindqvist', remark: 'Övning', status: 'upcoming' },
  { id: '5', time: '17:00', aircraft: 'SE-MKL', pilot: 'Peter Holm', remark: '', status: 'upcoming' },
  { id: '6', time: '09:00', aircraft: 'SE-GKU', pilot: '', remark: 'Underhåll motor', status: 'maintenance' },
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
        return;
      }
      
      const data: BookingsResponse = JSON.parse(text);
      
      setBookings(data.bookings);
      setLastUpdate(new Date(data.fetchedAt));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      // Use demo data as fallback
      if (bookings.length === 0) {
        setBookings(DEMO_BOOKINGS);
        setLastUpdate(new Date());
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
