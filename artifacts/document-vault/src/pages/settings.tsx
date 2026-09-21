import { useState } from 'react';
import { Check, Clipboard, KeyRound, LockKeyhole, LogOut, Mail, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSessionQueryKey, useGetDashboardSummary, useGetSession, useLogout } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBytes, initials, QueryState } from '@/components/vault-ui';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <button role="switch" aria-checked={checked} aria-label={label} className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-muted'}`} onClick={() => onChange(!checked)} data-testid={`toggle-${label.toLowerCase().replaceAll(' ', '-')}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-card shadow-sm transition-transform ${checked ? 'left-6' : 'left-1'}`} /></button>;
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: session, isLoading: sessionLoading, error: sessionError, refetch } = useGetSession();
  const summary = useGetDashboardSummary();
  const logout = useLogout();
  const [persistent, setPersistent] = useState(true);
  const [activity, setActivity] = useState(true);
  const [notice, setNotice] = useState('');

  const signOut = () => logout.mutate(undefined, { onSuccess: () => { queryClient.removeQueries({ queryKey: getGetSessionQueryKey() }); setLocation('/login'); } });
  const copyEmail = () => {
    if (session?.user?.email) void navigator.clipboard?.writeText(session.user.email);
    setNotice('Account email copied.');
  };

  return (
    <div className="vault-page mx-auto max-w-[1100px] px-5 py-8 sm:px-8 lg:px-10 lg:py-11" data-testid="page-settings">
      <div><p className="eyebrow text-accent">The way Haven works for you</p><h1 className="display mt-2 text-4xl sm:text-5xl" data-testid="heading-settings">Settings<span className="text-accent">.</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">A few quiet controls for your account, privacy, and the space around your files.</p></div>
      {notice && <div className="mt-6 flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm text-primary" data-testid="status-settings-notice"><Check className="h-4 w-4" /> {notice}</div>}
      <div className="mt-9 grid gap-5">
        <section className="vault-card overflow-hidden rounded-2xl" data-testid="section-account-settings">
          <div className="border-b border-border px-5 py-5 sm:px-7"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary"><KeyRound className="h-4 w-4" /></span><div><h2 className="font-semibold">Account</h2><p className="text-xs text-muted-foreground">How Haven recognizes you.</p></div></div></div>
          <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-7"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground" data-testid="avatar-settings">{initials(session?.user?.name)}</div><div><p className="text-lg font-semibold" data-testid="text-account-name">{session?.user?.name || 'Your account'}</p><div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" /><span data-testid="text-account-email">{session?.user?.email || 'Email unavailable'}</span></div></div><Button variant="outline" onClick={copyEmail} data-testid="button-copy-email"><Clipboard className="h-4 w-4" /> Copy email</Button></div>
        </section>
        <section className="vault-card rounded-2xl" data-testid="section-session-settings">
          <div className="border-b border-border px-5 py-5 sm:px-7"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary"><LockKeyhole className="h-4 w-4" /></span><div><h2 className="font-semibold">Session & privacy</h2><p className="text-xs text-muted-foreground">Small choices that keep the space yours.</p></div></div></div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between gap-5 px-5 py-5 sm:px-7"><div><p className="text-sm font-semibold">Keep me signed in</p><p className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">Stay signed in on this trusted device so your next visit starts in your vault.</p></div><Toggle checked={persistent} onChange={(value) => { setPersistent(value); setNotice(value ? 'Persistent session enabled.' : 'Persistent session disabled.'); }} label="Keep me signed in" /></div>
            <div className="flex items-center justify-between gap-5 px-5 py-5 sm:px-7"><div><p className="text-sm font-semibold">Account activity</p><p className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">Keep a private record of sign-ins and document changes in your activity view.</p></div><Toggle checked={activity} onChange={(value) => { setActivity(value); setNotice(value ? 'Activity history enabled.' : 'Activity history paused.'); }} label="Account activity" /></div>
            <div className="flex items-center justify-between gap-5 px-5 py-5 sm:px-7"><div><p className="text-sm font-semibold">Secure sign-in</p><p className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">Haven uses one-time codes instead of a password.</p></div><span className="flex items-center gap-1.5 text-xs font-semibold text-accent" data-testid="status-secure-sign-in"><ShieldCheck className="h-4 w-4" /> Active</span></div>
          </div>
        </section>
        <section className="vault-card rounded-2xl" data-testid="section-storage-settings">
          <div className="border-b border-border px-5 py-5 sm:px-7"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary"><SlidersHorizontal className="h-4 w-4" /></span><div><h2 className="font-semibold">Storage</h2><p className="text-xs text-muted-foreground">Your current space and allowance.</p></div></div></div>
          <QueryState loading={summary.isLoading} error={summary.error} onRetry={() => void summary.refetch()} empty={<div className="p-7 text-sm text-muted-foreground" data-testid="empty-storage">Storage details will appear when your vault is connected.</div>} />
          {summary.data && <div className="p-5 sm:p-7"><div className="flex items-end justify-between"><div><p className="text-2xl font-semibold" data-testid="text-settings-storage-used">{formatBytes(summary.data.storageUsedBytes)}</p><p className="mt-1 text-xs text-muted-foreground">of {formatBytes(summary.data.storageLimitBytes)} used</p></div><span className="mono text-xs text-muted-foreground">{Math.round((summary.data.storageUsedBytes / Math.max(summary.data.storageLimitBytes, 1)) * 100)}%</span></div><div className="mt-4 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (summary.data.storageUsedBytes / Math.max(summary.data.storageLimitBytes, 1)) * 100)}%` }} /></div></div>}
        </section>
        <section className="rounded-2xl border border-destructive/25 bg-destructive/5 p-5 sm:p-7" data-testid="section-signout-settings"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><LogOut className="h-4 w-4 text-destructive" /><h2 className="font-semibold">End this session</h2></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Sign out of Haven on this device. Your documents remain safely stored.</p></div><Button variant="outline" className="w-fit text-destructive hover:text-destructive" onClick={signOut} disabled={logout.isPending} data-testid="button-settings-logout">{logout.isPending ? 'Signing out…' : 'Sign out'}</Button></div></section>
      </div>
      {(sessionLoading || sessionError) && <div className="mt-5 text-xs text-muted-foreground">{sessionLoading ? 'Loading account details…' : <button onClick={() => void refetch()} className="font-semibold text-accent hover:underline" data-testid="button-settings-retry">Retry account details</button>}</div>}
    </div>
  );
}