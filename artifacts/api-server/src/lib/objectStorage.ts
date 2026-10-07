export class ObjectNotFoundError extends Error {
  constructor() {
    super('Object not found');
    this.name = 'ObjectNotFoundError';
  }
}

export class ObjectStorageService {
  async getObjectEntityUploadURL(): Promise<string> {
    throw new Error('File upload not supported in this deployment.');
  }

  normalizeObjectEntityPath(rawPath: string): string {
    return rawPath;
  }

  async getObjectEntityFile(_objectPath: string): Promise<never> {
    throw new ObjectNotFoundError();
  }

  async downloadObject(_file: never): Promise<Response> {
    throw new ObjectNotFoundError();
  }

  async deleteObjectEntity(_objectPath: string): Promise<void> {
    // no-op
  }
}
