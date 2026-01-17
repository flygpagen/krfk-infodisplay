import { useMemo } from "react";
import { Sunrise, Sunset, Sun, Moon } from "lucide-react";
import { getSunTimesForDate, formatTimeUTC, formatTimeLocal, getDayProgress } from "@/utils/sunCalculations";

interface TimeCardProps {
  icon: React.ElementType;
  label: string;
  localTime: string;
  utcTime: string;
  highlight?: boolean;
}

function TimeCard({ icon: Icon, label, localTime, utcTime, highlight }: TimeCardProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${highlight ? "bg-primary/10 border border-primary/30" : "bg-muted/20"}`}
    >
      <Icon className={`w-6 h-6 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold font-mono">{localTime}</span>
          <span className="text-sm text-muted-foreground font-mono">{utcTime}</span>
        </div>
      </div>
    </div>
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
    <div className="flex items-center justify-between px-8 py-4 border-t border-border/50 bg-gradient-to-r from-card to-background">
      <div className="flex items-center gap-2">
        <Sun className="w-5 h-5 text-primary" />
        <span className="font-semibold">Soltider</span>
        <span className="text-sm text-muted-foreground ml-2">ESMK (55.92°N, 14.08°Ö)</span>
      </div>

      <div className="flex items-center gap-4">
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
        <div className="flex flex-col items-center px-4">
          <div className="w-32 h-2 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 transition-all duration-1000"
              style={{ width: `${dayProgress}%` }}
            />
          </div>
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

      <div className="text-right">
        <div className="text-sm text-muted-foreground">VFR-flygning</div>
        <div className="text-sm font-semibold text-primary">
          {formatTimeLocal(sunTimes.civilDawn)} - {formatTimeLocal(sunTimes.civilDusk)}
        </div>
      </div>
    </div>
  );
}
