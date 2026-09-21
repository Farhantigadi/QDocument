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
    <div className="vault-page mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-11" data-testid="page-documents">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div><p className="eyebrow text-accent">The whole collection</p><h1 className="display mt-2 text-4xl sm:text-5xl" data-testid="heading-documents">Documents<span className="text-accent">.</span></h1><p className="mt-3 text-sm text-muted-foreground">Find something by its name, place, or the feeling it carries.</p></div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-document-workspace"><Plus className="h-4 w-4" /> Add document</Button>
      </div>
      <section className="mt-9 rounded-2xl border border-border bg-card/70 p-3 shadow-[var(--shadow-sm)] sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-11 border-0 bg-background pl-10 shadow-none focus-visible:ring-1" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your documents" data-testid="input-search-documents" />{search && <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted" onClick={() => setSearch('')} data-testid="button-clear-search"><X className="h-4 w-4" /></button>}</div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative"><ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select className="h-11 w-full min-w-[160px] appearance-none rounded-md border-0 bg-background pl-10 pr-9 text-sm focus:outline-none focus:ring-1 focus:ring-ring sm:w-auto" value={category} onChange={(event) => setCategory(event.target.value)} data-testid="select-filter-category"><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /></div>
            <select className="h-11 min-w-[150px] rounded-md border-0 bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} data-testid="select-sort-documents"><option value="recent">Most recent</option><option value="name">Name A–Z</option><option value="size">Largest first</option></select>
          </div>
        </div>
        {isFiltered && <div className="flex items-center gap-2 px-2 pb-1 pt-3 text-xs text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Showing a refined view <button className="font-semibold text-accent hover:underline" onClick={() => { setSearch(''); setCategory(''); }} data-testid="button-clear-filters">Clear filters</button></div>}
      </section>
      <div className="mt-7 flex items-center justify-between"><p className="text-sm text-muted-foreground" data-testid="text-document-results">{documents.isLoading ? 'Looking through your vault…' : `${documents.data?.length ?? 0} ${documents.data?.length === 1 ? 'document' : 'documents'}`}</p><div className="eyebrow hidden text-muted-foreground sm:block">Secure index</div></div>
      <div className="mt-4"><QueryState loading={documents.isLoading} error={documents.error} onRetry={() => void documents.refetch()} empty={documents.data?.length === 0 ? <EmptyVault onAdd={() => setDialogOpen(true)} title={isFiltered ? 'Nothing matches this view' : undefined} description={isFiltered ? 'Try a different word or clear the filters to see the rest of your vault.' : undefined} /> : undefined} />{documents.data && documents.data.length > 0 && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{documents.data.map((document) => <DocumentCard key={document.id} document={document} />)}</div>}</div>
      <DocumentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}