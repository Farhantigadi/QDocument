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
    } catch { setError('Network connection error.'); }
    finally { setLoading(false); }
  };

  return (
    <section className="vault-card-surface rounded-xl p-5 border border-border bg-card" data-testid="section-delegation">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-foreground">Role delegation</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Toggle user account privileges between ADMIN and USER.</p>
      </div>
      <form onSubmit={toggle} className="flex flex-col gap-2.5 sm:flex-row" data-testid="form-delegation">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          type="email"
          required
          className="flex-1 text-xs"
          data-testid="input-delegate-email"
        />
        <Button type="submit" size="sm" disabled={loading} data-testid="button-delegate" className="w-full sm:w-auto font-semibold">
          {loading ? 'Updating…' : 'Toggle role'}
        </Button>
      </form>
      {result && <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-foreground" data-testid="status-delegation-result">{result}</p>}
      {error && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}
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
    { label: 'Registered accounts', value: overview.data.userCount, icon: Users, testId: 'users' },
    { label: 'Documents filed', value: overview.data.documentCount, icon: FileStack, testId: 'documents' },
    { label: 'Storage consumed', value: formatBytes(overview.data.storageUsedBytes), icon: HardDrive, testId: 'storage' },
    { label: 'Audit events', value: overview.data.auditEventCount, icon: Activity, testId: 'events' },
  ] : [];

  if (session.data?.user?.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-12 text-center" data-testid="page-admin">
        <div className="vault-card-surface rounded-xl p-8 max-w-sm mx-auto border border-border bg-card" data-testid="state-admin-forbidden">
          <ShieldCheck className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-3 text-lg font-bold text-foreground">Access Restricted</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Administrator tools are reserved for verified system administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-8 lg:py-8 space-y-6" data-testid="page-admin">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl" data-testid="heading-admin">
            System Overview
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Privacy-safe system metrics and user management. Document content remains encrypted.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Privacy preserved
        </div>
      </div>

      <QueryState
        loading={overview.isLoading}
        error={overview.error}
        onRetry={() => void overview.refetch()}
        empty={
          !overview.data ? (
            <div data-testid="empty-admin-overview">
              <div className="vault-card-surface rounded-xl p-8 text-center border border-border bg-card">
                <Database className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-bold text-foreground">Admin metrics unavailable</p>
              </div>
            </div>
          ) : null
        }
      />

      {overview.data && (
        <>
          {/* Metrics Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(({ label, value, testId }) => (
              <div className="vault-card-surface rounded-xl p-4 border border-border bg-card" key={testId} data-testid={`admin-metric-${testId}`}>
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <p className="mt-2 text-2xl font-bold tracking-tight text-foreground" data-testid={`admin-value-${testId}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div><DelegationTool /></div>

          {/* User Management Table Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">User accounts</h2>
              <p className="text-xs text-muted-foreground">System user index and access control.</p>
            </div>

            <QueryState
              loading={users.isLoading}
              error={users.error}
              onRetry={() => void users.refetch()}
              empty={
                sortedUsers.length === 0 ? (
                  <div className="vault-card-surface rounded-xl p-8 text-center text-xs text-muted-foreground border border-border bg-card" data-testid="empty-admin-users">
                    No user accounts found.
                  </div>
                ) : null
              }
            />

            {sortedUsers.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="sticky top-0 z-10 border-b border-border bg-muted/60 text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Files</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {sortedUsers.map((user) => (
                      <tr className="transition-colors hover:bg-muted/40" key={user.id} data-testid={`row-user-${user.id}`}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground" data-testid={`text-user-name-${user.id}`}>{user.name}</p>
                          <p className="text-[11px] text-muted-foreground">{user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${
                            'role' in user && user.role === 'ADMIN'
                              ? 'bg-foreground text-background'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {'role' in user ? String(user.role) : 'USER'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 capitalize" data-testid={`status-user-${user.id}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                            {user.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-foreground">{user.documentCount}</td>
                        <td className="px-4 py-3 text-right">
                          {user.id !== session.data?.user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              disabled={deletingId === user.id}
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              data-testid={`button-delete-user-${user.id}`}
                              title="Delete user"
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

