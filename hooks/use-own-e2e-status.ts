"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";

export function useOwnE2EStatus() {
  const { address, isConnected } = useAccount();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!address) {
      setIsRegistered(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/pubkey/${address}`);
      setIsRegistered(res.ok);
    } catch {
      setIsRegistered(false);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      checkStatus();
    } else {
      setIsRegistered(false);
    }
  }, [isConnected, address, checkStatus]);

  const refresh = useCallback(() => {
    checkStatus();
  }, [checkStatus]);

  return { isRegistered, isLoading, isConnected, address, refresh };
}
