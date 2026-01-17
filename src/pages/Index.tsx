import { useEffect, useState } from 'react';
import { Header } from '@/components/display/Header';
import { BookingsTable } from '@/components/display/BookingsTable';
import { WeatherPanel } from '@/components/display/WeatherPanel';
import { SunTimesStrip } from '@/components/display/SunTimesStrip';

const Index = () => {
  const [cursorHidden, setCursorHidden] = useState(false);

  // Hide cursor after 3 seconds of inactivity
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    const hideCursor = () => {
      setCursorHidden(true);
    };

    const showCursor = () => {
      setCursorHidden(false);
      clearTimeout(timeout);
      timeout = setTimeout(hideCursor, 3000);
    };

    showCursor();
    window.addEventListener('mousemove', showCursor);
    window.addEventListener('mousedown', showCursor);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', showCursor);
      window.removeEventListener('mousedown', showCursor);
    };
  }, []);

  return (
    <div className={`kiosk bg-background text-foreground flex flex-col ${cursorHidden ? 'cursor-hidden' : ''}`}>
      {/* Header with clock and branding */}
      <Header />
      
      {/* Main content area */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 p-4 lg:p-6 overflow-hidden">
        {/* Bookings table - takes 3 columns */}
        <div className="lg:col-span-3 overflow-hidden">
          <BookingsTable />
        </div>
        
        {/* Weather panel - takes 2 columns */}
        <div className="lg:col-span-2 overflow-hidden">
          <WeatherPanel />
        </div>
      </main>
      
      {/* Sun times strip at the bottom */}
      <SunTimesStrip />
    </div>
  );
};

export default Index;
