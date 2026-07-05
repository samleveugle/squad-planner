# Squad Planner

Webapp voor onze voetbalploeg om trainingen en wedstrijden te plannen. Spelers geven aan of ze **aanwezig**, **twijfel** of **afwezig** zijn. Administrators stellen opstellingen samen, delen die wanneer ze klaar zijn, en vullen wedstrijd-stats in.

> **Status:** Sessie 4 — frontend met mock data. Opstellingen, stats, dark mode. Nog geen login, database of persistente opslag.

## Functies

### Kalender & beschikbaarheid
- Seizoenskalender (training do 20u30, thuis/uit om de 2 zondagen)
- Weeknavigatie, beschikbaarheid aanwezig/twijfel/afwezig
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
- Admin-spelers zien ook ranking (sorteerbaar)

## Rollen & tabs

| Rol | Wie | Tabs |
|-----|-----|------|
| Speler | Ploegleden | Kalender · Opstelling · Stats |
| Admin-only | Pol, Gijs | Kalender · Beschikbaarheid · Opstelling maken · Stats invoeren |
| Admin + speler | Sam, Senne | Alle 6 tabs |

Spelers hebben `isSquadPlayer: true`. Admins Pol en Gijs hebben `isSquadPlayer: false` — geen Opstelling/Stats tabs.

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
├── app/                 # layout, page, globals.css (incl. dark theme)
├── components/
│   ├── SquadPlanner.jsx # Hoofdcomponent (useState)
│   ├── layout/          # Header, PlayerSelector, ThemeToggle
│   ├── calendar/        # WeekView, EventCard, WeekNavigator
│   ├── availability/    # AvailabilityPicker, EventTeamSummary
│   ├── admin/           # AdminOverview
│   ├── lineup/          # Opstelling (veld, bank, staf)
│   └── stats/           # MatchStatsForm, StatsTab, ranking
└── lib/
    ├── mock-data.js     # Spelers, events, isAdmin, isSquadPlayer
    ├── formations.js
    ├── lineups.js
    └── stats.js
```

## State (SquadPlanner.jsx)

| State | Inhoud |
|-------|--------|
| `currentPlayerId` | Wie is "ingelogd" (simulatie) |
| `responses` | Beschikbaarheid per event |
| `lineups` | Opstelling per wedstrijd |
| `matchStats` | Goals/assists per wedstrijd/speler |
| `seenLineups` | Geziene opstelling-meldingen |
| `weekStart` | Huidige week |

## Roadmap

| Sessie | Onderwerp | Status |
|--------|-----------|--------|
| 1–3 | Basis, kalender, opstelling | ✅ |
| 4 | Stats + polish (tabs, dark mode) | ✅ |
| 5 | Layout polish | 🔜 |
| 6 | Database, login, live deploy | 🔜 |

## Git workflow

```bash
git add .
git commit -m "Sessie X: beschrijving"
git push
```
