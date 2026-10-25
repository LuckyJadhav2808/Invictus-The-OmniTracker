// Web Crypto API AES-GCM 256-bit Encrypted Vault Engine (Zero External Dependencies)

const DEFAULT_VAULT_PASSPHRASE = "invictus_neobrutalist_vault_sec_2026";

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts complete workspace snapshot into an AES-GCM 256-bit encrypted envelope
 */
export async function encryptVaultPayload(data: unknown, customPassphrase?: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    // Fallback to plain JSON string if crypto subtle is unavailable
    return JSON.stringify(data, null, 2);
  }

  const passphrase = customPassphrase?.trim() || DEFAULT_VAULT_PASSPHRASE;
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    plaintext
  );

  const vaultEnvelope = {
    version: 2,
    format: "invictus-encrypted-vault",
    algorithm: "AES-GCM-256",
    exportedAt: new Date().toISOString(),
    salt: Array.from(salt),
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(encryptedBuffer)),
  };

  return JSON.stringify(vaultEnvelope, null, 2);
}

/**
 * Decrypts an encrypted vault envelope or parses legacy unencrypted backup JSON
 */
export async function decryptVaultPayload(jsonStr: string, customPassphrase?: string): Promise<any> {
  const parsed = JSON.parse(jsonStr);

  // If plain unencrypted backup, return directly
  if (parsed.format !== "invictus-encrypted-vault" || !parsed.ciphertext) {
    return parsed;
  }

  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Web Crypto API is not supported in this runtime environment.");
  }

  const passphrase = customPassphrase?.trim() || DEFAULT_VAULT_PASSPHRASE;
  const salt = new Uint8Array(parsed.salt);
  const iv = new Uint8Array(parsed.iv);
  const ciphertext = new Uint8Array(parsed.ciphertext);

  const key = await deriveKey(passphrase, salt);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  const decryptedText = dec.decode(decryptedBuffer);
  return JSON.parse(decryptedText);
}
