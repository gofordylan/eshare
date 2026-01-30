/**
 * ECIES (Elliptic Curve Integrated Encryption Scheme) for true E2E encryption
 *
 * Uses secp256k1 (Ethereum's curve) for ECDH key exchange and AES-256-GCM for encryption.
 * The server never sees the decryption key - only the recipient's wallet can decrypt.
 */

import { secp256k1 } from "@noble/curves/secp256k1";

/**
 * Generate an ephemeral keypair for one-time use
 */
export function generateEphemeralKeyPair(): {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
} {
  const privateKey = secp256k1.utils.randomPrivateKey();
  const publicKey = secp256k1.getPublicKey(privateKey, false); // uncompressed (65 bytes)
  return { publicKey, privateKey };
}

// Check if crypto is available (for server-side compatibility)
const cryptoSubtle = typeof crypto !== "undefined" ? crypto.subtle : null;

/**
 * Derive a shared secret using ECDH
 * Both parties derive the same secret: sender uses (ephemeralPrivate, recipientPublic)
 * Recipient uses (recipientPrivate, ephemeralPublic)
 */
export function deriveSharedSecret(
  privateKey: Uint8Array,
  publicKey: Uint8Array
): Uint8Array {
  const sharedPoint = secp256k1.getSharedSecret(privateKey, publicKey);
  // Use only the x-coordinate (first 32 bytes after the prefix)
  return sharedPoint.slice(1, 33);
}

/**
 * Derive an AES-256 key from the shared secret using HKDF-like derivation
 */
export async function deriveAESKey(sharedSecret: Uint8Array): Promise<Uint8Array> {
  // Use Web Crypto's HKDF
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    sharedSecret.buffer as ArrayBuffer,
    "HKDF",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode("eshare-ecies-v1-salt"),
      info: new TextEncoder().encode("eshare-ecies-v1-info"),
    },
    keyMaterial,
    256
  );

  return new Uint8Array(derivedBits);
}

/**
 * Encrypt data using ECIES
 *
 * @param recipientPublicKey - The recipient's secp256k1 public key (65 bytes uncompressed)
 * @param plaintext - The data to encrypt
 * @returns Encrypted package with ephemeral public key and ciphertext
 */
export async function eciesEncrypt(
  recipientPublicKey: Uint8Array,
  plaintext: Uint8Array
): Promise<{
  ephemeralPublicKey: Uint8Array;
  iv: Uint8Array;
  ciphertext: Uint8Array;
}> {
  // Generate ephemeral keypair
  const ephemeral = generateEphemeralKeyPair();

  // Derive shared secret via ECDH
  const sharedSecret = deriveSharedSecret(ephemeral.privateKey, recipientPublicKey);

  // Derive AES key from shared secret
  const aesKeyBytes = await deriveAESKey(sharedSecret);

  // Generate IV for AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Import AES key for Web Crypto
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    aesKeyBytes.buffer as ArrayBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  // Encrypt with AES-256-GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as Uint8Array<ArrayBuffer> },
    cryptoKey,
    plaintext.buffer as ArrayBuffer
  );

  return {
    ephemeralPublicKey: ephemeral.publicKey,
    iv,
    ciphertext: new Uint8Array(ciphertext),
  };
}

/**
 * Decrypt data using ECIES
 *
 * @param recipientPrivateKey - The recipient's secp256k1 private key (32 bytes)
 * @param ephemeralPublicKey - The sender's ephemeral public key (65 bytes)
 * @param iv - The initialization vector (12 bytes)
 * @param ciphertext - The encrypted data
 * @returns Decrypted plaintext
 */
export async function eciesDecrypt(
  recipientPrivateKey: Uint8Array,
  ephemeralPublicKey: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array
): Promise<Uint8Array> {
  // Derive same shared secret via ECDH
  const sharedSecret = deriveSharedSecret(recipientPrivateKey, ephemeralPublicKey);

  // Derive same AES key
  const aesKeyBytes = await deriveAESKey(sharedSecret);

  // Import AES key for Web Crypto
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    aesKeyBytes.buffer as ArrayBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // Decrypt with AES-256-GCM
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as Uint8Array<ArrayBuffer> },
    cryptoKey,
    ciphertext.buffer as ArrayBuffer
  );

  return new Uint8Array(plaintext);
}

/**
 * Validate a secp256k1 public key
 */
export function isValidPublicKey(publicKey: Uint8Array): boolean {
  try {
    secp256k1.ProjectivePoint.fromHex(publicKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert public key between compressed (33 bytes) and uncompressed (65 bytes) formats
 */
export function uncompressPublicKey(compressedKey: Uint8Array): Uint8Array {
  const point = secp256k1.ProjectivePoint.fromHex(compressedKey);
  return point.toRawBytes(false); // false = uncompressed
}

// Utility functions for hex/bytes conversion
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
