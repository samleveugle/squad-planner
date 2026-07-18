# Squad Planner

Webapp voor onze voetbalploeg: trainingen en wedstrijden plannen, beschikbaarheid doorgeven, opstellingen delen en wedstrijd-stats bijhouden.

**Live app:** [https://squad-planner-beige.vercel.app](https://squad-planner-beige.vercel.app)

Spelers loggen in met **e-mail + wachtwoord**. Eerste keer registreren ze via `/register`. Admins beheren spelers, agenda, opstellingen en stats.

---

## Functies

### Login & rollen
- E-mail + wachtwoord (registratie, login, wachtwoord vergeten)
- Alleen e-mails die admin heeft toegevoegd kunnen registreren/inloggen
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
- **Pushherinnering** zondag 20:00 (OneSignal) — enkel voor ploegspelers die meldingen aanzetten én nog niet alles ingevuld hebben

---

## Tech stack

| Onderdeel | Technologie |
|-----------|-------------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui |
| Taal | JavaScript |
| Database & Auth | Supabase (PostgreSQL + e-mail/wachtwoord) |
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
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | ⚙️ | ⚙️ | OneSignal → Settings → Keys & IDs (voor push) |
| `ONESIGNAL_REST_API_KEY` | ⚙️ | ⚙️ | OneSignal REST API Key (server-only, voor cron) |
| `CRON_SECRET` | ⚙️ | ⚙️ | Willekeurig geheim voor Vercel Cron (Bearer token). **Alleen ASCII** (a-z, A-Z, 0-9, `-_`) — geen accenten of speciale Unicode |

⚙️ = nodig voor pushmeldingen. Zonder deze vars werkt de rest van de app gewoon; de push-opt-in UI verschijnt dan niet.

**Vercel:** zet de 4 Supabase/site vars verplicht voor **Production** (en Preview). Na wijziging → **Redeploy**.

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
4. **Enable Email signup** aan (voor registratie)
5. **Confirm email** uit (aanbevolen voor sneller testen)
6. Magic link/OTP voor login **uit** (alleen wachtwoord-login)

### 2. Redirect URLs
**Authentication** → **URL Configuration**

Voeg **deze callback-URLs** toe:

| Redirect URL |
|--------------|
| `http://localhost:3000/auth/callback` |
| `http://localhost:3000/auth/callback/recovery` |
| `https://squad-planner-beige.vercel.app/auth/callback` |
| `https://squad-planner-beige.vercel.app/auth/callback/recovery` |

| Instelling | Waarde |
|------------|--------|
| Site URL | `https://squad-planner-beige.vercel.app` |

> **Wachtwoord reset** gebruikt `/auth/callback/recovery` (aparte route). De `next`-parameter in URLs wordt door Supabase vaak verwijderd — daarom niet alleen `/auth/callback?next=...` gebruiken.

### 3. E-mail koppelen aan speler
- **Via app:** admin → tab **Spelers** → speler toevoegen/bewerken → e-mail invullen
- **Via seed:** e-mail in `src/lib/players-db.js` → `npm run db:seed`
- Testaccount **Sam:** `leveuglesam98@gmail.com`

### 4. Auth-flow voor spelers
1. Admin voegt speler toe met e-mail
2. Speler gaat naar **Registreren** (`/register`) → wachtwoord instellen (1×)
3. Daarna **Inloggen** (`/`) met e-mail + wachtwoord
4. **Wachtwoord vergeten** → reset-mail → nieuw wachtwoord op `/auth/reset-password`

Spelers die eerder via magic link inlogden: gebruik **Wachtwoord vergeten** om een wachtwoord in te stellen.

---

## Pushmeldingen (OneSignal)

### Wat spelers moeten doen
Meldingen komen **niet automatisch** op elke gsm. Elke speler moet:
1. Inloggen in de app
2. Op **Meldingen aan** klikken en toestemming geven
3. **iPhone:** voeg de app toe aan je startscherm (Safari → Deel → Zet op beginscherm) voor betrouwbare web push

### Wat jij als beheerder moet instellen (eenmalig)

#### 1. Database migratie
Voer `supabase/migrations/003_push_notifications.sql` uit in Supabase → **SQL Editor**.

#### 2. OneSignal-app aanmaken
1. Account op [onesignal.com](https://onesignal.com)
2. **New App/Website** → kies **Web Push**
3. Site URL: `https://squad-planner-beige.vercel.app` (en lokaal `http://localhost:3000` voor test)
4. Kopieer **App ID** → `NEXT_PUBLIC_ONESIGNAL_APP_ID`
5. **Settings → Keys & IDs** → kopieer **REST API Key** → `ONESIGNAL_REST_API_KEY`

#### 3. Environment variables
In `.env.local` (lokaal) en Vercel → **Environment Variables**:

```
NEXT_PUBLIC_ONESIGNAL_APP_ID=...
ONESIGNAL_REST_API_KEY=...
CRON_SECRET=...   # alleen ASCII! bv. output van: openssl rand -hex 32
```

Redeploy na toevoegen op Vercel.

#### 4. Vercel Cron
`vercel.json` triggert **1× per dag** om ~19:00 UTC (Vercel Hobby-limiet). De handler stuurt enkel op **zondagavond** (Brussels) de push.

> **Hobby-plan:** cron mag maximaal 1× per dag draaien. Op Pro kan het schema nauwkeuriger (bv. elke 15 min op zondag).

Zet `CRON_SECRET` in Vercel; het cron-job stuurt `Authorization: Bearer <CRON_SECRET>` mee.

#### 5. Handmatig testen (zonder te wachten op zondag)
```bash
curl -H "Authorization: Bearer JOUW_CRON_SECRET" "https://squad-planner-beige.vercel.app/api/cron/availability-reminder?force=1"
```

### Wanneer wordt er gepusht?
- **Wanneer:** zondag 20:00 (Brussels)
- **Tekst:** *Vergeet je aanwezigheid voor komende week niet in te vullen.*
- **Naar wie:** ploegspelers met meldingen **aan**, ingelogd account, en **minstens 1 event** in komende week zonder ingevulde beschikbaarheid
- **Niet naar:** spelers die al alles ingevuld hebben, admins zonder ploegspeler-rol, spelers zonder opt-in

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

**Teamleden** hebben alleen nodig: e-mail in de database (admin regelt) → één keer registreren → daarna inloggen met wachtwoord.

---

## Testen

### Registratie & login (lokaal)
1. Admin: speler met e-mail toevoegen (tab **Spelers**)
2. `/register` → e-mail + wachtwoord (min. 8 tekens, 1 hoofdletter, 1 cijfer)
3. Uitloggen → `/` → inloggen met wachtwoord

### Registratie & login (Vercel)
1. [https://squad-planner-beige.vercel.app/register](https://squad-planner-beige.vercel.app/register)
2. Zelfde flow als lokaal

### Wachtwoord vergeten
1. `/forgot-password` → e-mail invullen
2. Klik resetlink in inbox → nieuw wachtwoord op `/auth/reset-password`
3. Inloggen met nieuw wachtwoord

### Admin — Spelers
1. Inloggen als admin (bv. Sam)
2. Tab **Spelers** → toevoegen / bewerken / verwijderen
3. Uitloggen → nieuwe speler registreert en logt in

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

### Reset-mail komt niet aan
- Check spam/promoties
- Supabase → **Authentication** → **Logs**
- Gratis tier: ~2 e-mails/uur — wacht of zet **custom SMTP** aan

### Redirect URL / reset-link werkt niet
- Redirect URLs moeten exact `/auth/callback` bevatten (lokaal + Vercel)
- `NEXT_PUBLIC_SITE_URL` moet overeenkomen met je app-URL
- Na env-wijziging op Vercel: **Redeploy**

### "Dit account is al geregistreerd"
- Log in met wachtwoord, of gebruik **Wachtwoord vergeten**
- Spelers met oude magic-link login: reset via **Wachtwoord vergeten**

### "Geen account voor dit e-mailadres"
- E-mail staat niet in `players.email` — admin voegt toe via tab **Spelers**

### `CRON_SECRET` / deploy faalt (non-ASCII character)
- Vercel stuurt `CRON_SECRET` als HTTP-header; **alleen ASCII** toegestaan (a-z, A-Z, 0-9, `-_`)
- Geen accenten (`é`), geen `µ`, geen emoji of spaties met vreemde tekens
- Fix: Vercel → **Settings → Environment Variables** → `CRON_SECRET` vervangen door bv. `openssl rand -hex 32` → **Redeploy**

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
| 8 | E-mail + wachtwoord login | ✅ |

---

## Git workflow

```bash
git add .
git commit -m "Beschrijving van je wijziging"
git push
```

Vercel deployt automatisch na push.

**Nooit committen:** `.env.local`, `.cursor/.env.local`
