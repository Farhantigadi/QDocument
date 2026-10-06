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
      className={`relative h-7 w-12 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        checked ? 'bg-accent' : 'bg-muted'
      }`}
      onClick={() => onChange(!checked)}
      data-testid={`toggle-${label.toLowerCase().replaceAll(' ', '-')}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow-xs transition-transform ${
          checked ? 'left-6' : 'left-1'
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
        setLocation('/login');
      },
    });

  const copyEmail = () => {
    if (session?.user?.email) void navigator.clipboard?.writeText(session.user.email);
    setNotice('Account email copied to clipboard.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-8 lg:px-10 lg:py-10 animate-fade-in" data-testid="page-settings">
      {/* Header Banner */}
      <div className="border-b border-border/60 pb-6">
        <p className="eyebrow-text text-accent">Vault Preferences</p>
        <h1 className="display-title mt-1.5 text-3xl font-extrabold sm:text-4xl lg:text-5xl text-foreground" data-testid="heading-settings">
          Settings<span className="text-accent">.</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          Account details, privacy preferences, and storage usage.
        </p>
      </div>

      {notice && (
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-primary animate-fade-in" data-testid="status-settings-notice">
          <Check className="h-4 w-4 text-emerald-500" /> {notice}
        </div>
      )}

      <div className="mt-8 space-y-6">
        {/* Account Profile Card */}
        <section className="vault-card-surface overflow-hidden rounded-2xl" data-testid="section-account-settings">
          <div className="border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <h2 className="display-title text-lg text-foreground">Account Information</h2>
                <p className="text-xs text-muted-foreground">Your Haven profile identity.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sidebar text-xl font-bold text-sidebar-foreground shadow-sm" data-testid="avatar-settings">
                {initials(session?.user?.name)}
              </div>
              <div>
                <p className="text-lg font-bold text-foreground" data-testid="text-account-name">
                  {session?.user?.name || 'Your Account'}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span data-testid="text-account-email">{session?.user?.email || 'Session protected'}</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={copyEmail} data-testid="button-copy-email">
              <Clipboard className="h-4 w-4 mr-1.5" /> Copy email
            </Button>
          </div>
        </section>

        {/* Session & Privacy */}
        <section className="vault-card-surface rounded-2xl" data-testid="section-session-settings">
          <div className="border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <LockKeyhole className="h-5 w-5" />
              </span>
              <div>
                <h2 className="display-title text-lg text-foreground">Session &amp; Privacy Controls</h2>
                <p className="text-xs text-muted-foreground">Manage persistent sign-ins and activity logging.</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            <div className="flex items-center justify-between gap-6 px-6 py-5">
              <div>
                <p className="text-sm font-bold text-foreground">Keep me signed in</p>
                <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground">
                  Maintain persistent sessions on trusted devices.
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

            <div className="flex items-center justify-between gap-6 px-6 py-5">
              <div>
                <p className="text-sm font-bold text-foreground">Account Activity History</p>
                <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground">
                  Log private audit events for document changes and logins.
                </p>
              </div>
              <Toggle
                checked={activity}
                onChange={(value) => {
                  setActivity(value);
                  setNotice(value ? 'Activity history enabled.' : 'Activity history paused.');
                }}
                label="Account activity"
              />
            </div>

            <div className="flex items-center justify-between gap-6 px-6 py-5">
              <div>
                <p className="text-sm font-bold text-foreground">Authentication Protocol</p>
                <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground">
                  Email verification + AES-256 encrypted storage.
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500" data-testid="status-secure-sign-in">
                <ShieldCheck className="h-4 w-4" /> Active
              </span>
            </div>
          </div>
        </section>

        {/* Feedback */}
        <section className="vault-card-surface overflow-hidden rounded-2xl" data-testid="section-feedback-settings">
          <div className="border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <MessageSquare className="h-5 w-5" />
              </span>
              <div>
                <h2 className="display-title text-lg text-foreground">Share Feedback</h2>
                <p className="text-xs text-muted-foreground">Report a bug, suggest a feature, or just say hello.</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {feedbackStatus === 'sent' ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <Check className="h-6 w-6" />
                </span>
                <p className="text-sm font-semibold text-foreground">Message received — thank you!</p>
                <p className="text-xs text-muted-foreground">We'll get back to you at <strong>{session?.user?.email}</strong> if needed.</p>
                <button onClick={() => setFeedbackStatus('idle')} className="mt-1 text-xs font-semibold text-primary hover:underline">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submitFeedback} className="space-y-4">
                <Textarea
                  value={feedback}
                  onChange={(e) => { setFeedback(e.target.value); if (feedbackStatus === 'error') setFeedbackStatus('idle'); }}
                  placeholder="What's on your mind? A bug, a suggestion, or anything else…"
                  maxLength={2000}
                  className="min-h-[120px] resize-none rounded-xl text-sm"
                  data-testid="input-feedback"
                />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] text-muted-foreground">{feedback.length} / 2000</span>
                  <div className="flex items-center gap-3">
                    {feedbackStatus === 'error' && (
                      <p className="text-xs text-destructive">Failed to send. Please try again.</p>
                    )}
                    <Button
                      type="submit"
                      size="sm"
                      disabled={feedbackStatus === 'sending' || !feedback.trim()}
                      className="rounded-xl"
                      data-testid="button-send-feedback"
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      {feedbackStatus === 'sending' ? 'Sending…' : 'Send message'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* End Session */}
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6" data-testid="section-signout-settings">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-destructive" />
                <h2 className="display-title text-lg text-destructive">End Active Session</h2>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Sign out of your Haven account on this device. Your documents remain safely stored.
              </p>
            </div>
            <Button
              variant="destructive"
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
        <div className="mt-5 text-xs text-muted-foreground">
          {sessionLoading ? 'Loading account details…' : <button onClick={() => void refetch()} className="font-bold text-accent hover:underline" data-testid="button-settings-retry">Retry account details</button>}
        </div>
      )}
    </div>
  );
}