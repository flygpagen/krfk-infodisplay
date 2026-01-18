import { useState, useEffect } from 'react';

export function Header() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const utcTime = time.toISOString().slice(11, 19);
  const localTime = time.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Stockholm',
  });
  const dateStr = time.toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="flex items-center justify-between px-6 lg:px-10 py-3 lg:py-5 border-b border-border/50 bg-gradient-to-r from-background to-card">
      <span className="text-2xl lg:text-5xl font-bold tracking-wider text-primary">KRFK</span>

      <div className="text-center hidden lg:block">
        <div className="text-base lg:text-xl text-muted-foreground capitalize">{dateStr}</div>
      </div>

      <div className="flex items-center gap-4 lg:gap-10">
        <div className="text-right">
          <div className="text-xs lg:text-base text-muted-foreground">Lokal</div>
          <div className="text-xl lg:text-4xl font-mono font-semibold">{localTime}</div>
        </div>
        <div className="h-10 lg:h-16 w-px bg-border/50" />
        <div className="text-right">
          <div className="text-xs lg:text-base text-muted-foreground">UTC</div>
          <div className="text-xl lg:text-4xl font-mono font-semibold">{utcTime}Z</div>
        </div>
      </div>
    </header>
  );
}
