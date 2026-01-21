import { Wind, Eye, Thermometer, Gauge, Cloud, Loader2, AlertCircle } from 'lucide-react';
import { getFlightCategoryColor, getWindDirectionName } from '@/utils/weatherDecoder';
import { useWeather } from '@/hooks/useWeather';

function WindIndicator({ direction, speed, gust }: { direction: number | 'VRB'; speed: number; gust?: number }) {
  // Add 180° to show where wind is blowing TO (arrow points downwind)
  const rotation = direction === 'VRB' ? 0 : (direction + 180) % 360;
  
  return (
    <div className="flex items-center gap-4 lg:gap-6">
      <div className="relative w-24 h-24 lg:w-32 lg:h-32">
        {/* Compass rose */}
        <div className="absolute inset-0 rounded-full border-2 border-border/50">
          <span className="absolute top-1 lg:top-2 left-1/2 -translate-x-1/2 text-sm lg:text-base text-muted-foreground">N</span>
          <span className="absolute bottom-1 lg:bottom-2 left-1/2 -translate-x-1/2 text-sm lg:text-base text-muted-foreground">S</span>
          <span className="absolute left-1 lg:left-2 top-1/2 -translate-y-1/2 text-sm lg:text-base text-muted-foreground">V</span>
          <span className="absolute right-1 lg:right-2 top-1/2 -translate-y-1/2 text-sm lg:text-base text-muted-foreground">Ö</span>
        </div>
        {/* Wind arrow */}
        {direction !== 'VRB' && (
          <div 
            className="absolute inset-3 lg:inset-4 flex items-center justify-center transition-transform duration-1000"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div className="w-1.5 h-full bg-gradient-to-b from-primary to-transparent rounded-full" />
            <div className="absolute top-0 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-primary" />
          </div>
        )}
        {direction === 'VRB' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base lg:text-lg text-muted-foreground">VRB</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl lg:text-6xl font-bold">{speed}</span>
          <span className="text-xl lg:text-2xl text-muted-foreground">kt</span>
        </div>
        {gust && (
          <div className="text-lg lg:text-xl text-orange-400 font-semibold">
            Byar {gust} kt
          </div>
        )}
        <span className="text-base lg:text-lg text-muted-foreground">
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
    <div className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-lg bg-muted/20">
      <Icon className="w-7 h-7 lg:w-9 lg:h-9 text-primary" />
      <div className="flex flex-col">
        <span className="text-xs lg:text-sm text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-xl lg:text-3xl font-semibold">{value}</span>
        {subValue && <span className="text-sm lg:text-base text-muted-foreground">{subValue}</span>}
      </div>
    </div>
  );
}

export function WeatherPanel() {
  const { metar, metarRaw, tafRaw, loading, error, lastUpdate } = useWeather();

  if (loading && !metar) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 lg:w-14 lg:h-14 animate-spin text-primary" />
        <span className="text-lg lg:text-2xl text-muted-foreground">Laddar väderdata...</span>
      </div>
    );
  }

  if (error && !metar) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 lg:w-14 lg:h-14 text-destructive" />
        <span className="text-lg lg:text-2xl text-muted-foreground">{error}</span>
      </div>
    );
  }

  if (!metar) {
    return <div className="animate-pulse bg-muted/20 rounded-lg h-full" />;
  }

  // Find the ceiling (lowest BKN or OVC layer) or show most significant layer
  const ceilingLayer = metar.clouds.find(c => c.cover === 'Brutet' || c.cover === 'Täckt');
  const cloudDesc = metar.clouds.length > 0 
    ? ceilingLayer 
      ? `${ceilingLayer.cover} ${ceilingLayer.altitude}ft`
      : metar.clouds[0].altitude > 0 
        ? `${metar.clouds[0].cover} ${metar.clouds[0].altitude}ft`
        : metar.clouds[0].cover
    : 'CAVOK';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 lg:mb-5 min-h-[40px] lg:min-h-[52px]">
        <div className="flex items-center gap-3 lg:gap-4">
          <h2 className="text-xl lg:text-3xl font-semibold text-foreground">Väder</h2>
          <span className={`text-lg lg:text-2xl font-bold px-3 lg:px-4 py-1 lg:py-2 rounded ${getFlightCategoryColor(metar.flightCategory)} bg-current/10`}>
            {metar.flightCategory}
          </span>
        </div>
        {lastUpdate && (
          <span className="text-sm lg:text-base text-muted-foreground">
            Uppdaterad {lastUpdate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-3 lg:space-y-4">
        {/* Wind section */}
        <div className="p-4 lg:p-5 rounded-lg border border-border/50 bg-card/50">
          <div className="flex items-center gap-2 mb-3 lg:mb-4">
            <Wind className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
            <span className="text-lg lg:text-xl font-semibold">Vind</span>
          </div>
          {metar.wind ? (
            <WindIndicator 
              direction={metar.wind.direction} 
              speed={metar.wind.speed} 
              gust={metar.wind.gust} 
            />
          ) : (
            <span className="text-lg lg:text-xl text-muted-foreground">Lugnt</span>
          )}
        </div>

        {/* Weather stats grid */}
        <div className="grid grid-cols-2 gap-2 lg:gap-3">
          <WeatherStat 
            icon={Eye} 
            label="Sikt" 
            value={metar.visibility}
            subValue={metar.visibilityCause ? `i ${metar.visibilityCause}` : undefined}
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

        {/* RVR section */}
        {metar.rvr && metar.rvr.length > 0 && (
          <div className="p-3 lg:p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <span className="text-xs lg:text-sm text-amber-400 uppercase tracking-wider font-medium">Bansikt (RVR)</span>
            <div className="flex flex-wrap gap-3 lg:gap-4 mt-2">
              {metar.rvr.map((r, i) => (
                <div key={i} className="flex items-baseline gap-1">
                  <span className="text-sm lg:text-base text-muted-foreground">Bana {r.runway}:</span>
                  <span className="text-lg lg:text-xl font-semibold">
                    {r.visibility}m
                    {r.variableMax && `–${r.variableMax}m`}
                  </span>
                  {r.trend === 'U' && <span className="text-green-400 ml-1">↑</span>}
                  {r.trend === 'D' && <span className="text-red-400 ml-1">↓</span>}
                  {r.trend === 'N' && <span className="text-muted-foreground ml-1">→</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw METAR/TAF */}
        <div className="mt-3 lg:mt-4 space-y-2">
          <div className="p-2 lg:p-3 rounded bg-muted/30 font-mono text-xs lg:text-sm">
            <span className="text-muted-foreground">METAR: </span>
            <span className="text-foreground break-all">{metarRaw || 'Ej tillgängligt'}</span>
          </div>
          <div className="p-2 lg:p-3 rounded bg-muted/30 font-mono text-xs lg:text-sm">
            <span className="text-muted-foreground">TAF: </span>
            <span className="text-foreground break-all">{tafRaw || 'Ej tillgängligt'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
