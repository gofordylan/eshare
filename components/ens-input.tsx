"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface EnsInputProps {
  value: string;
  onChange: (value: string) => void;
  resolvedAddress: string | null;
  onResolvedAddressChange: (address: string | null) => void;
  disabled?: boolean;
}

function UserIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21C4 17.134 7.58172 14 12 14C16.4183 14 20 17.134 20 21" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12L11 15L16 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EnsInput({
  value,
  onChange,
  resolvedAddress,
  onResolvedAddressChange,
  disabled,
}: EnsInputProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveEns = useCallback(async (name: string) => {
    if (!name || !name.endsWith(".eth")) {
      onResolvedAddressChange(null);
      setError(null);
      return;
    }

    setIsResolving(true);
    setError(null);

    try {
      const res = await fetch(`/api/ens/${encodeURIComponent(name)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resolve ENS name");
        onResolvedAddressChange(null);
      } else if (data.address) {
        onResolvedAddressChange(data.address);
        setError(null);
      } else {
        setError("No address found for this ENS name");
        onResolvedAddressChange(null);
      }
    } catch {
      setError("Failed to resolve ENS name");
      onResolvedAddressChange(null);
    } finally {
      setIsResolving(false);
    }
  }, [onResolvedAddressChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      resolveEns(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value, resolveEns]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-2">
      <label htmlFor="recipient" className="block text-sm font-medium">
        Recipient
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <UserIcon className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
        </div>
        <input
          id="recipient"
          type="text"
          placeholder="vitalik.eth"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "input-vault w-full pl-10 pr-10 py-3 rounded-lg text-sm",
            "focus:outline-none focus:ring-0"
          )}
          style={{
            borderColor: error ? 'var(--destructive)' : resolvedAddress ? 'var(--primary)' : undefined
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isResolving && (
            <svg className="w-5 h-5 animate-spin" style={{ color: 'var(--primary)' }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
              <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          {resolvedAddress && !isResolving && !error && (
            <CheckCircleIcon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          )}
        </div>
      </div>

      {/* Fixed height container to prevent layout shift */}
      <div className="h-4">
        {error && (
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--destructive)' }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
            </svg>
            {error}
          </p>
        )}

        {resolvedAddress && !error && (
          <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
            <span>Verified:</span>
            <code
              className="px-1.5 py-0.5 rounded font-mono"
              style={{ background: 'var(--file-item-bg)', color: 'var(--primary)' }}
            >
              {formatAddress(resolvedAddress)}
            </code>
          </p>
        )}
      </div>
    </div>
  );
}
