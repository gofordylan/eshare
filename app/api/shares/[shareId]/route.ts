import { NextRequest, NextResponse } from "next/server";
import { getShareForClaim } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const share = await getShareForClaim(shareId);

    if (!share) {
      return NextResponse.json(
        { error: "Share not found or expired" },
        { status: 404 }
      );
    }

    // Return share info without the decryption key
    return NextResponse.json({
      id: share.id,
      senderAddress: share.sender_address,
      senderEns: share.sender_ens,
      recipientAddress: share.recipient_address,
      recipientEns: share.recipient_ens,
      fileManifest: share.file_manifest,
      createdAt: share.created_at,
      expiresAt: share.expires_at,
      claimed: !!share.claimed_at,
    });
  } catch (error) {
    console.error("Get share error:", error);
    return NextResponse.json(
      { error: "Failed to get share" },
      { status: 500 }
    );
  }
}
