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
    <header className="flex items-center justify-between px-8 py-4 border-b border-border/50 bg-gradient-to-r from-background to-card">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-3xl font-bold tracking-wider text-primary">KRFK</span>
          <span className="text-sm text-muted-foreground">Kristianstad Flygklubb</span>
        </div>
        <div className="h-12 w-px bg-border/50" />
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-accent-foreground">ESMK</span>
          <span className="text-xs text-muted-foreground">Kristianstad Flygplats</span>
        </div>
      </div>

      <div className="text-center">
        <div className="text-sm text-muted-foreground capitalize">{dateStr}</div>
      </div>

      <div className="flex items-center gap-8">
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Lokal</div>
          <div className="text-2xl font-mono font-semibold">{localTime}</div>
        </div>
        <div className="h-12 w-px bg-border/50" />
        <div className="text-right">
          <div className="text-sm text-muted-foreground">UTC</div>
          <div className="text-4xl font-mono font-bold text-primary tracking-wider">{utcTime}Z</div>
        </div>
      </div>
    </header>
  );
}
