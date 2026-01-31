"use client";

import { useState, useEffect } from "react";

export type E2EStatus = "unknown" | "legacy" | "e2e-enabled";

export function useE2EEligibility(address: string | null) {
  const [status, setStatus] = useState<E2EStatus>("unknown");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setStatus("unknown");
      return;
    }

    const checkEligibility = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/pubkey/${address}`);
        // If pubkey exists, user has E2E enabled
        // If not, they're in legacy mode (address exists but no pubkey)
        setStatus(res.ok ? "e2e-enabled" : "legacy");
      } catch {
        setStatus("legacy");
      } finally {
        setIsLoading(false);
      }
    };

    checkEligibility();
  }, [address]);

  return { status, isLoading };
}
