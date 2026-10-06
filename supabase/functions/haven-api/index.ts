import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { SignJWT, jwtVerify } from "npm:jose@5.9.6";

// ---------------------------------------------------------------------------
// CORS headers — mandatory on every response
// ---------------------------------------------------------------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ---------------------------------------------------------------------------
// Config from environment / secrets
// ---------------------------------------------------------------------------
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "";
const GOOGLE_REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI") ?? "";
const SESSION_SECRET = Deno.env.get("SESSION_SECRET") ?? "dev-secret-change-me";

const SECRET = new TextEncoder().encode(SESSION_SECRET);
const COOKIE_NAME = "haven_session";
const ADMIN_EMAIL = "farhantigadi123@gmail.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SessionPayload = {
  sub: string;
  name: string;
  email: string;
  picture: string;
  role: "USER" | "ADMIN";
  accessToken: string;
  refreshToken: string;
};

type VaultDocument = {
  id: string;
  title: string;
  category: string;
  sourceType: "upload" | "link";
  tags: string[];
  notes: string;
  fileType: "pdf" | "png" | "jpg" | "webp" | null;
  sizeBytes: number | null;
  sourceUrl: string | null;
  objectPath: string | null;
  driveFileId: string | null;
  thumbnailUrl: string | null;
  uploadedAt: string;
  updatedAt: string;
  status: "active" | "deleted";
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function redirect(url: string, cookie?: string): Response {
  const headers: Record<string, string> = { ...corsHeaders, Location: url };
  if (cookie) headers["Set-Cookie"] = cookie;
  return new Response(null, { status: 302, headers });
}

function resolveRole(email: string): "USER" | "ADMIN" {
  return email.trim().toLowerCase() === ADMIN_EMAIL ? "ADMIN" : "USER";
}

async function signSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .sign(SECRET);
}

async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

function cookieHeader(token: string): string {
  const expires = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toUTCString();
  return [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "Path=/",
    "Max-Age=315360000",
    `Expires=${expires}`,
    "SameSite=Lax",
    "Secure",
  ].join("; ");
}

function clearCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function requireSession(req: Request): Promise<SessionPayload | null> {
  const token = parseCookie(req.headers.get("Cookie"), COOKIE_NAME);
  if (!token) return null;
  return await verifySession(token);
}

function uuid(): string {
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Activity helper
// ---------------------------------------------------------------------------
async function addActivity(userSub: string, action: string, label: string): Promise<void> {
  await supabase.from("haven_activities").insert({
    id: uuid(),
    user_sub: userSub,
    action,
    label,
    created_at: nowISO(),
  });
}

// ---------------------------------------------------------------------------
// Google OAuth helpers
// ---------------------------------------------------------------------------
function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "openid email profile https://www.googleapis.com/auth/drive.file",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
} | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { access_token: data.access_token, refresh_token: data.refresh_token };
}

async function getGoogleProfile(accessToken: string): Promise<{
  id: string;
  name: string;
  email: string;
  picture: string;
} | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return await res.json();
}

// ---------------------------------------------------------------------------
// Document DB helpers
// ---------------------------------------------------------------------------
function dbRowToDoc(row: Record<string, unknown>): VaultDocument {
  return {
    id: row.id as string,
    title: row.title as string,
    category: row.category as string,
    sourceType: row.source_type as "upload" | "link",
    tags: row.tags as string[] ?? [],
    notes: row.notes as string ?? "",
    fileType: row.file_type as VaultDocument["fileType"],
    sizeBytes: row.size_bytes as number | null,
    sourceUrl: row.source_url as string | null,
    objectPath: row.object_path as string | null,
    driveFileId: row.drive_file_id as string | null,
    thumbnailUrl: row.thumbnail_url as string | null,
    uploadedAt: row.uploaded_at as string,
    updatedAt: row.updated_at as string,
    status: row.status as "active" | "deleted",
  };
}

