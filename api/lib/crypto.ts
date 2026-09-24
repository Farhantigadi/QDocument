import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const rawKey = process.env.VAULT_ENCRYPTION_KEY;
if (!rawKey) {
  throw new Error(
    "Missing configuration: VAULT_ENCRYPTION_KEY is not set.\n" +
      "Provide a 32-byte key (64 hex chars). Generate with: openssl rand -hex 32\n",
  );
}
if (!/^[0-9a-fA-F]{64}$/.test(rawKey)) {
  throw new Error("Invalid VAULT_ENCRYPTION_KEY: must be 64 hex characters (32 bytes).");
}
const KEY = Buffer.from(rawKey, "hex");

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all hex)
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(stored: string): string {
  const [ivHex, tagHex, dataHex] = stored.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final("utf8");
}
