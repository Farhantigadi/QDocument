import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Plus } from 'lucide-react';
import { useGetDashboardSummary, useListDocuments, useListCredentials, useGetSession } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { DocumentCard, DocumentDialog, EmptyVault, QueryState } from '@/components/vault-ui';

export default function Dashboard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const session = useGetSession();
  const summary = useGetDashboardSummary();
  const documents = useListDocuments({ sort: 'recent' });
  const credentials = useListCredentials();
  const recentDocuments = useMemo(() => (documents.data ?? []).slice(0, 4), [documents.data]);

  const userName = session.data?.user?.name ? session.data.user.name.split(' ')[0] : null;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-8 lg:py-8 space-y-8" data-testid="page-dashboard">

      {/* Header with Greeting & One Primary Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl" data-testid="heading-dashboard">
            {userName ? `Welcome back, ${userName}` : 'Dashboard'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground" data-testid="text-dashboard-intro">
            Overview of your encrypted files and passwords.
          </p>
        </div>
        <div>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-add-document" className="w-full sm:w-auto font-semibold">
            <Plus className="h-4 w-4 mr-1.5" /> Add document
          </Button>
        </div>
      </div>

      {/* Compact Summary Row (Counts, no decorative tiles) */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="vault-card-surface rounded-xl p-5 border border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Documents</span>
            <Link href="/documents" className="text-xs font-medium text-foreground hover:underline" data-testid="link-view-all-documents">
              View all
            </Link>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground" data-testid="text-document-count">
            {summary.data?.documentCount ?? '0'}
          </p>
        </div>

        <div className="vault-card-surface rounded-xl p-5 border border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Vault credentials</span>
            <Link href="/vault" className="text-xs font-medium text-foreground hover:underline" data-testid="link-review-privacy">
              Manage passwords
            </Link>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground" data-testid="text-credential-count">
            {credentials.data?.length ?? '0'}
          </p>
        </div>
      </section>

      {/* Recent Documents Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Recent documents</h2>
          <Link href="/documents" className="text-xs font-medium text-foreground hover:underline" data-testid="link-browse-documents">
            View all
          </Link>
        </div>

        <QueryState
          loading={documents.isLoading}
          error={documents.error}
          onRetry={() => void documents.refetch()}
          empty={recentDocuments.length === 0 ? <EmptyVault onAdd={() => setDialogOpen(true)} /> : undefined}
        />

        {!documents.isLoading && !documents.error && recentDocuments.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentDocuments.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        )}
      </section>

      <DocumentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

