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
      {/* Checkbox overlay — always visible when any selection is active */}
      {selecting && (
        <button
          onClick={() => onToggle(document.id)}
          className={`absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors shadow-sm ${
            selected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background/90 hover:border-primary'
          }`}
          aria-label={selected ? 'Deselect' : 'Select'}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </button>
      )}
      <div
        className={`transition-all duration-150 ${selected ? 'ring-2 ring-primary rounded-3xl' : ''}`}
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
      if (res.ok) setLinks(await res.json());
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
      <DialogContent className="rounded-3xl border-card-border bg-card p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="display-title text-xl">Active Share Links</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Revoke any link to instantly cut off access.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {loading && <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>}
          {!loading && links.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No active share links.</p>
          )}
          {links.map((link) => (
            <div key={link.token} className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-foreground truncate">/shared/{link.token.slice(0, 8)}…</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {link.documentIds.length} doc{link.documentIds.length !== 1 ? 's' : ''}
                  {' · '}
                  {link.expiresAt
                    ? `expires ${new Date(link.expiresAt).toLocaleDateString()}`
                    : 'no expiry'}
                  {' · created '}{new Date(link.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => copy(link.token)}
                className="shrink-0 rounded-lg p-1.5 hover:bg-secondary transition-colors"
                title="Copy link"
              >
                {copied === link.token
                  ? <Check className="h-4 w-4 text-emerald-500" />
                  : <Copy className="h-4 w-4 text-muted-foreground" />}
              </button>
              <a
                href={`/shared/${link.token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg p-1.5 hover:bg-secondary transition-colors"
                title="Preview"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
              <button
                onClick={() => revoke(link.token)}
                disabled={revoking === link.token}
                className="shrink-0 rounded-lg p-1.5 hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                title="Revoke"
              >
                <Link2Off className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>Close</Button>
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
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      const { token } = await res.json();
      setLink(`${window.location.origin}/shared/${token}`);
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
      <DialogContent className="rounded-3xl border-card-border bg-card p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="display-title text-xl">Share Documents</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {selectedIds.length} {selectedIds.length === 1 ? 'document' : 'documents'} selected. Anyone with the link can view them — nothing else.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expires after (days)</label>
            <Input
              className="mt-1.5 rounded-xl"
              type="number"
              min="1"
              placeholder="Never (leave blank)"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
            />
          </div>

          {!link ? (
            <>
              {error && <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-xs font-semibold text-destructive">{error}</p>}
              <Button className="w-full rounded-xl" onClick={generate} disabled={loading}>
                <Share2 className="h-4 w-4 mr-1.5" />
                {loading ? 'Generating…' : 'Generate Link'}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2.5">
                <span className="flex-1 truncate text-xs font-mono text-foreground">{link}</span>
                <button onClick={copy} className="shrink-0 rounded-lg p-1.5 hover:bg-secondary transition-colors" title="Copy">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {copied ? '✓ Copied to clipboard' : 'Share this link — recipients see only these documents'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" className="rounded-xl" onClick={() => handleClose(false)}>Done</Button>
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
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 lg:px-10 lg:py-8 animate-fade-in" data-testid="page-documents">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="display-title text-2xl font-extrabold sm:text-3xl text-foreground" data-testid="heading-documents">
            Documents
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            All your files and links, searchable in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selecting && (
            <>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-muted-foreground" onClick={clearSelection}>
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
              <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setShareOpen(true)}>
                <Share2 className="h-3.5 w-3.5" /> Share {selected.size}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => setManageOpen(true)} className="rounded-xl gap-1.5 hidden sm:flex">
            <Link2Off className="h-4 w-4" /> Manage Links
          </Button>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-add-document-workspace" className="w-full md:w-auto rounded-xl">
            <Plus className="h-4 w-4 mr-1.5" /> Add Document
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <section className="mt-6 rounded-3xl border border-border/80 bg-card p-4 shadow-2xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 pr-9 border-border bg-background shadow-2xs focus-visible:ring-2 rounded-2xl"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents by title, tag, or category…"
              data-testid="input-search-documents"
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                onClick={() => setSearch('')}
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <ListFilter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                className="flex min-h-[44px] w-full appearance-none rounded-2xl border border-border bg-background pl-10 pr-10 text-sm font-semibold text-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-ring sm:w-auto min-w-[160px]"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                data-testid="select-filter-category"
              >
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <SlidersHorizontal className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <select
              className="flex min-h-[44px] w-full appearance-none rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-ring sm:w-auto min-w-[150px]"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              data-testid="select-sort-documents"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name A–Z</option>
              <option value="size">Largest First</option>
            </select>
          </div>
        </div>
        {isFiltered && (
          <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Active filter</span>
            <button className="font-bold text-primary hover:underline" onClick={() => { setSearch(''); setCategory(''); }} data-testid="button-clear-filters">Clear</button>
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
        {!selecting && documents.data && documents.data.length > 0 && (
          <button
            className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            onClick={() => toggleSelect((documents.data as Document[])[0].id)}
          >
            <Share2 className="h-3.5 w-3.5" /> Select to share
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="mt-4">
        <QueryState
          loading={documents.isLoading}
          error={documents.error}
          onRetry={() => void documents.refetch()}
          empty={
            documents.data?.length === 0 ? (
              <EmptyVault
                onAdd={() => setDialogOpen(true)}
                title={isFiltered ? 'No matching documents' : 'Nothing here yet'}
                description={isFiltered ? 'Try clearing your filters or searching something else.' : undefined}
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
