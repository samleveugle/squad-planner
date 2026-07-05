# Squad Planner

Webapp voor onze voetbalploeg om trainingen en wedstrijden te plannen. Spelers geven aan of ze **aanwezig**, **twijfel** of **afwezig** zijn. Administrators stellen opstellingen samen, delen die wanneer ze klaar zijn, en vullen wedstrijd-stats in.

> **Status:** Sessie 4 — frontend met mock data. Opstellingen + goals/assists stats. Nog geen login, database of persistente opslag.

## Functies (huidige versie)

### Kalender & beschikbaarheid
- Seizoenskalender: training elke **donderdag 20u30** (SK Laar), thuis/uitwedstrijden om de 2 zondagen
- Weeknavigatie (← → en "Vandaag")
- Per speler beschikbaarheid: **aanwezig / twijfel / afwezig**
- Live overzicht: iedereen ziet wie al gereageerd heeft
- Speler simuleren via dropdown ("Wie ben jij?") — vervangt later echte login

### Opstelling
- Admin stelt opstelling samen voor **wedstrijden** (formaties 4-3-3 / 4-4-2)
- Visueel voetbalveld + **bank** (max 5) + **staf** (max 3)
- Draft opslaan → **publiceren** of **verbergen**
- Spelers zien gepubliceerde opstelling (tab + event card + melding)

### Stats (goals & assists)
- **Admin — Stats invoeren:** per wedstrijd goals/assists invullen voor alle spelers
- **Tab Stats (iedereen):** eigen seizoensstats + lijst per wedstrijd
- **Admin ranking:** sorteerbaar op goals of assists

### Admin-tabs
- **Beschikbaarheid** — wie komt trainen/spelen
- **Opstelling maken** — opstelling beheren
- **Stats invoeren** — wedstrijd-stats invullen

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (Button, Card, Badge, Select, Tabs, Input)
- JavaScript (geen TypeScript)

## Lokaal starten

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

```bash
npm run build   # Productie-build
npm run start   # Productie-server (na build)
npm run lint    # ESLint
```

## Projectstructuur

```
src/
├── app/
│   ├── layout.js
│   ├── page.js
│   └── globals.css
├── components/
│   ├── SquadPlanner.jsx
│   ├── ui/
│   ├── layout/
│   ├── calendar/
│   ├── availability/
│   ├── admin/
│   ├── lineup/
│   └── stats/
│       ├── MatchStatsForm.jsx
│       ├── StatsManager.jsx
│       ├── StatsTab.jsx
│       ├── PlayerStatsView.jsx
│       └── AdminStatsRanking.jsx
└── lib/
    ├── mock-data.js
    ├── formations.js
    ├── lineups.js
    ├── stats.js
    └── utils.js
```

## Hoe het werkt

Alle interactieve state zit in `SquadPlanner.jsx`:

| State | Wat het bevat |
|-------|----------------|
| `currentPlayerId` | Wie is "ingelogd" (simulatie) |
| `responses` | Beschikbaarheid per speler/event |
| `lineups` | Opstelling per wedstrijd |
| `matchStats` | Goals/assists per wedstrijd/speler |
| `seenLineups` | Geziene opstelling-meldingen |
| `weekStart` | Welke week je bekijkt |

Voorbeeld stats:

```javascript
matchStats["match-home-2026-08-09"] = {
  "senne": { goals: 2, assists: 0 },
  "massi": { goals: 1, assists: 1 },
}
```

Data stroomt **omlaag via props**, wijzigingen gaan **omhoog via callbacks**. Mock data verdwijnt bij refresh — bewust, tot we een database toevoegen.

## Spelers & admins

- **28 spelers** (jullie ploeg)
- **Admins:** Sam, Jalle, Gijs, Senne

## Roadmap

| Sessie | Onderwerp | Status |
|--------|-----------|--------|
| 1 | Basis UI, mock data, admin-overzicht | ✅ |
| 2 | Weeknavigatie, echte spelers/seizoen, live ploegoverzicht | ✅ |
| 3 | Opstelling (formatie, publiceren, bank, staf) | ✅ |
| 4 | Stats (goals & assists per speler) | ✅ |
| 5 | Layout polish | 🔜 |
| 6 | Database, login, live deploy | 🔜 |

## Git workflow

```bash
git add .
git commit -m "Sessie X: korte beschrijving"
git push
```

## Deploy (later)

Deploy via [Vercel](https://vercel.com/) wanneer database en login klaar zijn.
