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
      <div className="flex items-center gap-4 lg:gap-8">
        <div className="flex flex-col">
          <span className="text-2xl lg:text-5xl font-bold tracking-wider text-primary">KRFK</span>
          <span className="text-xs lg:text-base text-muted-foreground">Kristianstad Flygklubb</span>
        </div>
        <div className="h-10 lg:h-16 w-px bg-border/50" />
        <div className="flex flex-col">
          <span className="text-base lg:text-2xl font-semibold text-accent-foreground">ESMK</span>
          <span className="text-xs lg:text-sm text-muted-foreground">Kristianstad Flygplats</span>
        </div>
      </div>

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
          <div className="text-3xl lg:text-6xl font-mono font-bold text-primary tracking-wider">{utcTime}Z</div>
        </div>
      </div>
    </header>
  );
}
