"use client";

import { useCallback } from "react";
import { encryptFiles, packFiles, generateKey, exportKey, generateIV, encrypt, arrayBufferToBase64 } from "@/lib/crypto";
import { eciesEncrypt, hexToBytes, bytesToHex, isValidPublicKey } from "@/lib/ecies";

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
  encryptionMode: "ecies" | "legacy";
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
      onProgress?.("encrypting", 0);

      // Try to get recipient's derived public key for E2E encryption
      // This key is stored when the recipient claims their first share
      let recipientPublicKey: string | null = null;
      try {
        const pubkeyResponse = await fetch(`/api/pubkey/${recipientAddress}`);
        if (pubkeyResponse.ok) {
          const { publicKey } = await pubkeyResponse.json();
          // Validate the public key
          const pubkeyBytes = hexToBytes(publicKey);
          if (isValidPublicKey(pubkeyBytes)) {
            recipientPublicKey = publicKey;
            console.log("Using E2E encryption - recipient has registered their public key");
          }
        } else {
          console.log("Recipient has not registered E2E public key yet, using legacy mode");
        }
      } catch (error) {
        console.warn("Could not fetch recipient public key, using legacy mode:", error);
      }

      let encryptedData: ArrayBuffer;
      let encryptionPayload: {
        encryptedKey?: string;
        ephemeralPublicKey?: string;
        encryptionMode: "ecies" | "legacy";
        iv: string;
        manifest: { files: Array<{ name: string; size: number; type: string; offset: number }>; totalSize: number };
      };

      if (recipientPublicKey) {
        // E2E encryption using ECIES
        onProgress?.("encrypting", 10);

        // Pack files
        const { data, manifest } = await packFiles(files);
        onProgress?.("encrypting", 30);

        // Generate AES key and IV
        const aesKey = await generateKey();
        const iv = generateIV();
        const aesKeyBytes = new Uint8Array(await crypto.subtle.exportKey("raw", aesKey));

        // Encrypt files with AES
        encryptedData = await encrypt(data, aesKey, iv);
        onProgress?.("encrypting", 60);

        // Encrypt the AES key with recipient's public key using ECIES
        const recipientPubKeyBytes = hexToBytes(recipientPublicKey);
        const eciesResult = await eciesEncrypt(recipientPubKeyBytes, aesKeyBytes);
        onProgress?.("encrypting", 90);

        // Combine ECIES ciphertext with IV for the AES key
        // Format: [ecies_iv (12 bytes)][ecies_ciphertext]
        const combinedEcies = new Uint8Array(eciesResult.iv.length + eciesResult.ciphertext.length);
        combinedEcies.set(eciesResult.iv);
        combinedEcies.set(eciesResult.ciphertext, eciesResult.iv.length);

        encryptionPayload = {
          ephemeralPublicKey: "0x" + bytesToHex(eciesResult.ephemeralPublicKey),
          encryptionMode: "ecies",
          iv: arrayBufferToBase64(iv.buffer as ArrayBuffer) + ":" + arrayBufferToBase64(combinedEcies.buffer as ArrayBuffer),
          manifest,
        };
      } else {
        // Legacy encryption (server holds key)
        const encrypted = await encryptFiles(files);
        encryptedData = encrypted.encryptedData;

        encryptionPayload = {
          encryptedKey: encrypted.key,
          encryptionMode: "legacy",
          iv: encrypted.iv,
          manifest: encrypted.manifest,
        };
      }

      onProgress?.("encrypting", 100);

      // Step 2: Upload encrypted blob
      onProgress?.("uploading", 0);
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: encryptedData,
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
          blobSizeBytes: encryptedData.byteLength,
          ...encryptionPayload,
          fileManifest: encryptionPayload.manifest,
        }),
      });

      if (!shareResponse.ok) {
        const error = await shareResponse.json();
        throw new Error(error.error || "Failed to create share");
      }

      const { shareId, shareLink, encryptionMode } = await shareResponse.json();
      onProgress?.("creating", 100);

      return { shareId, shareLink, encryptionMode };
    },
    []
  );

  return { encryptAndShare };
}
