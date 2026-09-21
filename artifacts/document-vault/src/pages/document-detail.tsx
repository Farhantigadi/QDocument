import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, FileImage, FileText, Link2, MoreHorizontal, Pencil, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetDashboardSummaryQueryKey,
  getGetDocumentQueryKey,
  getListActivityQueryKey,
  getListDocumentsQueryKey,
  useDeleteDocument,
  useGetDocument,
  useUpdateDocument,
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DeleteConfirmDialog, LoadingRows, formatBytes, formatDate, QueryState } from '@/components/vault-ui';

export default function DocumentDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const documentQuery = useGetDocument(id, { query: { queryKey: getGetDocumentQueryKey(id), enabled: Boolean(id) } });
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [notice, setNotice] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (documentQuery.data) {
      setTitle(documentQuery.data.title);
      setCategory(documentQuery.data.category);
      setTags((documentQuery.data.tags ?? []).join(', '));
      setNotes(documentQuery.data.notes ?? '');
    }
  }, [documentQuery.data]);

  const document = documentQuery.data;
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !category.trim()) {
      setNotice('Title and category cannot be empty.');
      return;
    }
    updateDocument.mutate({ documentId: id, data: { title: title.trim(), category: category.trim(), tags: tags.split(',').map((item) => item.trim()).filter(Boolean), notes: notes.trim() || undefined } }, {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetDocumentQueryKey(id), updated);
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
        setEditing(false);
        setNotice('Saved to your vault.');
      },
      onError: () => setNotice('This document could not be saved yet.'),
    });
  };

  const remove = () => {
    deleteDocument.mutate({ documentId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
        setLocation('/documents');
      },
      onError: () => setNotice('This document could not be removed yet.'),
    });
  };

  return (
    <div className="vault-page mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:px-10 lg:py-11" data-testid="page-document-detail">
      <Link href="/documents" className="focus-ring inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" data-testid="link-back-documents"><ArrowLeft className="h-4 w-4" /> Back to documents</Link>
      <QueryState loading={documentQuery.isLoading} error={documentQuery.error} onRetry={() => void documentQuery.refetch()} empty={!document ? <LoadingRows count={1} /> : undefined} />
      {document && <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div><p className="eyebrow text-accent">{document.category} / {document.fileType}</p><h1 className="display mt-2 max-w-2xl text-4xl leading-tight sm:text-5xl" data-testid="heading-document-title">{document.title}</h1><p className="mt-3 text-sm text-muted-foreground">Updated {formatDate(document.updatedAt, true)}</p></div>
            <div className="flex gap-2"><Button variant="outline" onClick={() => setEditing((value) => !value)} data-testid="button-edit-document"><Pencil className="h-4 w-4" /> {editing ? 'Close edit' : 'Edit'}</Button><Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)} disabled={deleteDocument.isPending} data-testid="button-delete-document"><Trash2 className="h-4 w-4" /></Button></div>
          </div>
          {notice && <div className="mt-5 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm text-primary" data-testid="status-document-notice"><Check className="h-4 w-4" /> {notice}</div>}
          <div className="paper-grid mt-8 flex min-h-[390px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-5 sm:min-h-[510px]">
            {document.sourceType === 'link' && document.sourceUrl ? (
              <div className="w-full max-w-sm rounded-xl border border-border bg-background p-7 text-center shadow-[var(--shadow-sm)]" data-testid="empty-document-preview">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Link2 className="h-7 w-7" /></div>
                <p className="mt-5 font-semibold">Linked document</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">This document lives in your Google Drive.</p>
                <a href={document.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Open in Drive</a>
              </div>
            ) : document.thumbnailUrl ? (
              <img src={document.thumbnailUrl} alt={`Preview of ${document.title}`} className="max-h-[470px] max-w-full rounded-lg object-contain shadow-[var(--shadow-lg)]" data-testid="img-document-preview" />
            ) : (
              <div className="w-full max-w-sm rounded-xl border border-border bg-background p-7 text-center shadow-[var(--shadow-sm)]" data-testid="empty-document-preview">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">{document.fileType === 'pdf' ? <FileText className="h-7 w-7" /> : <FileImage className="h-7 w-7" />}</div>
                <p className="mt-5 font-semibold">Stored in your Drive</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">This file is safely saved in your Haven Vault folder on Google Drive.</p>
              </div>
            )}
          </div>
          <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={remove} isPending={deleteDocument.isPending} title={document.title} />
        </section>
        <aside className="space-y-5">
          {editing ? <form className="vault-card rounded-2xl p-5" onSubmit={save} data-testid="form-edit-document"><div className="mb-5 flex items-center justify-between"><div><p className="eyebrow text-accent">Edit details</p><h2 className="mt-1 text-lg font-semibold">Keep it useful</h2></div><Save className="h-4 w-4 text-muted-foreground" /></div><div className="space-y-4"><label className="block space-y-1.5 text-sm font-medium">Title<Input data-testid="input-edit-title" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label className="block space-y-1.5 text-sm font-medium">Category<Input data-testid="input-edit-category" value={category} onChange={(event) => setCategory(event.target.value)} /></label><label className="block space-y-1.5 text-sm font-medium">Tags<Input data-testid="input-edit-tags" value={tags} onChange={(event) => setTags(event.target.value)} /></label><label className="block space-y-1.5 text-sm font-medium">Notes<Textarea data-testid="input-edit-notes" value={notes} onChange={(event) => setNotes(event.target.value)} /></label><Button className="w-full" type="submit" disabled={updateDocument.isPending} data-testid="button-save-edit">{updateDocument.isPending ? 'Saving…' : 'Save changes'}</Button></div></form> : <section className="vault-card rounded-2xl p-5" data-testid="panel-document-details"><div className="flex items-center justify-between"><div><p className="eyebrow text-accent">Details</p><h2 className="mt-1 text-lg font-semibold">A little context</h2></div><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></div><dl className="mt-6 space-y-4 text-sm"><div className="flex items-start justify-between gap-4"><dt className="text-muted-foreground">File size</dt><dd className="mono text-right" data-testid="text-document-size">{formatBytes(document.sizeBytes)}</dd></div><div className="flex items-start justify-between gap-4"><dt className="text-muted-foreground">Added</dt><dd className="text-right" data-testid="text-document-uploaded">{formatDate(document.uploadedAt)}</dd></div><div className="flex items-start justify-between gap-4"><dt className="text-muted-foreground">Last updated</dt><dd className="text-right" data-testid="text-document-updated">{formatDate(document.updatedAt)}</dd></div><div className="flex items-start justify-between gap-4"><dt className="text-muted-foreground">Status</dt><dd className="flex items-center gap-1.5 text-right text-accent" data-testid="status-document"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> {document.status}</dd></div></dl></section>}
          <section className="rounded-2xl bg-primary p-5 text-primary-foreground"><div className="flex items-center gap-2 text-sidebar-primary"><ShieldCheck className="h-4 w-4" /><span className="eyebrow">Private record</span></div><p className="mt-4 text-sm leading-6 text-primary-foreground/65">Only your account can access this document and its notes.</p><div className="mt-5 flex items-center gap-2 text-xs text-primary-foreground/50"><CalendarDays className="h-3.5 w-3.5" /> Filed {formatDate(document.uploadedAt)}</div></section>
        </aside>
      </div>}
    </div>
  );
}