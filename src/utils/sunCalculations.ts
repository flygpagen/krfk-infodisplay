// Sun position calculations for civil twilight, sunrise, and sunset
// Based on NOAA Solar Calculator algorithms

const ESMK_LAT = 55.92;
const ESMK_LON = 14.08;

interface SunTimes {
  civilDawn: Date;
  sunrise: Date;
  sunset: Date;
  civilDusk: Date;
}

function toJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function fromJulianDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

function calculateSunTimes(date: Date, lat: number = ESMK_LAT, lon: number = ESMK_LON): SunTimes {
  const jd = toJulianDate(date);
  const n = Math.floor(jd - 2451545.0 + 0.0008);
  
  // Mean solar noon
  const jStar = n - lon / 360;
  
  // Solar mean anomaly
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const MRad = toRadians(M);
  
  // Equation of the center
  const C = 1.9148 * Math.sin(MRad) + 0.02 * Math.sin(2 * MRad) + 0.0003 * Math.sin(3 * MRad);
  
  // Ecliptic longitude
  const lambda = (M + C + 180 + 102.9372) % 360;
  const lambdaRad = toRadians(lambda);
  
  // Solar transit
  const jTransit = 2451545.0 + jStar + 0.0053 * Math.sin(MRad) - 0.0069 * Math.sin(2 * lambdaRad);
  
  // Declination of the sun
  const sinDelta = Math.sin(lambdaRad) * Math.sin(toRadians(23.4397));
  const delta = Math.asin(sinDelta);
  
  const latRad = toRadians(lat);
  
  // Hour angle calculation for different elevations
  function calculateHourAngle(elevation: number): number {
    const cosOmega = (Math.sin(toRadians(elevation)) - Math.sin(latRad) * sinDelta) / 
                     (Math.cos(latRad) * Math.cos(delta));
    
    if (cosOmega > 1 || cosOmega < -1) {
      return NaN; // Sun doesn't reach this elevation
    }
    
    return toDegrees(Math.acos(cosOmega));
  }
  
  // Sunrise/sunset (sun at horizon, accounting for refraction: -0.833°)
  const omega0 = calculateHourAngle(-0.833);
  
  // Civil twilight (sun at -6°)
  const omegaCivil = calculateHourAngle(-6);
  
  const sunrise = fromJulianDate(jTransit - omega0 / 360);
  const sunset = fromJulianDate(jTransit + omega0 / 360);
  const civilDawn = fromJulianDate(jTransit - omegaCivil / 360);
  const civilDusk = fromJulianDate(jTransit + omegaCivil / 360);
  
  return {
    civilDawn,
    sunrise,
    sunset,
    civilDusk,
  };
}

export function getSunTimesForDate(date: Date = new Date()): SunTimes {
  // Set to noon of the given date for calculation
  const calcDate = new Date(date);
  calcDate.setHours(12, 0, 0, 0);
  return calculateSunTimes(calcDate);
}

export function formatTimeUTC(date: Date): string {
  return date.toISOString().slice(11, 16) + 'Z';
}

export function formatTimeLocal(date: Date): string {
  return date.toLocaleTimeString('sv-SE', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/Stockholm'
  });
}

export function getDayProgress(sunTimes: SunTimes): number {
  const now = new Date();
  const start = sunTimes.civilDawn.getTime();
  const end = sunTimes.civilDusk.getTime();
  const current = now.getTime();
  
  if (current < start) return 0;
  if (current > end) return 100;
  
  return ((current - start) / (end - start)) * 100;
}
