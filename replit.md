# Personal Document Vault

Haven Vault is a privacy-first workspace for organizing, finding, previewing, and managing personal documents.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Web: React + Vite + Wouter + Tailwind CSS + shadcn-style primitives

## Where things live

- `artifacts/document-vault/src/` — Haven Vault web app, routes, shell, and UI
- `artifacts/api-server/src/routes/` — API route handlers
- `artifacts/api-server/src/lib/vault-store.ts` — development vault data store
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/api-client-react/src/generated/` — generated React Query client
- `lib/api-zod/src/generated/` — generated server validation schemas

## Architecture decisions

- Sessions are intentionally persistent until explicit logout or server-side revocation; the browser cookie is HttpOnly, Secure in production, SameSite=Strict, and long-lived.
- The API contract is OpenAPI-first; generated React Query hooks and Zod schemas are used by the web and server layers.
- Documents are private by default and all document operations are scoped to the current user boundary before storage access is added.
- Documents support two explicit sources: an uploaded vault file or an external link. Removing a link record never deletes the original Drive file.
- Google Drive copy/sync must be an explicit per-user OAuth opt-in; linking a Drive URL alone does not grant Haven access to or ownership of that file.
- The first working build uses a small in-memory development store so the complete product flow is visible while managed auth, database, and object storage are connected.

## Product

- Persistent sign-in and logout flow
- Overview dashboard with storage summary, category map, and recent activity
- Searchable, sortable document workspace
- Upload-or-link document intake for PDF, PNG, JPG, and WEBP files plus existing Google Drive URLs
- Document detail view with metadata editing and soft delete
- Account, session, privacy, and storage settings
- Privacy-safe admin overview and user quota/status table

## User preferences

- The user explicitly requested indefinite sessions that persist until logout.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- The generated client expects the API at `/api`; use the shared proxy for local verification.
- The development store is not durable or multi-user; replace it with PostgreSQL and authenticated storage before production use.
- Uploaded file bytes are stored in private App Storage through a presigned direct upload; the document record keeps only the object path and queryable metadata.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
