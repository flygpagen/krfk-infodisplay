import { useMemo } from 'react';
import { Sunrise, Sunset, Moon } from 'lucide-react';
import { getSunTimesForDate, formatTimeUTC, formatTimeLocal } from '@/utils/sunCalculations';
interface TimeItemProps {
  icon: React.ElementType;
  label: string;
  localTime: string;
  utcTime: string;
}
function TimeItem({
  icon: Icon,
  label,
  localTime,
  utcTime
}: TimeItemProps) {
  return <div className="flex items-center gap-2 lg:gap-3">
      <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground" />
      <span className="text-sm lg:text-base text-muted-foreground">{label}</span>
      <span className="text-lg lg:text-2xl font-semibold font-mono">{localTime}</span>
      
    </div>;
}
export function SunTimesStrip() {
  const sunTimes = useMemo(() => getSunTimesForDate(), []);
  return <div className="flex items-center justify-center px-4 lg:px-10 py-3 lg:py-4 border-t border-border/50 bg-gradient-to-r from-card to-background">
      <div className="flex items-center gap-4 lg:gap-8 flex-wrap justify-center">
        <TimeItem icon={Moon} label="Borgerlig gryning" localTime={formatTimeLocal(sunTimes.civilDawn)} utcTime={formatTimeUTC(sunTimes.civilDawn)} />
        <TimeItem icon={Sunrise} label="Soluppgång" localTime={formatTimeLocal(sunTimes.sunrise)} utcTime={formatTimeUTC(sunTimes.sunrise)} />
        <TimeItem icon={Sunset} label="Solnedgång" localTime={formatTimeLocal(sunTimes.sunset)} utcTime={formatTimeUTC(sunTimes.sunset)} />
        <TimeItem icon={Moon} label="Borgerlig skymning" localTime={formatTimeLocal(sunTimes.civilDusk)} utcTime={formatTimeUTC(sunTimes.civilDusk)} />
      </div>
    </div>;
}