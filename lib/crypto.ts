// AES-256-GCM encryption/decryption utilities using Web Crypto API

export interface FileManifest {
  files: Array<{
    name: string;
    size: number;
    type: string;
    offset: number;
  }>;
  totalSize: number;
}

export interface EncryptedPackage {
  encryptedData: ArrayBuffer;
  key: string; // base64 encoded
  iv: string; // base64 encoded
  manifest: FileManifest;
}

// Generate a random AES-256 key
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

// Export key to base64 for storage
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exported);
}

// Import key from base64
export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(keyString);
  return crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Generate random IV (12 bytes for GCM)
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

// Encrypt data with AES-256-GCM
export async function encrypt(
  data: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as Uint8Array<ArrayBuffer> }, key, data);
}

// Decrypt data with AES-256-GCM
export async function decrypt(
  encryptedData: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as Uint8Array<ArrayBuffer> }, key, encryptedData);
}

// Combine multiple files into a single buffer with manifest
export async function packFiles(
  files: File[]
): Promise<{ data: ArrayBuffer; manifest: FileManifest }> {
  const manifest: FileManifest = {
    files: [],
    totalSize: 0,
  };

  // Calculate total size and build manifest
  let offset = 0;
  for (const file of files) {
    manifest.files.push({
      name: file.name,
      size: file.size,
      type: file.type,
      offset,
    });
    offset += file.size;
    manifest.totalSize += file.size;
  }

  // Combine all file contents
  const combined = new Uint8Array(manifest.totalSize);
  let currentOffset = 0;

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    combined.set(new Uint8Array(buffer), currentOffset);
    currentOffset += file.size;
  }

  return { data: combined.buffer, manifest };
}

// Extract files from combined buffer using manifest
export function unpackFiles(
  data: ArrayBuffer,
  manifest: FileManifest
): File[] {
  const files: File[] = [];
  const dataView = new Uint8Array(data);

  for (const fileInfo of manifest.files) {
    const fileData = dataView.slice(fileInfo.offset, fileInfo.offset + fileInfo.size);
    const file = new File([fileData], fileInfo.name, { type: fileInfo.type });
    files.push(file);
  }

  return files;
}

// Main encryption function: pack files, encrypt, return package
export async function encryptFiles(files: File[]): Promise<EncryptedPackage> {
  const { data, manifest } = await packFiles(files);
  const key = await generateKey();
  const iv = generateIV();

  const encryptedData = await encrypt(data, key, iv);
  const keyString = await exportKey(key);
  const ivString = arrayBufferToBase64(iv.buffer as ArrayBuffer);

  return {
    encryptedData,
    key: keyString,
    iv: ivString,
    manifest,
  };
}

// Main decryption function: decrypt and unpack files
export async function decryptFiles(
  encryptedData: ArrayBuffer,
  keyString: string,
  ivString: string,
  manifest: FileManifest
): Promise<File[]> {
  const key = await importKey(keyString);
  const iv = new Uint8Array(base64ToArrayBuffer(ivString));

  const decryptedData = await decrypt(encryptedData, key, iv);
  return unpackFiles(decryptedData, manifest);
}

// Generate deterministic claim message for wallet signature
export function generateClaimMessage(shareId: string, walletAddress: string): string {
  return `I am claiming share ${shareId} with wallet ${walletAddress.toLowerCase()}`;
}

// Utility: ArrayBuffer to base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Utility: base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
