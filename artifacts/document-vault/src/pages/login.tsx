import { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useGetSession, getGetSessionQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';

type Mode = 'login' | 'signup' | 'signup-verify' | 'forgot' | 'forgot-verify';

function OtpInput({ value, onChange, disabled }: { value: string; onChange: (code: string) => void; disabled?: boolean }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const getDigits = () => {
    const chars = value.split('').slice(0, 6);
    while (chars.length < 6) chars.push('');
    return chars;
  };

  const digits = getDigits();

  const handleDigitChange = (index: number, val: string) => {
    const raw = val.replace(/\D/g, '');
    if (!raw) {
      const next = [...digits];
      next[index] = '';
      onChange(next.join(''));
      return;
    }
    const char = raw[raw.length - 1];
    const next = [...digits];
    next[index] = char;
    const newCode = next.join('');
    onChange(newCode);

    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste} data-testid="container-otp">
      {digits.map((digit, idx) => (
        <Input
          key={idx}
          ref={(el) => { inputRefs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleDigitChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          className="h-12 w-11 sm:w-12 text-center text-lg font-semibold font-mono border-border bg-background focus:ring-2 focus:ring-ring"
          data-testid={idx === 0 ? "input-code" : `input-code-${idx}`}
          aria-label={`Digit ${idx + 1} of 6`}
        />
      ))}
    </div>
  );
}

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
      if (!res.ok) { setError(String(data.error ?? 'Login failed. Please check your credentials.')); return; }
      await session.refetch();
      setLocation('/dashboard');
    } catch { setError('Network connection error. Please try again.'); }
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
      if (!res.ok) { setError(String(data.error ?? 'Account creation failed.')); return; }
      queryClient.setQueryData(getGetSessionQueryKey(), { authenticated: false, user: null });
      setInfo('A 6-digit code has been sent to your email.');
      setMode('signup-verify');
    } catch { setError('Network connection error. Please try again.'); }
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
      if (!res.ok) { setError(String(data.error ?? 'Invalid verification code. Please check and try again.')); return; }
      await session.refetch();
      setLocation('/dashboard');
    } catch { setError('Network connection error. Please try again.'); }
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
        setInfo('A reset code has been sent to your email.');
        setMode('forgot-verify');
      } else setError('Could not send reset code. Please check your email.');
    } catch { setError('Network connection error.'); }
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
      if (!res.ok) { setError(String(data.error ?? 'Verification failed. Check the code and try again.')); return; }
      setInfo('Password updated successfully. You can now sign in.');
      goToMode('login');
    } catch { setError('Network connection error.'); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-[100dvh] flex flex-col justify-between bg-background px-4 py-8 sm:px-6" data-testid="page-login">
      {/* Top Header */}
      <header className="mx-auto w-full max-w-md flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <KeyRound className="h-4 w-4" />
          </span>
          <span className="text-base font-bold tracking-tight text-foreground">Haven</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Centered Auth Form */}
      <div className="mx-auto w-full max-w-md my-auto py-8">
        <div className="vault-card-surface rounded-2xl p-6 sm:p-8 bg-card border border-border">
          
          {/* Mode Switcher Tabs */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="mb-6 flex rounded-xl border border-border bg-muted/50 p-1">
              <button
                type="button"
                onClick={() => goToMode('login')}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors min-h-[36px] ${
                  mode === 'login' ? 'bg-card text-foreground border border-border/60 shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => goToMode('signup')}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors min-h-[36px] ${
                  mode === 'signup' ? 'bg-card text-foreground border border-border/60 shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Create account
              </button>
            </div>
          )}

          {/* ── Sign In ── */}
          {mode === 'login' && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-foreground" data-testid="heading-login">
                  Sign in to Haven
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">Access your encrypted documents and passwords.</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4" data-testid="form-login">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Password</label>
                    <button
                      type="button"
                      onClick={() => goToMode('forgot')}
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      data-testid="link-forgot-password"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    data-testid="input-password"
                  />
                </div>

                {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}
                {info && <p className="rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-foreground">{info}</p>}

                <Button type="submit" className="w-full text-sm font-semibold" disabled={loading} data-testid="button-login">
                  {loading ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            </>
          )}

          {/* ── Signup ── */}
          {mode === 'signup' && (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-foreground" data-testid="heading-signup">
                    Create your account
                  </h1>
                  <span className="text-[11px] font-medium text-muted-foreground">Step 1 of 2</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">We will send a 6-digit verification code to your email.</p>
              </div>
              <form onSubmit={handleSignupRequest} className="space-y-4" data-testid="form-signup">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Full name</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    required
                    autoComplete="name"
                    data-testid="input-name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    data-testid="input-password"
                  />
                </div>

                {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}

                <Button type="submit" className="w-full text-sm font-semibold" disabled={loading} data-testid="button-signup">
                  {loading ? 'Sending code…' : 'Continue'}
                </Button>
              </form>
            </>
          )}

          {/* ── Signup Verify OTP ── */}
          {mode === 'signup-verify' && (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-foreground" data-testid="heading-signup-verify">
                    Verify your email
                  </h1>
                  <span className="text-[11px] font-medium text-muted-foreground">Step 2 of 2</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter the 6-digit code sent to <strong className="text-foreground">{email}</strong>.
                </p>
              </div>
              {info && <p className="mb-4 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-foreground">{info}</p>}
              <form onSubmit={handleSignupVerify} className="space-y-5" data-testid="form-signup-verify">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Verification code</label>
                  <OtpInput value={code} onChange={setCode} disabled={loading} />
                </div>
                {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}
                <Button type="submit" className="w-full text-sm font-semibold" disabled={loading || code.trim().length !== 6} data-testid="button-signup-verify">
                  {loading ? 'Verifying…' : 'Verify and create account'}
                </Button>
                <div className="text-center pt-1">
                  <button type="button" onClick={() => goToMode('signup')} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                    Back to edit email
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Forgot Password Request ── */}
          {mode === 'forgot' && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-foreground">Reset password</h1>
                <p className="mt-1 text-xs text-muted-foreground">Enter your email address to receive a verification code.</p>
              </div>
              <form onSubmit={handleForgotRequest} className="space-y-4" data-testid="form-forgot">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                    data-testid="input-email"
                  />
                </div>
                {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}
                <Button type="submit" className="w-full text-sm font-semibold" disabled={loading}>
                  {loading ? 'Sending code…' : 'Send reset code'}
                </Button>
                <div className="text-center pt-1">
                  <button type="button" onClick={() => goToMode('login')} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                    Back to sign in
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Forgot Password Verify ── */}
          {mode === 'forgot-verify' && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-foreground">Set new password</h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter the code sent to <strong className="text-foreground">{email}</strong> and your new password.
                </p>
              </div>
              {info && <p className="mb-4 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-foreground">{info}</p>}
              <form onSubmit={handleForgotVerify} className="space-y-4" data-testid="form-forgot-verify">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Verification code</label>
                  <OtpInput value={code} onChange={setCode} disabled={loading} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">New password</label>
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
                {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}
                <Button type="submit" className="w-full text-sm font-semibold" disabled={loading || code.trim().length !== 6}>
                  {loading ? 'Updating…' : 'Update password'}
                </Button>
                <div className="text-center pt-1">
                  <button type="button" onClick={() => goToMode('login')} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                    Back to sign in
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      </div>

      {/* Footer info */}
      <footer className="mx-auto w-full max-w-md text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>AES-256-GCM encrypted · HttpOnly session</span>
        </p>
      </footer>
    </main>
  );
}

