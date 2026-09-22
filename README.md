# Haven — Personal Document Vault

Haven is a personal document vault for families. It lets you store, organize, and find important documents — passports, insurance policies, leases, certificates — in one quiet place. Every file lives in **your own Google Drive**. Haven never copies your data anywhere else.

Built for small groups (10–100 people). No heavy database, no S3 bucket, no monthly infra bill.

---

## What it does

- Sign in with Google — no passwords, no OTP codes
- Upload files directly to a `Haven Vault` folder in your Google Drive
- Or link an existing Google Drive document by URL
- Organize documents by category and tags
- Search and sort your vault
- Edit document metadata (title, category, tags, notes)
- Delete documents — removes from vault and from Drive
- Dashboard with storage usage, category breakdown, and recent activity
- Works for the whole family — each person's files stay in their own Drive

---

## How the storage works

There is no separate database. Each user's Google Drive acts as both the file store and the database.

When you first sign in, Haven creates a `Haven Vault` folder in your Drive and a `haven-vault.json` file inside it. That JSON file is the index — it stores all document metadata (title, category, tags, notes, Drive file ID). Every read and write goes through that file.

```
Your Google Drive/
└── Haven Vault/
    ├── haven-vault.json     ← the "database" (metadata index)
    ├── Passport scan.pdf
    ├── Health insurance.pdf
    └── Apartment lease.pdf
```

Sessions are JWT tokens stored in an HttpOnly cookie. No session database needed.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, shadcn/ui primitives, Wouter |
| API | Vercel Serverless Functions (TypeScript) |
| Auth | Google OAuth 2.0 → JWT cookie (jose) |
| Storage | Google Drive API (googleapis) |
| File parsing | formidable (multipart uploads) |
| Deployment | Vercel |

---

## Project structure

```
/
├── api/                        ← Vercel serverless functions
│   ├── auth/
│   │   ├── login.ts            ← redirects to Google OAuth
│   │   ├── callback.ts         ← exchanges code, sets session cookie
│   │   ├── session.ts          ← returns current user from cookie
│   │   └── logout.ts           ← clears cookie
│   ├── documents/
│   │   ├── index.ts            ← GET list, POST upload/link
│   │   └── [documentId]/
│   │       └── index.ts        ← GET, PATCH, DELETE one document
│   ├── dashboard/
│   │   └── index.ts            ← summary + activity (derived from Drive index)
│   └── lib/
│       ├── drive.ts            ← all Google Drive operations
│       └── session.ts          ← JWT sign/verify/cookie helpers
│
├── artifacts/
│   └── document-vault/         ← React frontend (Vite)
│       └── src/
│           ├── pages/          ← login, dashboard, documents, detail, settings
│           └── components/
│               └── vault-ui.tsx ← shared UI: DocumentDialog, AppShell, cards
│
├── lib/
│   ├── api-spec/openapi.yaml   ← OpenAPI contract (source of truth)
│   ├── api-client-react/       ← generated React Query hooks
│   └── api-zod/                ← generated Zod validation schemas
│
├── vercel.json                 ← routes /api/* to functions, /* to SPA
├── .env.example                ← environment variable template
└── .env.local                  ← your local secrets (never committed)
```

---

## Running locally

You need two terminals.

**Prerequisites**
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Vercel CLI (`npm install -g vercel`)

**1. Install dependencies**
```bash
cd C:\Personal-Projects\QDocument
pnpm approve-builds   # approve esbuild on first run
pnpm install
```

**2. Set up environment variables**

Copy `.env.example` to `.env.local` and fill in your Google credentials:
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
SESSION_SECRET=any-random-32-char-string
```

**3. Terminal 1 — API (Vercel functions)**
```bash
cd C:\Personal-Projects\QDocument
npx vercel dev
```
Runs at `http://localhost:3000`

**4. Terminal 2 — Frontend (Vite)**
```bash
cd C:\Personal-Projects\QDocument\artifacts\document-vault
pnpm dev
```
Runs at `http://localhost:5173` — proxies `/api/*` to port 3000 automatically.

Open `http://localhost:5173` in your browser.

---

## Getting Google credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project
3. Enable **Google Drive API** and **Google People API**
4. Go to **Credentials → Create → OAuth 2.0 Client ID**
   - Type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback`
5. Copy Client ID and Client Secret into `.env.local`
6. Go to **OAuth consent screen → Test users** and add your own email

---

## Deploying to Vercel

```bash
# from project root
npx vercel --prod
```

Then in the Vercel dashboard, add these environment variables:

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | from Google Console |
| `GOOGLE_CLIENT_SECRET` | from Google Console |
| `GOOGLE_REDIRECT_URI` | `https://your-app.vercel.app/api/auth/callback` |
| `SESSION_SECRET` | random 32+ char string |

Also add `https://your-app.vercel.app/api/auth/callback` as an authorized redirect URI in Google Console.

---

## Privacy model

- Haven requests the `drive.file` OAuth scope — it can only see files **it created**, never your existing Drive files
- Each user's data is completely isolated — no shared database, no cross-user access possible
- Sessions expire on logout; the JWT cookie is HttpOnly and never readable by JavaScript
- Deleting a document from Haven also deletes the file from Drive
