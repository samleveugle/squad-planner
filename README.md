# Squad Planner

Webapp voor onze voetbalploeg om trainingen en wedstrijden te plannen. Spelers geven aan of ze **aanwezig**, **twijfel** of **afwezig** zijn. Administrators stellen opstellingen samen, delen die wanneer ze klaar zijn, en vullen wedstrijd-stats in.

> **Status:** Sessie 5 — frontend met mock data. Maandkalender, opstellingen, stats, dark mode. Nog geen login, database of persistente opslag.

## Functies

### Kalender & beschikbaarheid
- Seizoenskalender (training do 20u30, thuis/uit om de 2 zondagen)
- **Week-view** — events per week + beschikbaarheid
- **Maand-view** — agenda-overzicht met gemarkeerde training/wedstrijd-dagen; klik op dag → spring naar juiste week
- Live overzicht wie al gereageerd heeft
- Dark/light theme toggle in header

### Opstelling
- Formaties 4-3-3 / 4-4-2, visueel voetbalveld
- Bank (max 5) + staf (max 3)
- Draft opslaan → publiceren / verbergen
- Melding voor spelers bij nieuwe opstelling

### Stats
- Admin vult goals/assists in per wedstrijd (enkel spelers uit opstelling + bank)
- Spelers zien eigen seizoensstats + per wedstrijd

## Rollen & tabs

| Rol | Wie | Tabs |
|-----|-----|------|
| Speler | Ploegleden | Kalender · Opstelling · Stats |
| Admin-only | Pol, Gijs | Kalender · Beschikbaarheid · Opstelling maken · Stats invoeren |
| Admin + speler | Sam, Senne | Alle 6 tabs |

## Tech stack

- Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, JavaScript

## Lokaal starten

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Projectstructuur

```
src/
├── app/
├── components/
│   ├── SquadPlanner.jsx
│   ├── calendar/        # WeekView, MonthView, CalendarTab, ...
│   ├── lineup/
│   ├── stats/
│   └── ...
└── lib/
    ├── mock-data.js
    ├── calendar.js      # Maand-grid helpers
    ├── lineups.js
    └── stats.js
```

## Roadmap

| Sessie | Onderwerp | Status |
|--------|-----------|--------|
| 1–4 | Basis, kalender, opstelling, stats | ✅ |
| 5 | Maandkalender + dark mode + UX | ✅ |
| 6 | Database, login, live deploy | 🔜 |

## Git workflow

```bash
git add .
git commit -m "Sessie X: beschrijving"
git push
```
