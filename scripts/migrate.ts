import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "@vercel/postgres";

async function migrate() {
  console.log("Running database migration...");

  await sql`
    CREATE TABLE IF NOT EXISTS shares (
        id UUID PRIMARY KEY,
        sender_address VARCHAR(42) NOT NULL,
        sender_ens VARCHAR(255),
        recipient_address VARCHAR(42) NOT NULL,
        recipient_ens VARCHAR(255) NOT NULL,
        blob_url TEXT NOT NULL,
        blob_size_bytes BIGINT NOT NULL,
        encrypted_key TEXT NOT NULL,
        iv TEXT NOT NULL,
        file_manifest JSONB NOT NULL,
        claimed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL
    )
  `;

  console.log("Created shares table");

  await sql`
    CREATE INDEX IF NOT EXISTS idx_shares_recipient ON shares(recipient_address)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_shares_expires ON shares(expires_at)
  `;

  console.log("Created indexes");
  console.log("Migration complete!");
}

migrate().catch(console.error);
