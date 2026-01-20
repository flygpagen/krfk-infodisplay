# InfoDisplay flygklubb
Ett projekt byggt med Lovable. 

## Beskrivning
Detta är en enkel informationspanel för en flygklubb som hämtar bokningar från myweblog.se och METAR/TAF för närmaste flygplats från checkwx.com. Båda kräver att man har API-tillgång. För närvarande används myweblog api 3.1.

<img width="1445" height="1093" alt="infodisp" src="https://github.com/user-attachments/assets/a4e9202d-c951-4c1f-bfee-c9bbbbaba7af" />

## Installation

- Hämta med git clone
- Lägg till API-nycklar för checkwx och myweblog i config.php (se config.example.php)
- Ange ICAO för närmaste flygplats samt koordinater (ex. 55.92) i config.php
- Bygg med npm run build och flytta sen innehållet i /dist till din webbkatalog.

## What technologies are used for this project?
This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
