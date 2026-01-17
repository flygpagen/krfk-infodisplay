import { useMemo } from 'react';
import { Sunrise, Sunset, Moon } from 'lucide-react';
import { getSunTimesForDate, formatTimeUTC, formatTimeLocal, getDayProgress } from '@/utils/sunCalculations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TimeCardProps {
  icon: React.ElementType;
  label: string;
  localTime: string;
  utcTime: string;
  highlight?: boolean;
}

function TimeCard({ icon: Icon, label, localTime, utcTime, highlight }: TimeCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-5 py-2 lg:py-3 rounded-lg transition-colors ${highlight ? 'bg-primary/10 border border-primary/30' : 'bg-muted/20'}`}>
            <Icon className={`w-5 h-5 lg:w-7 lg:h-7 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1 lg:gap-2">
                <span className="text-lg lg:text-2xl font-semibold font-mono">{localTime}</span>
                <span className="text-sm lg:text-base text-muted-foreground font-mono">{utcTime}</span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SunTimesStrip() {
  const sunTimes = useMemo(() => getSunTimesForDate(), []);
  const dayProgress = useMemo(() => getDayProgress(sunTimes), [sunTimes]);

  const now = new Date();
  const isBeforeDawn = now < sunTimes.civilDawn;
  const isBeforeSunrise = now < sunTimes.sunrise;
  const isBeforeSunset = now < sunTimes.sunset;
  const isBeforeDusk = now < sunTimes.civilDusk;

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between px-4 lg:px-10 py-3 lg:py-4 border-t border-border/50 bg-gradient-to-r from-card to-background gap-3 lg:gap-0">
      <div className="flex items-center gap-3">
        <span className="text-base lg:text-xl font-semibold">VFR</span>
        <span className="text-lg lg:text-2xl font-bold text-primary font-mono">
          {formatTimeLocal(sunTimes.civilDawn)} - {formatTimeLocal(sunTimes.civilDusk)}
        </span>
      </div>

      <div className="flex items-center gap-2 lg:gap-4 flex-wrap justify-center">
        <TimeCard 
          icon={Moon}
          label="Borgerlig gryning"
          localTime={formatTimeLocal(sunTimes.civilDawn)}
          utcTime={formatTimeUTC(sunTimes.civilDawn)}
          highlight={isBeforeDawn}
        />
        <TimeCard 
          icon={Sunrise}
          label="Soluppgång"
          localTime={formatTimeLocal(sunTimes.sunrise)}
          utcTime={formatTimeUTC(sunTimes.sunrise)}
          highlight={!isBeforeDawn && isBeforeSunrise}
        />
        
        {/* Day progress bar */}
        <div className="flex flex-col items-center px-3 lg:px-6">
          <div className="w-28 lg:w-48 h-2 lg:h-3 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 transition-all duration-1000"
              style={{ width: `${dayProgress}%` }}
            />
          </div>
          <span className="text-xs lg:text-sm text-muted-foreground mt-1">
            {dayProgress < 50 ? 'Förmiddag' : dayProgress < 100 ? 'Eftermiddag' : 'Natt'}
          </span>
        </div>

        <TimeCard 
          icon={Sunset}
          label="Solnedgång"
          localTime={formatTimeLocal(sunTimes.sunset)}
          utcTime={formatTimeUTC(sunTimes.sunset)}
          highlight={!isBeforeSunrise && isBeforeSunset}
        />
        <TimeCard 
          icon={Moon}
          label="Borgerlig skymning"
          localTime={formatTimeLocal(sunTimes.civilDusk)}
          utcTime={formatTimeUTC(sunTimes.civilDusk)}
          highlight={!isBeforeSunset && isBeforeDusk}
        />
      </div>

      <div className="text-center lg:text-right">
        <span className="text-sm lg:text-base text-muted-foreground">ESMK 55.92°N</span>
      </div>
    </div>
  );
}
