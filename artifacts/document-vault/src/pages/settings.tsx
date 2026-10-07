import { useState } from 'react';
import { Check, Clipboard, KeyRound, LockKeyhole, LogOut, Mail, MessageSquare, Send, ShieldCheck } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSessionQueryKey, useGetSession, useLogout } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { initials } from '@/components/vault-ui';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        checked ? 'bg-foreground' : 'bg-muted'
      }`}
      onClick={() => onChange(!checked)}
      data-testid={`toggle-${label.toLowerCase().replaceAll(' ', '-')}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: session, isLoading: sessionLoading, error: sessionError, refetch } = useGetSession();
  const logout = useLogout();
  const [persistent, setPersistent] = useState(true);
  const [activity, setActivity] = useState(true);
  const [notice, setNotice] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setFeedbackStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: feedback.trim() }),
      });
      if (!res.ok) throw new Error();
      setFeedbackStatus('sent');
      setFeedback('');
    } catch {
      setFeedbackStatus('error');
    }
  };

  const signOut = () =>
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: getGetSessionQueryKey() });
        setLocation('/');
      },
    });

  const copyEmail = () => {
    if (session?.user?.email) void navigator.clipboard?.writeText(session.user.email);
    setNotice('Account email copied to clipboard.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-8 lg:py-8 space-y-6" data-testid="page-settings">
      {/* Header Banner */}
      <div className="border-b border-border/60 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl" data-testid="heading-settings">
          Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Manage your account profile, preferences, and session controls.
        </p>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-xs font-semibold text-foreground" data-testid="status-settings-notice">
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {notice}
        </div>
      )}

      <div className="space-y-6">
        {/* Account Profile Card */}
        <section className="vault-card-surface overflow-hidden rounded-xl border border-border bg-card" data-testid="section-account-settings">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-bold text-foreground">Account profile</h2>
          </div>

          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-foreground border border-border" data-testid="avatar-settings">
                {initials(session?.user?.name)}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground" data-testid="text-account-name">
                  {session?.user?.name || 'Your account'}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span data-testid="text-account-email">{session?.user?.email || 'Protected session'}</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={copyEmail} data-testid="button-copy-email">
              <Clipboard className="h-3.5 w-3.5 mr-1" /> Copy email
            </Button>
          </div>
        </section>

        {/* Session & Privacy */}
        <section className="vault-card-surface rounded-xl border border-border bg-card" data-testid="section-session-settings">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-bold text-foreground">Session &amp; privacy controls</h2>
          </div>

          <div className="divide-y divide-border/60">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-xs font-bold text-foreground">Stay signed in</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Keep your session active on this trusted browser until explicit sign out.
                </p>
              </div>
              <Toggle
                checked={persistent}
                onChange={(value) => {
                  setPersistent(value);
                  setNotice(value ? 'Persistent session enabled.' : 'Persistent session disabled.');
                }}
                label="Keep me signed in"
              />
            </div>

            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-xs font-bold text-foreground">Account activity log</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Log your own account logins and security events in your private history.
                </p>
              </div>
              <Toggle
                checked={activity}
                onChange={(value) => {
                  setActivity(value);
                  setNotice(value ? 'Activity logging enabled.' : 'Activity logging paused.');
                }}
                label="Account activity"
              />
            </div>

            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-xs font-bold text-foreground">Vault encryption status</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  AES-256-GCM authenticated encryption enabled for credentials.
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400" data-testid="status-secure-sign-in">
                <ShieldCheck className="h-4 w-4" /> Active
              </span>
            </div>
          </div>
        </section>

        {/* Feedback */}
        <section className="vault-card-surface overflow-hidden rounded-xl border border-border bg-card" data-testid="section-feedback-settings">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-bold text-foreground">Send feedback</h2>
          </div>

          <div className="p-5">
            {feedbackStatus === 'sent' ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-5 w-5" />
                </span>
                <p className="text-xs font-semibold text-foreground">Message received</p>
                <p className="text-[11px] text-muted-foreground">We will reply to <strong>{session?.user?.email}</strong> if needed.</p>
                <button onClick={() => setFeedbackStatus('idle')} className="mt-1 text-xs text-foreground underline font-medium">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submitFeedback} className="space-y-3">
                <Textarea
                  value={feedback}
                  onChange={(e) => { setFeedback(e.target.value); if (feedbackStatus === 'error') setFeedbackStatus('idle'); }}
                  placeholder="What's on your mind? A bug, a suggestion, or a question…"
                  maxLength={2000}
                  className="min-h-[100px] resize-none rounded-lg text-xs"
                  data-testid="input-feedback"
                />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] text-muted-foreground">{feedback.length} / 2000</span>
                  <div className="flex items-center gap-2">
                    {feedbackStatus === 'error' && (
                      <p className="text-xs text-destructive">Failed to send. Please try again.</p>
                    )}
                    <Button
                      type="submit"
                      size="sm"
                      disabled={feedbackStatus === 'sending' || !feedback.trim()}
                      data-testid="button-send-feedback"
                    >
                      <Send className="h-3.5 w-3.5 mr-1" />
                      {feedbackStatus === 'sending' ? 'Sending…' : 'Send message'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* End Session */}
        <section className="rounded-xl border border-destructive/30 bg-card p-5" data-testid="section-signout-settings">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <LogOut className="h-4 w-4 text-destructive" />
                <h2 className="text-sm font-bold text-destructive">Sign out</h2>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                End your active session on this device. Your data remains safely encrypted.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full sm:w-auto"
              onClick={signOut}
              disabled={logout.isPending}
              data-testid="button-settings-logout"
            >
              {logout.isPending ? 'Signing out…' : 'Sign out'}
            </Button>
          </div>
        </section>
      </div>

      {(sessionLoading || sessionError) && (
        <div className="mt-4 text-xs text-muted-foreground">
          {sessionLoading ? 'Loading account details…' : <button onClick={() => void refetch()} className="font-semibold text-foreground underline" data-testid="button-settings-retry">Retry loading account</button>}
        </div>
      )}
    </div>
  );
}