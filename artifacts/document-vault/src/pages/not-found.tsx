import { ArrowLeft, KeyRound } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12 animate-fade-in" data-testid="page-not-found">
      <div className="vault-card-surface max-w-md rounded-3xl p-8 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
          <KeyRound className="h-8 w-8" />
        </div>
        <p className="eyebrow-text mt-6 text-accent">404 Error</p>
        <h1 className="display-title mt-2 text-3xl font-extrabold text-foreground">Nothing filed here.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This address does not belong to your Haven vault space. Let’s head back to somewhere useful.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-150 hover:bg-primary/90 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="link-not-found-home"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    </main>
  );
}