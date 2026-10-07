import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, FileStack, KeyRound, Plus } from 'lucide-react';
import { useGetDashboardSummary, useListDocuments, useListCredentials } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { DocumentCard, DocumentDialog, EmptyVault, QueryState } from '@/components/vault-ui';

export default function Dashboard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const summary = useGetDashboardSummary();
  const documents = useListDocuments({ sort: 'recent' });
  const credentials = useListCredentials();
  const recentDocuments = useMemo(() => (documents.data ?? []).slice(0, 4), [documents.data]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 lg:px-10 lg:py-8 animate-fade-in" data-testid="page-dashboard">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="display-title text-2xl font-extrabold sm:text-3xl text-foreground" data-testid="heading-dashboard">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-dashboard-intro">
            Your documents and passwords, all in one place.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-document" className="w-full sm:w-auto rounded-xl">
          <Plus className="h-4 w-4 mr-1.5" /> Add Document
        </Button>
      </div>

      {/* Metric Tiles */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">

        {/* Documents */}
        <div className="vault-card-surface flex flex-col justify-between rounded-3xl p-5 border border-border/80 bg-card">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileStack className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-muted-foreground">Documents</span>
          </div>
          <p className="my-3 text-3xl font-extrabold text-foreground" data-testid="text-document-count">
            {summary.data?.documentCount ?? '0'}
          </p>
          <Link href="/documents" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline" data-testid="link-view-all-documents">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Passwords */}
        <div className="vault-card-surface flex flex-col justify-between rounded-3xl p-5 border border-border/80 bg-card">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-muted-foreground">Vault</span>
          </div>
          <p className="my-3 text-3xl font-extrabold text-foreground" data-testid="text-credential-count">
            {credentials.data?.length ?? '0'}
          </p>
          <Link href="/vault" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline" data-testid="link-review-privacy">
            Manage passwords <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </section>

      {/* Recent Documents */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="display-title text-xl text-foreground">Recent Documents</h2>
          <Link href="/documents" className="text-xs font-bold text-primary hover:underline flex items-center gap-1" data-testid="link-browse-documents">
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
