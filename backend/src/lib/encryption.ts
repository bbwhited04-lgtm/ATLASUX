/**
 * AES-256-GCM token encryption at rest.
 *
 * Encrypted format: `iv:tag:ciphertext` (all hex-encoded).
 * Fits existing TEXT / VARCHAR columns with no schema change.
 *
 * When TOKEN_ENCRYPTION_KEY is not set, encrypt/decrypt are no-ops
 * and tokens pass through as plaintext (backward-compatible).
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

/** Regex that matches the `iv:tag:ciphertext` hex format. */
const ENCRYPTED_RE = /^[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/;

function getKey(hexKey: string): Buffer {
  const buf = Buffer.from(hexKey, "hex");
  if (buf.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
  return buf;
}

/**
 * Returns true if `value` matches the encrypted format (iv:tag:ciphertext hex).
 * Used during migration to skip already-encrypted values.
 */
export function isEncrypted(value: string): boolean {
  return ENCRYPTED_RE.test(value);
}

/**
 * Encrypt a plaintext token. Returns `iv:tag:ciphertext` hex string.
 * If `hexKey` is falsy, returns plaintext unchanged (encryption disabled).
 */
export function encryptToken(plaintext: string, hexKey: string | undefined): string {
  if (!hexKey) return plaintext;
  const key = getKey(hexKey);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt an encrypted token. If the value doesn't look encrypted
 * (legacy plaintext), returns it unchanged for backward compatibility.
 * If `hexKey` is falsy, returns the value unchanged.
 */
export function decryptToken(value: string, hexKey: string | undefined): string {
  if (!hexKey) return value;
  if (!isEncrypted(value)) return value; // plaintext fallback during migration
  const [ivHex, tagHex, ctHex] = value.split(":");
  const key = getKey(hexKey);
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(ctHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}
