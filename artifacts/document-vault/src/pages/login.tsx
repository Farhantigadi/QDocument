import { useEffect, useState } from 'react';
import { ArrowRight, Check, KeyRound, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useLocation } from 'wouter';
import { useGetSession } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Login() {
  const [, setLocation] = useLocation();
  const session = useGetSession();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (session.data?.authenticated) setLocation('/dashboard');
  }, [session.data, setLocation]);

  const submitEmail = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setNotice('Enter the email you use for Haven.');
      return;
    }
    setSent(true);
    setNotice('If this account exists, a one-time code is on its way.');
  };

  const submitCode = (event: React.FormEvent) => {
    event.preventDefault();
    if (code.length < 4) {
      setNotice('Enter the code from your email to continue.');
      return;
    }
    setNotice('Code verification is waiting for the secure sign-in service to connect.');
  };

  return (
    <main className="paper-grid flex min-h-[100dvh] items-center justify-center bg-background px-5 py-8" data-testid="page-login">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-[var(--shadow-lg)] md:grid-cols-[.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground md:block lg:p-14">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[32px] border-sidebar-primary/10" />
          <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full border-[24px] border-sidebar-primary/10" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><KeyRound className="h-5 w-5" /></span><span className="display text-2xl">Haven</span></div>
            <div className="mt-auto max-w-sm"><p className="eyebrow text-sidebar-primary">A place for the important things</p><h1 className="display mt-5 text-5xl leading-[1.04]">Make room for a little less to remember.</h1><p className="mt-6 text-sm leading-7 text-primary-foreground/60">Your documents, gathered with care. Available when you need them, quiet when you don’t.</p><div className="mt-9 flex items-center gap-2 text-xs text-primary-foreground/55"><ShieldCheck className="h-4 w-4 text-sidebar-primary" /> Persistent session protection</div></div>
          </div>
        </div>
        <div className="p-7 sm:p-12 lg:p-16">
          <div className="flex items-center gap-3 md:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><KeyRound className="h-4 w-4" /></span><span className="display text-xl">Haven</span></div>
          <div className="mt-12 max-w-md md:mt-4">
            <p className="eyebrow text-accent">Welcome back</p>
            <h2 className="display mt-3 text-4xl" data-testid="heading-login">Come back to your calm.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in with a one-time code. No password to remember.</p>
            {!sent ? <form className="mt-9 space-y-5" onSubmit={submitEmail} data-testid="form-login-email"><label className="block space-y-2 text-sm font-semibold">Email address<div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-12 pl-10" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" data-testid="input-login-email" /></div></label><Button className="h-12 w-full" type="submit" data-testid="button-send-code">Send one-time code <ArrowRight className="h-4 w-4" /></Button></form> : <form className="mt-9 space-y-5" onSubmit={submitCode} data-testid="form-login-code"><div className="rounded-xl bg-secondary p-4 text-sm text-primary"><div className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" /> Code requested for <span className="font-semibold">{email}</span></div></div><label className="block space-y-2 text-sm font-semibold">One-time code<Input className="h-12 text-center font-mono text-lg tracking-[.35em]" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="000000" data-testid="input-login-code" /></label><Button className="h-12 w-full" type="submit" data-testid="button-verify-code">Enter Haven <ArrowRight className="h-4 w-4" /></Button><button type="button" className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground" onClick={() => { setSent(false); setNotice(''); }} data-testid="button-change-email">Use a different email</button></form>}
            {notice && <p className="mt-5 rounded-xl border border-border bg-background px-4 py-3 text-sm leading-5 text-muted-foreground" data-testid="status-login-notice">{notice}</p>}
            <div className="mt-12 flex items-start gap-3 border-t border-border pt-5"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><p className="text-xs leading-5 text-muted-foreground">Haven keeps your session persistent so returning to your vault feels effortless. You can sign out any time.</p></div>
            {session.error && <button className="mt-5 text-xs font-semibold text-accent hover:underline" onClick={() => void session.refetch()} data-testid="button-retry-session">Check session again</button>}
          </div>
        </div>
      </div>
    </main>
  );
}