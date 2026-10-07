import { ArrowLeft, KeyRound } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12" data-testid="page-not-found">
      <div className="vault-card-surface max-w-sm rounded-2xl p-6 text-center border border-border bg-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
          <KeyRound className="h-6 w-6" />
        </div>
        <p className="mt-4 text-xs font-semibold text-muted-foreground">404 Error</p>
        <h1 className="mt-1 text-xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          This address does not belong to your Haven vault space.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-2 text-xs font-semibold text-background transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="link-not-found-home"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    </main>
  );
}