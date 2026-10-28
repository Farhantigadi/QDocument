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
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background/90 px-4 sm:px-8 backdrop-blur-md gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background">
          <KeyRound className="h-4 w-4" />
        </span>
        <span className="text-base font-bold text-foreground tracking-tight">Haven</span>
        <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Shared view</span>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-12 sm:px-8">
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="shared-error-state">
            <div className="vault-card-surface w-full max-w-sm rounded-2xl border border-border bg-card p-6 sm:p-8 text-center space-y-4">
              {status === 410 ? (
                <>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-foreground">Link Expired</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The owner set an expiration timer on this share link and access has ended.
                    </p>
                  </div>
                </>
              ) : status === 404 ? (
                <>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                    <ShieldOff className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-foreground">Access Revoked</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This share link was deleted or ended by the document owner. Access to the files has been permanently revoked.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-foreground">Link Not Found</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This share link does not exist or may have been mistyped.
                    </p>
                  </div>
                </>
              )}
              <a
                href="/"
                className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Return to Haven
              </a>
            </div>
          </div>
        ) : !docs ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-muted/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <p className="mb-6 text-xs text-muted-foreground font-semibold">
              {docs.length} {docs.length === 1 ? 'document' : 'documents'} shared with you
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {docs.map((doc) => {
                const Icon = fileIcon(doc.sourceUrl);
                const isGoogle = doc.sourceUrl && (doc.sourceUrl.includes('google.com') || doc.sourceUrl.includes('drive.google'));
                return (
                  <article
                    key={doc.id}
                    className="vault-card-surface flex h-full flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4"
                  >
                    <div className="relative flex h-28 w-full items-center justify-center rounded-lg bg-muted/60 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border text-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="absolute right-2.5 top-2.5 rounded bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground border border-border">
                        {isGoogle ? 'Google Drive' : 'Link'}
                      </span>
                    </div>
                    <div className="mt-3 flex-1">
                      <h3 className="line-clamp-2 text-xs font-semibold text-foreground">{doc.title}</h3>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="rounded bg-muted px-2 py-0.5 font-medium">{doc.category}</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                      </div>
                      {doc.notes && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{doc.notes}</p>}
                      {doc.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {doc.tags.map((t) => (
                            <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {doc.sourceUrl && (
                      <a
                        href={doc.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
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

