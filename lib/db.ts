import { sql } from "@vercel/postgres";
import { FileManifest } from "./crypto";

export type EncryptionMode = "ecies" | "legacy";

export interface Share {
  id: string;
  sender_address: string;
  sender_ens: string | null;
  recipient_address: string;
  recipient_ens: string;
  blob_url: string;
  blob_size_bytes: number;
  encrypted_key: string | null; // Only for legacy mode
  ephemeral_public_key: string | null; // Only for ECIES mode
  encryption_mode: EncryptionMode;
  iv: string;
  file_manifest: FileManifest;
  claimed_at: Date | null;
  created_at: Date;
  expires_at: Date;
}

export interface CreateShareInput {
  id: string;
  senderAddress: string;
  senderEns?: string;
  recipientAddress: string;
  recipientEns: string;
  blobUrl: string;
  blobSizeBytes: number;
  encryptedKey?: string; // Only for legacy mode
  ephemeralPublicKey?: string; // Only for ECIES mode
  encryptionMode: EncryptionMode;
  iv: string;
  fileManifest: FileManifest;
  expiresAt?: Date;
}

export async function createShare(input: CreateShareInput): Promise<Share> {
  const expiresAt = input.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const result = await sql`
    INSERT INTO shares (
      id, sender_address, sender_ens, recipient_address, recipient_ens,
      blob_url, blob_size_bytes, encrypted_key, ephemeral_public_key,
      encryption_mode, iv, file_manifest, expires_at
    ) VALUES (
      ${input.id},
      ${input.senderAddress},
      ${input.senderEns || null},
      ${input.recipientAddress},
      ${input.recipientEns},
      ${input.blobUrl},
      ${input.blobSizeBytes},
      ${input.encryptedKey || null},
      ${input.ephemeralPublicKey || null},
      ${input.encryptionMode},
      ${input.iv},
      ${JSON.stringify(input.fileManifest)},
      ${expiresAt.toISOString()}
    )
    RETURNING *
  `;

  return rowToShare(result.rows[0]);
}

export async function getShare(id: string): Promise<Share | null> {
  const result = await sql`
    SELECT * FROM shares WHERE id = ${id}
  `;

  if (result.rows.length === 0) {
    return null;
  }

  return rowToShare(result.rows[0]);
}

export async function getShareForClaim(id: string): Promise<Share | null> {
  const share = await getShare(id);

  if (!share) {
    return null;
  }

  // Check if expired
  if (new Date() > share.expires_at) {
    return null;
  }

  return share;
}

export async function markShareClaimed(id: string): Promise<void> {
  await sql`
    UPDATE shares SET claimed_at = NOW() WHERE id = ${id}
  `;
}

export async function deleteExpiredShares(): Promise<number> {
  const result = await sql`
    DELETE FROM shares WHERE expires_at < NOW()
  `;

  return result.rowCount || 0;
}

function rowToShare(row: Record<string, unknown>): Share {
  return {
    id: row.id as string,
    sender_address: row.sender_address as string,
    sender_ens: row.sender_ens as string | null,
    recipient_address: row.recipient_address as string,
    recipient_ens: row.recipient_ens as string,
    blob_url: row.blob_url as string,
    blob_size_bytes: Number(row.blob_size_bytes),
    encrypted_key: row.encrypted_key as string | null,
    ephemeral_public_key: row.ephemeral_public_key as string | null,
    encryption_mode: (row.encryption_mode as EncryptionMode) || "legacy",
    iv: row.iv as string,
    file_manifest: typeof row.file_manifest === "string"
      ? JSON.parse(row.file_manifest)
      : row.file_manifest as FileManifest,
    claimed_at: row.claimed_at ? new Date(row.claimed_at as string) : null,
    created_at: new Date(row.created_at as string),
    expires_at: new Date(row.expires_at as string),
  };
}

// SQL to create the shares table (run this manually or via migration)
export const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS shares (
    id UUID PRIMARY KEY,
    sender_address VARCHAR(42) NOT NULL,
    sender_ens VARCHAR(255),
    recipient_address VARCHAR(42) NOT NULL,
    recipient_ens VARCHAR(255) NOT NULL,
    blob_url TEXT NOT NULL,
    blob_size_bytes BIGINT NOT NULL,
    encrypted_key TEXT,
    ephemeral_public_key TEXT,
    encryption_mode VARCHAR(10) NOT NULL DEFAULT 'legacy',
    iv TEXT NOT NULL,
    file_manifest JSONB NOT NULL,
    claimed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shares_recipient ON shares(recipient_address);
CREATE INDEX IF NOT EXISTS idx_shares_expires ON shares(expires_at);
`;

// Migration SQL to add E2E encryption columns to existing table
export const MIGRATION_ADD_E2E_COLUMNS = `
ALTER TABLE shares ADD COLUMN IF NOT EXISTS ephemeral_public_key TEXT;
ALTER TABLE shares ADD COLUMN IF NOT EXISTS encryption_mode VARCHAR(10) NOT NULL DEFAULT 'legacy';
ALTER TABLE shares ALTER COLUMN encrypted_key DROP NOT NULL;
`;

// Table for storing derived encryption public keys
export const CREATE_DERIVED_KEYS_TABLE = `
CREATE TABLE IF NOT EXISTS derived_keys (
    address VARCHAR(42) PRIMARY KEY,
    public_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
`;

/**
 * Store a user's derived encryption public key
 */
export async function storeDerivedPublicKey(
  address: string,
  publicKey: string
): Promise<void> {
  await sql`
    INSERT INTO derived_keys (address, public_key)
    VALUES (${address.toLowerCase()}, ${publicKey})
    ON CONFLICT (address) DO UPDATE SET public_key = ${publicKey}
  `;
}

/**
 * Get a user's derived encryption public key
 */
export async function getDerivedPublicKey(
  address: string
): Promise<string | null> {
  const result = await sql`
    SELECT public_key FROM derived_keys WHERE address = ${address.toLowerCase()}
  `;

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].public_key as string;
}
