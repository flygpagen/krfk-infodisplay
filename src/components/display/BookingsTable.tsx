import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBookings, type Booking } from '@/hooks/useBookings';
import { Loader2, AlertCircle } from 'lucide-react';

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
    case 'active':
      return (
        <span className="text-sm lg:text-base px-3 py-1 rounded bg-green-500/20 text-green-400 animate-pulse">
          ● Pågående
        </span>
      );
    case 'upcoming':
      return <span className="text-sm lg:text-base px-3 py-1 rounded bg-blue-500/20 text-blue-400">Kommande</span>;
    case 'maintenance':
      return <span className="text-sm lg:text-base px-3 py-1 rounded bg-orange-500/20 text-orange-400">Underhåll</span>;
    default:
      return null;
  }
}

export function BookingsTable() {
  const { bookings, loading, error, lastUpdate } = useBookings();

  const sortedBookings = useMemo(() => {
    return [...bookings]
      .filter(b => b.status !== 'completed')
      .sort((a, b) => {
        const statusOrder: Record<string, number> = { active: 0, upcoming: 1, maintenance: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return a.time.localeCompare(b.time);
      });
  }, [bookings]);

  const remainingFlights = sortedBookings.filter(
    b => b.status === 'active' || b.status === 'upcoming'
  ).length;

  if (loading && bookings.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 lg:w-14 lg:h-14 animate-spin text-primary" />
        <span className="text-lg lg:text-2xl text-muted-foreground">Laddar bokningar...</span>
      </div>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 lg:w-14 lg:h-14 text-destructive" />
        <span className="text-lg lg:text-2xl text-muted-foreground">{error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 lg:mb-5">
        <h2 className="text-xl lg:text-3xl font-semibold text-foreground">Dagens bokningar</h2>
        <div className="flex items-center gap-4 lg:gap-6">
          <span className="text-base lg:text-xl text-muted-foreground">
            {remainingFlights} flygningar kvar
          </span>
          {lastUpdate && (
            <span className="text-sm lg:text-base text-muted-foreground">
              Uppdaterad {lastUpdate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-base lg:text-xl font-semibold py-3 lg:py-4">Tid</TableHead>
              <TableHead className="text-base lg:text-xl font-semibold py-3 lg:py-4">Flygplan</TableHead>
              <TableHead className="text-base lg:text-xl font-semibold py-3 lg:py-4">Pilot</TableHead>
              <TableHead className="text-base lg:text-xl font-semibold py-3 lg:py-4 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xl lg:text-2xl text-muted-foreground py-12 lg:py-16">
                  Inga bokningar idag
                </TableCell>
              </TableRow>
            ) : (
              sortedBookings.map((booking) => (
                <TableRow 
                  key={booking.id} 
                  className={`${getStatusStyles(booking.status)} transition-colors`}
                >
                  <TableCell className="font-mono text-xl lg:text-2xl py-3 lg:py-5">
                    {booking.time}
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-2xl lg:text-3xl">{booking.aircraft}</span>
                  </TableCell>
                  <TableCell className="text-xl lg:text-2xl">{booking.pilot}</TableCell>
                  <TableCell className="text-right">{getStatusBadge(booking.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
