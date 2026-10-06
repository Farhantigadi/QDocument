# Haven — Personal Document & Password Vault

Haven is a private, encrypted vault for the things that matter most — passports, insurance policies, leases, certificates, and passwords — all in one secure place.

---

## What it does

- Sign in with email and password
- Sign up with email + OTP verification (no unverified accounts stored)
- Forgot password via OTP reset flow
- Upload or link documents, organize by category and tags
- Search and sort your document vault
- Edit and delete documents
- Dashboard with category breakdown and recent activity
- Password vault — store credentials encrypted with AES-256-GCM, reveal on demand
- Admin panel — view all users, manage accounts

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, shadcn/ui, Wouter |
| API | Express 5 (Node.js) |
| Auth | Email + OTP → JWT cookie (jose, bcryptjs) |
| Database | PostgreSQL via Supabase (Drizzle ORM) |
| Email | Gmail SMTP via Nodemailer |
| Encryption | AES-256-GCM (Node.js crypto) |
| Deployment | Vercel (frontend) + any Node host (API) |

---

## Project structure

```
/
├── artifacts/
│   ├── api-server/         ← Express API server
│   │   └── src/
│   │       ├── routes/     ← auth, documents, dashboard, admin, storage, vault
│   │       ├── middlewares/ ← requireAuth
│   │       └── lib/        ← db, session, email, objectStorage
│   └── document-vault/     ← React frontend (Vite)
│       └── src/
│           ├── pages/      ← login, dashboard, documents, vault, settings, admin
│           └── components/
├── lib/
│   ├── db/                 ← Drizzle schema + migrations + seed
│   ├── api-client-react/   ← React Query hooks
│   └── api-zod/            ← Zod validation schemas
├── .env.example            ← environment variable template
└── .env.local              ← your local secrets (never committed)
```

---

## Running locally

**Prerequisites**
- Node.js 20+
- pnpm (`npm install -g pnpm`)

**1. Install dependencies**
```bash
cd C:\Personal-Projects\QDocument
pnpm install
```

**2. Set up environment variables**

Copy `.env.example` to `.env.local` and fill in your values:

```
SESSION_SECRET=        # random 32+ char string
DATABASE_URL=          # Supabase pooled connection string (port 6543)
VAULT_ENCRYPTION_KEY=  # 64 hex chars (32 bytes) — generate once, never change
ADMIN_EMAIL=           # email that gets ADMIN role on signup
SMTP_USER=             # your Gmail address
SMTP_PASS=             # Gmail App Password (16 chars, no spaces)
PORT=3000
```

**3. Terminal 1 — API server**
```bash
cd artifacts/api-server
pnpm build
pnpm dev
```
Runs at `http://localhost:3000`

**4. Terminal 2 — Frontend**
```bash
cd artifacts/document-vault
pnpm dev
```
Runs at `http://localhost:5173` — proxies `/api/*` to port 3000 automatically.

---

## Default admin account

The admin account is seeded automatically on first run if `ADMIN_EMAIL` is set and the user signs up through the normal flow. To create it directly in the database:

```bash
cd artifacts/api-server
node --env-file=../../.env.local seed.mjs
```

Default credentials (change after first login):
- Email: set via `ADMIN_EMAIL` in `.env.local`
- Password: `Ft@haven123`

---

## Gmail App Password setup

1. Enable **2-Step Verification** on your Google account
2. Go to [Google Account → Security → App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a password for "Haven"
4. Paste the 16-char password into `SMTP_PASS` in `.env.local` (spaces are stripped automatically)

---

## Database setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com)
2. Copy the **pooled connection string** (port 6543) into `DATABASE_URL`
3. Run migrations:
```bash
cd lib/db
npx drizzle-kit push
```

> **Note:** Supabase free-tier projects pause after 7 days of inactivity. The API server pings the database every 4 days automatically to prevent this while it's running.

---

## Auth flow

**Signup**
1. User enters name, email, password → OTP sent to email
2. User enters 6-digit code → account created + logged in

**Login**
- Email + password → JWT session cookie (10-year expiry, HttpOnly)

**Forgot password**
1. User enters email → OTP sent to email
2. User enters code + new password → password updated, redirected to login

---

## Password vault

Credentials are encrypted at rest using **AES-256-GCM** with a 32-byte key (`VAULT_ENCRYPTION_KEY`). The encrypted value stored in the database is `iv:authTag:ciphertext` (all hex). Passwords are never returned in list responses — only when explicitly revealed via `GET /api/vault/:id`.

---

## Environment variables reference

| Variable | Description |
|---|---|
| `SESSION_SECRET` | Secret for signing JWT cookies |
| `DATABASE_URL` | PostgreSQL connection string (Supabase pooled, port 6543) |
| `VAULT_ENCRYPTION_KEY` | AES-256-GCM key for credential encryption (64 hex chars) |
| `ADMIN_EMAIL` | Email address that receives ADMIN role on signup |
| `SMTP_USER` | Gmail address for sending OTP emails |
| `SMTP_PASS` | Gmail App Password (spaces stripped automatically) |
| `PORT` | API server port (default 3000) |
