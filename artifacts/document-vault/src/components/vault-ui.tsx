import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Check,
  FileArchive,
  FileImage,
  FileText,
  FolderOpen,
  KeyRound,
  Link2,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  Users,
  X,
  LayoutDashboard,
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
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';
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
        <Skeleton className="h-16 w-full rounded-xl bg-muted" key={index} />
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
      <div className="vault-card-surface rounded-xl border border-border p-8 text-center" data-testid="state-error">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <p className="font-semibold text-foreground text-base">Could not reach your vault</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">Check your connection and try again. Your data remains safe.</p>
        {onRetry && (
          <Button data-testid="button-retry" variant="outline" size="sm" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        )}
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

export function getGoogleEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // 1. Google Drive File: drive.google.com/file/d/FILE_ID
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;
  }

  // 2. Google Docs: docs.google.com/document/d/DOC_ID
  const docsMatch = trimmed.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docsMatch && docsMatch[1]) {
    return `https://docs.google.com/document/d/${docsMatch[1]}/preview`;
  }

  // 3. Google Sheets: docs.google.com/spreadsheets/d/SHEET_ID
  const sheetsMatch = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetsMatch && sheetsMatch[1]) {
    return `https://docs.google.com/spreadsheets/d/${sheetsMatch[1]}/preview`;
  }

  // 4. Google Slides: docs.google.com/presentation/d/SLIDE_ID
  const slidesMatch = trimmed.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (slidesMatch && slidesMatch[1]) {
    return `https://docs.google.com/presentation/d/${slidesMatch[1]}/embed?start=false&loop=false`;
  }

  // 5. Google Drive Folder: drive.google.com/drive/folders/FOLDER_ID
  const folderMatch = trimmed.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#grid`;
  }

  // Generic Google Docs/Drive URL check
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    if (trimmed.includes('/view') || trimmed.includes('/edit')) {
      return trimmed.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
    }
    return trimmed;
  }

  return null;
}

