import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { Storage, type File } from '@google-cloud/storage';
import { getObjectAclPolicy, type ObjectAclPolicy, setObjectAclPolicy } from './objectAcl';

const REPLIT_SIDECAR_ENDPOINT = 'http://127.0.0.1:1106';

export const objectStorageClient = new Storage({
  credentials: {
    audience: 'replit',
    subject_token_type: 'access_token',
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: 'external_account',
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: { type: 'json', subject_token_field_name: 'access_token' },
    },
    universe_domain: 'googleapis.com',
  },
  projectId: '',
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super('Object not found');
    this.name = 'ObjectNotFoundError';
  }
}

export class ObjectStorageService {
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || '';
    if (!dir) throw new Error('PRIVATE_OBJECT_DIR is not configured.');
    return dir;
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const { bucketName, objectName } = parseObjectPath(
      `${this.getPrivateObjectDir()}/uploads/${randomUUID()}`,
    );
    return signObjectURL({ bucketName, objectName, method: 'PUT', ttlSec: 900 });
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.startsWith('https://storage.googleapis.com/')) return rawPath;
    const url = new URL(rawPath);
    const privateDir = this.getPrivateObjectDir().replace(/^\/+/, '').replace(/\/+$/, '');
    const rawObjectPath = url.pathname.replace(/^\/+/, '');
    const prefix = `${privateDir}/`;
    return rawObjectPath.startsWith(prefix)
      ? `/objects/${rawObjectPath.slice(prefix.length)}`
      : rawObjectPath;
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith('/objects/')) throw new ObjectNotFoundError();
    const entityId = objectPath.slice('/objects/'.length);
    if (!entityId || entityId.includes('..')) throw new ObjectNotFoundError();
    const { bucketName, objectName } = parseObjectPath(`${this.getPrivateObjectDir()}/${entityId}`);
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [exists] = await file.exists();
    if (!exists) throw new ObjectNotFoundError();
    return file;
  }

  async downloadObject(file: File, cacheTtlSec = 300): Promise<Response> {
    const [metadata] = await file.getMetadata();
    const acl = await getObjectAclPolicy(file);
    const headers: Record<string, string> = {
      'Content-Type': (metadata.contentType as string) || 'application/octet-stream',
      'Cache-Control': `${acl?.visibility === 'public' ? 'public' : 'private'}, max-age=${cacheTtlSec}`,
    };
    if (metadata.size) headers['Content-Length'] = String(metadata.size);
    const webStream = Readable.toWeb(file.createReadStream()) as ReadableStream;
    return new Response(webStream, { headers });
  }

  async setPrivateAcl(objectPath: string, owner: string): Promise<void> {
    const file = await this.getObjectEntityFile(objectPath);
    const policy: ObjectAclPolicy = { owner, visibility: 'private' };
    await setObjectAclPolicy(file, policy);
  }

  async deleteObjectEntity(objectPath: string): Promise<void> {
    const file = await this.getObjectEntityFile(objectPath);
    await file.delete({ ignoreNotFound: true });
  }
}

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const parts = normalized.split('/');
  if (parts.length < 3 || !parts[1] || !parts.slice(2).join('/')) {
    throw new Error('Invalid object storage path.');
  }
  return { bucketName: parts[1], objectName: parts.slice(2).join('/') };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: 'GET' | 'PUT';
  ttlSec: number;
}): Promise<string> {
  const response = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Failed to sign object URL (${response.status}).`);
  const body = await response.json() as { signed_url?: string };
  if (!body.signed_url) throw new Error('Storage returned no signed URL.');
  return body.signed_url;
}