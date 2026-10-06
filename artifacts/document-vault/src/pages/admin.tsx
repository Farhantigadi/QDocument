import { useMemo, useState } from 'react';
import { Activity, Database, FileStack, HardDrive, ShieldCheck, Trash2, Users } from 'lucide-react';
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
      if (!res.ok) { setError(String(data.error ?? 'Role toggle failed.')); return; }
      setResult(`${String(data.email)} is now ${String(data.role)}.`);
      setEmail('');
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <section className="vault-card-surface rounded-2xl p-6" data-testid="section-delegation">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="display-title text-lg text-foreground">Role Delegation</h2>
          <p className="text-xs text-muted-foreground">Toggle user account privileges between ADMIN and USER.</p>
        </div>
      </div>
      <form onSubmit={toggle} className="flex flex-col gap-3 sm:flex-row" data-testid="form-delegation">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          type="email"
          required
          className="flex-1"
          data-testid="input-delegate-email"
        />
        <Button type="submit" disabled={loading} data-testid="button-delegate" className="w-full sm:w-auto">
          {loading ? 'Updating…' : 'Toggle role'}
        </Button>
      </form>
      {result && <p className="mt-3 rounded-xl bg-secondary px-3.5 py-2.5 text-sm font-semibold text-primary" data-testid="status-delegation-result">{result}</p>}
      {error && <p className="mt-3 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm font-semibold text-destructive">{error}</p>}
    </section>
  );
}

export default function Admin() {
  const session = useGetSession();
  const overview = useGetAdminOverview();
  const users = useListUsers();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const sortedUsers = useMemo(() => [...(users.data ?? [])].sort((a, b) => b.documentCount - a.documentCount), [users.data]);

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Delete account for "${userName}"? This cannot be undone.`)) return;
    setDeletingId(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', credentials: 'include' });
      await users.refetch();
      await overview.refetch();
    } finally { setDeletingId(null); }
  };

  const metrics = overview.data ? [
    { label: 'Registered Accounts', value: overview.data.userCount, icon: Users, testId: 'users' },
    { label: 'Documents Filed', value: overview.data.documentCount, icon: FileStack, testId: 'documents' },
    { label: 'Storage Consumed', value: formatBytes(overview.data.storageUsedBytes), icon: HardDrive, testId: 'storage' },
    { label: 'Audit Trail Events', value: overview.data.auditEventCount, icon: Activity, testId: 'events' },
  ] : [];

  if (session.data?.user?.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-12 text-center animate-fade-in" data-testid="page-admin">
        <div className="vault-card-surface rounded-2xl p-10 max-w-md mx-auto" data-testid="state-admin-forbidden">
          <ShieldCheck className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="display-title mt-4 text-2xl font-bold text-foreground">Access Restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Administrator tools are reserved for verified Haven system administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 lg:px-10 lg:py-10 animate-fade-in" data-testid="page-admin">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end border-b border-border/60 pb-6">
        <div>
          <p className="eyebrow-text text-accent">System Administration</p>
          <h1 className="display-title mt-1.5 text-3xl font-extrabold sm:text-4xl lg:text-5xl text-foreground" data-testid="heading-admin">
            Admin Overview<span className="text-accent">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">
            Privacy-safe system metrics and user account management. Document contents remain strictly encrypted.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-500" /> Privacy Preserved
        </div>
      </div>

      <QueryState
        loading={overview.isLoading}
        error={overview.error}
        onRetry={() => void overview.refetch()}
        empty={
          <div className="mt-8" data-testid="empty-admin-overview">
            <div className="vault-card-surface rounded-2xl p-10 text-center">
              <Database className="mx-auto h-8 w-8 text-accent" />
              <p className="mt-4 font-bold text-foreground">Admin metrics unavailable</p>
            </div>
          </div>
        }
      />

      {overview.data && (
        <>
          {/* Metrics Cards Grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon, testId }) => (
              <div className="vault-card-surface rounded-2xl p-5" key={testId} data-testid={`admin-metric-${testId}`}>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="eyebrow-text text-accent">Live</span>
                </div>
                <p className="mt-6 text-3xl font-extrabold tracking-tight text-foreground" data-testid={`admin-value-${testId}`}>
                  {value}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8"><DelegationTool /></div>

          {/* User Management Table Section */}
          <section className="mt-10">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="eyebrow-text text-accent">Account Index</p>
                <h2 className="display-title mt-0.5 text-2xl text-foreground">User Management</h2>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">Metadata Only</span>
            </div>

            <QueryState
              loading={users.isLoading}
              error={users.error}
              onRetry={() => void users.refetch()}
              empty={<div className="vault-card-surface rounded-2xl p-8 text-center text-xs text-muted-foreground" data-testid="empty-admin-users">No user accounts found.</div>}
            />

            {sortedUsers.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-4">Account</th>
                      <th className="px-5 py-4">Role</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Files</th>
                      <th className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {sortedUsers.map((user) => (
                      <tr className="transition-colors hover:bg-muted/30" key={user.id} data-testid={`row-user-${user.id}`}>
                        <td className="px-5 py-4">
                          <p className="font-bold text-foreground" data-testid={`text-user-name-${user.id}`}>{user.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${
                            'role' in user && user.role === 'ADMIN'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-primary'
                          }`}>
                            {'role' in user ? String(user.role) : 'USER'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-500 capitalize" data-testid={`status-user-${user.id}`}>
                            {user.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs font-bold text-foreground">{user.documentCount}</td>
                        <td className="px-5 py-4">
                          {user.id !== session.data?.user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={deletingId === user.id}
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              data-testid={`button-delete-user-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
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
