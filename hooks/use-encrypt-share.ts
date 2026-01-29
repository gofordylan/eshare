"use client";

import { useCallback } from "react";
import { encryptFiles } from "@/lib/crypto";

interface EncryptShareParams {
  files: File[];
  senderAddress: string;
  senderEns?: string | null;
  recipientAddress: string;
  recipientEns: string;
  onProgress?: (stage: "encrypting" | "uploading" | "creating", progress: number) => void;
}

interface EncryptShareResult {
  shareId: string;
  shareLink: string;
}

export function useEncryptShare() {
  const encryptAndShare = useCallback(
    async ({
      files,
      senderAddress,
      senderEns,
      recipientAddress,
      recipientEns,
      onProgress,
    }: EncryptShareParams): Promise<EncryptShareResult> => {
      // Step 1: Encrypt files
      onProgress?.("encrypting", 0);
      const encrypted = await encryptFiles(files);
      onProgress?.("encrypting", 100);

      // Step 2: Upload encrypted blob
      onProgress?.("uploading", 0);
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: encrypted.encryptedData,
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Failed to upload file");
      }

      const { url: blobUrl } = await uploadResponse.json();
      onProgress?.("uploading", 100);

      // Step 3: Create share record
      onProgress?.("creating", 0);
      const shareResponse = await fetch("/api/shares", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderAddress,
          senderEns: senderEns || null,
          recipientAddress,
          recipientEns,
          blobUrl,
          blobSizeBytes: encrypted.encryptedData.byteLength,
          encryptedKey: encrypted.key,
          iv: encrypted.iv,
          fileManifest: encrypted.manifest,
        }),
      });

      if (!shareResponse.ok) {
        const error = await shareResponse.json();
        throw new Error(error.error || "Failed to create share");
      }

      const { shareId, shareLink } = await shareResponse.json();
      onProgress?.("creating", 100);

      return { shareId, shareLink };
    },
    []
  );

  return { encryptAndShare };
}
