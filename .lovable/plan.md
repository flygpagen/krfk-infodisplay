
## Plan: Fixa VV (vertikal sikt) och väderfenomen-parsning

### Översikt

METAR-koden `VV016` (Vertical Visibility 1600 ft) och `-SN` (lätt snö) hanteras inte korrekt. Molnvisningen visar felaktigt "CAVOK" istället för vertikal sikt.

### Ändring 1: Utöka DecodedMetar-interface

**Fil:** `src/utils/weatherDecoder.ts`

Lägg till stöd för vertikal sikt:

```typescript
export interface DecodedMetar {
  // ... befintliga fält
  verticalVisibility?: number;  // Ny - VV i fot
}
```

### Ändring 2: Parsa VV (Vertical Visibility)

**Fil:** `src/utils/weatherDecoder.ts`

Lägg till regex för VV-parsning i loopen (efter cloud-matchning):

```typescript
// Vertical Visibility (VV016 = 1600 ft)
const vvMatch = part.match(/^VV(\d{3})$/);
if (vvMatch) {
  verticalVisibility = parseInt(vvMatch[1]) * 100;
  continue;
}
```

### Ändring 3: Förbättra väderfenomen-parsning

**Fil:** `src/utils/weatherDecoder.ts`

Uppdatera parsningen så att prefix som `-`, `+`, `VC` hanteras och att fenomen som `-SN` blir visibilityCause:

```typescript
// Weather phenomena with intensity prefix
const wxMatch = part.match(/^([+-]|VC)?([A-Z]{2,})$/);
if (wxMatch) {
  const intensity = wxMatch[1] || '';
  const phenomenon = wxMatch[2];
  
  // Check for obscuration (affects visibility cause)
  if (OBSCURATION_PHENOMENA[phenomenon]) {
    visibilityCause = OBSCURATION_PHENOMENA[phenomenon];
  }
  // Check for precipitation that can affect visibility
  if (['SN', 'RA', 'DZ', 'SG'].includes(phenomenon)) {
    const intensityText = intensity === '-' ? 'lätt ' : intensity === '+' ? 'kraftig ' : '';
    visibilityCause = intensityText + (WEATHER_PHENOMENA[phenomenon] || phenomenon).toLowerCase();
  }
  
  // Add to conditions list
  // ... befintlig logik
}
```

### Ändring 4: Uppdatera molnvisning i WeatherPanel

**Fil:** `src/components/display/WeatherPanel.tsx`

Ändra cloudDesc-logiken för att hantera VV:

```typescript
// Find the ceiling or vertical visibility
const ceilingLayer = metar.clouds.find(c => c.cover === 'Brutet' || c.cover === 'Täckt');

let cloudDesc: string;
if (metar.verticalVisibility) {
  // Vertical visibility - sky obscured
  cloudDesc = `VV ${metar.verticalVisibility}ft`;
} else if (ceilingLayer) {
  cloudDesc = `${ceilingLayer.cover} ${ceilingLayer.altitude}ft`;
} else if (metar.clouds.length > 0) {
  cloudDesc = metar.clouds[0].altitude > 0 
    ? `${metar.clouds[0].cover} ${metar.clouds[0].altitude}ft`
    : metar.clouds[0].cover;
} else {
  cloudDesc = 'CAVOK';
}
```

### Ändring 5: Inkludera VV i ceiling-beräkning

**Fil:** `src/utils/weatherDecoder.ts`

Uppdatera flight category-beräkningen så VV räknas som ceiling:

```typescript
// Vertical visibility counts as ceiling
const ceiling = verticalVisibility || 
  clouds.find(c => c.cover === 'Brutet' || c.cover === 'Täckt')?.altitude || 
  99999;
```

### Resultat efter fix

| METAR-kod | Före | Efter |
|-----------|------|-------|
| `VV016` | CAVOK | VV 1600ft |
| `-SN` | (inget) | "i lätt snö" under sikt |
| `2600 -SN VV016` | Sikt: 2.6 km, Moln: CAVOK | Sikt: 2.6 km (i lätt snö), Moln: VV 1600ft |

### Tekniska detaljer

- `VV` (Vertical Visibility) rapporteras när himlen är helt skymd av fenomen som snöfall, dimma, etc.
- Formatet är `VVnnn` där `nnn` är höjd i hundratal fot (VV016 = 1600 ft)
- VV ska behandlas som ceiling i flight category-beräkningen
