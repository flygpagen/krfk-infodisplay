import { Wind, Eye, Thermometer, Gauge, Cloud, Loader2, AlertCircle } from 'lucide-react';
import { getFlightCategoryColor, getWindDirectionName } from '@/utils/weatherDecoder';
import { useWeather } from '@/hooks/useWeather';

function WindIndicator({ direction, speed, gust }: { direction: number | 'VRB'; speed: number; gust?: number }) {
  const rotation = direction === 'VRB' ? 0 : direction;
  
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20">
        {/* Compass rose */}
        <div className="absolute inset-0 rounded-full border-2 border-border/50">
          <span className="absolute top-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">N</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">S</span>
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">V</span>
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Ö</span>
        </div>
        {/* Wind arrow */}
        {direction !== 'VRB' && (
          <div 
            className="absolute inset-2 flex items-center justify-center transition-transform duration-1000"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div className="w-1 h-full bg-gradient-to-b from-primary to-transparent rounded-full" />
            <div className="absolute top-0 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-primary" />
          </div>
        )}
        {direction === 'VRB' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">VRB</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{speed}</span>
          <span className="text-lg text-muted-foreground">kt</span>
        </div>
        {gust && (
          <div className="text-orange-400 font-semibold">
            Byar {gust} kt
          </div>
        )}
        <span className="text-sm text-muted-foreground">
          {direction === 'VRB' ? 'Variabel' : `${direction}° (${getWindDirectionName(direction)})`}
        </span>
      </div>
    </div>
  );
}

function WeatherStat({ icon: Icon, label, value, subValue }: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  subValue?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
      <Icon className="w-6 h-6 text-primary" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-xl font-semibold">{value}</span>
        {subValue && <span className="text-sm text-muted-foreground">{subValue}</span>}
      </div>
    </div>
  );
}

export function WeatherPanel() {
  const { metar, metarRaw, tafRaw, loading, error, lastUpdate } = useWeather();

  if (loading && !metar) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-muted-foreground">Laddar väderdata...</span>
      </div>
    );
  }

  if (error && !metar) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <span className="text-muted-foreground">{error}</span>
      </div>
    );
  }

  if (!metar) {
    return <div className="animate-pulse bg-muted/20 rounded-lg h-full" />;
  }

  const cloudDesc = metar.clouds.length > 0 
    ? metar.clouds.map(c => `${c.cover}${c.altitude > 0 ? ` ${c.altitude}ft` : ''}`).join(', ')
    : 'Klart';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">Väder</h2>
          <span className={`text-lg font-bold px-3 py-1 rounded ${getFlightCategoryColor(metar.flightCategory)} bg-current/10`}>
            {metar.flightCategory}
          </span>
        </div>
        {lastUpdate && (
          <span className="text-sm text-muted-foreground">
            Uppdaterad {lastUpdate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-4">
        {/* Wind section */}
        <div className="p-4 rounded-lg border border-border/50 bg-card/50">
          <div className="flex items-center gap-2 mb-3">
            <Wind className="w-5 h-5 text-primary" />
            <span className="font-semibold">Vind</span>
          </div>
          {metar.wind ? (
            <WindIndicator 
              direction={metar.wind.direction} 
              speed={metar.wind.speed} 
              gust={metar.wind.gust} 
            />
          ) : (
            <span className="text-muted-foreground">Lugnt</span>
          )}
        </div>

        {/* Weather stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <WeatherStat 
            icon={Eye} 
            label="Sikt" 
            value={metar.visibility}
          />
          <WeatherStat 
            icon={Cloud} 
            label="Moln" 
            value={cloudDesc}
          />
          <WeatherStat 
            icon={Thermometer} 
            label="Temperatur" 
            value={`${metar.temperature}°C`}
            subValue={`Daggpunkt ${metar.dewpoint}°C`}
          />
          <WeatherStat 
            icon={Gauge} 
            label="QNH" 
            value={`${metar.pressure}`}
            subValue={metar.pressureUnit}
          />
        </div>

        {/* Raw METAR/TAF */}
        <div className="mt-4 space-y-2">
          <div className="p-2 rounded bg-muted/30 font-mono text-xs">
            <span className="text-muted-foreground">METAR: </span>
            <span className="text-foreground">{metarRaw || 'Ej tillgängligt'}</span>
          </div>
          <div className="p-2 rounded bg-muted/30 font-mono text-xs">
            <span className="text-muted-foreground">TAF: </span>
            <span className="text-foreground">{tafRaw || 'Ej tillgängligt'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
