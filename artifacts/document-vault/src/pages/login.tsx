import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useGetSession } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';

export default function Login() {
  const [, setLocation] = useLocation();
  const session = useGetSession();

  useEffect(() => {
    if (session.data?.authenticated) setLocation('/dashboard');
  }, [session.data, setLocation]);

  return (
    <main className="paper-grid flex min-h-[100dvh] items-center justify-center bg-background px-5 py-8" data-testid="page-login">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-[var(--shadow-lg)] md:grid-cols-[.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground md:block lg:p-14">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[32px] border-sidebar-primary/10" />
          <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full border-[24px] border-sidebar-primary/10" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><KeyRound className="h-5 w-5" /></span>
              <span className="display text-2xl">Haven</span>
            </div>
            <div className="mt-auto max-w-sm">
              <p className="eyebrow text-sidebar-primary">Your documents, your space</p>
              <h1 className="display mt-5 text-5xl leading-[1.04]">Everything important, in one quiet place.</h1>
              <p className="mt-6 text-sm leading-7 text-primary-foreground/60">Keep important files together in a private vault, or link documents that already live in Google Drive.</p>
              <div className="mt-9 flex items-center gap-2 text-xs text-primary-foreground/55">
                <ShieldCheck className="h-4 w-4 text-sidebar-primary" /> Private by default
              </div>
            </div>
          </div>
        </div>

        <div className="p-7 sm:p-12 lg:p-16">
          <div className="flex items-center gap-3 md:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><KeyRound className="h-4 w-4" /></span>
            <span className="display text-xl">Haven</span>
          </div>
          <div className="mt-12 max-w-md md:mt-4">
            <p className="eyebrow text-accent">Welcome</p>
            <h2 className="display mt-3 text-4xl" data-testid="heading-login">Sign in to your vault.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Haven uses your Google account for sign-in. You decide whether a document is uploaded to the vault or linked from your own Google Drive.
            </p>

            <div className="mt-10">
              <Button
                asChild
                className="h-12 w-full gap-3 text-base"
                data-testid="button-google-login"
              >
                <a href="/api/auth/login">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </a>
              </Button>
            </div>

            <div className="mt-8 flex items-start gap-3 border-t border-border pt-6">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-xs leading-5 text-muted-foreground">
                Haven requests access only to files it creates. Existing Drive files are never touched. You can revoke access any time from your Google account settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
