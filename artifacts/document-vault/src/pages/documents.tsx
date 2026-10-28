import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Link2Off, ListFilter, Plus, Search, Share2, SlidersHorizontal, X } from 'lucide-react';
import { useListDocuments } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DocumentCard, DocumentDialog, EmptyVault, QueryState } from '@/components/vault-ui';
import type { Document } from '@workspace/api-client-react';

function SelectableDocumentCard({
  document,
  selected,
  selecting,
  onToggle,
}: {
  document: Document;
  selected: boolean;
  selecting: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="relative">
      {selecting && (
        <button
          onClick={() => onToggle(document.id)}
          className={`absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
            selected
              ? 'border-foreground bg-foreground text-background'
              : 'border-border bg-background/90 hover:border-foreground'
          }`}
          aria-label={selected ? 'Deselect' : 'Select'}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </button>
      )}
      <div
        className={`transition-all ${selected ? 'ring-2 ring-ring rounded-xl' : ''}`}
        onClick={selecting ? () => onToggle(document.id) : undefined}
        style={selecting ? { cursor: 'pointer' } : undefined}
      >
        <DocumentCard document={document} />
      </div>
    </div>
  );
}

type ShareLink = { token: string; documentIds: string[]; expiresAt: string | null; createdAt: string };

function ManageLinksDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/share', { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json().catch(() => null)) as ShareLink[] | null;
        if (Array.isArray(data)) setLinks(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) load(); }, [open]);

  const revoke = async (token: string) => {
    setRevoking(token);
    try {
      await fetch(`/api/share/${token}`, { method: 'DELETE', credentials: 'include' });
      setLinks((prev) => prev.filter((l) => l.token !== token));
    } finally {
      setRevoking(null);
    }
  };

  const copy = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/shared/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-border bg-card p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Active share links</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Revoke any link to cut off access immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {loading && <p className="text-xs text-muted-foreground py-4 text-center">Loading…</p>}
          {!loading && links.length === 0 && (
            <p className="text-xs text-muted-foreground py-6 text-center">No active share links.</p>
          )}
          {links.map((link) => (
            <div key={link.token} className="flex items-center gap-2 sm:gap-3 rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs font-mono font-medium text-foreground truncate">
                  /shared/{link.token.slice(0, 6)}…{link.token.slice(-4)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {link.documentIds.length} doc{link.documentIds.length !== 1 ? 's' : ''}
                  {' · '}
                  {link.expiresAt
                    ? `expires ${new Date(link.expiresAt).toLocaleDateString()}`
                    : 'no expiry'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copy(link.token)}
                className="shrink-0 rounded-lg border border-border bg-background p-2.5 text-foreground hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Copy full link"
              >
                {copied === link.token
                  ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  : <Copy className="h-4 w-4 text-muted-foreground" />}
              </button>
              <a
                href={`/shared/${link.token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-border bg-background p-2.5 text-foreground hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Open link"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
              <button
                type="button"
                onClick={() => revoke(link.token)}
                disabled={revoking === link.token}
                className="shrink-0 rounded-lg border border-border bg-background p-2.5 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Revoke access"
              >
                <Link2Off className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShareDialog({
  open,
  onOpenChange,
  selectedIds,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedIds: string[];
  onDone: () => void;
}) {
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          documentIds: selectedIds,
          expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as { token?: string; error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error ?? `Server error (${res.status}). Please verify selection.`);
      }
      if (!data?.token) {
        throw new Error('Could not retrieve share link from server.');
      }
      setLink(`${window.location.origin}/shared/${data.token}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not create link');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (v: boolean) => {
    if (!v) { setLink(''); setError(''); setExpiresInDays(''); setCopied(false); onDone(); }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl border-border bg-card p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Share documents</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {selectedIds.length} {selectedIds.length === 1 ? 'document' : 'documents'} selected. Anyone with the link can view them.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {!link ? (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Expiry <span className="font-normal">(optional)</span></label>
                <div className="relative mt-1.5">
                  <Input
                    className="pr-12 text-xs"
                    type="number"
                    min="1"
                    max="3650"
                    placeholder="No expiry"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                  />
                  {expiresInDays && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">days</span>}
                </div>
              </div>
              {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}
              <Button size="sm" className="w-full min-h-[44px] text-xs font-semibold" onClick={generate} disabled={loading}>
                <Share2 className="h-4 w-4 mr-1.5" />
                {loading ? 'Generating…' : 'Generate share link'}
              </Button>
            </>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3.5 shadow-xs w-full min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Check className="h-3 w-3" />
                  </span>
                  <p className="text-xs font-bold text-foreground">Share link ready</p>
                </div>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">Auto-copied</span>
              </div>

              {/* Clean 100% full-width link display pill */}
              <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-muted/60 p-3">
                <p className="w-full min-w-0 text-xs font-mono font-medium text-foreground truncate select-all">
                  {window.location.host}/shared/{(link.split('/shared/')[1] || '').slice(0, 6)}…{(link.split('/shared/')[1] || '').slice(-4)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Link copied to clipboard</p>
              </div>

              {/* Full-width 44px mobile touch action */}
              <Button
                type="button"
                size="sm"
                onClick={copy}
                className="w-full min-h-[44px] text-xs font-semibold rounded-xl"
                data-testid="button-copy-share-link"
              >
                {copied ? (
                  <span className="flex items-center justify-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" /> Copied to clipboard</span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5"><Copy className="h-4 w-4" /> Copy link</span>
                )}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" size="sm" className="w-full min-h-[44px] text-xs font-semibold" onClick={() => handleClose(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Documents() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<'recent' | 'name' | 'size'>('recent');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shareOpen, setShareOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const documents = useListDocuments({ search: search.trim() || undefined, category: category || undefined, sort });
  const categories = useMemo(() => Array.from(new Set((documents.data ?? []).map((d: Document) => d.category))).sort(), [documents.data]);
  const isFiltered = Boolean(search || category);
  const selecting = selected.size > 0;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const selectAll = () => {
    if (documents.data) setSelected(new Set((documents.data as Document[]).map((d) => d.id)));
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-8 lg:py-8 space-y-6" data-testid="page-documents">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl" data-testid="heading-documents">
            Documents
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Searchable index of all your saved files and links.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selecting && (
            <>
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select all
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
              <Button size="sm" onClick={() => setShareOpen(true)}>
                <Share2 className="h-3.5 w-3.5 mr-1" /> Share {selected.size}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setManageOpen(true)} className="flex items-center gap-1 font-semibold text-xs min-h-[38px]" data-testid="button-manage-links">
            <Link2Off className="h-3.5 w-3.5 mr-1" /> Manage links
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)} data-testid="button-add-document-workspace" className="font-semibold">
            <Plus className="h-4 w-4 mr-1" /> Add document
          </Button>
        </div>
      </div>

      {/* Search & Sort Toolbar */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 pr-8 text-xs border-border bg-card"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by title, tag, or category…"
            data-testid="input-search-documents"
          />
          {search && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch('')}
              data-testid="button-clear-search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            data-testid="select-filter-category"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="h-9 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            data-testid="select-sort-documents"
          >
            <option value="recent">Most recent</option>
            <option value="name">Name A–Z</option>
            <option value="size">Largest first</option>
          </select>
        </div>
      </section>

      {/* Active Filter Indicator */}
      {isFiltered && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Active filter applied</span>
          <button className="font-semibold text-foreground underline" onClick={() => { setSearch(''); setCategory(''); }} data-testid="button-clear-filters">
            Clear filter
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground" data-testid="text-document-results">
          {documents.isLoading
            ? 'Loading documents…'
            : `${documents.data?.length ?? 0} ${documents.data?.length === 1 ? 'document' : 'documents'}`}
        </p>
        {!selecting && documents.data && documents.data.length > 0 && (
          <button
            onClick={() => toggleSelect((documents.data as Document[])[0].id)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1"
          >
            <Share2 className="h-3.5 w-3.5" /> Select to share
          </button>
        )}
      </div>

      {/* Dense Grid / List */}
      <div>
        <QueryState
          loading={documents.isLoading}
          error={documents.error}
          onRetry={() => void documents.refetch()}
          empty={
            documents.data?.length === 0 ? (
              <EmptyVault
                onAdd={() => setDialogOpen(true)}
                title={isFiltered ? 'No matching documents' : 'No documents added'}
                description={isFiltered ? 'Try clearing your search query or category filter.' : undefined}
              />
            ) : undefined
          }
        />
        {documents.data && documents.data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(documents.data as Document[]).map((doc) => (
              <SelectableDocumentCard
                key={doc.id}
                document={doc}
                selected={selected.has(doc.id)}
                selecting={selecting}
                onToggle={toggleSelect}
              />
            ))}
          </div>
        )}
      </div>

      <DocumentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        selectedIds={Array.from(selected)}
        onDone={clearSelection}
      />
      <ManageLinksDialog open={manageOpen} onOpenChange={setManageOpen} />
    </div>
  );
}

