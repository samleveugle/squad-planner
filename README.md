# Squad Planner

Webapp voor onze voetbalploeg om trainingen en wedstrijden te plannen. Spelers geven aan of ze **aanwezig**, **twijfel** of **afwezig** zijn. Administrators stellen opstellingen samen, delen die wanneer ze klaar zijn, en vullen wedstrijd-stats in.

> **Status:** Sessie 6e-b — admins beheren trainingen/wedstrijden in de database. Volgende stap: Vercel deploy (6e-c).

## Functies

### Login
- Magic link per e-mail (geen wachtwoord)
- Alleen spelers met e-mail in de database kunnen inloggen
- Rollen uit database: admin / speler tabs

### Admin — spelers
- Tab **Spelers** (alleen admins): lijst, toevoegen, bewerken, verwijderen
- E-mail instellen voor magic-link login
- Rollen: admin ja/nee, ploegspeler ja/nee
- Spelerslijsten in de UI komen uit Supabase (niet meer uit mock-data)

### Admin — agenda
- Tab **Agenda** (alleen admins): trainingen en wedstrijden beheren
- Toevoegen, bewerken, verwijderen (met bevestiging)
- Kalender en alle tabs gebruiken events uit Supabase
- Initiële events via `npm run db:seed` (mock-data generator)

### Kalender & beschikbaarheid
- Seizoenskalender uit database
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
- Testaccount **Sam:** `leveuglesam98@gmail.com` (via seed of admin-tab **Spelers**)
- Draai `npm run db:seed` voor initiële spelers + Sam's e-mail
- Of: inloggen als admin → tab **Spelers** → speler bewerken → e-mail invullen

Teamleden toevoegen: tab **Spelers** (admin) of handmatig in Supabase Table Editor.

## Spelers beheren testen (6e-a)

1. `npm run dev`
2. Log in als **Sam** (`leveuglesam98@gmail.com`)
3. Open tab **Spelers**
4. **Speler toevoegen:** naam, optioneel e-mail, vink admin/ploegspeler aan
5. Log uit → probeer in te loggen met het nieuwe e-mailadres
6. **Bewerken / verwijderen** via dezelfde tab (verwijderen vraagt bevestiging)

## Agenda beheren testen (6e-b)

1. `npm run dev` — zorg dat events in DB staan (`npm run db:seed` indien nodig)
2. Log in als **Sam** (admin)
3. Tab **Agenda** → blader met week-navigator
4. **Event toevoegen:** kies training of wedstrijd, datum, locatie, optioneel tijd/tegenstander
5. Tab **Kalender** → nieuw event moet zichtbaar zijn in de juiste week
6. Vul **beschikbaarheid** in op dat event (tab Kalender)
7. Terug naar **Agenda** → wedstrijd **bewerken** (tegenstander invullen)
8. Event **verwijderen** → bevestig → verdwijnt uit Kalender

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
| 6e-a | Admin spelers beheren | ✅ |
| 6e-b | Admin events beheren | ✅ |
| 6e-c | Deploy Vercel | 🔜 |

## Git workflow

```bash
git add .
git commit -m "Sessie X: beschrijving"
git push
```

**Nooit committen:** `.env.local`
