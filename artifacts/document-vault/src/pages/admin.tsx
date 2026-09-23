import { useMemo, useState } from 'react';
import { Activity, Database, FileStack, HardDrive, ShieldCheck, Users } from 'lucide-react';
import { useGetAdminOverview, useGetSession, useListUsers } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBytes, QueryState } from '@/components/vault-ui';

function DelegationTool() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggle = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(''); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/admin/delegate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        credentials: 'include',
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) { setError(String(data.error ?? 'Failed.')); return; }
      setResult(`${String(data.email)} is now ${String(data.role)}.`);
      setEmail('');
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <section className="vault-card rounded-2xl p-6" data-testid="section-delegation">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary"><ShieldCheck className="h-4 w-4" /></span>
        <div><h2 className="font-semibold">Role Delegation</h2><p className="text-xs text-muted-foreground">Toggle any user between ADMIN and USER.</p></div>
      </div>
      <form onSubmit={toggle} className="flex gap-3" data-testid="form-delegation">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" type="email" required className="flex-1" data-testid="input-delegate-email" />
        <Button type="submit" disabled={loading} data-testid="button-delegate">{loading ? 'Updating…' : 'Toggle role'}</Button>
      </form>
      {result && <p className="mt-3 rounded-lg bg-secondary px-3 py-2 text-sm text-primary" data-testid="status-delegation-result">{result}</p>}
      {error && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
    </section>
  );
}

export default function Admin() {
  const session = useGetSession();
  const overview = useGetAdminOverview();
  const users = useListUsers();
  const sortedUsers = useMemo(() => [...(users.data ?? [])].sort((a, b) => b.documentCount - a.documentCount), [users.data]);
  const metrics = overview.data ? [
    { label: 'People with access', value: overview.data.userCount, icon: Users, testId: 'users' },
    { label: 'Documents held', value: overview.data.documentCount, icon: FileStack, testId: 'documents' },
    { label: 'Storage in use', value: formatBytes(overview.data.storageUsedBytes), icon: HardDrive, testId: 'storage' },
    { label: 'Audit events', value: overview.data.auditEventCount, icon: Activity, testId: 'events' },
  ] : [];

  if (session.data?.user?.role !== 'ADMIN') {
    return (
      <div className="vault-page mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-11" data-testid="page-admin">
        <div className="vault-card rounded-2xl p-10 text-center" data-testid="state-admin-forbidden">
          <ShieldCheck className="mx-auto h-8 w-8 text-accent" />
          <h1 className="display mt-4 text-3xl">This room is private.</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Administrator tools are only available to Haven administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-page mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-11" data-testid="page-admin">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-accent">For the people who keep Haven steady</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl" data-testid="heading-admin">Admin overview<span className="text-accent">.</span></h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">A privacy-safe view of account health. No document contents, ever.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-primary"><ShieldCheck className="h-3.5 w-3.5" /> Metadata only</div>
      </div>

      <QueryState loading={overview.isLoading} error={overview.error} onRetry={() => void overview.refetch()} empty={<div className="mt-8" data-testid="empty-admin-overview"><div className="vault-card rounded-2xl p-10 text-center"><Database className="mx-auto h-8 w-8 text-accent" /><p className="mt-4 font-semibold">Admin metrics are not connected</p></div></div>} />

      {overview.data && (
        <>
          <div className="vault-stagger mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon, testId }) => (
              <div className="vault-card rounded-2xl p-5" key={testId} data-testid={`admin-metric-${testId}`}>
                <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="h-4 w-4" /></span><span className="eyebrow text-muted-foreground">Live</span></div>
                <p className="mt-7 text-3xl font-semibold tracking-tight" data-testid={`admin-value-${testId}`}>{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8"><DelegationTool /></div>

          <section className="mt-10">
            <div className="mb-5 flex items-center justify-between">
              <div><p className="eyebrow text-accent">Account health</p><h2 className="display mt-1 text-3xl">People and their space</h2></div>
              <span className="text-xs text-muted-foreground">Status & quota only</span>
            </div>
            <QueryState loading={users.isLoading} error={users.error} onRetry={() => void users.refetch()} empty={<div className="vault-card rounded-2xl p-9 text-center text-sm text-muted-foreground" data-testid="empty-admin-users">No user accounts to show.</div>} />
            {sortedUsers.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/45 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-5 py-4 font-medium">Account</th>
                      <th className="px-5 py-4 font-medium">Role</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 font-medium">Documents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedUsers.map((user) => (
                      <tr className="transition-colors hover:bg-muted/30" key={user.id} data-testid={`row-user-${user.id}`}>
                        <td className="px-5 py-4">
                          <p className="font-semibold" data-testid={`text-user-name-${user.id}`}>{user.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${'role' in user && user.role === 'ADMIN' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary'}`}>
                            {'role' in user ? String(user.role) : 'USER'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-primary" data-testid={`status-user-${user.id}`}>{user.status.toLowerCase()}</span>
                        </td>
                        <td className="px-5 py-4 mono text-xs">{user.documentCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