async function listDocuments(userSub: string, search: string, category: string, sort: string): Promise<VaultDocument[]> {
  let query = supabase
    .from("haven_documents")
    .select("*")
    .eq("user_sub", userSub)
    .eq("status", "active");

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let docs = (data ?? []).map(dbRowToDoc);

  if (search) {
    const q = search.toLowerCase();
    docs = docs.filter((d) => [d.title, d.category, ...d.tags].join(" ").toLowerCase().includes(q));
  }

  docs.sort((a, b) => {
    if (sort === "name") return a.title.localeCompare(b.title);
    if (sort === "size") return (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0);
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  return docs;
}

async function createDocument(userSub: string, body: Record<string, unknown>): Promise<VaultDocument> {
  const now = nowISO();
  const newRow = {
    id: uuid(),
    user_sub: userSub,
    title: String(body.title ?? ""),
    category: String(body.category ?? ""),
    source_type: body.sourceType as "upload" | "link",
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    notes: String(body.notes ?? ""),
    file_type: body.fileType ?? null,
    size_bytes: body.sizeBytes ?? null,
    source_url: body.sourceUrl ?? null,
    object_path: body.objectPath ?? null,
    drive_file_id: body.driveFileId ?? null,
    thumbnail_url: null,
    status: "active",
    uploaded_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase.from("haven_documents").insert(newRow).select("*").single();
  if (error) throw new Error(error.message);

  await addActivity(userSub, "uploaded", `${newRow.title} added`);
  return dbRowToDoc(data);
}

async function getDocument(userSub: string, docId: string): Promise<VaultDocument | null> {
  const { data, error } = await supabase
    .from("haven_documents")
    .select("*")
    .eq("id", docId)
    .eq("user_sub", userSub)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return dbRowToDoc(data);
}

async function updateDocument(userSub: string, docId: string, body: Record<string, unknown>): Promise<VaultDocument | null> {
  const updates: Record<string, unknown> = { updated_at: nowISO() };
  if (body.title !== undefined) updates.title = String(body.title);
  if (body.category !== undefined) updates.category = String(body.category);
  if (Array.isArray(body.tags)) updates.tags = body.tags.map(String);
  if (body.notes !== undefined) updates.notes = String(body.notes);

  const { data, error } = await supabase
    .from("haven_documents")
    .update(updates)
    .eq("id", docId)
    .eq("user_sub", userSub)
    .eq("status", "active")
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  await addActivity(userSub, "updated", `${data.title} details updated`);
  return dbRowToDoc(data);
}

async function deleteDocument(userSub: string, docId: string): Promise<boolean> {
  const doc = await getDocument(userSub, docId);
  if (!doc || doc.status === "deleted") return false;

  const { error } = await supabase
    .from("haven_documents")
    .update({ status: "deleted", updated_at: nowISO() })
    .eq("id", docId)
    .eq("user_sub", userSub);

  if (error) throw new Error(error.message);

  await addActivity(userSub, "deleted", `${doc.title} moved to trash`);
  return true;
}

// ---------------------------------------------------------------------------
// Storage helpers — Supabase Storage for private file uploads
// ---------------------------------------------------------------------------
const STORAGE_BUCKET = "haven-uploads";

async function createUploadUrl(): Promise<{ uploadURL: string; objectPath: string }> {
  const filePath = `uploads/${uuid()}`;
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(filePath);

  if (error || !data) throw new Error("Failed to generate upload URL");

  return {
    uploadURL: data.signedUrl,
    objectPath: `/objects/${filePath}`,
  };
}

async function serveStorageObject(objectPath: string): Promise<Response> {
  // objectPath is like /objects/uploads/uuid
  const filePath = objectPath.replace(/^\/objects\//, "");

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, 300);

  if (error || !data) return json({ error: "Object not found" }, 404);

  // Fetch the file and stream it back
  const fileRes = await fetch(data.signedUrl);
  if (!fileRes.ok) return json({ error: "Object not found" }, 404);

  const contentType = fileRes.headers.get("content-type") ?? "application/octet-stream";
  const contentLength = fileRes.headers.get("content-length");

  const headers: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": contentType,
    "Cache-Control": "private, max-age=300",
  };
  if (contentLength) headers["Content-Length"] = contentLength;

  return new Response(fileRes.body, { status: 200, headers });
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  // Edge function receives paths like /functions/v1/haven-api/api/auth/session
  // or /api/auth/session (when proxied). Strip everything up to and including /api.
  let path = url.pathname;
  const apiIdx = path.indexOf("/api/");
  if (apiIdx >= 0) {
    path = path.slice(apiIdx + 4); // keep the leading slash after /api
  } else {
    // Fallback: strip /haven-api prefix if present
    path = path.replace(/^\/haven-api/, "");
  }
  const method = req.method;

  // Remove leading slash for matching
  const route = path.replace(/^\/+/, "");

  // --- Health check ---
  if (route === "healthz" && method === "GET") {
    return json({ status: "ok" });
  }

  // --- Auth: login (redirect to Google) ---
  if (route === "auth/login" && method === "GET") {
    return redirect(buildAuthUrl());
  }

  // --- Auth: callback (Google redirects back here) ---
  if (route === "auth/callback" && method === "GET") {
    const code = url.searchParams.get("code");
    if (!code) return json({ error: "Missing code" }, 400);

    const tokens = await exchangeCodeForTokens(code);
    if (!tokens) return json({ error: "Failed to exchange code" }, 400);

    const profile = await getGoogleProfile(tokens.access_token);
    if (!profile) return json({ error: "Failed to get profile" }, 400);

    const role = resolveRole(profile.email);

    const token = await signSession({
      sub: profile.id,
      name: profile.name,
      email: profile.email,
      picture: profile.picture,
      role,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? "",
    });

    return redirect("/dashboard", cookieHeader(token));
  }

  // --- Auth: session ---
  if (route === "auth/session" && method === "GET") {
    const session = await requireSession(req);
    if (!session) {
      return json({ authenticated: false, user: null });
    }
    return json({
      authenticated: true,
      user: {
        id: session.sub,
        name: session.name,
        email: session.email,
        picture: session.picture,
        role: session.role,
        status: "ACTIVE",
      },
    });
  }

  // --- Auth: logout ---
  if (route === "auth/logout" && method === "POST") {
    const session = await requireSession(req);
    if (session) {
      await addActivity(session.sub, "login", "Signed out of this browser");
    }
    return new Response(null, {
      status: 204,
      headers: { ...corsHeaders, "Set-Cookie": clearCookieHeader() },
    });
  }

  // --- All remaining routes require authentication ---
  const session = await requireSession(req);
  if (!session) {
    return json({ error: "Unauthorized" }, 401);
  }

  // --- Documents: list + create ---
  if (route === "documents" && method === "GET") {
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const category = url.searchParams.get("category") ?? "";
    const sort = url.searchParams.get("sort") ?? "recent";
    const docs = await listDocuments(session.sub, search, category, sort);
    return json(docs);
  }

  if (route === "documents" && method === "POST") {
    const body = await req.json();
    if (!body.title || !body.category) return json({ error: "title and category required" }, 400);

    if (body.sourceType === "upload" && (!body.fileType || !body.sizeBytes)) {
      return json({ error: "Uploaded documents require a file." }, 400);
    }
    if (body.sourceType === "upload" && (!body.objectPath || !body.objectPath.startsWith("/objects/uploads/"))) {
      return json({ error: "Uploaded documents require a private object." }, 400);
    }
    if (body.sourceType === "link" && !body.sourceUrl) {
      return json({ error: "Linked documents require a URL." }, 400);
    }

    const doc = await createDocument(session.sub, body);
    return json(doc, 201);
  }

  // --- Documents: get / update / delete by ID ---
  const docMatch = route.match(/^documents\/([^/]+)$/);
  if (docMatch) {
    const docId = docMatch[1];

    if (method === "GET") {
      const doc = await getDocument(session.sub, docId);
      if (!doc || doc.status === "deleted") return json({ error: "Document not found" }, 404);
      await addActivity(session.sub, "viewed", `${doc.title} viewed`);
      return json(doc);
    }

    if (method === "PATCH") {
      const body = await req.json();
      const doc = await updateDocument(session.sub, docId, body);
      if (!doc) return json({ error: "Document not found" }, 404);
      return json(doc);
    }

    if (method === "DELETE") {
      const deleted = await deleteDocument(session.sub, docId);
      if (!deleted) return json({ error: "Document not found" }, 404);
      return new Response(null, { status: 204, headers: corsHeaders });
    }
  }

  // --- Storage: request upload URL ---
  if (route === "storage/uploads/request-url" && method === "POST") {
    const body = await req.json();
    if (!body.name || !body.size || !body.contentType) {
      return json({ error: "Missing or invalid required fields" }, 400);
    }
    const { uploadURL, objectPath } = await createUploadUrl();
    return json({
      uploadURL,
      objectPath,
      metadata: { name: body.name, size: body.size, contentType: body.contentType },
    });
  }

  // --- Storage: serve object ---
  const storageMatch = route.match(/^storage\/objects\/(.+)$/);
  if (storageMatch && method === "GET") {
    const objectPath = `/objects/${storageMatch[1]}`;
    return await serveStorageObject(objectPath);
  }

  // --- Dashboard: summary ---
  if (route === "dashboard/summary" && method === "GET") {
    const { data: docs } = await supabase
      .from("haven_documents")
      .select("category, size_bytes")
      .eq("user_sub", session.sub)
      .eq("status", "active");

    const activeDocs = docs ?? [];
    const categoryMap = new Map<string, number>();
    let storageUsed = 0;
    for (const d of activeDocs) {
      const cat = d.category as string;
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
      storageUsed += (d.size_bytes as number) ?? 0;
    }

    return json({
      documentCount: activeDocs.length,
      storageUsedBytes: storageUsed,
      storageLimitBytes: 15 * 1024 * 1024 * 1024,
      categories: [...categoryMap.entries()].map(([category, count]) => ({ category, count })),
    });
  }

  // --- Dashboard: activity ---
  if (route === "dashboard/activity" && method === "GET") {
    const { data } = await supabase
      .from("haven_activities")
      .select("*")
      .eq("user_sub", session.sub)
      .order("created_at", { ascending: false })
      .limit(8);

    const activities = (data ?? []).map((a) => ({
      id: a.id,
      action: a.action,
      label: a.label,
      createdAt: a.created_at,
    }));

    return json(activities);
  }

  // --- Admin: overview ---
  if (route === "admin/overview" && method === "GET") {
    if (session.role !== "ADMIN") return json({ error: "Forbidden" }, 403);

    const { data: docs } = await supabase
      .from("haven_documents")
      .select("size_bytes")
      .eq("user_sub", session.sub)
      .eq("status", "active");

    const activeDocs = docs ?? [];
    const storageUsed = activeDocs.reduce((sum, d) => sum + ((d.size_bytes as number) ?? 0), 0);

    const { count } = await supabase
      .from("haven_activities")
      .select("*", { count: "exact", head: true })
      .eq("user_sub", session.sub);

    return json({
      userCount: 1,
      documentCount: activeDocs.length,
      storageUsedBytes: storageUsed,
      auditEventCount: count ?? 0,
    });
  }

  // --- Admin: users ---
  if (route === "admin/users" && method === "GET") {
    if (session.role !== "ADMIN") return json({ error: "Forbidden" }, 403);

    const { data: docs } = await supabase
      .from("haven_documents")
      .select("size_bytes")
      .eq("user_sub", session.sub)
      .eq("status", "active");

    const activeDocs = docs ?? [];
    const storageUsed = activeDocs.reduce((sum, d) => sum + ((d.size_bytes as number) ?? 0), 0);

    return json([{
      id: session.sub,
      name: session.name,
      email: session.email,
      status: "ACTIVE",
      documentCount: activeDocs.length,
      storageUsedBytes: storageUsed,
      storageLimitBytes: 15 * 1024 * 1024 * 1024,
    }]);
  }

  // --- 404 ---
  return json({ error: "Not found" }, 404);
}

// ---------------------------------------------------------------------------
// Main server
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    return await handleRequest(req);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return json({ error: message }, 500);
  }
});
