# Squad Planner

Webapp voor onze voetbalploeg om trainingen en wedstrijden te plannen. Spelers geven aan of ze **aanwezig**, **twijfel** of **afwezig** zijn. Administrators stellen opstellingen samen, delen die wanneer ze klaar zijn, en vullen wedstrijd-stats in.

> **Status:** Sessie 6d — magic-link login via Supabase Auth. Data persistent in Supabase. Volgende stap: Vercel deploy (6e).

## Functies

### Login
- Magic link per e-mail (geen wachtwoord)
- Alleen spelers met e-mail in de database kunnen inloggen
- Rollen uit database: admin / speler tabs

### Kalender & beschikbaarheid
- Seizoenskalender (training do 20u30, thuis/uit om de 2 zondagen)
- **Week-view** + **Maand-view**
- Beschikbaarheid opgeslagen in Supabase

### Opstelling & stats
- Opstellingen draft/publiceren — persistent
- Wedstrijd-stats — persistent
- Dark/light theme toggle

## Tech stack

- Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, JavaScript
- **Supabase** (PostgreSQL + Auth)

## Lokaal starten

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → login-scherm.

## `.env.local`

| Variabele | Waar |
|-----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` (lokaal) |
| `SUPABASE_DB_URL` | Alleen voor `npm run db:migrate` |

## Database setup

```bash
npm run db:setup
```

Draai **`npm run db:seed`** opnieuw na e-mail-wijzigingen (zet Sam's e-mail in de DB).

## Login instellen (Supabase dashboard)

### 1. E-mail provider
1. [supabase.com](https://supabase.com) → je project
2. **Authentication** → **Providers** → **Email**
3. Zet **Enable Email provider** aan
4. Voor lokaal testen: zet **Confirm email** uit (optioneel, sneller testen)

### 2. Redirect URLs
1. **Authentication** → **URL Configuration**
2. **Site URL:** `http://localhost:3000`
3. **Redirect URLs** — voeg toe:
   - `http://localhost:3000/auth/callback`
   - (later voor 6e) `https://jouw-app.vercel.app/auth/callback`

### 3. E-mail koppelen aan speler
- Testaccount **Sam:** `leveuglesam98@gmail.com` (staat in `src/lib/players-db.js`)
- Draai `npm run db:seed` om e-mail in `players`-tabel te zetten
- Of handmatig: Supabase → **Table Editor** → `players` → rij `sam` → kolom `email`

Teamleden toevoegen: zet hun e-mail in `players.email` (Table Editor of uitbreiden `PLAYER_EMAILS` in `players-db.js` + seed).

## Login testen

1. `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000)
3. Vul `leveuglesam98@gmail.com` in → **Stuur loginlink**
4. Check inbox (en spam) → klik link
5. Je bent ingelogd als **Sam** (admin + speler → alle tabs)
6. **Uitloggen** rechtsboven werkt

### Magic link komt niet aan?
- Check spam/promoties
- Supabase → **Authentication** → **Logs** op errors
- Redirect URL exact `http://localhost:3000/auth/callback`?
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`?

## Roadmap

| Sessie | Onderwerp | Status |
|--------|-----------|--------|
| 6a–6c | Database + persistent data | ✅ |
| 6d | Magic-link login | ✅ |
| 6e | Deploy Vercel | 🔜 |

## Git workflow

```bash
git add .
git commit -m "Sessie X: beschrijving"
git push
```

**Nooit committen:** `.env.local`
