import { NextRequest, NextResponse } from "next/server";
import { getDerivedPublicKey, storeDerivedPublicKey } from "@/lib/db";
import { isValidPublicKey, hexToBytes } from "@/lib/ecies";

/**
 * GET /api/pubkey/[address]
 *
 * Returns the derived encryption public key for an address.
 * This is NOT the Ethereum public key - it's a separate keypair
 * derived from a wallet signature for E2E encryption.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid address format" },
        { status: 400 }
      );
    }

    const publicKey = await getDerivedPublicKey(address);

    if (!publicKey) {
      return NextResponse.json(
        {
          error: "No derived key found",
          reason: "This user hasn't registered their encryption key yet. They need to claim a share first.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      address: address.toLowerCase(),
      publicKey,
    });
  } catch (error) {
    console.error("Get derived public key error:", error);
    return NextResponse.json(
      { error: "Failed to get public key" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pubkey/[address]
 *
 * Store a derived encryption public key (called during claim flow)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const body = await request.json();
    const { publicKey } = body;

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid address format" },
        { status: 400 }
      );
    }

    // Validate public key format (65 bytes uncompressed = 130 hex chars + 0x prefix)
    if (!/^0x04[a-fA-F0-9]{128}$/.test(publicKey)) {
      return NextResponse.json(
        { error: "Invalid public key format (expected uncompressed secp256k1)" },
        { status: 400 }
      );
    }

    // Validate it's a valid secp256k1 point
    if (!isValidPublicKey(hexToBytes(publicKey))) {
      return NextResponse.json(
        { error: "Invalid secp256k1 public key" },
        { status: 400 }
      );
    }

    await storeDerivedPublicKey(address, publicKey);

    return NextResponse.json({
      success: true,
      address: address.toLowerCase(),
    });
  } catch (error) {
    console.error("Store derived public key error:", error);
    return NextResponse.json(
      { error: "Failed to store public key" },
      { status: 500 }
    );
  }
}
