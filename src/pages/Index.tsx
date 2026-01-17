import { Header } from '@/components/display/Header';
import { BookingsTable } from '@/components/display/BookingsTable';
import { WeatherPanel } from '@/components/display/WeatherPanel';
import { SunTimesStrip } from '@/components/display/SunTimesStrip';

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header with clock and branding */}
      <Header />
      
      {/* Main content area */}
      <main className="flex-1 grid grid-cols-5 gap-6 p-6 overflow-hidden">
        {/* Bookings table - takes 3 columns */}
        <div className="col-span-3 overflow-hidden">
          <BookingsTable />
        </div>
        
        {/* Weather panel - takes 2 columns */}
        <div className="col-span-2 overflow-hidden">
          <WeatherPanel />
        </div>
      </main>
      
      {/* Sun times strip at the bottom */}
      <SunTimesStrip />
    </div>
  );
};

export default Index;
