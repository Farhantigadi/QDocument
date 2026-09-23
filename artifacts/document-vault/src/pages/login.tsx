import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useGetSession } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Mode = 'login' | 'signup' | 'forgot' | 'verify';

export default function Login() {
  const [, setLocation] = useLocation();
  const session = useGetSession();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session.data?.authenticated) setLocation('/dashboard');
  }, [session.data, setLocation]);

  const reset = () => { setError(''); setInfo(''); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'include',
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) { setError(String(data.error ?? 'Login failed.')); return; }
      await session.refetch();
      setLocation('/dashboard');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
        credentials: 'include',
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) { setError(String(data.error ?? 'Sign up failed.')); return; }
      await session.refetch();
      setLocation('/dashboard');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) { setInfo('Check your email (or console in dev) for the 6-digit code.'); setMode('verify'); }
      else setError('Could not send code. Try again.');
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: otp.trim(), newPassword }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) { setError(String(data.error ?? 'Verification failed.')); return; }
      setInfo('Password updated! Please sign in.');
      setMode('login');
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <main className="paper-grid flex min-h-[100dvh] items-center justify-center bg-background px-5 py-8" data-testid="page-login">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-[var(--shadow-lg)] md:grid-cols-[.9fr_1.1fr]">
        {/* Left panel */}
        <div className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground md:block lg:p-14">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[32px] border-sidebar-primary/10" />
          <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full border-[24px] border-sidebar-primary/10" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><KeyRound className="h-5 w-5" /></span>
              <span className="display text-2xl">Haven</span>
            </div>
            <div className="mt-auto max-w-sm">
              <p className="eyebrow text-sidebar-primary">Your documents &amp; passwords</p>
              <h1 className="display mt-5 text-5xl leading-[1.04]">Everything important, in one quiet place.</h1>
              <p className="mt-6 text-sm leading-7 text-primary-foreground/60">Store documents, organize links, and keep passwords encrypted — all in your private vault.</p>
              <div className="mt-9 flex items-center gap-2 text-xs text-primary-foreground/55">
                <ShieldCheck className="h-4 w-4 text-sidebar-primary" /> AES-256-GCM encrypted
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="p-7 sm:p-12 lg:p-16">
          <div className="flex items-center gap-3 md:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><KeyRound className="h-4 w-4" /></span>
            <span className="display text-xl">Haven</span>
          </div>

          <div className="mt-10 max-w-md md:mt-4">
            {/* Mode tabs */}
            {(mode === 'login' || mode === 'signup') && (
              <div className="mb-8 flex rounded-xl border border-border bg-muted/50 p-1">
                {(['login', 'signup'] as const).map((m) => (
                  <button key={m} type="button" onClick={() => { setMode(m); reset(); }}
                    className={`flex flex-1 items-center justify-center rounded-lg py-2 text-sm font-semibold transition-colors ${mode === m ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    {m === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>
            )}

            {mode === 'login' && (
              <>
                <h2 className="display text-3xl" data-testid="heading-login">Welcome back.</h2>
                <form onSubmit={handleLogin} className="mt-7 space-y-4" data-testid="form-login">
                  <label className="block space-y-1.5 text-sm font-medium">Email
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required data-testid="input-email" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">Password
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required data-testid="input-password" />
                  </label>
                  {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                  {info && <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-primary">{info}</p>}
                  <Button type="submit" className="h-11 w-full" disabled={loading} data-testid="button-login">{loading ? 'Signing in…' : 'Sign in'}</Button>
                  <button type="button" onClick={() => { setMode('forgot'); reset(); }} className="w-full text-center text-xs text-muted-foreground hover:text-accent" data-testid="link-forgot-password">
                    Forgot password?
                  </button>
                </form>
              </>
            )}

            {mode === 'signup' && (
              <>
                <h2 className="display text-3xl" data-testid="heading-signup">Create your vault.</h2>
                <form onSubmit={handleSignup} className="mt-7 space-y-4" data-testid="form-signup">
                  <label className="block space-y-1.5 text-sm font-medium">Full name
                    <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required data-testid="input-name" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">Email
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required data-testid="input-email" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">Password
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a strong password" required data-testid="input-password" />
                  </label>
                  {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="h-11 w-full" disabled={loading} data-testid="button-signup">{loading ? 'Creating account…' : 'Create account'}</Button>
                </form>
              </>
            )}

            {mode === 'forgot' && (
              <>
                <h2 className="display text-3xl">Reset password.</h2>
                <p className="mt-2 text-sm text-muted-foreground">Enter your email and we'll send a 6-digit code.</p>
                <form onSubmit={handleForgot} className="mt-7 space-y-4" data-testid="form-forgot">
                  <label className="block space-y-1.5 text-sm font-medium">Email
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required data-testid="input-email" />
                  </label>
                  {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="h-11 w-full" disabled={loading}>{loading ? 'Sending…' : 'Send code'}</Button>
                  <button type="button" onClick={() => { setMode('login'); reset(); }} className="w-full text-center text-xs text-muted-foreground hover:text-accent">Back to sign in</button>
                </form>
              </>
            )}

            {mode === 'verify' && (
              <>
                <h2 className="display text-3xl">Enter your code.</h2>
                {info && <p className="mt-2 text-sm text-accent">{info}</p>}
                <form onSubmit={handleVerify} className="mt-7 space-y-4" data-testid="form-verify">
                  <label className="block space-y-1.5 text-sm font-medium">6-digit code
                    <Input type="text" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" required data-testid="input-otp" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">New password
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" required data-testid="input-new-password" />
                  </label>
                  {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="h-11 w-full" disabled={loading}>{loading ? 'Verifying…' : 'Reset password'}</Button>
                  <button type="button" onClick={() => { setMode('forgot'); reset(); }} className="w-full text-center text-xs text-muted-foreground hover:text-accent">Resend code</button>
                </form>
              </>
            )}

            <div className="mt-8 flex items-start gap-3 border-t border-border pt-6">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-xs leading-5 text-muted-foreground">
                Passwords are encrypted with AES-256-GCM. Sessions are permanent until you sign out.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
