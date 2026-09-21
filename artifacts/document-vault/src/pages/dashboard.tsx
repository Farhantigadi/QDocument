import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  ArrowRight,
  Clock3,
  FileStack,
  HardDrive,
  LockKeyhole,
  Plus,
  ShieldCheck,
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
    <div className="vault-page mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-11" data-testid="page-dashboard">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-accent">Good to have you here</p>
          <h1 className="display mt-2 text-4xl leading-tight sm:text-5xl" data-testid="heading-dashboard">Your calm corner<span className="text-accent">.</span></h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground" data-testid="text-dashboard-intro">Everything important, close at hand and quietly looked after.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-document"><Plus className="h-4 w-4" /> Add document</Button>
      </div>

      <section className="vault-stagger mt-9 grid gap-4 lg:grid-cols-[1.35fr_.8fr_.8fr]">
        <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground sm:p-7">
          <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full border-[20px] border-sidebar-primary/15" />
          <div className="absolute -bottom-28 right-24 h-48 w-48 rounded-full border-[18px] border-sidebar-primary/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sidebar-primary"><ShieldCheck className="h-4 w-4" /><span className="eyebrow">Storage, at a glance</span></div>
            <div className="mt-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-semibold tracking-tight" data-testid="text-storage-used">{summary.data ? formatBytes(summary.data.storageUsedBytes) : '—'}</p>
                <p className="mt-1 text-sm text-primary-foreground/60">of {summary.data ? formatBytes(summary.data.storageLimitBytes) : 'your allowance'} used</p>
              </div>
              <p className="mono text-sm text-sidebar-primary" data-testid="text-storage-percent">{summary.data ? `${Math.round(usedPercent)}%` : '—'}</p>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-primary-foreground/15"><div className="h-full rounded-full bg-sidebar-primary transition-all duration-700" style={{ width: `${usedPercent}%` }} /></div>
            <p className="mt-4 text-xs text-primary-foreground/55">A little room left for what comes next.</p>
          </div>
        </div>
        <div className="vault-card rounded-2xl p-6">
          <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary"><FileStack className="h-4 w-4" /></span><span className="eyebrow text-muted-foreground">Filed</span></div>
          <p className="mt-8 text-4xl font-semibold tracking-tight" data-testid="text-document-count">{summary.data?.documentCount ?? '—'}</p>
          <p className="mt-1 text-sm text-muted-foreground">documents in your vault</p>
          <Link href="/documents" className="focus-ring mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-accent" data-testid="link-view-all-documents">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="vault-card rounded-2xl bg-secondary/55 p-6">
          <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-primary"><LockKeyhole className="h-4 w-4" /></span><span className="eyebrow text-muted-foreground">Privacy</span></div>
          <p className="mt-8 text-lg font-semibold" data-testid="text-privacy-status">Private by default</p>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">Your files are only visible to you.</p>
          <Link href="/settings" className="focus-ring mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary" data-testid="link-review-privacy">Review settings <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </section>

      <div className="mt-12 grid gap-10 xl:grid-cols-[1fr_340px]">
        <section>
          <div className="mb-5 flex items-end justify-between"><div><p className="eyebrow text-accent">Recently added</p><h2 className="display mt-1 text-3xl">Your latest papers</h2></div><Link href="/documents" className="focus-ring hidden items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground sm:flex" data-testid="link-browse-documents">Browse vault <ArrowRight className="h-3.5 w-3.5" /></Link></div>
          <QueryState loading={documents.isLoading} error={documents.error} onRetry={() => void documents.refetch()} empty={recentDocuments.length === 0 ? <EmptyVault onAdd={() => setDialogOpen(true)} /> : undefined} />
          {!documents.isLoading && !documents.error && recentDocuments.length > 0 && <div className="grid gap-4 sm:grid-cols-2">{recentDocuments.map((document) => <DocumentCard key={document.id} document={document} />)}</div>}
        </section>
        <aside className="space-y-8">
          <section>
            <div className="mb-5 flex items-center justify-between"><div><p className="eyebrow text-accent">By category</p><h2 className="display mt-1 text-2xl">A quick map</h2></div><HardDrive className="h-4 w-4 text-muted-foreground" /></div>
            <QueryState loading={summary.isLoading} error={summary.error} onRetry={() => void summary.refetch()} empty={categories.length === 0 ? <p className="text-sm text-muted-foreground" data-testid="empty-categories">Categories will appear as you add documents.</p> : undefined} />
            {categories.length > 0 && <div className="space-y-4">{categories.slice(0, 5).map((category) => { const largest = Math.max(...categories.map((item) => item.count), 1); return <div key={category.category} data-testid={`category-${category.category}`}><div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold">{category.category}</span><span className="mono text-muted-foreground">{category.count}</span></div><div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-accent/75 transition-all duration-700" style={{ width: `${(category.count / largest) * 100}%` }} /></div></div>; })}</div>}
          </section>
          <section className="border-t border-border pt-7">
            <div className="mb-4 flex items-center gap-2"><Clock3 className="h-4 w-4 text-accent" /><h2 className="text-sm font-semibold">Recent activity</h2></div>
            <QueryState loading={activity.isLoading} error={activity.error} onRetry={() => void activity.refetch()} empty={<p className="text-sm text-muted-foreground" data-testid="empty-activity">No activity yet. Your next action will appear here.</p>} />
            {activity.data && activity.data.length > 0 && <div className="space-y-4">{activity.data.slice(0, 5).map((item) => <div className="flex gap-3" key={item.id} data-testid={`activity-${item.id}`}><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent/70" /><div><p className="text-xs leading-5">{item.label}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(item.createdAt, true)}</p></div></div>)}</div>}
          </section>
        </aside>
      </div>
      <DocumentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}