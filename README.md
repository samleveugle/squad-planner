# Squad Planner

Webapp voor onze voetbalploeg om trainingen en wedstrijden te plannen. Spelers geven aan of ze **aanwezig**, **twijfel** of **afwezig** zijn. Administrators stellen opstellingen samen, delen die wanneer ze klaar zijn, en vullen wedstrijd-stats in.

> **Status:** Sessie 6c — beschikbaarheid, opstellingen en stats worden opgeslagen in Supabase. Login komt in 6d.

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

Bij `SUPABASE_DB_URL`: vervang `[YOUR-PASSWORD]` door het wachtwoord dat je bij project-aanmaak koos (alleen nodig voor `npm run db:migrate`).

### 2. Tabellen aanmaken + data laden

```bash
npm run db:setup
```

> **Windows/Node SSL:** db-scripts gebruiken `node --use-system-ca`. De app zelf activeert systeemcertificaten via `node-ssl.js` (geen extra flags nodig voor `npm run dev`).

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

De app laadt spelers/events nog uit mock-data. **Beschikbaarheid, opstellingen en stats** worden in Supabase bewaard.

### Testen (Sessie 6b–6c)

1. `npm run dev` → open [http://localhost:3000](http://localhost:3000)

**Beschikbaarheid:**
2. Kies speler → tab **Kalender** → **Aanwezig** → F5 → keuze blijft
3. Supabase → `availability`

**Opstelling:**
4. Kies admin → tab **Opstelling maken** → vul opstelling in → **Opslaan** → F5 → draft blijft
5. **Publiceren** → F5 → speler ziet opstelling op tab **Opstelling**
6. Supabase → `lineups`

**Stats:**
7. Tab **Stats invoeren** → goals/assists invullen → **Opslaan** → F5 → stats blijven
8. Supabase → `match_stats`

**Bij fouten:** rode balk bovenaan → check `.env.local` in projectroot (service_role key). Herstart `npm run dev`.

## Database-tabellen

| Tabel | Inhoud |
|-------|--------|
| `players` | Spelers + admins |
| `events` | Trainingen en wedstrijden |
| `availability` | Aanwezig/twijfel/afwezig per speler per event |
| `lineups` | Opstellingen per wedstrijd |
| `match_stats` | Goals/assists per speler per wedstrijd |

## Projectstructuur

```
src/
├── lib/
│   ├── mock-data.js       # Events/spelers (UI)
│   ├── availability.js    # DB ↔ responses mapping
│   ├── lineups-db.js      # DB ↔ lineups mapping
│   ├── stats-db.js        # DB ↔ matchStats mapping
│   ├── supabase/          # Supabase clients
│   └── ...
src/app/actions/           # Server Actions (availability, lineups, match-stats)
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
| 6b | Beschikbaarheid opslaan in DB | ✅ |
| 6c | Opstellingen + stats persistent | ✅ |
| 6d | Login (Supabase Auth) | 🔜 |
| 6e | Deploy Vercel | 🔜 |

## Git workflow

```bash
git add .
git commit -m "Sessie X: beschrijving"
git push
```

**Nooit committen:** `.env.local` (staat in `.gitignore`).
