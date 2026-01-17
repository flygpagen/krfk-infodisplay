import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Booking {
  id: string;
  time: string;
  endTime: string;
  aircraft: string;
  registration: string;
  pilot: string;
  remarks?: string;
  status: 'completed' | 'active' | 'upcoming' | 'maintenance';
}

// Mock data - in production this would come from an API
const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1',
    time: '08:00',
    endTime: '10:00',
    aircraft: 'PA-28',
    registration: 'SE-KFG',
    pilot: 'Anders Svensson',
    remarks: 'Training flight',
    status: 'completed',
  },
  {
    id: '2',
    time: '10:30',
    endTime: '12:30',
    aircraft: 'C172',
    registration: 'SE-MKL',
    pilot: 'Erik Johansson',
    remarks: 'Cross-country',
    status: 'completed',
  },
  {
    id: '3',
    time: '13:00',
    endTime: '15:00',
    aircraft: 'PA-28',
    registration: 'SE-KFG',
    pilot: 'Maria Lindqvist',
    status: 'active',
  },
  {
    id: '4',
    time: '15:30',
    endTime: '17:30',
    aircraft: 'C172',
    registration: 'SE-MKL',
    pilot: 'Johan Berg',
    remarks: 'Solo practice',
    status: 'upcoming',
  },
  {
    id: '5',
    time: '09:00',
    endTime: '17:00',
    aircraft: 'Robin DR400',
    registration: 'SE-XYZ',
    pilot: '—',
    remarks: '100h inspection',
    status: 'maintenance',
  },
];

function getStatusStyles(status: Booking['status']) {
  switch (status) {
    case 'completed':
      return 'opacity-50';
    case 'active':
      return 'bg-green-500/10 border-l-4 border-l-green-500';
    case 'upcoming':
      return 'bg-blue-500/5';
    case 'maintenance':
      return 'bg-orange-500/10 border-l-4 border-l-orange-500';
    default:
      return '';
  }
}

function getStatusBadge(status: Booking['status']) {
  switch (status) {
    case 'completed':
      return <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Completed</span>;
    case 'active':
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 animate-pulse">
          ● Active
        </span>
      );
    case 'upcoming':
      return <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">Upcoming</span>;
    case 'maintenance':
      return <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">Maintenance</span>;
    default:
      return null;
  }
}

export function BookingsTable() {
  const sortedBookings = useMemo(() => {
    return [...MOCK_BOOKINGS].sort((a, b) => {
      const statusOrder = { active: 0, upcoming: 1, maintenance: 2, completed: 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return a.time.localeCompare(b.time);
    });
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Today's Bookings</h2>
        <span className="text-sm text-muted-foreground">
          {sortedBookings.filter(b => b.status === 'active' || b.status === 'upcoming').length} flights remaining
        </span>
      </div>
      
      <div className="flex-1 overflow-auto rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-base font-semibold">Time</TableHead>
              <TableHead className="text-base font-semibold">Aircraft</TableHead>
              <TableHead className="text-base font-semibold">Pilot</TableHead>
              <TableHead className="text-base font-semibold">Remarks</TableHead>
              <TableHead className="text-base font-semibold text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBookings.map((booking) => (
              <TableRow 
                key={booking.id} 
                className={`${getStatusStyles(booking.status)} transition-colors`}
              >
                <TableCell className="font-mono text-lg">
                  {booking.time} - {booking.endTime}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-lg">{booking.registration}</span>
                    <span className="text-sm text-muted-foreground">{booking.aircraft}</span>
                  </div>
                </TableCell>
                <TableCell className="text-lg">{booking.pilot}</TableCell>
                <TableCell className="text-muted-foreground">{booking.remarks || '—'}</TableCell>
                <TableCell className="text-right">{getStatusBadge(booking.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
