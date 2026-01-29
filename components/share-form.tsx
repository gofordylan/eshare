"use client";

import { useState } from "react";
import { useAccount, useEnsName } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FileDropzone } from "@/components/file-dropzone";
import { EnsInput } from "@/components/ens-input";
import { useEncryptShare } from "@/hooks/use-encrypt-share";

type ShareStatus = "idle" | "encrypting" | "uploading" | "creating" | "done" | "error";

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="11" width="14" height="10" rx="1" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="9" y="9" width="13" height="13" rx="1" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShareForm() {
  const { address, isConnected } = useAccount();
  const { data: senderEns } = useEnsName({ address });
  const [files, setFiles] = useState<File[]>([]);
  const [recipient, setRecipient] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<ShareStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { encryptAndShare } = useEncryptShare();

  const handleShare = async () => {
    if (!address || !resolvedAddress || files.length === 0) return;

    setStatus("encrypting");
    setProgress(10);
    setError(null);
    setShareLink(null);

    try {
      const result = await encryptAndShare({
        files,
        senderAddress: address,
        senderEns: senderEns || null,
        recipientAddress: resolvedAddress,
        recipientEns: recipient,
        onProgress: (stage, pct) => {
          if (stage === "encrypting") {
            setStatus("encrypting");
            setProgress(10 + pct * 0.3);
          } else if (stage === "uploading") {
            setStatus("uploading");
            setProgress(40 + pct * 0.4);
          } else if (stage === "creating") {
            setStatus("creating");
            setProgress(80 + pct * 0.2);
          }
        },
      });

      setStatus("done");
      setProgress(100);
      setShareLink(result.shareLink);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setRecipient("");
    setResolvedAddress(null);
    setStatus("idle");
    setProgress(0);
    setShareLink(null);
    setError(null);
  };

  const handleCopy = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canShare = isConnected && files.length > 0 && resolvedAddress && status === "idle";
  const isProcessing = ["encrypting", "uploading", "creating"].includes(status);

  const statusText: Record<ShareStatus, string> = {
    idle: "",
    encrypting: "Encrypting...",
    uploading: "Uploading...",
    creating: "Creating link...",
    done: "Complete",
    error: "Failed",
  };

  return (
    <div className="vault-card p-6 lg:p-8 relative h-full flex flex-col min-h-[420px]">
      {/* Corner Accents */}
      <div className="corner-accent corner-accent-tl" />
      <div className="corner-accent corner-accent-tr" />
      <div className="corner-accent corner-accent-bl" />
      <div className="corner-accent corner-accent-br" />

      {!isConnected ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
              <LockIcon className="w-6 h-6" />
            </div>
            <h2 className="text-2xl mb-2">Connect wallet</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
              Sign in to start sharing encrypted files
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        </div>
      ) : shareLink ? (
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center mb-6">
            <div className="success-check w-12 h-12 mx-auto mb-4 border flex items-center justify-center" style={{ borderColor: 'var(--primary)' }}>
              <CheckIcon className="w-6 h-6" />
            </div>
            <h2 className="text-2xl mb-2">Sealed</h2>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Share this link with <span className="mono" style={{ color: 'var(--foreground)' }}>{recipient}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div
              className="flex items-center gap-3 p-4 border"
              style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}
            >
              <code className="flex-1 text-xs break-all mono" style={{ color: 'var(--muted-foreground)' }}>
                {shareLink}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 p-2 transition-colors hover:bg-white"
              >
                {copied ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <CopyIcon className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                )}
              </button>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 px-4 text-sm font-medium transition-colors border"
              style={{ borderColor: 'var(--border)' }}
            >
              Share more files
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-2xl">Send</h2>
            <div className="w-10 h-10 border flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
              <LockIcon className="w-5 h-5" />
            </div>
          </div>

          <FileDropzone
            files={files}
            onFilesChange={setFiles}
            disabled={isProcessing}
          />

          <EnsInput
            value={recipient}
            onChange={setRecipient}
            resolvedAddress={resolvedAddress}
            onResolvedAddressChange={setResolvedAddress}
            disabled={isProcessing}
          />

          {/* Button with integrated progress */}
          <div className="relative">
            <button
              onClick={handleShare}
              disabled={!canShare && !isProcessing}
              className={`w-full py-3.5 px-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${canShare ? 'btn-vault' : ''}`}
              style={{
                background: isProcessing ? 'var(--primary)' : canShare ? 'var(--primary)' : 'var(--muted)',
                color: isProcessing ? 'var(--primary-foreground)' : canShare ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                cursor: canShare || isProcessing ? 'pointer' : 'not-allowed'
              }}
            >
              {isProcessing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="mono">{statusText[status]}</span>
                </>
              ) : (
                <>
                  <span>Encrypt & Send</span>
                  <ArrowIcon className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Progress bar overlay at bottom of button */}
            {isProcessing && (
              <div
                className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  background: 'var(--primary-foreground)',
                  opacity: 0.5
                }}
              />
            )}

            {/* Error message - absolute positioned below button */}
            {error && !isProcessing && (
              <p className="absolute -bottom-5 left-0 right-0 text-xs text-center" style={{ color: 'var(--destructive)' }}>{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
