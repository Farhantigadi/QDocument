import { google } from "googleapis";
import { Readable } from "stream";

export type DriveDocument = {
  id: string;
  title: string;
  category: string;
  sourceType: "upload" | "link";
  tags: string[];
  notes: string;
  fileType: "pdf" | "png" | "jpg" | "webp" | null;
  sizeBytes: number | null;
  sourceUrl: string | null;
  driveFileId: string | null;
  uploadedAt: string;
  updatedAt: string;
  status: "active" | "deleted";
};

export type VaultIndex = {
  documents: DriveDocument[];
  activities: { id: string; action: string; label: string; createdAt: string }[];
};

const FOLDER_NAME = "Haven Vault";
const INDEX_NAME = "haven-vault.json";

export function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

export async function getOrCreateVaultFolder(accessToken: string): Promise<string> {
  const drive = getDriveClient(accessToken);
  const existing = await drive.files.list({
    q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
    spaces: "drive",
  });
  if (existing.data.files?.length) return existing.data.files[0].id!;
  const folder = await drive.files.create({
    requestBody: { name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" },
    fields: "id",
  });
  return folder.data.id!;
}

async function getIndexFileId(accessToken: string, folderId: string): Promise<string | null> {
  const drive = getDriveClient(accessToken);
  const res = await drive.files.list({
    q: `name='${INDEX_NAME}' and '${folderId}' in parents and trashed=false`,
    fields: "files(id)",
    spaces: "drive",
  });
  return res.data.files?.[0]?.id ?? null;
}

export async function readIndex(accessToken: string, folderId: string): Promise<VaultIndex> {
  const drive = getDriveClient(accessToken);
  const fileId = await getIndexFileId(accessToken, folderId);
  if (!fileId) return { documents: [], activities: [] };
  const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "text" });
  try {
    return JSON.parse(res.data as string) as VaultIndex;
  } catch {
    return { documents: [], activities: [] };
  }
}

export async function writeIndex(
  accessToken: string,
  folderId: string,
  index: VaultIndex,
): Promise<void> {
  const drive = getDriveClient(accessToken);
  const body = JSON.stringify(index);
  const media = { mimeType: "application/json", body };
  const existingId = await getIndexFileId(accessToken, folderId);
  if (existingId) {
    await drive.files.update({ fileId: existingId, media });
  } else {
    await drive.files.create({
      requestBody: { name: INDEX_NAME, parents: [folderId] },
      media,
      fields: "id",
    });
  }
}

export async function uploadFileToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer,
): Promise<{ driveFileId: string }> {
  const drive = getDriveClient(accessToken);
  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: "id",
  });
  return { driveFileId: res.data.id! };
}

export async function deleteFileFromDrive(
  accessToken: string,
  driveFileId: string,
): Promise<void> {
  const drive = getDriveClient(accessToken);
  await drive.files.delete({ fileId: driveFileId });
}
