import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useGetSession, getGetSessionQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Mode = 'login' | 'signup' | 'signup-verify' | 'forgot' | 'forgot-verify';

export default function Login() {
  const [, setLocation] = useLocation();
  const session = useGetSession();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session.data?.authenticated) setLocation('/dashboard');
  }, [session.data, setLocation]);

  const reset = () => { setError(''); setInfo(''); };

  const goToMode = (m: Mode) => { reset(); setCode(''); setMode(m); };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) { setError(String(data.error ?? 'Login failed.')); return; }
      await session.refetch();
      setLocation('/dashboard');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  // ── Signup step 1: request OTP ─────────────────────────────────────────────
  const handleSignupRequest = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true);
    try {
      const res = await fetch('/api/auth/signup/request', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) { setError(String(data.error ?? 'Sign up failed.')); return; }
      queryClient.setQueryData(getGetSessionQueryKey(), { authenticated: false, user: null });
      setInfo('A 6-digit code has been sent to your email.');
      setMode('signup-verify');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  // ── Signup step 2: verify OTP → account created + logged in ───────────────
  const handleSignupVerify = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true);
    try {
      const res = await fetch('/api/auth/signup/verify', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) { setError(String(data.error ?? 'Verification failed.')); return; }
      await session.refetch();
      setLocation('/dashboard');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  // ── Forgot password step 1: request OTP ───────────────────────────────────
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setInfo('If that email exists, a reset code has been sent.');
        setMode('forgot-verify');
      } else setError('Could not send code. Try again.');
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  // ── Forgot password step 2: verify OTP + new password ─────────────────────
  const handleForgotVerify = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) { setError(String(data.error ?? 'Verification failed.')); return; }
      setInfo('Password updated! You can now sign in.');
      goToMode('login');
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

            {/* Tab switcher — only on login/signup */}
            {(mode === 'login' || mode === 'signup') && (
              <div className="mb-8 flex rounded-xl border border-border bg-muted/50 p-1">
                {(['login', 'signup'] as const).map((m) => (
                  <button key={m} type="button" onClick={() => goToMode(m)}
                    className={`flex flex-1 items-center justify-center rounded-lg py-2 text-sm font-semibold transition-colors ${mode === m ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    {m === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>
            )}

            {/* ── Login ── */}
            {mode === 'login' && (
              <>
                <h2 className="display text-3xl" data-testid="heading-login">Welcome back.</h2>
                <form onSubmit={handleLogin} className="mt-7 space-y-4" data-testid="form-login">
                  <label className="block space-y-1.5 text-sm font-medium">Email
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" data-testid="input-email" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">Password
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" data-testid="input-password" />
                  </label>
                  {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                  {info && <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-primary">{info}</p>}
                  <Button type="submit" className="h-11 w-full" disabled={loading} data-testid="button-login">{loading ? 'Signing in…' : 'Sign in'}</Button>
                  <button type="button" onClick={() => goToMode('forgot')} className="w-full text-center text-xs text-muted-foreground hover:text-accent" data-testid="link-forgot-password">
                    Forgot password?
                  </button>
                </form>
              </>
            )}

            {/* ── Signup step 1 ── */}
            {mode === 'signup' && (
              <>
                <h2 className="display text-3xl" data-testid="heading-signup">Create your vault.</h2>
                <p className="mt-2 text-sm text-muted-foreground">We'll send a verification code to your email.</p>
                <form onSubmit={handleSignupRequest} className="mt-7 space-y-4" data-testid="form-signup">
                  <label className="block space-y-1.5 text-sm font-medium">Full name
                    <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required autoComplete="name" data-testid="input-name" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">Email
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" data-testid="input-email" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">Password
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} autoComplete="new-password" data-testid="input-password" />
                  </label>
                  {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="h-11 w-full" disabled={loading} data-testid="button-signup">{loading ? 'Sending code…' : 'Continue'}</Button>
                </form>
              </>
            )}

            {/* ── Signup step 2: verify OTP ── */}
            {mode === 'signup-verify' && (
              <>
                <h2 className="display text-3xl" data-testid="heading-signup-verify">Check your email.</h2>
                <p className="mt-2 text-sm text-muted-foreground">We sent a 6-digit code to <strong>{email}</strong>. Enter it below to create your account.</p>
                {info && <p className="mt-3 rounded-lg bg-secondary px-3 py-2 text-sm text-primary">{info}</p>}
                <form onSubmit={handleSignupVerify} className="mt-7 space-y-4" data-testid="form-signup-verify">
                  <label className="block space-y-1.5 text-sm font-medium">Verification code
                    <Input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" required autoComplete="one-time-code" data-testid="input-code" />
                  </label>
                  {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="h-11 w-full" disabled={loading} data-testid="button-signup-verify">{loading ? 'Verifying…' : 'Verify & create account'}</Button>
                  <button type="button" onClick={() => goToMode('signup')} className="w-full text-center text-xs text-muted-foreground hover:text-accent">← Back</button>
                </form>
              </>
            )}

            {/* ── Forgot password step 1 ── */}
            {mode === 'forgot' && (
              <>
                <h2 className="display text-3xl">Reset password.</h2>
                <p className="mt-2 text-sm text-muted-foreground">Enter your email and we'll send a reset code.</p>
                <form onSubmit={handleForgotRequest} className="mt-7 space-y-4" data-testid="form-forgot">
                  <label className="block space-y-1.5 text-sm font-medium">Email
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" data-testid="input-email" />
                  </label>
                  {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="h-11 w-full" disabled={loading}>{loading ? 'Sending…' : 'Send reset code'}</Button>
                  <button type="button" onClick={() => goToMode('login')} className="w-full text-center text-xs text-muted-foreground hover:text-accent">← Back to sign in</button>
                </form>
              </>
            )}

            {/* ── Forgot password step 2 ── */}
            {mode === 'forgot-verify' && (
              <>
                <h2 className="display text-3xl">Set new password.</h2>
                <p className="mt-2 text-sm text-muted-foreground">Enter the code sent to <strong>{email}</strong> and choose a new password.</p>
                {info && <p className="mt-3 rounded-lg bg-secondary px-3 py-2 text-sm text-primary">{info}</p>}
                <form onSubmit={handleForgotVerify} className="mt-7 space-y-4" data-testid="form-forgot-verify">
                  <label className="block space-y-1.5 text-sm font-medium">Reset code
                    <Input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" required autoComplete="one-time-code" data-testid="input-code" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">New password
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} autoComplete="new-password" data-testid="input-new-password" />
                  </label>
                  {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="h-11 w-full" disabled={loading}>{loading ? 'Updating…' : 'Reset password'}</Button>
                  <button type="button" onClick={() => goToMode('forgot')} className="w-full text-center text-xs text-muted-foreground hover:text-accent">Resend code</button>
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
