import { NextRequest, NextResponse } from "next/server";
import { createShare } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      senderAddress,
      senderEns,
      recipientAddress,
      recipientEns,
      blobUrl,
      blobSizeBytes,
      encryptedKey,
      iv,
      fileManifest,
    } = body;

    // Validate required fields
    if (!senderAddress || !recipientAddress || !recipientEns || !blobUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!encryptedKey || !iv || !fileManifest) {
      return NextResponse.json(
        { error: "Missing encryption data" },
        { status: 400 }
      );
    }

    // Validate addresses
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(senderAddress) || !addressRegex.test(recipientAddress)) {
      return NextResponse.json(
        { error: "Invalid address format" },
        { status: 400 }
      );
    }

    const shareId = uuidv4();
    await createShare({
      id: shareId,
      senderAddress: senderAddress.toLowerCase(),
      senderEns,
      recipientAddress: recipientAddress.toLowerCase(),
      recipientEns,
      blobUrl,
      blobSizeBytes,
      encryptedKey,
      iv,
      fileManifest,
    });

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();
    const shareLink = `${appUrl}/s/${shareId}`;

    return NextResponse.json({
      shareId,
      shareLink,
    });
  } catch (error) {
    console.error("Create share error:", error);
    return NextResponse.json(
      { error: "Failed to create share" },
      { status: 500 }
    );
  }
}
