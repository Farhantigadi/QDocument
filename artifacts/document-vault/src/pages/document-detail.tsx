import { useEffect, useState } from 'react';
import { ArrowLeft, Check, ExternalLink, FileImage, FileText, Link2, Pencil, Save, Trash2 } from 'lucide-react';
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
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-8 lg:py-8 space-y-6" data-testid="page-document-detail">
      {/* Back Link */}
      <Link
        href="/documents"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-testid="link-back-documents"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to documents
      </Link>

      <QueryState
        loading={documentQuery.isLoading}
        error={documentQuery.error}
        onRetry={() => void documentQuery.refetch()}
        empty={!document ? <LoadingRows count={1} /> : undefined}
      />

      {document && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Main Content Pane */}
          <section className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-border/60 pb-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {document.category} / {googleEmbedUrl ? 'Google Drive' : document.sourceType === 'link' ? 'Link' : (document.fileType ?? 'File').toUpperCase()}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl" data-testid="heading-document-title">
                  {document.title}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated {formatDate(document.updatedAt, true)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing((value) => !value)} data-testid="button-edit-document">
                  <Pencil className="h-3.5 w-3.5 mr-1" /> {editing ? 'Cancel' : 'Edit'}
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteOpen(true)} disabled={deleteDocument.isPending} data-testid="button-delete-document">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                </Button>
              </div>
            </div>

            {notice && (
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3.5 py-2.5 text-xs font-medium text-foreground" data-testid="status-document-notice">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {notice}
              </div>
            )}

            {/* Document Preview Box */}
            <div className="flex min-h-[480px] flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-card p-4">
              {googleEmbedUrl ? (
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-2.5 text-xs font-medium text-foreground border border-border">
                    <span>Google Drive Document Preview</span>
                    <a
                      href={document.sourceUrl ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded bg-foreground px-2.5 py-1 text-xs font-medium text-background hover:opacity-90 transition-opacity"
                    >
                      Open in Drive <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <iframe
                    src={googleEmbedUrl}
                    title={`Preview of ${document.title}`}
                    className="h-[600px] w-full rounded-lg border border-border bg-background"
                    allow="autoplay; encrypted-media"
                    data-testid="iframe-document-preview"
                  />
                </div>
              ) : document.sourceType === 'link' && document.sourceUrl ? (
                <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 text-center" data-testid="empty-document-preview">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-foreground">
                    <Link2 className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-foreground">External Web Link</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This file is stored on an external cloud service or webpage.
                  </p>
                  <a
                    href={document.sourceUrl ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90 transition-opacity"
                  >
                    Open link <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : document.objectPath && document.fileType === 'pdf' ? (
                <iframe
                  src={`/api/storage${document.objectPath}`}
                  title={`Preview of ${document.title}`}
                  className="h-[600px] w-full rounded-lg border border-border bg-background"
                  data-testid="iframe-document-preview"
                />
              ) : document.objectPath && document.fileType && ['jpg', 'png', 'webp'].includes(document.fileType) ? (
                <img
                  src={`/api/storage${document.objectPath}`}
                  alt={`Preview of ${document.title}`}
                  className="max-h-[580px] max-w-full rounded-lg object-contain"
                  data-testid="img-document-preview"
                />
              ) : (
                <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 text-center" data-testid="empty-document-preview">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    {document.fileType === 'pdf' ? <FileText className="h-6 w-6" /> : <FileImage className="h-6 w-6" />}
                  </div>
                  <h3 className="mt-4 text-base font-bold text-foreground">Vault File</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Stored securely in your Haven vault.
                  </p>
                </div>
              )}
            </div>

            <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={remove} isPending={deleteDocument.isPending} title={document.title} sourceType={document.sourceType} />
          </section>

          {/* Right Details Sidebar */}
          <aside className="space-y-6">
            {editing ? (
              <form className="vault-card-surface rounded-xl p-5 border border-border bg-card" onSubmit={save} data-testid="form-edit-document">
                <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
                  <h2 className="text-sm font-bold text-foreground">Edit Details</h2>
                  <Save className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-3.5">
                  <label className="block space-y-1 text-xs font-medium text-muted-foreground">
                    Title
                    <Input className="text-xs" data-testid="input-edit-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
                  </label>
                  <label className="block space-y-1 text-xs font-medium text-muted-foreground">
                    Category
                    <Input className="text-xs" data-testid="input-edit-category" value={category} onChange={(event) => setCategory(event.target.value)} required />
                  </label>
                  <label className="block space-y-1 text-xs font-medium text-muted-foreground">
                    Tags <span className="font-normal text-muted-foreground">(comma separated)</span>
                    <Input className="text-xs" data-testid="input-edit-tags" value={tags} onChange={(event) => setTags(event.target.value)} />
                  </label>
                  <label className="block space-y-1 text-xs font-medium text-muted-foreground">
                    Notes
                    <Textarea className="min-h-[90px] text-xs resize-none" data-testid="input-edit-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
                  </label>
                  <Button className="w-full text-xs font-semibold" size="sm" type="submit" disabled={updateDocument.isPending} data-testid="button-save-edit">
                    {updateDocument.isPending ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </form>
            ) : (
              <section className="vault-card-surface rounded-xl p-5 border border-border bg-card" data-testid="panel-document-details">
                <div className="mb-4 border-b border-border/60 pb-3">
                  <h2 className="text-sm font-bold text-foreground">Document Details</h2>
                </div>
                <dl className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Source</dt>
                    <dd className="font-medium text-foreground capitalize">{document.sourceType}</dd>
                  </div>
                  {!isLink && document.sizeBytes && (
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">File size</dt>
                      <dd className="font-mono text-foreground">{formatBytes(document.sizeBytes)}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Added</dt>
                    <dd className="font-medium text-foreground">{formatDate(document.uploadedAt)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Last modified</dt>
                    <dd className="font-medium text-foreground">{formatDate(document.updatedAt)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400" data-testid="status-document">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" /> {document.status}
                    </dd>
                  </div>
                </dl>
                {document.notes && (
                  <div className="mt-4 border-t border-border/60 pt-3">
                    <p className="text-xs font-medium text-muted-foreground">Notes</p>
                    <p className="mt-1 text-xs text-foreground bg-muted/50 p-2.5 rounded-lg leading-relaxed">{document.notes}</p>
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