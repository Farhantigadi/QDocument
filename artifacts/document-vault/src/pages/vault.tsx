import { useEffect, useState } from 'react';
import {
  Check, ClipboardCopy, Eye, EyeOff, ExternalLink, KeyRound, Pencil, Plus, Trash2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
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

// ── Reveal password for a single card ────────────────────────────────────────
function RevealPassword({ id }: { id: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const query = useGetCredential(id, { query: { enabled: show } });

  const copy = async () => {
    if (!query.data?.password) return;
    await navigator.clipboard.writeText(query.data.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="mono flex-1 rounded-lg bg-muted px-3 py-1.5 text-sm tracking-widest">
        {show && query.data ? query.data.password : '••••••••••••'}
      </span>
      <button
        onClick={() => setShow((v) => !v)}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        title={show ? 'Hide' : 'Show'}
        data-testid={`button-toggle-password-${id}`}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button
        onClick={copy}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        title="Copy password"
        data-testid={`button-copy-password-${id}`}
      >
        {copied ? <Check className="h-4 w-4 text-accent" /> : <ClipboardCopy className="h-4 w-4" />}
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

  // Reset form fields whenever the dialog opens or the editing target changes
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
    } catch { setError('Could not save. Please try again.'); }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><KeyRound className="h-5 w-5" /></div>
          <DialogTitle className="display text-2xl">{editing ? 'Edit credential' : 'Add credential'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" data-testid="form-credential">
          <label className="block space-y-1.5 text-sm font-medium">Account name *
            <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. Gmail, Netflix" data-testid="input-account-name" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">Username / Email
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="user@example.com" data-testid="input-username" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Password {editing && <span className="font-normal text-muted-foreground">(leave blank to keep current)</span>}
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" data-testid="input-vault-password" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">Website URL
            <Input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" data-testid="input-website-url" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">Notes
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" maxLength={500} data-testid="input-credential-notes" />
          </label>
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-credential">{isPending ? 'Saving…' : 'Save'}</Button>
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

  const remove = () => {
    del.mutate({ id: cred.id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() }),
    });
  };

  return (
    <article className="vault-card rounded-[var(--radius)] p-5" data-testid={`card-credential-${cred.id}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold leading-5" data-testid={`text-account-name-${cred.id}`}>{cred.accountName}</h3>
          {cred.username && <p className="mt-0.5 text-xs text-muted-foreground" data-testid={`text-username-${cred.id}`}>{cred.username}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {cred.websiteUrl && (
            <a href={cred.websiteUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Open website" data-testid={`link-website-${cred.id}`}>
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button onClick={() => onEdit(cred)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid={`button-edit-credential-${cred.id}`}>
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteOpen(true)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive" data-testid={`button-delete-credential-${cred.id}`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <RevealPassword id={cred.id} />
      {cred.notes && <p className="mt-3 text-xs leading-5 text-muted-foreground">{cred.notes}</p>}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this credential?</AlertDialogTitle>
            <AlertDialogDescription><span className="font-semibold text-foreground">{cred.accountName}</span> will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={remove} disabled={del.isPending}>
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
    <div className="vault-page mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-11" data-testid="page-vault">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-accent">Encrypted with AES-256-GCM</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl" data-testid="heading-vault">Password Vault<span className="text-accent">.</span></h1>
          <p className="mt-3 text-sm text-muted-foreground">Passwords are encrypted at rest. Only you can reveal them.</p>
        </div>
        <Button onClick={openAdd} data-testid="button-add-credential"><Plus className="h-4 w-4" /> Add credential</Button>
      </div>

      <div className="mt-9">
        <QueryState
          loading={credentials.isLoading}
          error={credentials.error}
          onRetry={() => void credentials.refetch()}
          empty={
            credentials.data?.length === 0 ? (
              <div className="paper-grid rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center" data-testid="empty-vault-credentials">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><KeyRound className="h-6 w-6" /></div>
                <h3 className="display mt-5 text-2xl">No passwords saved yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Add your first credential and it will be encrypted immediately.</p>
                <Button onClick={openAdd} className="mt-6" data-testid="button-empty-add-credential"><Plus className="h-4 w-4" /> Add credential</Button>
              </div>
            ) : undefined
          }
        />
        {credentials.data && credentials.data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
