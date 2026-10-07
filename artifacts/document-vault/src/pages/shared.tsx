import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { FileText, FileImage, FileArchive, Link2, KeyRound, ExternalLink, ShieldOff, Clock, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/components/vault-ui';

type SharedDoc = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  notes: string;
  sourceUrl: string | null;
  uploadedAt: string;
};

const fileIcon = (url: string | null) => {
  if (!url) return FileArchive;
  if (url.includes('google.com') || url.includes('drive.google')) return Link2;
  if (url.match(/\.(jpg|jpeg|png|webp)/i)) return FileImage;
  if (url.match(/\.pdf/i)) return FileText;
  return FileArchive;
};

export default function SharedPage() {
  const { token } = useParams<{ token: string }>();
  const [docs, setDocs] = useState<SharedDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  useEffect(() => {
    if (!token) { setError('invalid'); return; }
    fetch(`/api/share/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          setStatus(res.status);
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'Not found');
        }
        return res.json();
      })
      .then((data) => setDocs(data.documents))
      .catch((e: Error) => setError(e.message));
  }, [token]);

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border/80 bg-background/85 px-4 sm:px-8 backdrop-blur-md gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <KeyRound className="h-4 w-4" />
        </span>
        <span className="display-title text-lg font-extrabold text-foreground">Haven</span>
        <span className="ml-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">Shared View</span>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8">
        {error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            {status === 410 ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 mb-5">
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">This link has expired</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">The owner set an expiry date on this share link and it has passed. Ask them to generate a new one.</p>
              </>
            ) : status === 404 ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mb-5">
                  <ShieldOff className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Access revoked</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">The owner has revoked access to this shared link. It no longer points to any documents.</p>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mb-5">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Invalid link</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">This share link doesn't exist or may have been mistyped.</p>
              </>
            )}
            <a href="/" className="mt-8 inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors">
              Go to Haven
            </a>
          </div>
        ) : !docs ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-3xl bg-secondary/60" />
            ))}
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground font-semibold">
              {docs.length} {docs.length === 1 ? 'document' : 'documents'} shared with you
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {docs.map((doc) => {
                const Icon = fileIcon(doc.sourceUrl);
                const isGoogle = doc.sourceUrl && (doc.sourceUrl.includes('google.com') || doc.sourceUrl.includes('drive.google'));
                return (
                  <article
                    key={doc.id}
                    className="vault-card-surface flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card p-4"
                  >
                    <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl bg-secondary/50 p-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs ${isGoogle ? 'bg-blue-600 text-white' : 'bg-primary text-primary-foreground'}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-bold text-foreground border border-border/60 shadow-2xs backdrop-blur-xs">
                        {isGoogle ? 'Google Drive' : 'Link'}
                      </span>
                    </div>
                    <div className="mt-3.5 flex-1 px-1">
                      <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">{doc.title}</h3>
                      <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground font-medium">
                        <span className="rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">{doc.category}</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                      </div>
                      {doc.notes && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{doc.notes}</p>}
                      {doc.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {doc.tags.map((t) => (
                            <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {doc.sourceUrl && (
                      <a
                        href={doc.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
