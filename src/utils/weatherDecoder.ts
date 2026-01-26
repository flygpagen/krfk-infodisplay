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
  visibilityCause?: string;
  verticalVisibility?: number;  // VV i fot (t.ex. VV016 = 1600 ft)
  rvr: Array<{
    runway: string;
    visibility: number;
    variableMax?: number;
    trend?: 'U' | 'D' | 'N';
  }>;
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

// Siktnedsättande fenomen (obscuration)
const OBSCURATION_PHENOMENA: Record<string, string> = {
  'BR': 'dis',
  'FG': 'dimma',
  'HZ': 'dis',
  'FU': 'rök',
  'DU': 'damm',
  'SA': 'sand',
  'VA': 'vulkanaska',
};

const WEATHER_PHENOMENA: Record<string, string> = {
  // Intensity
  '+': 'Kraftig',
  '-': 'Lätt',
  
  // Descriptors
  'MI': 'Låg',
  'BC': 'Fläckvis',
  'PR': 'Delvis',
  'DR': 'Drivande',
  'BL': 'Blåsande',
  'SH': 'Skurar',
  'TS': 'Åska',
  'FZ': 'Underkyld',
  'VC': 'I närheten',
  
  // Precipitation
  'RA': 'Regn',
  'SN': 'Snö',
  'DZ': 'Duggregn',
  'GR': 'Hagel',
  'GS': 'Småhagel',
  'IC': 'Iskristaller',
  'SG': 'Snökorn',
  'PL': 'Ispellets',
  'UP': 'Okänd nederbörd',
  
  // Obscuration
  'FG': 'Dimma',
  'BR': 'Dis',
  'HZ': 'Dis',
  'FU': 'Rök',
  'DU': 'Damm',
  'SA': 'Sand',
  'VA': 'Vulkanaska',
  
  // Other
  'PO': 'Sandvirvlar',
  'SQ': 'Vindby',
  'FC': 'Trattmoln',
  'DS': 'Sandstorm',
  'SS': 'Sandstorm',
};

export function decodeMetar(metar: string): DecodedMetar {
  const parts = metar.trim().split(/\s+/);
  
  let station = '';
  let time = '';
  let wind = null;
  let visibility = 'CAVOK';
  let visibilityMeters = 9999;
  let visibilityCause: string | undefined = undefined;
  let verticalVisibility: number | undefined = undefined;
  const rvr: DecodedMetar['rvr'] = [];
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
    
    // RVR: R28/0600 eller R28/0600V1000 eller R28/0600U eller R28L/0300V0600D
    const rvrMatch = part.match(/^R(\d{2}[LCR]?)\/([PM]?)(\d{4})(V(\d{4}))?([UDN])?$/);
    if (rvrMatch) {
      rvr.push({
        runway: rvrMatch[1],
        visibility: parseInt(rvrMatch[3]),
        variableMax: rvrMatch[5] ? parseInt(rvrMatch[5]) : undefined,
        trend: rvrMatch[6] as 'U' | 'D' | 'N' | undefined,
      });
      continue;
    }
    
    // Obscuration phenomena (visibility cause)
    if (OBSCURATION_PHENOMENA[part]) {
      visibilityCause = OBSCURATION_PHENOMENA[part];
      conditions.push(WEATHER_PHENOMENA[part] || part);
      continue;
    }
    
    // Weather phenomena with intensity prefix (e.g., -SN, +RA, VCSH)
    const wxMatch = part.match(/^([+-]|VC)?([A-Z]{2,})$/);
    if (wxMatch && !part.match(/^[A-Z]{4}$/) && !part.match(/^\d{6}Z$/)) {
      const intensity = wxMatch[1] || '';
      const phenomenon = wxMatch[2];
      
      // Check if it's a known phenomenon
      if (WEATHER_PHENOMENA[phenomenon] || OBSCURATION_PHENOMENA[phenomenon]) {
        // Check for precipitation that can affect visibility
        if (['SN', 'RA', 'DZ', 'SG', 'GR', 'GS', 'PL', 'IC'].includes(phenomenon)) {
          const intensityText = intensity === '-' ? 'lätt ' : intensity === '+' ? 'kraftig ' : '';
          visibilityCause = intensityText + (WEATHER_PHENOMENA[phenomenon] || phenomenon).toLowerCase();
        }
        // Check for obscuration (affects visibility cause)
        else if (OBSCURATION_PHENOMENA[phenomenon] && !visibilityCause) {
          visibilityCause = OBSCURATION_PHENOMENA[phenomenon];
        }
        
        // Add to conditions list
        const desc = WEATHER_PHENOMENA[phenomenon] || phenomenon;
        if (intensity === '-') {
          conditions.push(`Lätt ${desc.toLowerCase()}`);
        } else if (intensity === '+') {
          conditions.push(`Kraftig ${desc.toLowerCase()}`);
        } else if (intensity === 'VC') {
          conditions.push(`${desc} i närheten`);
        } else if (!conditions.includes(desc)) {
          conditions.push(desc);
        }
        continue;
      }
    }
    
    // Vertical Visibility (VV016 = 1600 ft)
    const vvMatch = part.match(/^VV(\d{3})$/);
    if (vvMatch) {
      verticalVisibility = parseInt(vvMatch[1]) * 100;
      continue;
    }
    
    // Clouds
    const cloudMatch = part.match(/^(FEW|SCT|BKN|OVC|SKC|CLR|NSC|NCD)(\d{3})?(\/\/\/|CB|TCU)?$/);
    if (cloudMatch) {
      clouds.push({
        cover: CLOUD_COVER_MAP[cloudMatch[1]] || cloudMatch[1],
        altitude: cloudMatch[2] ? parseInt(cloudMatch[2]) * 100 : 0,
        type: cloudMatch[3] === '///' ? undefined : cloudMatch[3],
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
  // Vertical visibility counts as ceiling
  const ceiling = verticalVisibility || 
    clouds.find(c => c.cover === 'Brutet' || c.cover === 'Täckt')?.altitude || 
    99999;
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
    visibilityCause,
    verticalVisibility,
    rvr,
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
