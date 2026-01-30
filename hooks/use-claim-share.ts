"use client";

import { useCallback } from "react";
import { decryptFiles, FileManifest, base64ToArrayBuffer, unpackFiles } from "@/lib/crypto";
import { eciesDecrypt, hexToBytes } from "@/lib/ecies";
import { keccak256 } from "viem";

interface ClaimShareParams {
  shareId: string;
  signature: string;
  derivationSignature: string; // Signature of derivation message for E2E key derivation
  walletAddress: string;
  onProgress?: (
    stage: "claiming" | "downloading" | "decrypting",
    progress: number
  ) => void;
}

interface ClaimResponse {
  blobUrl: string;
  iv: string;
  fileManifest: FileManifest;
  encryptionMode: "ecies" | "legacy";
  // Legacy mode
  encryptedKey?: string;
  // E2E mode
  ephemeralPublicKey?: string;
}

/**
 * Derive a deterministic encryption private key from a wallet signature.
 * The signature is deterministic for a given message + private key,
 * so this produces a consistent key that only the wallet owner can derive.
 */
function derivePrivateKeyFromSignature(signature: string): Uint8Array {
  // Hash the signature to get a valid 32-byte secp256k1 private key
  const hash = keccak256(signature as `0x${string}`);
  return hexToBytes(hash);
}

export function useClaimShare() {
  const claimAndDecrypt = useCallback(
    async ({
      shareId,
      signature,
      derivationSignature,
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

      const claimData: ClaimResponse = await claimResponse.json();
      const { blobUrl, iv, fileManifest, encryptionMode } = claimData;
      onProgress?.("claiming", 100);

      // Step 2: Download the encrypted blob
      onProgress?.("downloading", 0);
      const blobResponse = await fetch(blobUrl);
      if (!blobResponse.ok) {
        throw new Error("Failed to download encrypted file");
      }
      const encryptedData = await blobResponse.arrayBuffer();
      onProgress?.("downloading", 100);

      // Step 3: Decrypt the files based on encryption mode
      onProgress?.("decrypting", 0);

      let files: File[];

      if (encryptionMode === "ecies" && claimData.ephemeralPublicKey) {
        // E2E decryption using ECIES
        // The IV field contains: "fileIV:eciesData" where eciesData = eciesIV + encryptedAESKey
        const [fileIvBase64, eciesDataBase64] = iv.split(":");
        const fileIv = new Uint8Array(base64ToArrayBuffer(fileIvBase64));
        const eciesData = new Uint8Array(base64ToArrayBuffer(eciesDataBase64));

        // Extract ECIES IV (first 12 bytes) and encrypted AES key (rest)
        const eciesIv = eciesData.slice(0, 12);
        const encryptedAESKey = eciesData.slice(12);

        // Derive the recipient's encryption private key from the derivation signature
        // This uses the consistent derivation message, not the share-specific claim message
        const recipientPrivateKey = derivePrivateKeyFromSignature(derivationSignature);

        // Get the sender's ephemeral public key
        const ephemeralPublicKey = hexToBytes(claimData.ephemeralPublicKey);

        // Decrypt the AES key using ECIES
        const aesKeyBytes = await eciesDecrypt(
          recipientPrivateKey,
          ephemeralPublicKey,
          eciesIv,
          encryptedAESKey
        );

        // Import the AES key
        const aesKey = await crypto.subtle.importKey(
          "raw",
          aesKeyBytes.buffer as ArrayBuffer,
          { name: "AES-GCM", length: 256 },
          false,
          ["decrypt"]
        );

        // Decrypt the file data
        const decryptedData = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: fileIv as Uint8Array<ArrayBuffer> },
          aesKey,
          encryptedData
        );

        // Unpack files from decrypted data
        files = unpackFiles(decryptedData, fileManifest);
      } else {
        // Legacy decryption (server provided the key)
        if (!claimData.encryptedKey) {
          throw new Error("Missing encryption key for legacy mode");
        }
        files = await decryptFiles(
          encryptedData,
          claimData.encryptedKey,
          iv,
          fileManifest
        );
      }

      onProgress?.("decrypting", 100);

      return files;
    },
    []
  );

  return { claimAndDecrypt };
}
