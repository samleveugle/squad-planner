# Squad Planner

Webapp voor onze voetbalploeg om trainingen en wedstrijden te plannen. Spelers geven aan of ze **aanwezig**, **twijfel** of **afwezig** zijn. Administrators zien per event wie er komt — als basis voor een opstelling.

> **Status:** Sessie 1 — frontend met mock data. Nog geen login, database of persistente opslag.

## Functies (huidige versie)

- Kalenderweergave met trainingen en wedstrijden
- Per speler beschikbaarheid aangeven: aanwezig / twijfel / afwezig
- Speler simuleren via dropdown ("Wie ben jij?")
- Admin-overzicht met **namen per status** (handig voor opstellingen)
- Admin-tab alleen zichtbaar voor spelers met `isAdmin: true`

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (Button, Card, Badge, Select, Tabs)
- JavaScript (geen TypeScript)

## Lokaal starten

```bash
# Dependencies installeren (eerste keer of na clone)
npm install

# Development server starten
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

Andere scripts:

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
│   ├── calendar/          # WeekView, EventCard
│   ├── availability/      # AvailabilityPicker, AvailabilityBadge
│   ├── admin/             # AdminOverview
│   └── layout/            # Header, PlayerSelector
└── lib/
    ├── mock-data.js       # Spelers, events, helpers
    └── utils.js           # cn() helper voor Tailwind
```

## Hoe het werkt

Alle interactieve state zit in `SquadPlanner.jsx`:

- `currentPlayerId` — welke speler is "ingelogd" (simulatie)
- `responses` — antwoorden per speler per event, bv. `{ "1-t1": "present" }`

Data stroomt **omlaag via props**, wijzigingen gaan **omhoog via callbacks** — standaard React-patroon.

Mock data (spelers, datums) staat in `src/lib/mock-data.js`. Antwoorden verdwijnen bij refresh — bewust, tot we een database toevoegen.

## Roadmap

| Sessie | Onderwerp |
|--------|-----------|
| ✅ 1 | Basis UI, mock data, admin-overzicht |
| 2 | Weeknavigatie, betere kalender |
| 3 | Opstelling maken (admin) |
| 4 | Opstelling tonen aan spelers |
| Later | Database, login, echte authenticatie |

## Git workflow

Na elke sessie:

```bash
git add .
git commit -m "Sessie X: korte beschrijving"
git push
```

## Deploy (later)

Deploy kan via [Vercel](https://vercel.com/) — gratis voor Next.js-projecten. Eerst lokaal afwerken; deployen doen we wanneer login en database klaar zijn.
