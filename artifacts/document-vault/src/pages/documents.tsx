import { useMemo, useState } from 'react';
import { ListFilter, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { useListDocuments } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentCard, DocumentDialog, EmptyVault, QueryState } from '@/components/vault-ui';

export default function Documents() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<'recent' | 'name' | 'size'>('recent');
  const [dialogOpen, setDialogOpen] = useState(false);
  const documents = useListDocuments({ search: search.trim() || undefined, category: category || undefined, sort });
  const categories = useMemo(() => Array.from(new Set((documents.data ?? []).map((document) => document.category))).sort(), [documents.data]);
  const isFiltered = Boolean(search || category);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 lg:px-10 lg:py-8 animate-fade-in" data-testid="page-documents">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="display-title text-2xl font-extrabold sm:text-3xl text-foreground" data-testid="heading-documents">
            Documents
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Search and organize your files and Google Drive links.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-document-workspace" className="w-full md:w-auto rounded-xl">
          <Plus className="h-4 w-4 mr-1.5" /> Add Document
        </Button>
      </div>

      {/* Search & Filter Bar Container */}
      <section className="mt-6 rounded-3xl border border-border/80 bg-card p-4 shadow-2xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 pr-9 border-border bg-background shadow-2xs focus-visible:ring-2 rounded-2xl"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search documents by title, tag, or category…"
              data-testid="input-search-documents"
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                onClick={() => setSearch('')}
                data-testid="button-clear-search"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Selects */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <ListFilter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                className="flex min-h-[44px] w-full appearance-none rounded-2xl border border-border bg-background pl-10 pr-10 text-sm font-semibold text-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-ring sm:w-auto min-w-[160px]"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                data-testid="select-filter-category"
              >
                <option value="">All Categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <SlidersHorizontal className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>

            <select
              className="flex min-h-[44px] w-full appearance-none rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-ring sm:w-auto min-w-[150px]"
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
              data-testid="select-sort-documents"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name A–Z</option>
              <option value="size">Largest First</option>
            </select>
          </div>
        </div>

        {/* Filter Indicator pill */}
        {isFiltered && (
          <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Active filter</span>
            <button
              className="font-bold text-primary hover:underline focus-visible:outline-none"
              onClick={() => { setSearch(''); setCategory(''); }}
              data-testid="button-clear-filters"
            >
              Clear
            </button>
          </div>
        )}
      </section>

      {/* Results Counter */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground" data-testid="text-document-results">
          {documents.isLoading
            ? 'Loading documents…'
            : `${documents.data?.length ?? 0} ${documents.data?.length === 1 ? 'document' : 'documents'}`}
        </p>
      </div>

      {/* Grid Results */}
      <div className="mt-4">
        <QueryState
          loading={documents.isLoading}
          error={documents.error}
          onRetry={() => void documents.refetch()}
          empty={
            documents.data?.length === 0 ? (
              <EmptyVault
                onAdd={() => setDialogOpen(true)}
                title={isFiltered ? 'No matching documents' : undefined}
                description={isFiltered ? 'Try clearing your search terms or active category filter.' : undefined}
              />
            ) : undefined
          }
        />
        {documents.data && documents.data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.data.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        )}
      </div>

      <DocumentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}