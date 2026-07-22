# Development guide — Squad Planner

Setup, environment variables, deploy and troubleshooting.  
For a product overview and demo link, see the root [README.md](../README.md).

---

## Requirements

- Node.js 18+
- Supabase project (free tier is enough)
- Git

---

## Quick start

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
# Fill .env.local (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Important:** `.env.local` must live in the **project root** (next to `package.json`), **not** in `.cursor/`.

---

## Project structure

```
squad-planner/
├── src/
│   ├── app/              # Pages, Server Actions, auth callback, cron, /demo
│   ├── components/       # UI (calendar, lineup, admin, stats, …)
│   ├── context/          # React context
│   └── lib/              # Helpers, Supabase clients, demo data, formations
├── supabase/
│   └── migrations/       # Database schema + RLS (SQL)
├── scripts/              # db:migrate, db:seed, db:setup, …
├── docs/
│   ├── DEVELOPMENT.md    # This file
│   └── screenshots/      # README screenshots
├── .env.local            # Secrets (local, do not commit)
└── .env.example          # Env template
```

---

## Environment variables

| Variable | Local | Vercel | Notes |
|----------|:-----:|:------:|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | service_role (server only) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | ✅ | Local: `http://localhost:3000` · Prod: `https://squad-planner-beige.vercel.app` |
| `SUPABASE_DB_URL` | ✅ | ❌ | Only for DB scripts (connection URI) |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | ⚙️ | ⚙️ | Push |
| `ONESIGNAL_REST_API_KEY` | ⚙️ | ⚙️ | Push (server) |
| `CRON_SECRET` | ⚙️ | ⚙️ | Vercel Cron Bearer token — **ASCII only** (`a-zA-Z0-9-_`) |
| `RBFA_TEAM_ID` | ⚙️ | ⚙️ | Optional; default `360260` (FC Hoje) |

⚙️ = needed for push / cron / RBFA. Without them the core app still works.

**Never commit:** `.env.local`, service role key, database password.

On Vercel: set required vars for **Production** (and Preview). Redeploy after changes.

---

## Database

```bash
npm run db:setup          # migrate + seed
npm run db:migrate        # schema only
npm run db:seed           # players + events from mock data
npm run db:reset-test-data
npm run db:enable-rls     # enable RLS (if not already)
```

Migrations live in `supabase/migrations/` (including RLS policies in `006_rls_policies.sql`).

On Windows, DB scripts use `--use-system-ca` for SSL.

---

## Supabase Auth

### Email provider

1. Supabase → **Authentication** → **Providers** → **Email**
2. Enable Email provider + signup
3. Confirm email: off (faster for club use)
4. Magic link / OTP for login: off (password only)

### Redirect URLs

**Authentication** → **URL Configuration**

| Redirect URL |
|--------------|
| `http://localhost:3000/auth/callback` |
| `http://localhost:3000/auth/callback/recovery` |
| `https://squad-planner-beige.vercel.app/auth/callback` |
| `https://squad-planner-beige.vercel.app/auth/callback/recovery` |

| Setting | Value |
|---------|--------|
| Site URL | `https://squad-planner-beige.vercel.app` |

Password reset uses `/auth/callback/recovery` (separate route).

### Player auth flow

1. Admin adds player with email (tab **Spelers**)
2. Player registers once at `/register`
3. Login at `/` with email + password
4. Forgot password → `/forgot-password` → `/auth/reset-password`

---

## Push notifications (OneSignal)

### Players

1. Log in
2. Enable notifications in the app
3. **iPhone:** add to home screen (Safari → Share → Add to Home Screen); open from the icon

### Setup

1. Run `003_push_notifications.sql` (or full migrate history)
2. Create a OneSignal **Web Push** app for your site URL
3. Set `NEXT_PUBLIC_ONESIGNAL_APP_ID` + `ONESIGNAL_REST_API_KEY` + `CRON_SECRET`
4. Redeploy on Vercel

Local OneSignal: allow `http://localhost:3000` in OneSignal and set `NEXT_PUBLIC_ONESIGNAL_ALLOW_LOCALHOST=true` if needed.

### Cron

`vercel.json` runs `/api/cron/availability-reminder` once per day (~19:00 UTC). That job:

1. Syncs the RBFA match calendar
2. Sends the Sunday evening availability push (Europe/Brussels window)

Manual tests:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://squad-planner-beige.vercel.app/api/cron/availability-reminder?force=1"

curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://squad-planner-beige.vercel.app/api/cron/rbfa-calendar"
```

In-app: admin → **Agenda** → **RBFA kalender sync**.

---

## Deploy (Vercel)

1. Push repo to GitHub
2. Import project on Vercel
3. Set environment variables
4. Deploy; set `NEXT_PUBLIC_SITE_URL` to the live URL → redeploy
5. Add Supabase redirect URLs

Further pushes auto-deploy.

---

## App usage (roles)

| Tab | Who | What |
|-----|-----|------|
| **Kalender** | Everyone | Week/month, set availability |
| **Opstelling** | Squad players | View published lineup |
| **Stats** | Squad players | Season stats |
| **Beschikbaarheid** | Admin | Who responded per event |
| **Spelers** | Admin | CRUD + login emails |
| **Agenda** | Admin | Events + RBFA sync |
| **Opstelling maken** | Admin | Build & publish lineups |
| **Stats invoeren** | Admin | Goals / assists |

Public demo: `/demo` (no auth, read-only).

---

## Troubleshooting

### Reset email not arriving

- Check spam
- Supabase → Authentication → Logs
- Free tier rate limits; consider custom SMTP

### Redirect / reset link broken

- Redirect URLs must match exactly
- `NEXT_PUBLIC_SITE_URL` must match the app URL
- Redeploy after env changes on Vercel

### “Account already registered”

- Log in with password, or use Forgot password

### “No account for this email”

- Email missing on `players.email` — admin adds it under **Spelers**

### `CRON_SECRET` deploy fails (non-ASCII)

- Use only ASCII (`openssl rand -hex 32`)

### `TypeError: fetch failed` on Vercel login

- SSL workaround is Windows-only (`src/lib/node-ssl.js`); ensure latest code is deployed

### Empty calendar / no players

- `npm run db:seed` or `npm run db:setup`
- Check Supabase Table Editor

---

## Git

```bash
git add .
git commit -m "Describe your change"
git push
```

**Never commit:** `.env.local`, `.cursor/.env.local`
