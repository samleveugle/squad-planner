# Squad Planner

Webapp voor onze voetbalploeg om trainingen en wedstrijden te plannen. Spelers geven aan of ze **aanwezig**, **twijfel** of **afwezig** zijn. Administrators stellen opstellingen samen, delen die wanneer ze klaar zijn, en vullen wedstrijd-stats in.

> **Status:** Sessie 6a — Supabase database + seed. De app gebruikt de database **nog niet** (mock data in de UI). Login en persistente opslag komen in volgende sessies.

## Functies

### Kalender & beschikbaarheid
- Seizoenskalender (training do 20u30, thuis/uit om de 2 zondagen)
- **Week-view** — events per week + beschikbaarheid
- **Maand-view** — agenda-overzicht met gemarkeerde training/wedstrijd-dagen
- Live overzicht wie al gereageerd heeft
- Dark/light theme toggle in header

### Opstelling
- Formaties 4-3-3 / 4-4-2, visueel voetbalveld
- Bank (max 5) + staf (max 3)
- Draft opslaan → publiceren / verbergen
- Melding voor spelers bij nieuwe opstelling

### Stats
- Admin vult goals/assists in per wedstrijd
- Spelers zien eigen seizoensstats + per wedstrijd

## Tech stack

- Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, JavaScript
- **Supabase** (PostgreSQL) — database

## Lokaal starten

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database setup (Supabase) — Sessie 6a

### 1. `.env.local` in de projectroot

Maak **`squad-planner/.env.local`** (naast `package.json`, **niet** in `.cursor/`).

Kopieer `.env.example` en vul in:

| Variabele | Waar in Supabase |
|-----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role |
| `SUPABASE_DB_URL` | Project Settings → Database → Connection string → URI |

Bij `SUPABASE_DB_URL`: vervang `[YOUR-PASSWORD]` door het wachtwoord dat je bij project-aanmaak koos.

### 2. Tabellen aanmaken + data laden

```bash
npm run db:setup
```

> **Windows/Node SSL:** de db-scripts gebruiken `node --use-system-ca` zodat Node.js HTTPS-certificaten van Supabase vertrouwt.

Of apart:

```bash
npm run db:migrate   # tabellen aanmaken
npm run db:seed      # spelers + events laden
```

**Alternatief zonder `SUPABASE_DB_URL`:** open `supabase/migrations/001_initial_schema.sql` in Supabase → **SQL Editor** → **Run**, daarna alleen `npm run db:seed`.

### 3. Controleren

In Supabase → **Table Editor**:

- `players` — ~31 rijen
- `events` — ~80 rijen (trainingen + wedstrijden)

De app zelf werkt nog met mock data tot Sessie 6b.

## Database-tabellen

| Tabel | Inhoud |
|-------|--------|
| `players` | Spelers + admins |
| `events` | Trainingen en wedstrijden |
| `availability` | Aanwezig/twijfel/afwezig (leeg tot 6b) |
| `lineups` | Opstellingen (leeg tot 6c) |
| `match_stats` | Goals/assists (leeg tot 6c) |

## Projectstructuur

```
src/
├── lib/
│   ├── mock-data.js       # UI gebruikt dit nog
│   ├── supabase/          # Supabase clients (voor later)
│   └── ...
scripts/
├── db-migrate.mjs
└── db-seed.mjs
supabase/migrations/
└── 001_initial_schema.sql
```

## Roadmap

| Sessie | Onderwerp | Status |
|--------|-----------|--------|
| 1–5 | Frontend, kalender, opstelling, stats | ✅ |
| 6a | Supabase schema + seed | ✅ |
| 6b | Beschikbaarheid opslaan in DB | 🔜 |
| 6c | Opstellingen + stats persistent | 🔜 |
| 6d | Login (Supabase Auth) | 🔜 |
| 6e | Deploy Vercel | 🔜 |

## Git workflow

```bash
git add .
git commit -m "Sessie X: beschrijving"
git push
```

**Nooit committen:** `.env.local` (staat in `.gitignore`).
