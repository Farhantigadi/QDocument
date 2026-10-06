import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, ExternalLink, FileImage, FileText, Link2, Pencil, Save, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
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
import { DeleteConfirmDialog, LoadingRows, formatBytes, formatDate, getGoogleEmbedUrl, QueryState } from '@/components/vault-ui';

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
  const isLink = document?.sourceType === 'link';
  const googleEmbedUrl = getGoogleEmbedUrl(document?.sourceUrl);

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
        setNotice('Document details updated.');
      },
      onError: () => setNotice('This document could not be saved.'),
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
      onError: () => setNotice('This document could not be removed.'),
    });
  };

  return (
    <div className="mx-auto max-w-[1300px] px-4 py-6 sm:px-8 lg:px-10 lg:py-10 animate-fade-in" data-testid="page-document-detail">
      {/* Back Link */}
      <Link
        href="/documents"
        className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-testid="link-back-documents"
      >
        <ArrowLeft className="h-4 w-4" /> Back to documents
      </Link>

      <QueryState
        loading={documentQuery.isLoading}
        error={documentQuery.error}
        onRetry={() => void documentQuery.refetch()}
        empty={!document ? <LoadingRows count={1} /> : undefined}
      />

      {document && (
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Left Main Content Pane */}
          <section>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start border-b border-border/60 pb-6">
              <div>
                <p className="eyebrow-text text-primary flex items-center gap-2">
                  <span>{document.category}</span> / <span>{googleEmbedUrl ? 'Google Drive Embedded' : document.sourceType === 'link' ? 'Drive Link' : (document.fileType ?? 'File').toUpperCase()}</span>
                </p>
                <h1 className="display-title mt-1.5 text-3xl font-extrabold sm:text-4xl text-foreground leading-tight" data-testid="heading-document-title">
                  {document.title}
                </h1>
                <p className="mt-2 text-xs font-semibold text-muted-foreground">
                  Updated {formatDate(document.updatedAt, true)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing((value) => !value)} data-testid="button-edit-document">
                  <Pencil className="h-4 w-4 mr-1.5" /> {editing ? 'Cancel edit' : 'Edit'}
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteOpen(true)} disabled={deleteDocument.isPending} data-testid="button-delete-document">
                  <Trash2 className="h-4 w-4 mr-1.5" /> Remove
                </Button>
              </div>
            </div>

            {notice && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-primary" data-testid="status-document-notice">
                <Check className="h-4 w-4 text-emerald-500" /> {notice}
              </div>
            )}

            {/* Document Preview Box */}
            <div className="mt-6 flex min-h-[500px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs">
              {googleEmbedUrl ? (
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-blue-500/10 px-4 py-3 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span>Live Embedded Google Drive Document</span>
                    </div>
                    <a
                      href={document.sourceUrl ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 transition-colors shadow-xs"
                    >
                      Open in Drive <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <iframe
                    src={googleEmbedUrl}
                    title={`Preview of ${document.title}`}
                    className="h-[620px] w-full rounded-2xl border border-border/80 bg-background shadow-xs"
                    allow="autoplay; encrypted-media"
                    data-testid="iframe-document-preview"
                  />
                </div>
              ) : document.sourceType === 'link' && document.sourceUrl ? (
                <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 text-center shadow-xs" data-testid="empty-document-preview">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary">
                    <Link2 className="h-8 w-8" />
                  </div>
                  <h3 className="display-title mt-5 text-xl font-bold text-foreground">External Web Link</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    This file is stored on an external cloud location.
                  </p>
                  <a
                    href={document.sourceUrl ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Open Link <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ) : document.objectPath && document.fileType === 'pdf' ? (
                <iframe
                  src={`/api/storage${document.objectPath}`}
                  title={`Preview of ${document.title}`}
                  className="h-[620px] w-full rounded-2xl border border-border bg-background"
                  data-testid="iframe-document-preview"
                />
              ) : document.objectPath && document.fileType && ['jpg', 'png', 'webp'].includes(document.fileType) ? (
                <img
                  src={`/api/storage${document.objectPath}`}
                  alt={`Preview of ${document.title}`}
                  className="max-h-[600px] max-w-full rounded-2xl object-contain shadow-md"
                  data-testid="img-document-preview"
                />
              ) : (
                <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 text-center shadow-xs" data-testid="empty-document-preview">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary">
                    {document.fileType === 'pdf' ? <FileText className="h-8 w-8" /> : <FileImage className="h-8 w-8" />}
                  </div>
                  <h3 className="display-title mt-5 text-xl font-bold text-foreground">Private Vault File</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Stored privately in your vault and protected by authenticated access.
                  </p>
                </div>
              )}
            </div>

            <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={remove} isPending={deleteDocument.isPending} title={document.title} sourceType={document.sourceType} />
          </section>

          {/* Right Sidebar Details Pane */}
          <aside className="space-y-6">
            {editing ? (
              <form className="vault-card-surface rounded-2xl p-6" onSubmit={save} data-testid="form-edit-document">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="display-title text-lg text-foreground">Edit Metadata</h2>
                  <Save className="h-4 w-4 text-accent" />
                </div>
                <div className="space-y-4">
                  <label className="block space-y-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Title
                    <Input data-testid="input-edit-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
                  </label>
                  <label className="block space-y-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Category
                    <Input data-testid="input-edit-category" value={category} onChange={(event) => setCategory(event.target.value)} required />
                  </label>
                  <label className="block space-y-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Tags <span className="font-normal text-muted-foreground">(comma separated)</span>
                    <Input data-testid="input-edit-tags" value={tags} onChange={(event) => setTags(event.target.value)} />
                  </label>
                  <label className="block space-y-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Notes
                    <Textarea data-testid="input-edit-notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-[100px]" />
                  </label>
                  <Button className="w-full" type="submit" disabled={updateDocument.isPending} data-testid="button-save-edit">
                    {updateDocument.isPending ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </form>
            ) : (
              <section className="vault-card-surface rounded-2xl p-6" data-testid="panel-document-details">
                <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
                  <h2 className="display-title text-lg text-foreground">Document Context</h2>
                  <span className="eyebrow-text text-muted-foreground">Info</span>
                </div>
                <dl className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground text-xs font-semibold">Source Type</dt>
                    <dd className="font-mono text-xs font-bold text-foreground capitalize">{document.sourceType}</dd>
                  </div>
                  {!isLink && document.sizeBytes && (
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground text-xs font-semibold">File Size</dt>
                      <dd className="font-mono text-xs font-bold text-foreground">{formatBytes(document.sizeBytes)}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground text-xs font-semibold">Added On</dt>
                    <dd className="text-xs font-semibold text-foreground">{formatDate(document.uploadedAt)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground text-xs font-semibold">Last Modified</dt>
                    <dd className="text-xs font-semibold text-foreground">{formatDate(document.updatedAt)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground text-xs font-semibold">Status</dt>
                    <dd className="flex items-center gap-1.5 text-xs font-bold text-emerald-500" data-testid="status-document">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> {document.status}
                    </dd>
                  </div>
                </dl>
                {document.notes && (
                  <div className="mt-5 border-t border-border/60 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-foreground bg-muted/50 p-3 rounded-xl">{document.notes}</p>
                  </div>
                )}
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}