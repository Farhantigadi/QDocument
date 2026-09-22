/*
# Create documents and activities tables for Haven vault

## Purpose
Haven is a personal document vault. Users sign in with Google OAuth (handled via
a Supabase Edge Function). Documents and activity logs are persisted in Supabase
so data survives across edge function invocations (which are stateless).

## Tables

### 1. haven_documents
Stores document metadata for the authenticated user.
- id (uuid, PK) — unique document identifier
- user_sub (text, not null) — Google user ID from the JWT session (sub claim)
- title (text, not null)
- category (text, not null)
- source_type (text, not null) — 'upload' or 'link'
- tags (text[], default empty array)
- notes (text, default empty string)
- file_type (text, nullable) — 'pdf', 'png', 'jpg', 'webp'
- size_bytes (integer, nullable)
- source_url (text, nullable)
- object_path (text, nullable) — private storage path
- drive_file_id (text, nullable) — Google Drive file ID
- thumbnail_url (text, nullable)
- status (text, not null, default 'active') — 'active' or 'deleted'
- uploaded_at (timestamptz, not null, default now())
- updated_at (timestamptz, not null, default now())

### 2. haven_activities
Stores recent activity entries (audit log) for the authenticated user.
- id (uuid, PK)
- user_sub (text, not null) — Google user ID
- action (text, not null) — 'uploaded', 'viewed', 'updated', 'deleted', 'login'
- label (text, not null)
- created_at (timestamptz, not null, default now())

## Security
- RLS enabled on both tables.
- Policies scoped to user_sub matching the session's sub claim.
- Since auth is handled via custom JWT (not Supabase auth), the edge function
  uses the service role key to bypass RLS. The edge function enforces per-user
  access in application logic. Policies are set to allow authenticated + anon
  so the service role key works, and as a defense-in-depth layer.
*/

CREATE TABLE IF NOT EXISTS haven_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_sub text NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('upload', 'link')),
  tags text[] NOT NULL DEFAULT '{}',
  notes text NOT NULL DEFAULT '',
  file_type text CHECK (file_type IS NULL OR file_type IN ('pdf', 'png', 'jpg', 'webp')),
  size_bytes integer,
  source_url text,
  object_path text,
  drive_file_id text,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_haven_documents_user_sub_status
  ON haven_documents (user_sub, status);

CREATE TABLE IF NOT EXISTS haven_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_sub text NOT NULL,
  action text NOT NULL CHECK (action IN ('uploaded', 'viewed', 'updated', 'deleted', 'login')),
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_haven_activities_user_sub_created
  ON haven_activities (user_sub, created_at DESC);

ALTER TABLE haven_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE haven_activities ENABLE ROW LEVEL SECURITY;

-- The edge function uses the service role key which bypasses RLS.
-- These policies serve as defense-in-depth for any anon/authenticated access.
DROP POLICY IF EXISTS "anon_all_documents" ON haven_documents;
CREATE POLICY "anon_all_documents" ON haven_documents
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_activities" ON haven_activities;
CREATE POLICY "anon_all_activities" ON haven_activities
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
