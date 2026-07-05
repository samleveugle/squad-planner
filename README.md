# Squad Planner

Webapp voor onze voetbalploeg om trainingen en wedstrijden te plannen. Spelers geven aan of ze **aanwezig**, **twijfel** of **afwezig** zijn. Administrators stellen opstellingen samen en delen die wanneer ze klaar zijn.

> **Status:** Sessie 3 — frontend met mock data. Opstellingen met formatie, bank, staf en publicatie. Nog geen login, database of persistente opslag.

## Functies (huidige versie)

### Kalender & beschikbaarheid
- Seizoenskalender: training elke **donderdag 20u30** (SK Laar), thuis/uitwedstrijden om de 2 zondagen
- Weeknavigatie (← → en "Vandaag")
- Per speler beschikbaarheid: **aanwezig / twijfel / afwezig**
- Live overzicht: iedereen ziet wie al gereageerd heeft
- Speler simuleren via dropdown ("Wie ben jij?") — vervangt later echte login

### Opstelling (admin)
- Opstelling samenstellen voor **wedstrijden** (niet trainingen)
- Formaties: **4-3-3** (standaard) en **4-4-2**
- Visueel voetbalveld (TV-stijl) met spelers op posities
- **Bank:** max 5 spelers
- **Staf:** max 3 spelers (optioneel)
- Speler kan maar **1 rol** hebben (veld, bank of staf)
- Draft opslaan → later **publiceren** of **verbergen**
- Spelers kiezen uit spelers met status aanwezig/twijfel

### Opstelling (spelers)
- Melding wanneer admin een opstelling publiceert
- Tab **Opstelling** + op wedstrijd-event cards
- Alleen zichtbaar als gepubliceerd
- Eigen naam geel gemarkeerd (veld, bank of staf)

### Admin
- Tab **Beschikbaarheid:** wie is aanwezig/twijfel/afwezig per event
- Tab **Opstelling maken:** opstelling beheren per wedstrijd

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (Button, Card, Badge, Select, Tabs)
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
│   ├── layout.js          # Shell (fonts, metadata)
│   ├── page.js            # Homepage → SquadPlanner
│   └── globals.css        # Tailwind + thema
├── components/
│   ├── SquadPlanner.jsx   # Hoofdcomponent (useState)
│   ├── ui/                # shadcn/ui componenten
│   ├── layout/            # Header, PlayerSelector
│   ├── calendar/          # WeekView, EventCard, WeekNavigator
│   ├── availability/      # AvailabilityPicker, EventTeamSummary
│   ├── admin/             # AdminOverview
│   └── lineup/            # Opstelling (veld, bank, staf)
│       ├── LineupField.jsx
│       ├── LineupDisplay.jsx
│       ├── LineupBenchStaff.jsx
│       ├── LineupBuilder.jsx
│       ├── PublishedLineup.jsx
│       ├── LineupManager.jsx
│       ├── LineupTab.jsx
│       └── LineupNotificationBanner.jsx
└── lib/
    ├── mock-data.js       # Spelers, events, seizoen
    ├── formations.js      # 4-3-3 & 4-4-2 posities
    ├── lineups.js         # Opstelling helpers
    └── utils.js           # cn() helper
```

## Hoe het werkt

Alle interactieve state zit in `SquadPlanner.jsx`:

| State | Wat het bevat |
|-------|----------------|
| `currentPlayerId` | Wie is "ingelogd" (simulatie) |
| `responses` | Beschikbaarheid per speler/event |
| `lineups` | Opstelling per wedstrijd (formatie, posities, bank, staf, published) |
| `seenLineups` | Welke opstelling-meldingen al gezien zijn |
| `weekStart` | Welke week je bekijkt |

Voorbeeld opstelling:

```javascript
lineups["match-home-2026-08-09"] = {
  formation: "4-3-3",
  positions: { gk: "senne", st: "massi", ... },
  bench: ["apo", "batti", "bomme", "brico", "brunt"],
  staff: ["sam", "jalle", "gijs"],
  published: true,
  publishedAt: "2026-08-08T18:00:00.000Z"
}
```

Data stroomt **omlaag via props**, wijzigingen gaan **omhoog via callbacks**. Mock data verdwijnt bij refresh — bewust, tot we een database toevoegen.

## Spelers & admins

- **28 spelers** (jullie ploeg)
- **Admins:** Sam, Jalle, Gijs, Senne
- Admin-tabs alleen zichtbaar voor spelers met `isAdmin: true`

## Roadmap

| Sessie | Onderwerp | Status |
|--------|-----------|--------|
| 1 | Basis UI, mock data, admin-overzicht | ✅ |
| 2 | Weeknavigatie, echte spelers/seizoen, live ploegoverzicht | ✅ |
| 3 | Opstelling (formatie, publiceren, bank, staf) | ✅ |
| 4 | Stats (goals & assists per speler) | 🔜 |
| 5 | Layout polish | 🔜 |
| 6 | Database, login, live deploy | 🔜 |

## Git workflow

Na elke sessie:

```bash
git add .
git commit -m "Sessie X: korte beschrijving"
git push
```

## Deploy (later)

Deploy via [Vercel](https://vercel.com/) wanneer database en login klaar zijn. Tot die tijd lokaal ontwikkelen met `npm run dev`.