export function DocumentCard({ document }: { document: Document }) {
  const Icon = fileIcon(document.fileType);
  const isLink = document.sourceType === 'link';
  const embedUrl = getGoogleEmbedUrl(document.sourceUrl);
  const isGoogle = Boolean(embedUrl || (document.sourceUrl && (document.sourceUrl.includes('google.com') || document.sourceUrl.includes('drive.google'))));

  return (
    <Link href={`/documents/${document.id}`} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl" data-testid={`card-document-${document.id}`}>
      <article className="vault-card-surface flex h-full flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30">
        {/* Thumbnail Header */}
        <div className="relative flex h-28 w-full items-center justify-center rounded-lg bg-muted/60 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border text-foreground">
            {isGoogle ? <Link2 className="h-5 w-5" /> : isLink ? <Link2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
          </div>
          
          <span className="absolute right-2.5 top-2.5 rounded bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground border border-border">
            {isGoogle ? 'Google Drive' : isLink ? 'Link' : (FILE_TYPE_LABEL[document.fileType ?? ''] ?? document.fileType ?? 'File')}
          </span>
        </div>

        {/* Content */}
        <div className="mt-3 flex-1">
          <h3 className="line-clamp-2 text-xs font-semibold text-foreground group-hover:underline">
            {document.title}
          </h3>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="rounded bg-muted px-2 py-0.5 font-medium">{document.category}</span>
            <span>{formatDate(document.updatedAt)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function EmptyVault({
  onAdd,
  title = 'No documents found',
  description = 'Add your first document link or file to get started.',
}: {
  onAdd?: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center" data-testid="empty-vault">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <FolderOpen className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-base font-bold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
      {onAdd && (
        <Button onClick={onAdd} data-testid="button-empty-add" size="sm" className="mt-4">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add document
        </Button>
      )}
    </div>
  );
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  title,
  sourceType = 'upload',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  title: string;
  sourceType?: 'upload' | 'link';
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-border bg-card p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold">Remove document</AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to remove <strong className="text-foreground">{title}</strong>? {sourceType === 'link' ? 'The original file on Google Drive will remain untouched.' : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel className="rounded-lg text-xs">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-lg text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Removing…' : 'Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DocumentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle('');
    setCategory('');
    setTags('');
    setNotes('');
    setSourceUrl('');
    setError('');
    setSaving(false);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !category.trim()) { setError('Title and category are required.'); return; }
    if (!sourceUrl.trim()) { setError('Paste a document or Google Drive link.'); return; }
    try { new URL(sourceUrl.trim()); } catch { setError('Enter a valid link URL.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'link',
          title: title.trim(),
          category: category.trim(),
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          notes: notes.trim() || undefined,
          sourceUrl: sourceUrl.trim(),
        }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      invalidate();
      reset();
      onOpenChange(false);
    } catch {
      setError('Could not save document. Please try again.');
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) reset(); onOpenChange(value); }}>
      <DialogContent className="rounded-2xl border-border bg-card p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add document</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Paste a Google Drive, Docs, Sheets, Slides or web document link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="mt-2 space-y-4" data-testid="form-create-document">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Document or Drive link *</label>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 text-xs"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/…"
                data-testid="input-source-url"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-xs font-medium text-muted-foreground">Title *
              <Input className="mt-1 text-xs" data-testid="input-document-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Passport, Tax Return" required />
            </label>
            <label className="block space-y-1.5 text-xs font-medium text-muted-foreground">Category *
              <Input className="mt-1 text-xs" data-testid="input-document-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Identity, Financial" required />
            </label>
          </div>
          <label className="block space-y-1.5 text-xs font-medium text-muted-foreground">Tags <span className="font-normal text-muted-foreground">(comma separated)</span>
            <Input className="mt-1 text-xs" data-testid="input-document-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. 2026, renewal" />
          </label>
          <label className="block space-y-1.5 text-xs font-medium text-muted-foreground">Notes <span className="font-normal text-muted-foreground">(optional)</span>
            <Textarea className="mt-1 min-h-[70px] text-xs resize-none" data-testid="input-document-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional details…" maxLength={2000} />
          </label>
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive" data-testid="status-document-form-error">{error}</p>}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} data-testid="button-cancel-document">Cancel</Button>
            <Button type="submit" size="sm" disabled={saving} data-testid="button-save-document">{saving ? 'Saving…' : 'Save document'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FeedbackDialog() {
  const { data: session } = useGetSession();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
      setMessage('');
    } catch {
      setStatus('error');
    }
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) { setStatus('idle'); setMessage(''); }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[36px]"
        data-testid="button-feedback-trigger"
      >
        <MessageSquare className="h-3.5 w-3.5" /> Feedback
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="rounded-2xl border-border bg-card p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Share feedback</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Report a bug, suggest a feature, or leave a note.
            </DialogDescription>
          </DialogHeader>

          {status === 'sent' ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Check className="h-5 w-5" />
              </span>
              <p className="text-xs font-semibold text-foreground">Feedback received</p>
              <p className="text-[11px] text-muted-foreground">We will reply to <strong>{session?.user?.email}</strong> if needed.</p>
              <button onClick={() => setStatus('idle')} className="mt-1 text-xs text-foreground underline font-medium">Send another</button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-2 space-y-4">
              <Textarea
                value={message}
                onChange={(e) => { setMessage(e.target.value); if (status === 'error') setStatus('idle'); }}
                placeholder="What is on your mind?"
                maxLength={2000}
                className="min-h-[100px] resize-none rounded-lg text-xs"
                data-testid="input-feedback-dialog"
                autoFocus
              />
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-muted-foreground">{message.length} / 2000</span>
                <div className="flex items-center gap-2">
                  {status === 'error' && <p className="text-xs text-destructive">Failed to send.</p>}
                  <Button type="submit" size="sm" disabled={status === 'sending' || !message.trim()}>
                    <Send className="h-3.5 w-3.5 mr-1" />
                    {status === 'sending' ? 'Sending…' : 'Send'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/documents', label: 'Documents', icon: FolderOpen },
  { href: '/vault', label: 'Passwords', icon: KeyRound },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useGetSession();
  const logout = useLogout();
  const user: User | undefined = session?.user;
  const isAdmin = user?.role === 'ADMIN';
  const allNavItems = isAdmin ? [...navItems, { href: '/admin', label: 'Admin', icon: Users }] : navItems;

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => setLocation('/') });
  };

  const sidebarContent = (
    <aside className="flex h-full w-[240px] flex-col bg-sidebar px-3 py-5 text-sidebar-foreground border-r border-sidebar-border">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-2">
        <Link href="/dashboard" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-lg p-1" data-testid="link-brand">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <KeyRound className="h-4 w-4" />
          </span>
          <span className="text-base font-bold text-sidebar-foreground tracking-tight">Haven</span>
        </Link>
        <button
          className="rounded-lg p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent md:hidden"
          onClick={() => setMobileOpen(false)}
          data-testid="button-close-menu"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="mt-6 space-y-1" aria-label="Main navigation">
        {allNavItems.map(({ href, label, icon: Icon }) => {
          const active = location === href || (href === '/documents' && location.startsWith('/documents/'));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors min-h-[40px]',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
              data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="mt-auto flex items-center gap-2.5 border-t border-sidebar-border px-2 pt-4">
        {session?.user?.picture ? (
          <img src={session.user.picture} alt={user?.name} className="h-8 w-8 rounded-full object-cover border border-sidebar-border" data-testid="avatar-user" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-foreground" data-testid="avatar-user">
            {initials(user?.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-sidebar-foreground" data-testid="text-shell-user">
            {user?.name || 'Account'}
          </p>
          <p className="truncate text-[10px] text-sidebar-foreground/50">{user?.email}</p>
        </div>
        <button
          className="rounded-lg p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          onClick={handleLogout}
          disabled={logout.isPending}
          data-testid="button-logout"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Desktop Fixed Sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden md:block">{sidebarContent}</div>

      {/* Mobile Navigation Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
          data-testid="overlay-mobile-menu"
        >
          <div className="h-full w-[240px]" onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="md:pl-[240px]">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background/90 px-4 sm:px-8 backdrop-blur-md justify-between">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setMobileOpen(true)}
              data-testid="button-open-menu"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 text-xs font-medium text-muted-foreground sm:flex">
              <BookOpen className="h-4 w-4 text-foreground" />
              <span>Haven Vault</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <FeedbackDialog />
            <div className="hidden items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground lg:flex" title="AES-256-GCM encrypted">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> AES-256 Protected
            </div>
            <Link
              href="/settings"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground overflow-hidden border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="link-header-settings"
              title="Account settings"
            >
              {session?.user?.picture ? (
                <img src={session.user.picture} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(user?.name)
              )}
            </Link>
          </div>
        </header>

        {/* Page Container */}
        <main className="pb-20 md:pb-10">{children}</main>

        {/* Mobile Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-border bg-background px-2 md:hidden">
          {allNavItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href === '/documents' && location.startsWith('/documents/'));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors min-h-[44px]',
                  active ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 mb-0.5" />
                <span className="truncate max-w-[64px]">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

