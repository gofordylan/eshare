"use client";

import { useCallback } from "react";
import { decryptFiles, FileManifest } from "@/lib/crypto";

interface ClaimShareParams {
  shareId: string;
  signature: string;
  walletAddress: string;
  onProgress?: (
    stage: "claiming" | "downloading" | "decrypting",
    progress: number
  ) => void;
}

export function useClaimShare() {
  const claimAndDecrypt = useCallback(
    async ({
      shareId,
      signature,
      walletAddress,
      onProgress,
    }: ClaimShareParams): Promise<File[]> => {
      // Step 1: Claim the share
      onProgress?.("claiming", 0);
      const claimResponse = await fetch(`/api/shares/${shareId}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signature, walletAddress }),
      });

      if (!claimResponse.ok) {
        const error = await claimResponse.json();
        throw new Error(error.error || "Failed to claim share");
      }

      const { blobUrl, encryptedKey, iv, fileManifest } = await claimResponse.json();
      onProgress?.("claiming", 100);

      // Step 2: Download the encrypted blob
      onProgress?.("downloading", 0);
      const blobResponse = await fetch(blobUrl);
      if (!blobResponse.ok) {
        throw new Error("Failed to download encrypted file");
      }
      const encryptedData = await blobResponse.arrayBuffer();
      onProgress?.("downloading", 100);

      // Step 3: Decrypt the files
      onProgress?.("decrypting", 0);
      const files = await decryptFiles(
        encryptedData,
        encryptedKey,
        iv,
        fileManifest as FileManifest
      );
      onProgress?.("decrypting", 100);

      return files;
    },
    []
  );

  return { claimAndDecrypt };
}
