// METAR decoder utilities

export interface DecodedMetar {
  raw: string;
  station: string;
  time: string;
  wind: {
    direction: number | 'VRB';
    speed: number;
    gust?: number;
    unit: string;
  } | null;
  visibility: string;
  visibilityMeters: number;
  clouds: Array<{
    cover: string;
    altitude: number;
    type?: string;
  }>;
  temperature: number;
  dewpoint: number;
  pressure: number;
  pressureUnit: string;
  conditions: string[];
  flightCategory: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
}

const CLOUD_COVER_MAP: Record<string, string> = {
  'FEW': 'Få',
  'SCT': 'Spridda',
  'BKN': 'Brutet',
  'OVC': 'Täckt',
  'SKC': 'Klart',
  'CLR': 'Klart',
  'NSC': 'Obetydligt',
  'NCD': 'Inga moln',
  'CAVOK': 'CAVOK',
};

const WEATHER_PHENOMENA: Record<string, string> = {
  'RA': 'Rain',
  'SN': 'Snow',
  'DZ': 'Drizzle',
  'FG': 'Fog',
  'BR': 'Mist',
  'HZ': 'Haze',
  'TS': 'Thunderstorm',
  'SH': 'Showers',
  'GR': 'Hail',
  'FZ': 'Freezing',
  'VC': 'Vicinity',
  '+': 'Heavy',
  '-': 'Light',
};

export function decodeMetar(metar: string): DecodedMetar {
  const parts = metar.trim().split(/\s+/);
  
  let station = '';
  let time = '';
  let wind = null;
  let visibility = 'CAVOK';
  let visibilityMeters = 9999;
  const clouds: DecodedMetar['clouds'] = [];
  let temperature = 0;
  let dewpoint = 0;
  let pressure = 1013;
  let pressureUnit = 'hPa';
  const conditions: string[] = [];
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // Station identifier
    if (i === 0 || (i === 1 && parts[0] === 'METAR')) {
      if (/^[A-Z]{4}$/.test(part)) {
        station = part;
        continue;
      }
    }
    
    // Time (DDHHMMz)
    if (/^\d{6}Z$/.test(part)) {
      time = part;
      continue;
    }
    
    // Wind - keep in knots (convert MPS to KT if needed)
    if (/^(VRB|\d{3})(\d{2,3})(G\d{2,3})?(KT|MPS)$/.test(part)) {
      const match = part.match(/^(VRB|\d{3})(\d{2,3})(G(\d{2,3}))?(KT|MPS)$/);
      if (match) {
        const dir = match[1] === 'VRB' ? 'VRB' : parseInt(match[1]);
        const spd = parseInt(match[2]);
        const gust = match[4] ? parseInt(match[4]) : undefined;
        const unit = match[5];
        wind = {
          direction: dir,
          speed: unit === 'MPS' ? Math.round(spd * 1.944) : spd,
          gust: gust ? (unit === 'MPS' ? Math.round(gust * 1.944) : gust) : undefined,
          unit: 'kt',
        };
      }
      continue;
    }
    
    // Visibility in meters
    if (/^\d{4}$/.test(part) && parseInt(part) <= 9999) {
      visibilityMeters = parseInt(part);
      visibility = visibilityMeters >= 9999 ? '10+ km' : 
                   visibilityMeters >= 1000 ? `${(visibilityMeters / 1000).toFixed(1)} km` :
                   `${visibilityMeters} m`;
      continue;
    }
    
    // CAVOK
    if (part === 'CAVOK') {
      visibility = 'CAVOK';
      visibilityMeters = 9999;
      continue;
    }
    
    // Clouds
    const cloudMatch = part.match(/^(FEW|SCT|BKN|OVC|SKC|CLR|NSC|NCD)(\d{3})?(CB|TCU)?$/);
    if (cloudMatch) {
      clouds.push({
        cover: CLOUD_COVER_MAP[cloudMatch[1]] || cloudMatch[1],
        altitude: cloudMatch[2] ? parseInt(cloudMatch[2]) * 100 : 0,
        type: cloudMatch[3],
      });
      continue;
    }
    
    // Temperature/Dewpoint
    const tempMatch = part.match(/^(M?\d{2})\/(M?\d{2})$/);
    if (tempMatch) {
      temperature = tempMatch[1].startsWith('M') ? -parseInt(tempMatch[1].slice(1)) : parseInt(tempMatch[1]);
      dewpoint = tempMatch[2].startsWith('M') ? -parseInt(tempMatch[2].slice(1)) : parseInt(tempMatch[2]);
      continue;
    }
    
    // Pressure (QNH)
    if (/^Q\d{4}$/.test(part)) {
      pressure = parseInt(part.slice(1));
      pressureUnit = 'hPa';
      continue;
    }
    
    // Weather phenomena
    for (const [code, desc] of Object.entries(WEATHER_PHENOMENA)) {
      if (part.includes(code)) {
        conditions.push(desc);
      }
    }
  }
  
  // Calculate flight category (use Swedish cloud cover names)
  const ceiling = clouds.find(c => c.cover === 'Brutet' || c.cover === 'Täckt')?.altitude || 99999;
  let flightCategory: DecodedMetar['flightCategory'] = 'VFR';
  
  if (visibilityMeters < 1600 || ceiling < 500) {
    flightCategory = 'LIFR';
  } else if (visibilityMeters < 5000 || ceiling < 1000) {
    flightCategory = 'IFR';
  } else if (visibilityMeters < 8000 || ceiling < 3000) {
    flightCategory = 'MVFR';
  }
  
  return {
    raw: metar,
    station,
    time,
    wind,
    visibility,
    visibilityMeters,
    clouds,
    temperature,
    dewpoint,
    pressure,
    pressureUnit,
    conditions,
    flightCategory,
  };
}

export function getFlightCategoryColor(category: DecodedMetar['flightCategory']): string {
  switch (category) {
    case 'VFR': return 'text-green-400';
    case 'MVFR': return 'text-blue-400';
    case 'IFR': return 'text-red-400';
    case 'LIFR': return 'text-purple-400';
    default: return 'text-muted-foreground';
  }
}

export function getWindDirectionName(degrees: number | 'VRB'): string {
  if (degrees === 'VRB') return 'Variable';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
