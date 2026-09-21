import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  FileUp,
  FileArchive,
  FileImage,
  FileText,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  X,
} from 'lucide-react';
import {
  getGetDashboardSummaryQueryKey,
  getListActivityQueryKey,
  getListDocumentsQueryKey,
  useGetSession,
  useLogout,
} from '@workspace/api-client-react';
import type { Document, User } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export const formatBytes = (bytes: number | null | undefined) => {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
};

export const formatDate = (value: string | undefined, includeTime = false) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(date);
};

export const initials = (name = 'You') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'Y';

export function LoadingRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" data-testid="loading-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton h-[76px] rounded-[var(--radius)]" key={index} />
      ))}
    </div>
  );
}

export function QueryState({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading: boolean;
  error?: unknown;
  empty?: React.ReactNode;
  onRetry?: () => void;
}) {
  if (loading) return <LoadingRows />;
  if (error) {
    return (
      <div className="vault-card rounded-[var(--radius)] border-dashed p-10 text-center" data-testid="state-error">
        <ShieldCheck className="mx-auto mb-3 h-7 w-7 text-accent" />
        <p className="font-semibold">Haven could not reach the vault</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Your space is safe. Try again when the connection is ready.</p>
        {onRetry && <Button data-testid="button-retry" variant="outline" className="mt-5" onClick={onRetry}>Try again</Button>}
      </div>
    );
  }
  return empty ? <>{empty}</> : null;
}

const fileIcon = (type: string | null | undefined) => {
  if (type === 'pdf') return FileText;
  if (type && ['jpg', 'png', 'webp'].includes(type)) return FileImage;
  return FileArchive;
};

const FILE_TYPE_LABEL: Record<string, string> = {
  pdf: 'PDF',
  png: 'PNG',
  jpg: 'JPG',
  webp: 'WEBP',
};

