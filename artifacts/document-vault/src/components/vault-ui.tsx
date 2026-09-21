import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  FileArchive,
  FileImage,
  FileText,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
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
  getGetSessionQueryKey,
  getListActivityQueryKey,
  getListDocumentsQueryKey,
  useCreateDocument,
  useGetSession,
  useLogout,
} from '@workspace/api-client-react';
import type { Document, DocumentInputFileType, User } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
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

export const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
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

const fileIcon = (type: string) => {
  if (type === 'pdf') return FileText;
  if (['jpg', 'png', 'webp'].includes(type)) return FileImage;
  return FileArchive;
};

export function DocumentCard({ document }: { document: Document }) {
  const Icon = fileIcon(document.fileType);
  return (
    <article className="vault-card vault-card-hover group rounded-[var(--radius)] p-4" data-testid={`card-document-${document.id}`}>
      <div className="mb-5 flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <span className="eyebrow rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{document.fileType}</span>
      </div>
      <Link href={`/documents/${document.id}`} className="focus-ring block" data-testid={`link-document-${document.id}`}>
        <h3 className="line-clamp-2 min-h-12 font-semibold leading-6 text-foreground group-hover:text-accent">{document.title}</h3>
        <p className="mt-2 text-xs text-muted-foreground">{document.category} <span className="mx-1 text-border">/</span> {formatBytes(document.sizeBytes)}</p>
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

export function DocumentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const createDocument = useCreateDocument();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [fileType, setFileType] = useState<DocumentInputFileType>('pdf');
  const [sizeBytes, setSizeBytes] = useState('1');
  const [error, setError] = useState('');

  const reset = () => {
    setTitle('');
    setCategory('');
    setTags('');
    setNotes('');
    setFileType('pdf');
    setSizeBytes('1');
    setError('');
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !category.trim()) {
      setError('A title and category are needed before this can be filed.');
      return;
    }
    const bytes = Number(sizeBytes);
    if (!Number.isFinite(bytes) || bytes < 1) {
      setError('Enter a file size greater than zero.');
      return;
    }
    setError('');
    createDocument.mutate(
      {
        data: {
          title: title.trim(),
          category: category.trim(),
          tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
          notes: notes.trim() || undefined,
          fileType,
          sizeBytes: Math.round(bytes),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
          reset();
          onOpenChange(false);
        },
        onError: () => setError('The vault could not save this document yet. Please try again.'),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) reset(); onOpenChange(value); }}>
      <DialogContent className="border-card-border bg-card sm:max-w-xl">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><UploadCloud className="h-5 w-5" /></div>
          <DialogTitle className="display text-2xl">Add to your vault</DialogTitle>
          <DialogDescription>Save the details now. The secure file transfer can follow when your connection is ready.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" data-testid="form-create-document">
          <div className="grid gap-4 sm:grid-cols-[1.5fr_.8fr]">
            <label className="space-y-1.5 text-sm font-medium">Document title
              <Input data-testid="input-document-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Passport renewal" />
            </label>
            <label className="space-y-1.5 text-sm font-medium">Category
              <Input data-testid="input-document-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Identity" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
            <label className="space-y-1.5 text-sm font-medium">File type
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" data-testid="select-document-type" value={fileType} onChange={(event) => setFileType(event.target.value as DocumentInputFileType)}>
                <option value="pdf">PDF</option><option value="png">PNG</option><option value="jpg">JPG</option><option value="webp">WEBP</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium">Size in bytes
              <Input data-testid="input-document-size" type="number" min="1" value={sizeBytes} onChange={(event) => setSizeBytes(event.target.value)} />
            </label>
          </div>
          <label className="block space-y-1.5 text-sm font-medium">Tags <span className="font-normal text-muted-foreground">comma separated</span>
            <Input data-testid="input-document-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="travel, renewal, 2025" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">Notes <span className="font-normal text-muted-foreground">optional</span>
            <Textarea data-testid="input-document-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="A small reminder for future you" maxLength={2000} />
          </label>
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" data-testid="status-document-form-error">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-document">Cancel</Button>
            <Button type="submit" disabled={createDocument.isPending} data-testid="button-save-document">{createDocument.isPending ? 'Saving…' : 'Save document'}</Button>
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
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation('/login');
      },
    });
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
          return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={cn('focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors', active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground')} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon className="h-[17px] w-[17px]" /><span>{label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary-foreground/65" />}</Link>;
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4">
        <div className="flex items-center gap-2 text-sidebar-primary"><Sparkles className="h-4 w-4" /><span className="text-xs font-semibold">A quieter way to keep things</span></div>
        <p className="mt-2 text-xs leading-5 text-sidebar-foreground/55">Your important details, in their place and out of the way.</p>
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-sidebar-border px-2 pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary/15 text-xs font-semibold text-sidebar-primary" data-testid="avatar-user">{initials(user?.name)}</div>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold" data-testid="text-shell-user">{user?.name || 'Your account'}</p><p className="truncate text-xs text-sidebar-foreground/50">{user?.email || 'Session protected'}</p></div>
        <button className="rounded-lg p-2 text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={handleLogout} disabled={logout.isPending} data-testid="button-logout"><LogOut className="h-4 w-4" /></button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="fixed inset-y-0 left-0 z-40 hidden md:block">{sidebar}</div>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-primary/30 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} data-testid="overlay-mobile-menu"><div className="h-full" onClick={(event) => event.stopPropagation()}>{sidebar}</div></div>}
      <div className="md:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-border/70 bg-background/90 px-5 backdrop-blur-md sm:px-8">
          <button className="mr-3 rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-menu"><Menu className="h-5 w-5" /></button>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><BookOpen className="h-4 w-4" /><span>Personal document vault</span></div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground lg:flex"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> Private by default</div>
            <Link href="/settings" className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary" data-testid="link-header-settings">{initials(user?.name)}</Link>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}