import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { KeyRound, ShieldCheck, Lock, Mail, User as UserIcon, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useGetSession, getGetSessionQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';

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
      if (!res.ok) { setError(String(data.error ?? 'Login failed. Check your credentials.')); return; }
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

  // ── Signup step 2: verify OTP ─────────────────────────────────────────────
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

  // ── Forgot password step 1 ────────────────────────────────────────────────
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

  // ── Forgot password step 2 ────────────────────────────────────────────────
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
    <main className="relative flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8 sm:px-6 lg:px-8" data-testid="page-login">
      {/* Top Absolute Controls */}
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-lg md:grid-cols-[1fr_1.15fr]">
        
        {/* Left Hero Panel (Desktop) */}
        <div className="relative hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground md:flex lg:p-14">
          <div className="relative z-10 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-md">
              <KeyRound className="h-6 w-6" />
            </span>
            <span className="display-title text-2xl font-extrabold text-sidebar-foreground">Haven</span>
          </div>

          <div className="relative z-10 my-auto py-8">
            <span className="eyebrow-text text-sidebar-primary font-bold">Your private document space</span>
            <h1 className="display-title mt-4 text-4xl leading-tight font-extrabold text-sidebar-foreground lg:text-5xl">
              Everything important, in one quiet place.
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-sidebar-foreground/70">
              Keep sensitive papers, contracts, and credentials encrypted and easily accessible whenever you need them.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-sidebar-foreground/80">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>AES-256-GCM encrypted credential vault</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-sidebar-foreground/80">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Isolated document index and Drive integration</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-sidebar-foreground/80">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Private &amp; accessible across all devices</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-xs text-sidebar-foreground/50">
            <ShieldCheck className="h-4 w-4 text-sidebar-primary" />
            <span>Encrypted Session • Zero Data Sharing</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
          {/* Mobile Brand Header */}
          <div className="flex items-center justify-between gap-3 md:hidden mb-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <KeyRound className="h-5 w-5" />
              </span>
              <span className="display-title text-2xl font-bold">Haven</span>
            </div>
            <Link href="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground">← Home</Link>
          </div>

          <div className="mx-auto w-full max-w-md">
            {/* Tab Switcher for Login / Signup */}
            {(mode === 'login' || mode === 'signup') && (
              <div className="mb-8 flex rounded-2xl border border-border bg-muted/60 p-1.5">
                <button
                  type="button"
                  onClick={() => goToMode('login')}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-150 min-h-[40px] ${
                    mode === 'login' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => goToMode('signup')}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-150 min-h-[40px] ${
                    mode === 'signup' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* ── Sign In ── */}
            {mode === 'login' && (
              <>
                <div className="mb-6">
                  <h2 className="display-title text-3xl font-extrabold text-foreground" data-testid="heading-login">
                    Welcome back
                  </h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">Sign in to access your document vault.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4" data-testid="form-login">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        className="pl-10"
                        data-testid="input-email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        className="pl-10"
                        data-testid="input-password"
                      />
                    </div>
                  </div>

                  {error && <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm font-medium text-destructive">{error}</p>}
                  {info && <p className="rounded-xl bg-secondary px-3.5 py-2.5 text-sm font-medium text-primary">{info}</p>}

                  <Button type="submit" className="w-full text-base" disabled={loading} data-testid="button-login">
                    {loading ? 'Signing in…' : 'Sign in to Haven'} <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => goToMode('forgot')}
                      className="text-xs font-semibold text-muted-foreground hover:text-accent focus-visible:outline-none focus-visible:underline"
                      data-testid="link-forgot-password"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ── Signup ── */}
            {mode === 'signup' && (
              <>
                <div className="mb-6">
                  <h2 className="display-title text-3xl font-extrabold text-foreground" data-testid="heading-signup">
                    Create your vault
                  </h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">We'll send a 6-digit verification code to your email.</p>
                </div>
                <form onSubmit={handleSignupRequest} className="space-y-4" data-testid="form-signup">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Morgan"
                        required
                        autoComplete="name"
                        className="pl-10"
                        data-testid="input-name"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        className="pl-10"
                        data-testid="input-email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Choose Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="pl-10"
                        data-testid="input-password"
                      />
                    </div>
                  </div>

                  {error && <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm font-medium text-destructive">{error}</p>}

                  <Button type="submit" className="w-full text-base" disabled={loading} data-testid="button-signup">
                    {loading ? 'Sending code…' : 'Continue to Verification'} <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </form>
              </>
            )}

            {/* ── Signup Verify OTP ── */}
            {mode === 'signup-verify' && (
              <>
                <div className="mb-6">
                  <h2 className="display-title text-3xl font-extrabold text-foreground" data-testid="heading-signup-verify">
                    Check your email
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    We sent a code to <strong className="text-foreground font-semibold">{email}</strong>. Enter it below to complete registration.
                  </p>
                </div>
                {info && <p className="mb-4 rounded-xl bg-secondary px-3.5 py-2.5 text-sm font-medium text-primary">{info}</p>}
                <form onSubmit={handleSignupVerify} className="space-y-4" data-testid="form-signup-verify">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Verification Code</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="123456"
                      required
                      autoComplete="one-time-code"
                      className="font-mono text-center text-xl letter-spacing-widest h-12"
                      data-testid="input-code"
                    />
                  </div>
                  {error && <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm font-medium text-destructive">{error}</p>}
                  <Button type="submit" className="w-full text-base" disabled={loading} data-testid="button-signup-verify">
                    {loading ? 'Verifying…' : 'Verify & Create Account'}
                  </Button>
                  <button type="button" onClick={() => goToMode('signup')} className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-accent">
                    ← Back to edit email
                  </button>
                </form>
              </>
            )}

            {/* ── Forgot Password Request ── */}
            {mode === 'forgot' && (
              <>
                <div className="mb-6">
                  <h2 className="display-title text-3xl font-extrabold text-foreground">Reset password</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">Enter your email address to receive a password reset code.</p>
                </div>
                <form onSubmit={handleForgotRequest} className="space-y-4" data-testid="form-forgot">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        className="pl-10"
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                  {error && <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm font-medium text-destructive">{error}</p>}
                  <Button type="submit" className="w-full text-base" disabled={loading}>
                    {loading ? 'Sending…' : 'Send Reset Code'}
                  </Button>
                  <button type="button" onClick={() => goToMode('login')} className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-accent">
                    ← Back to Sign In
                  </button>
                </form>
              </>
            )}

            {/* ── Forgot Password Verify ── */}
            {mode === 'forgot-verify' && (
              <>
                <div className="mb-6">
                  <h2 className="display-title text-3xl font-extrabold text-foreground">Set new password</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Enter the code sent to <strong className="text-foreground font-semibold">{email}</strong> and your new password.
                  </p>
                </div>
                {info && <p className="mb-4 rounded-xl bg-secondary px-3.5 py-2.5 text-sm font-medium text-primary">{info}</p>}
                <form onSubmit={handleForgotVerify} className="space-y-4" data-testid="form-forgot-verify">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reset Code</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="123456"
                      required
                      autoComplete="one-time-code"
                      className="font-mono text-center text-xl tracking-widest h-12"
                      data-testid="input-code"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Password</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      data-testid="input-new-password"
                    />
                  </div>
                  {error && <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm font-medium text-destructive">{error}</p>}
                  <Button type="submit" className="w-full text-base" disabled={loading}>
                    {loading ? 'Updating…' : 'Update Password'}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
