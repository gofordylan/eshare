"use client";

import { useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useOwnE2EStatus } from "@/hooks/use-own-e2e-status";
import { useRegisterPubkey } from "@/hooks/use-register-pubkey";

function LockIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="11" width="14" height="10" rx="1" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

function CheckIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5Z" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SetupE2ECard() {
  const { isRegistered, isLoading, isConnected, address, refresh } = useOwnE2EStatus();
  const { registerPubkey, isRegistering, error } = useRegisterPubkey();
  const { signMessageAsync } = useSignMessage();

  const handleEnable = async () => {
    if (!address) return;
    const result = await registerPubkey(address, signMessageAsync);
    if (result.success) {
      refresh();
    }
  };

  // Don't show if not connected
  if (!isConnected) {
    return (
      <div className="p-4 border" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 border flex items-center justify-center shrink-0" style={{ borderColor: 'var(--border)' }}>
            <LockIcon className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="section-label mb-2 block">End-to-End Encryption</span>
            <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
              Connect your wallet to enable E2E encryption for files sent to you.
            </p>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 border" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
            <svg className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Checking E2E status...</span>
        </div>
      </div>
    );
  }

  // Already registered
  if (isRegistered) {
    return (
      <div className="p-4 border" style={{ borderColor: 'var(--primary)', background: 'var(--file-item-bg)' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 border flex items-center justify-center shrink-0" style={{ borderColor: 'var(--primary)' }}>
            <ShieldIcon className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">E2E Encryption Enabled</span>
              <CheckIcon className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Your encryption key is registered. Anyone who sends you files will use true end-to-end encryption.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not registered - show enable button
  return (
    <div className="p-4 border" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 border flex items-center justify-center shrink-0" style={{ borderColor: 'var(--border)' }}>
          <LockIcon className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="section-label mb-2 block">Enable End-to-End Encryption</span>
          <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Register your encryption key so anyone who sends you files uses true E2E encryption. Only your wallet can decrypt - not even eshare servers can access the contents.
          </p>
          {error && (
            <p className="text-xs mb-2" style={{ color: 'var(--destructive)' }}>{error}</p>
          )}
          <button
            onClick={handleEnable}
            disabled={isRegistering}
            className="px-4 py-2 text-sm font-medium transition-all btn-vault"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              cursor: isRegistering ? 'not-allowed' : 'pointer',
              opacity: isRegistering ? 0.7 : 1,
            }}
          >
            {isRegistering ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Signing...
              </span>
            ) : (
              "Enable E2E"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
