import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

/**
 * POST /api/migrate
 *
 * Run database migrations. This is idempotent and safe to run multiple times.
 */
export async function POST() {
  try {
    // Create derived_keys table for E2E encryption public keys
    await sql`
      CREATE TABLE IF NOT EXISTS derived_keys (
        address VARCHAR(42) PRIMARY KEY,
        public_key TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Add E2E encryption columns to shares table if they don't exist
    await sql`
      ALTER TABLE shares ADD COLUMN IF NOT EXISTS ephemeral_public_key TEXT
    `;

    await sql`
      ALTER TABLE shares ADD COLUMN IF NOT EXISTS encryption_mode VARCHAR(10) DEFAULT 'legacy'
    `;

    // Make encrypted_key nullable (it's only used in legacy mode)
    // This is a no-op if already nullable
    try {
      await sql`
        ALTER TABLE shares ALTER COLUMN encrypted_key DROP NOT NULL
      `;
    } catch {
      // Column might already be nullable, ignore error
    }

    return NextResponse.json({
      success: true,
      message: "Migrations completed successfully",
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed", details: String(error) },
      { status: 500 }
    );
  }
}