export function DocumentCard({ document }: { document: Document }) {
  const Icon = fileIcon(document.fileType);
  const isLink = document.sourceType === 'link';
  return (
    <article className="vault-card vault-card-hover group rounded-[var(--radius)] p-4" data-testid={`card-document-${document.id}`}>
      <div className="mb-5 flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
          {isLink ? <Link2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </div>
        <span className="eyebrow rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
          {isLink ? 'Link' : (FILE_TYPE_LABEL[document.fileType ?? ''] ?? document.fileType)}
        </span>
      </div>
      <Link href={`/documents/${document.id}`} className="focus-ring block" data-testid={`link-document-${document.id}`}>
        <h3 className="line-clamp-2 min-h-12 font-semibold leading-6 text-foreground group-hover:text-accent">{document.title}</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          {document.category}
          {!isLink && document.sizeBytes ? <><span className="mx-1 text-border">/</span>{formatBytes(document.sizeBytes)}</> : null}
        </p>
      </Link>
      <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
        <span className="text-xs text-muted-foreground">{formatDate(document.updatedAt)}</span>
        <Link href={`/documents/${document.id}`} className="focus-ring rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" data-testid={`button-open-document-${document.id}`}>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export function EmptyVault({
  onAdd,
  title = 'Your vault is still quiet',
  description = 'Add the first document and give an important piece of paper a place to land.',
}: {
  onAdd?: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <div className="paper-grid rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center" data-testid="empty-vault">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <FolderOpen className="h-6 w-6" />
      </div>
      <h3 className="display mt-5 text-2xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {onAdd && <Button onClick={onAdd} data-testid="button-empty-add" className="mt-6"><Plus className="h-4 w-4" /> Add a document</Button>}
    </div>
  );
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  title: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this document?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-semibold text-foreground">{title}</span> will be removed from your vault and deleted from your Google Drive. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Removing…' : 'Yes, remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const SUPPORTED_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

async function uploadDocument(formData: FormData): Promise<Document> {
  const res = await fetch('/api/documents', { method: 'POST', body: formData, credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<Document>;
}

async function linkDocument(body: object): Promise<Document> {
  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<Document>;
}

export function DocumentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setMode('upload');
    setTitle('');
    setCategory('');
    setTags('');
    setNotes('');
    setSelectedFile(null);
    setSourceUrl('');
    setError('');
    setSaving(false);
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!SUPPORTED_MIME[file.type]) { setError('Choose a PDF, PNG, JPG, or WEBP file.'); return; }
    if (file.size > 50 * 1024 * 1024) { setError('Files must be 50 MB or smaller.'); return; }
    setSelectedFile(file);
    setError('');
    if (!title.trim()) setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '));
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !category.trim()) { setError('A title and category are required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (mode === 'upload') {
        if (!selectedFile) { setError('Choose a file to upload.'); setSaving(false); return; }
        const fd = new FormData();
        fd.append('file', selectedFile);
        fd.append('title', title.trim());
        fd.append('category', category.trim());
        fd.append('tags', tags);
        fd.append('notes', notes.trim());
        await uploadDocument(fd);
      } else {
        if (!sourceUrl.trim()) { setError('Paste a Google Drive link.'); setSaving(false); return; }
        await linkDocument({ title: title.trim(), category: category.trim(), tags: tags.split(',').map((t) => t.trim()).filter(Boolean), notes: notes.trim() || undefined, sourceUrl: sourceUrl.trim() });
      }
      invalidate();
      reset();
      onOpenChange(false);
    } catch {
      setError('Could not save this document. Please try again.');
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) reset(); onOpenChange(value); }}>
      <DialogContent className="border-card-border bg-card sm:max-w-xl">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><UploadCloud className="h-5 w-5" /></div>
          <DialogTitle className="display text-2xl">Add to your vault</DialogTitle>
          <DialogDescription>Upload a file to your Drive, or link an existing Drive document.</DialogDescription>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="flex rounded-xl border border-border bg-muted/50 p-1">
          {(['upload', 'link'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(''); }}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors',
                mode === m ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
              data-testid={`tab-${m}`}
            >
              {m === 'upload' ? <FileUp className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {m === 'upload' ? 'Upload file' : 'Link from Drive'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4" data-testid="form-create-document">
          {mode === 'upload' ? (
            <label
              className="group block cursor-pointer rounded-2xl border border-dashed border-border bg-background/60 p-5 transition-colors hover:border-accent hover:bg-secondary/40"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              data-testid="dropzone-document-file"
            >
              <input className="sr-only" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => handleFile(e.target.files?.[0])} data-testid="input-document-file" />
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary transition-transform group-hover:-translate-y-0.5">
                  {selectedFile ? <Check className="h-5 w-5" /> : <FileUp className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" data-testid="text-selected-file">
                    {selectedFile ? selectedFile.name : 'Drop a file here or browse'}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {selectedFile
                      ? `${(selectedFile.type.split('/')[1] ?? '').toUpperCase()} · ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                      : 'PDF, PNG, JPG, or WEBP · up to 50 MB · saved to your Drive'}
                  </p>
                </div>
              </div>
            </label>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Google Drive link</label>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-10"
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/…"
                  data-testid="input-source-url"
                />
              </div>
              <p className="text-xs text-muted-foreground">Paste a link to any file already in your Google Drive.</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-[1.5fr_.8fr]">
            <label className="space-y-1.5 text-sm font-medium">Document title
              <Input data-testid="input-document-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Passport renewal" />
            </label>
            <label className="space-y-1.5 text-sm font-medium">Category
              <Input data-testid="input-document-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Identity" />
            </label>
          </div>
          <label className="block space-y-1.5 text-sm font-medium">Tags <span className="font-normal text-muted-foreground">comma separated</span>
            <Input data-testid="input-document-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="travel, renewal, 2025" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">Notes <span className="font-normal text-muted-foreground">optional</span>
            <Textarea data-testid="input-document-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="A small reminder for future you" maxLength={2000} />
          </label>
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" data-testid="status-document-form-error">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-document">Cancel</Button>
            <Button type="submit" disabled={saving} data-testid="button-save-document">{saving ? 'Saving…' : 'Save to vault'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/documents', label: 'Documents', icon: FolderOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useGetSession();
  const logout = useLogout();
  const user: User | undefined = session?.user;
  const isAdmin = user?.role === 'ADMIN';
  const allNavItems = isAdmin ? [...navItems, { href: '/admin', label: 'Admin view', icon: Users }] : navItems;

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => setLocation('/login') });
  };

  const sidebar = (
    <aside className="flex h-full w-[264px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground">
      <div className="flex items-center justify-between px-3">
        <Link href="/dashboard" className="focus-ring flex items-center gap-3" data-testid="link-brand">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><KeyRound className="h-[18px] w-[18px]" /></span>
          <span><span className="display block text-xl leading-5">Haven</span><span className="eyebrow text-sidebar-foreground/55">vault</span></span>
        </Link>
        <button className="rounded-lg p-2 text-sidebar-foreground/55 hover:bg-sidebar-accent md:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-menu"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-12 px-3"><p className="eyebrow text-sidebar-foreground/45">Your space</p></div>
      <nav className="mt-3 space-y-1" aria-label="Main navigation">
        {allNavItems.map(({ href, label, icon: Icon }) => {
          const active = location === href || (href === '/documents' && location.startsWith('/documents/'));
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={cn('focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors', active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground')} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <Icon className="h-[17px] w-[17px]" /><span>{label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary-foreground/65" />}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4">
        <div className="flex items-center gap-2 text-sidebar-primary"><Sparkles className="h-4 w-4" /><span className="text-xs font-semibold">Files live in your Drive</span></div>
        <p className="mt-2 text-xs leading-5 text-sidebar-foreground/55">Haven organizes them. You own them.</p>
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-sidebar-border px-2 pt-4">
        {session?.user?.picture ? (
          <img src={session.user.picture} alt={user?.name} className="h-9 w-9 rounded-full object-cover" data-testid="avatar-user" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary/15 text-xs font-semibold text-sidebar-primary" data-testid="avatar-user">{initials(user?.name)}</div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" data-testid="text-shell-user">{user?.name || 'Your account'}</p>
          <p className="truncate text-xs text-sidebar-foreground/50">{user?.email || 'Session protected'}</p>
        </div>
        <button className="rounded-lg p-2 text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={handleLogout} disabled={logout.isPending} data-testid="button-logout"><LogOut className="h-4 w-4" /></button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="fixed inset-y-0 left-0 z-40 hidden md:block">{sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-primary/30 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} data-testid="overlay-mobile-menu">
          <div className="h-full" onClick={(e) => e.stopPropagation()}>{sidebar}</div>
        </div>
      )}
      <div className="md:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-border/70 bg-background/90 px-5 backdrop-blur-md sm:px-8">
          <button className="mr-3 rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-menu"><Menu className="h-5 w-5" /></button>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><BookOpen className="h-4 w-4" /><span>Personal document vault</span></div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground lg:flex"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> Your Drive, your files</div>
            <Link href="/settings" className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary overflow-hidden" data-testid="link-header-settings">
              {session?.user?.picture ? <img src={session.user.picture} alt="" className="h-full w-full object-cover" /> : initials(user?.name)}
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
