# Squad Planner

Webapp voor onze voetbalploeg: trainingen en wedstrijden plannen, beschikbaarheid doorgeven, opstellingen delen en wedstrijd-stats bijhouden.

**Live app:** [https://squad-planner-beige.vercel.app](https://squad-planner-beige.vercel.app)

Spelers loggen in met een **magic link** (geen wachtwoord). Admins beheren spelers, agenda, opstellingen en stats.

---

## Functies

### Login & rollen
- Magic link per e-mail — alleen adressen in de database kunnen inloggen
- **Admin:** extra tabs (Beschikbaarheid, Spelers, Agenda, Opstelling maken, Stats invoeren)
- **Ploegspeler:** tabs Kalender, Opstelling, Stats
- Rollen staan in Supabase (`players.is_admin`, `players.is_squad_player`)

### Kalender & beschikbaarheid
- Week-view en maand-view
- Per event: **Aanwezig**, **Twijfel** of **Afwezig**
- Opgeslagen in Supabase (persistent)

### Opstelling
- Admins stellen opstellingen samen (formatie, veld, bank, staf)
- Publiceren → spelers zien opstelling + notificatie
- Opgeslagen in Supabase

### Stats
- Goals en assists per wedstrijd
- Seizoensstats per speler
- Opgeslagen in Supabase

### Admin — Spelers
- Lijst, toevoegen, bewerken, verwijderen
- E-mail instellen voor login
- Admin ja/nee, ploegspeler ja/nee

### Admin — Agenda
- Trainingen en wedstrijden toevoegen, bewerken, verwijderen
- Kalender en alle tabs gebruiken events uit de database

### Overig
- Dark/light theme toggle

---

## Tech stack

| Onderdeel | Technologie |
|-----------|-------------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui |
| Taal | JavaScript |
| Database & Auth | Supabase (PostgreSQL + magic link) |
| Hosting | Vercel |

---

## Projectstructuur

```
squad-planner/
├── src/
│   ├── app/              # Pages, Server Actions, auth callback
│   ├── components/       # UI (kalender, lineup, admin, stats, …)
│   ├── context/          # React context (spelers)
│   └── lib/              # Helpers, Supabase clients, formations
├── supabase/
│   └── migrations/       # Database schema (SQL)
├── scripts/              # db:migrate, db:seed, db:setup
├── .env.local            # Secrets (lokaal, niet committen)
└── .env.example          # Template voor env vars
```

---

## Lokaal ontwikkelen

### Vereisten
- Node.js 18+
- Supabase-project (gratis tier volstaat)
- Git

### Starten

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
# Vul .env.local in (zie hieronder)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Belangrijk:** `.env.local` moet in de **projectroot** staan (naast `package.json`), **niet** in `.cursor/`.

---

## Environment variables

| Variabele | Lokaal | Vercel | Uitleg |
|-----------|:------:|:------:|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | Supabase → Settings → API → service_role (geheim, alleen server) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | ✅ | Lokaal: `http://localhost:3000` · Productie: `https://squad-planner-beige.vercel.app` |
| `SUPABASE_DB_URL` | ✅ | ❌ | Alleen voor `npm run db:migrate` (database connection string) |

**Vercel:** zet de 4 verplichte vars voor **Production** (en Preview). Na wijziging → **Redeploy**.

**Nooit committen:** `.env.local`, service role key, database-wachtwoord.

---

## Database setup

Eenmalig (of na schema-wijziging):

```bash
npm run db:setup
```

Dit draait migrate + seed: tabellen aanmaken, spelers en seizoens-events laden.

| Script | Wat het doet |
|--------|--------------|
| `npm run db:migrate` | SQL schema uitvoeren |
| `npm run db:seed` | Spelers + events uit mock-data naar Supabase |
| `npm run db:setup` | Beide achter elkaar |

**Opnieuw seeden** wanneer:
- Lege spelers/events-tabel
- Initiële data resetten
- E-mail in seed gewijzigd (`src/lib/players-db.js`)

> Op Windows gebruiken de db-scripts automatisch `--use-system-ca` (SSL-fix).

---

## Supabase Auth instellen

### 1. E-mail provider
1. [supabase.com](https://supabase.com) → je project
2. **Authentication** → **Providers** → **Email**
3. **Enable Email provider** aan
4. Lokaal testen: **Confirm email** uit (optioneel, sneller)

### 2. Redirect URLs
**Authentication** → **URL Configuration**

| Instelling | Waarde |
|------------|--------|
| Site URL | `https://squad-planner-beige.vercel.app` (of localhost voor lokaal dev) |
| Redirect URLs | `http://localhost:3000/auth/callback` |
| | `https://squad-planner-beige.vercel.app/auth/callback` |

### 3. E-mail koppelen aan speler
- **Via app:** inloggen als admin → tab **Spelers** → speler bewerken → e-mail invullen
- **Via seed:** e-mail in `src/lib/players-db.js` → `npm run db:seed`
- Testaccount **Sam:** `leveuglesam98@gmail.com`

Zonder e-mail in `players.email` kan iemand **niet** inloggen.

---

## Deploy naar Vercel

### Eerste keer
1. Code op **GitHub** (push je repo)
2. [vercel.com](https://vercel.com) → **Add New Project** → kies repo
3. **Environment Variables** — vul de 4 verplichte vars in (zie tabel hierboven)
4. **Deploy** → noteer je URL (`https://squad-planner-beige.vercel.app`)
5. Zet `NEXT_PUBLIC_SITE_URL` op die URL → **Redeploy**
6. Supabase redirect URL toevoegen (zie hierboven)
7. Login testen op live URL

### Daarna
Elke `git push` naar GitHub triggert automatisch een nieuwe deploy.

---

## Gebruik van de app

| Tab | Wie | Wat |
|-----|-----|-----|
| **Kalender** | Iedereen | Week/maand, beschikbaarheid invullen |
| **Opstelling** | Ploegspelers | Gepubliceerde opstelling bekijken |
| **Stats** | Ploegspelers | Eigen seizoensstats |
| **Beschikbaarheid** | Admin | Overzicht wie waar staat per event |
| **Spelers** | Admin | Spelers CRUD + e-mail voor login |
| **Agenda** | Admin | Trainingen/wedstrijden CRUD |
| **Opstelling maken** | Admin | Opstelling bouwen en publiceren |
| **Stats invoeren** | Admin | Goals/assists per wedstrijd |

**Teamleden** hebben alleen nodig: e-mail in de database (admin regelt) + magic link om in te loggen. Geen installatie of dev-setup.

---

## Testen

### Productie (Vercel)
1. Open [https://squad-planner-beige.vercel.app](https://squad-planner-beige.vercel.app)
2. Vul je e-mail in → **Stuur loginlink**
3. Klik link in inbox → ingelogd
4. Controleer juiste tabs voor je rol

### Lokaal
1. `npm run dev` → [http://localhost:3000](http://localhost:3000)
2. Zelfde login-flow met `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

### Admin — Spelers
1. Inloggen als admin (bv. Sam)
2. Tab **Spelers** → toevoegen / bewerken / verwijderen
3. Uitloggen → inloggen met nieuwe speler-e-mail

### Admin — Agenda
1. Tab **Agenda** → event toevoegen
2. Tab **Kalender** → event zichtbaar
3. Event bewerken / verwijderen

### Beschikbaarheid & opstelling
1. Beschikbaarheid invullen op Kalender
2. Admin: opstelling maken → publiceren
3. Speler: tab **Opstelling** → opstelling zichtbaar

---

## Troubleshooting

### Magic link komt niet aan
- Check spam/promoties
- Supabase → **Authentication** → **Logs**
- Gratis tier: ~2 e-mails/uur — wacht of zet **custom SMTP** aan

### Redirect URL / inloggen na klik mislukt
- Supabase redirect URL moet exact `/auth/callback` bevatten
- `NEXT_PUBLIC_SITE_URL` moet overeenkomen met de URL waar je de app opent
- Na env-wijziging op Vercel: **Redeploy**

### `TypeError: fetch failed` op Vercel (login)
- Oorzaak was Windows SSL-fix die ook op Vercel draaide
- Fix staat in `src/lib/node-ssl.js` — SSL-fix **alleen lokaal Windows**
- Zorg dat laatste code gedeployed is

### SSL-fout bij `npm run db:seed` (Windows)
- Gebruik `npm run db:seed` (niet `node scripts/...` direct)
- Scripts gebruiken `--use-system-ca` automatisch

### Lege kalender / geen spelers
- `npm run db:seed` of `npm run db:setup`
- Check Supabase → Table Editor → `players` / `events`

### "Geen account voor dit e-mailadres"
- E-mail staat niet in `players.email` — admin voegt toe via tab **Spelers**

---

## Roadmap

| Sessie | Onderwerp | Status |
|--------|-----------|--------|
| 1–5 | Frontend (kalender, opstelling, stats, UX) | ✅ |
| 6a | Database schema + migrate/seed | ✅ |
| 6b | Beschikbaarheid persistent | ✅ |
| 6c | Opstelling + stats persistent | ✅ |
| 6d | Magic-link login | ✅ |
| 6e-a | Admin spelers beheren | ✅ |
| 6e-b | Admin agenda beheren | ✅ |
| 6e-c | Deploy Vercel | ✅ |

---

## Git workflow

```bash
git add .
git commit -m "Beschrijving van je wijziging"
git push
```

Vercel deployt automatisch na push.

**Nooit committen:** `.env.local`, `.cursor/.env.local`
