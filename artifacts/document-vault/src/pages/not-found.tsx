import { ArrowLeft, KeyRound } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <main className="paper-grid flex min-h-[100dvh] items-center justify-center bg-background px-5" data-testid="page-not-found">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><KeyRound className="h-6 w-6" /></div>
        <p className="eyebrow mt-7 text-accent">A page out of place</p>
        <h1 className="display mt-3 text-5xl">Nothing filed here.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">This address does not belong to your Haven yet. Let’s take you somewhere useful.</p>
        <Link href="/dashboard" className="focus-ring mt-7 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-not-found-home"><ArrowLeft className="h-4 w-4" /> Back to overview</Link>
      </div>
    </main>
  );
}