"use client";

import { use } from "react";
import { ClaimCard } from "@/components/claim-card";

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="11" width="14" height="10" rx="1" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

export default function ClaimPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = use(params);

  return (
    <main className="h-screen overflow-hidden relative flex flex-col">
      {/* Header - Brand only */}
      <header className="shrink-0 px-6 lg:px-12 pt-6 lg:pt-8 pb-6 lg:pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 animate-fade-up">
            <div className="w-8 h-8 border border-current flex items-center justify-center">
              <LockIcon className="w-4 h-4" />
            </div>
            <span className="text-lg font-medium tracking-tight">dshare</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="flex-1 min-h-0 px-6 lg:px-12 pb-8 lg:pb-12">
        <div className="max-w-6xl mx-auto w-full h-full">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 lg:items-stretch">
            {/* Left: Hero + Info */}
            <div className="lg:w-1/2 animate-fade-up-delay-1">
              {/* Hero */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-[0.92] mb-4">
                Files only <span className="font-semibold">you</span>
                <br />
                can decrypt.
              </h1>

              <p className="text-lg lg:text-xl mb-6" style={{ color: 'var(--muted-foreground)' }}>
                End-to-end encrypted file sharing via ENS.
              </p>

              {/* Security section */}
              <div className="mb-4">
                <span className="section-label mb-3 block">Security</span>
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    These files were encrypted using your public key derived from your address. Only your wallet can decrypt them.
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    Decryption happens entirely in your browser. Your private key never leaves your wallet.
                  </p>
                </div>
              </div>

              {/* Technical specs */}
              <div className="p-4 border" style={{ borderColor: 'var(--border)' }}>
                <span className="section-label mb-3 block">Technical Details</span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--muted-foreground)' }}>Encryption</span>
                    <span className="mono">AES-256-GCM + ECDH</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--muted-foreground)' }}>Key derivation</span>
                    <span className="mono">secp256k1</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--muted-foreground)' }}>Storage duration</span>
                    <span className="mono">7 days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Claim Card */}
            <div className="lg:w-1/2 animate-fade-up-delay-2">
              <ClaimCard shareId={shareId} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
