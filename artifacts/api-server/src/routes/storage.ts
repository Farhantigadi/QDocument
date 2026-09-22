import { Readable } from 'node:stream';
import { RequestUploadUrlBody, RequestUploadUrlResponse } from '@workspace/api-zod';
import { Router, type IRouter, type Request, type Response } from 'express';
import { ObjectNotFoundError, ObjectStorageService } from '../lib/objectStorage';

const router: IRouter = Router();
const storage = new ObjectStorageService();

function hasSession(req: Request): boolean {
  return req.cookies?.haven_session === 'demo-persistent-session';
}

router.post('/storage/uploads/request-url', async (req: Request, res: Response) => {
  if (!hasSession(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Missing or invalid required fields' });
    return;
  }
  try {
    const { name, size, contentType } = parsed.data;
    const uploadURL = await storage.getObjectEntityUploadURL();
    const objectPath = storage.normalizeObjectEntityPath(uploadURL);
    res.json(RequestUploadUrlResponse.parse({
      uploadURL,
      objectPath,
      metadata: { name, size, contentType },
    }));
  } catch (error) {
    req.log.error({ err: error }, 'Error generating private upload URL');
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

router.get('/storage/objects/*path', async (req: Request, res: Response) => {
  if (!hasSession(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join('/') : raw;
    const file = await storage.getObjectEntityFile(`/objects/${wildcardPath}`);
    const response = await storage.downloadObject(file);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    req.log.error({ err: error }, 'Error serving private object');
    res.status(500).json({ error: 'Failed to serve object' });
  }
});

export default router;