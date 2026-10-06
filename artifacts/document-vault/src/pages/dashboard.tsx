import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  ArrowRight,
  Clock3,
  FileStack,
  FolderOpen,
  HardDrive,
  KeyRound,
  Plus,
} from 'lucide-react';
import {
  useGetDashboardSummary,
  useListActivity,
  useListDocuments,
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import {
  DocumentCard,
  DocumentDialog,
  EmptyVault,
  formatBytes,
  formatDate,
  QueryState,
} from '@/components/vault-ui';

export default function Dashboard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const summary = useGetDashboardSummary();
  const activity = useListActivity();
  const documents = useListDocuments({ sort: 'recent' });
  const recentDocuments = useMemo(() => (documents.data ?? []).slice(0, 4), [documents.data]);
  const usedPercent = summary.data ? Math.min(100, (summary.data.storageUsedBytes / Math.max(summary.data.storageLimitBytes, 1)) * 100) : 0;
  const categories = summary.data?.categories ?? [];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 lg:px-10 lg:py-8 animate-fade-in" data-testid="page-dashboard">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="display-title text-2xl font-extrabold sm:text-3xl text-foreground" data-testid="heading-dashboard">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-dashboard-intro">
            Manage your saved documents, drive links, and credentials.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-document" className="w-full sm:w-auto rounded-xl">
          <Plus className="h-4 w-4 mr-1.5" /> Add Document
        </Button>
      </div>

      {/* Metric Tiles */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {/* Tile 1: Total Documents */}
        <div className="vault-card-surface flex flex-col justify-between rounded-3xl p-5 border border-border/80 bg-card">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileStack className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-muted-foreground">Documents</span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-extrabold text-foreground" data-testid="text-document-count">
              {summary.data?.documentCount ?? '0'}
            </p>
          </div>
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            data-testid="link-view-all-documents"
          >
            View all documents <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Tile 2: Storage Meter */}
        <div className="vault-card-surface flex flex-col justify-between rounded-3xl p-5 border border-border/80 bg-card">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <HardDrive className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {summary.data ? `${Math.round(usedPercent)}% Used` : 'Storage'}
            </span>
          </div>
          <div className="my-3">
            <p className="text-2xl font-extrabold text-foreground" data-testid="text-storage-used">
              {summary.data ? formatBytes(summary.data.storageUsedBytes) : '0 B'}
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${usedPercent}%` }} />
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {summary.data ? `${formatBytes(summary.data.storageLimitBytes)} allowance` : 'Limit'}
          </span>
        </div>

        {/* Tile 3: Passwords Shortcut */}
        <div className="vault-card-surface flex flex-col justify-between rounded-3xl p-5 border border-border/80 bg-card">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-muted-foreground">Vault</span>
          </div>
          <div className="my-3">
            <p className="text-lg font-bold text-foreground" data-testid="text-privacy-status">
              Passwords &amp; Keys
            </p>
          </div>
          <Link
            href="/vault"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            data-testid="link-review-privacy"
          >
            Manage passwords <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Main Grid */}
      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_320px]">
        {/* Recent Documents */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="display-title text-xl text-foreground">Recent Documents</h2>
            <Link
              href="/documents"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              data-testid="link-browse-documents"
            >
              Browse all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <QueryState
            loading={documents.isLoading}
            error={documents.error}
            onRetry={() => void documents.refetch()}
            empty={recentDocuments.length === 0 ? <EmptyVault onAdd={() => setDialogOpen(true)} /> : undefined}
          />

          {!documents.isLoading && !documents.error && recentDocuments.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {recentDocuments.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          )}
        </section>

        {/* Sidebar: Categories & Activity */}
        <aside className="space-y-6">
          {/* Categories */}
          <section className="vault-card-surface rounded-3xl p-5 border border-border/80 bg-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="display-title text-base text-foreground">Categories</h2>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </div>

            <QueryState
              loading={summary.isLoading}
              error={summary.error}
              onRetry={() => void summary.refetch()}
              empty={
                categories.length === 0 ? (
                  <p className="text-xs text-muted-foreground" data-testid="empty-categories">
                    No categories yet.
                  </p>
                ) : undefined
              }
            />

            {categories.length > 0 && (
              <div className="space-y-3">
                {categories.slice(0, 5).map((category) => {
                  const largest = Math.max(...categories.map((item) => item.count), 1);
                  return (
                    <div key={category.category} data-testid={`category-${category.category}`}>
                      <div className="mb-1 flex justify-between text-xs font-semibold">
                        <span className="text-foreground">{category.category}</span>
                        <span className="text-muted-foreground">{category.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${(category.count / largest) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Activity Log */}
          <section className="vault-card-surface rounded-3xl p-5 border border-border/80 bg-card">
            <div className="mb-3 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              <h2 className="display-title text-base text-foreground">Recent Activity</h2>
            </div>

            <QueryState
              loading={activity.isLoading}
              error={activity.error}
              onRetry={() => void activity.refetch()}
              empty={
                <p className="text-xs text-muted-foreground" data-testid="empty-activity">
                  No activity logged yet.
                </p>
              }
            />

            {activity.data && activity.data.length > 0 && (
              <div className="space-y-3">
                {activity.data.slice(0, 5).map((item) => (
                  <div className="flex items-start gap-2.5 border-b border-border/50 pb-2.5 last:border-0 last:pb-0" key={item.id} data-testid={`activity-${item.id}`}>
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground leading-snug">{item.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(item.createdAt, true)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      <DocumentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}