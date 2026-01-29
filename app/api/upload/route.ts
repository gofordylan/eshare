import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.arrayBuffer();

    if (!body || body.byteLength === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Max 100MB
    const maxSize = 100 * 1024 * 1024;
    if (body.byteLength > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 100MB." },
        { status: 400 }
      );
    }

    const filename = `${uuidv4()}.encrypted`;
    const blob = await put(filename, body, {
      access: "public",
      contentType: "application/octet-stream",
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
