import { NextRequest, NextResponse } from "next/server";
import { getShareForClaim, markShareClaimed } from "@/lib/db";
import { generateClaimMessage } from "@/lib/crypto";
import { recoverMessageAddress } from "viem";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const body = await request.json();
    const { signature, walletAddress } = body;

    if (!signature || !walletAddress) {
      return NextResponse.json(
        { error: "Missing signature or wallet address" },
        { status: 400 }
      );
    }

    const share = await getShareForClaim(shareId);

    if (!share) {
      return NextResponse.json(
        { error: "Share not found or expired" },
        { status: 404 }
      );
    }

    // Verify the signature
    const message = generateClaimMessage(shareId, walletAddress);

    let recoveredAddress: string;
    try {
      recoveredAddress = await recoverMessageAddress({
        message,
        signature: signature as `0x${string}`,
      });
    } catch {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Check if recovered address matches claimed address
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "Signature does not match wallet address" },
        { status: 403 }
      );
    }

    // Check if the wallet is the intended recipient
    if (walletAddress.toLowerCase() !== share.recipient_address.toLowerCase()) {
      return NextResponse.json(
        { error: "You are not the intended recipient of this share" },
        { status: 403 }
      );
    }

    // Mark as claimed
    await markShareClaimed(shareId);

    // Return decryption key and blob URL
    return NextResponse.json({
      blobUrl: share.blob_url,
      encryptedKey: share.encrypted_key,
      iv: share.iv,
      fileManifest: share.file_manifest,
    });
  } catch (error) {
    console.error("Claim share error:", error);
    return NextResponse.json(
      { error: "Failed to claim share" },
      { status: 500 }
    );
  }
}
