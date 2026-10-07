import { useEffect, useState } from 'react';
import {
  Check, ClipboardCopy, Eye, EyeOff, ExternalLink, KeyRound, Pencil, Plus, ShieldCheck, Trash2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetCredentialQueryKey,
  getListCredentialsQueryKey,
  useCreateCredential,
  useDeleteCredential,
  useGetCredential,
  useListCredentials,
  useUpdateCredential,
} from '@workspace/api-client-react';
import type { Credential } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { QueryState } from '@/components/vault-ui';

// ── Reveal password for a single card with auto-hide timeout ──────────────────
function RevealPassword({ id }: { id: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const query = useGetCredential(id, { query: { queryKey: getGetCredentialQueryKey(id), enabled: show } });

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => {
      setShow(false);
    }, 15000); // Auto hide after 15 seconds
    return () => clearTimeout(timer);
  }, [show]);

  const copy = async () => {
    if (!query.data?.password) return;
    await navigator.clipboard.writeText(query.data.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="font-mono flex-1 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs tracking-widest text-foreground font-medium truncate select-all">
        {show && query.data ? query.data.password : '••••••••••••'}
      </span>
      <button
        onClick={() => setShow((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title={show ? 'Hide password' : 'Show password'}
        data-testid={`button-toggle-password-${id}`}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button
        onClick={copy}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title="Copy password to clipboard"
        data-testid={`button-copy-password-${id}`}
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <ClipboardCopy className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── Add / Edit dialog ─────────────────────────────────────────────────────────
function CredentialDialog({
  open, onOpenChange, editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Credential;
}) {
  const queryClient = useQueryClient();
  const create = useCreateCredential();
  const update = useUpdateCredential();
  const [accountName, setAccountName] = useState(editing?.accountName ?? '');
  const [username, setUsername] = useState(editing?.username ?? '');
  const [password, setPassword] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState(editing?.websiteUrl ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setAccountName(editing?.accountName ?? '');
      setUsername(editing?.username ?? '');
      setPassword('');
      setWebsiteUrl(editing?.websiteUrl ?? '');
      setNotes(editing?.notes ?? '');
      setError('');
    }
  }, [open, editing?.id]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!accountName.trim()) { setError('Account name is required.'); return; }
    if (!editing && !password.trim()) { setError('Password is required.'); return; }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: { accountName: accountName.trim(), username: username.trim(), ...(password ? { password } : {}), websiteUrl: websiteUrl.trim(), notes: notes.trim() } });
      } else {
        await create.mutateAsync({ data: { accountName: accountName.trim(), username: username.trim(), password, websiteUrl: websiteUrl.trim(), notes: notes.trim() } });
      }
      invalidate();
      onOpenChange(false);
    } catch { setError('Could not save credential. Please try again.'); }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-border bg-card p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {editing ? 'Edit credential' : 'Add credential'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="mt-3 space-y-3.5" data-testid="form-credential">
          <label className="block space-y-1 text-xs font-medium text-muted-foreground">
            Account name *
            <Input className="text-xs" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. GitHub, Google, Banking" required data-testid="input-account-name" />
          </label>
          <label className="block space-y-1 text-xs font-medium text-muted-foreground">
            Username / Email
            <Input className="text-xs" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="user@example.com" data-testid="input-username" />
          </label>
          <label className="block space-y-1 text-xs font-medium text-muted-foreground">
            Password {editing && <span className="font-normal text-muted-foreground">(leave blank to keep current)</span>}
            <Input className="text-xs" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" data-testid="input-vault-password" />
          </label>
          <label className="block space-y-1 text-xs font-medium text-muted-foreground">
            Website URL
            <Input className="text-xs" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" data-testid="input-website-url" />
          </label>
          <label className="block space-y-1 text-xs font-medium text-muted-foreground">
            Notes <span className="font-normal text-muted-foreground">(optional)</span>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Security questions or recovery hints" maxLength={500} className="min-h-[70px] text-xs resize-none" data-testid="input-credential-notes" />
          </label>
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isPending} data-testid="button-save-credential">{isPending ? 'Saving…' : 'Save credential'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Credential card ───────────────────────────────────────────────────────────
function CredentialCard({ cred, onEdit }: { cred: Credential; onEdit: (c: Credential) => void }) {
  const queryClient = useQueryClient();
  const del = useDeleteCredential();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const initial = cred.accountName ? cred.accountName.charAt(0).toUpperCase() : 'P';

  const remove = () => {
    del.mutate({ id: cred.id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() }),
    });
  };

  return (
    <article className="vault-card-surface flex flex-col justify-between rounded-xl p-4 border border-border bg-card" data-testid={`card-credential-${cred.id}`}>
      <div>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground border border-border">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm leading-snug text-foreground truncate" data-testid={`text-account-name-${cred.id}`}>
                {cred.accountName}
              </h3>
              {cred.username && (
                <p className="mt-0.5 text-xs text-muted-foreground truncate" data-testid={`text-username-${cred.id}`}>
                  {cred.username}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {cred.websiteUrl && (
              <a
                href={cred.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="Open website"
                data-testid={`link-website-${cred.id}`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={() => onEdit(cred)}
              className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid={`button-edit-credential-${cred.id}`}
              title="Edit credential"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid={`button-delete-credential-${cred.id}`}
              title="Delete credential"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <RevealPassword id={cred.id} />
        {cred.notes && <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">{cred.notes}</p>}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Delete credential?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              <strong className="text-foreground">{cred.accountName}</strong> will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-lg text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={remove}
              disabled={del.isPending}
            >
              {del.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Vault() {
  const credentials = useListCredentials();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Credential | undefined>();

  const openAdd = () => { setEditing(undefined); setDialogOpen(true); };
  const openEdit = (c: Credential) => { setEditing(c); setDialogOpen(true); };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-8 lg:py-8 space-y-6" data-testid="page-vault">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>AES-256-GCM Encrypted</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl" data-testid="heading-vault">
            Password Vault
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            All credentials encrypted at rest. Revealed only when requested.
          </p>
        </div>
        <Button onClick={openAdd} data-testid="button-add-credential" size="sm" className="w-full sm:w-auto font-semibold">
          <Plus className="h-4 w-4 mr-1" /> Add credential
        </Button>
      </div>

      <div>
        <QueryState
          loading={credentials.isLoading}
          error={credentials.error}
          onRetry={() => void credentials.refetch()}
          empty={
            credentials.data?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center" data-testid="empty-vault-credentials">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">No passwords saved</h3>
                <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                  Save your first login credential encrypted in your vault.
                </p>
                <Button onClick={openAdd} size="sm" className="mt-4" data-testid="button-empty-add-credential">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add credential
                </Button>
              </div>
            ) : undefined
          }
        />
        {credentials.data && credentials.data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {credentials.data.map((cred) => (
              <CredentialCard key={cred.id} cred={cred} onEdit={openEdit} />
            ))}
          </div>
        )}
      </div>

      <CredentialDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(undefined); }}
        editing={editing}
      />
    </div>
  );
}

