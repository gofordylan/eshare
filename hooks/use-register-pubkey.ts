"use client";

import { useState } from "react";
import { generateDerivedKeyMessage } from "@/lib/crypto";
import { deriveKeyPair } from "@/lib/derived-keys";

export function useRegisterPubkey() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerPubkey = async (
    address: string,
    signMessageAsync: (args: { message: string }) => Promise<string>
  ) => {
    setIsRegistering(true);
    setError(null);

    try {
      // Sign the derivation message (for E2E key derivation)
      const derivationMessage = generateDerivedKeyMessage(address);
      const derivationSignature = await signMessageAsync({ message: derivationMessage });

      // Derive the public key from the signature
      const { publicKey } = deriveKeyPair(derivationSignature);

      // Store the public key
      const res = await fetch(`/api/pubkey/${address}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to register public key");
      }

      return { success: true, publicKey };
    } catch (e) {
      let message = "Failed to register key";
      if (e instanceof Error) {
        // Handle user rejection
        if (e.message.includes("rejected") || e.message.includes("denied")) {
          message = "Signature rejected";
        } else {
          message = e.message;
        }
      }
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsRegistering(false);
    }
  };

  return { registerPubkey, isRegistering, error };
}
