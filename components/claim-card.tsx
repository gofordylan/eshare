"use client";

import { useState, useEffect } from "react";
import { useAccount, useSignMessage, useEnsName } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useClaimShare } from "@/hooks/use-claim-share";
import { generateClaimMessage, FileManifest } from "@/lib/crypto";

interface ShareInfo {
  id: string;
  senderAddress: string;
  senderEns: string | null;
  recipientAddress: string;
  recipientEns: string;
  fileManifest: FileManifest;
  createdAt: string;
  expiresAt: string;
  claimed: boolean;
}

interface ClaimCardProps {
  shareId: string;
}

type ClaimStatus = "loading" | "ready" | "signing" | "claiming" | "decrypting" | "done" | "error" | "not-found" | "wrong-wallet";

function LockOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="11" width="14" height="10" rx="1" />
      <path d="M8 11V7a4 4 0 0 1 8 0" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="11" width="14" height="10" rx="1" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

function FileIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function DownloadIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3V15M12 15L8 11M12 15L16 11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V17" strokeLinecap="round" />
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

function WarningIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
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

export function ClaimCard({ shareId }: ClaimCardProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);

  // Resolve sender's ENS name if not already stored
  const { data: resolvedSenderEns } = useEnsName({
    address: shareInfo?.senderAddress as `0x${string}` | undefined,
    query: {
      enabled: !!shareInfo?.senderAddress && !shareInfo?.senderEns,
    },
  });
  const [status, setStatus] = useState<ClaimStatus>("loading");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloadedFiles, setDownloadedFiles] = useState<File[]>([]);

  const { claimAndDecrypt } = useClaimShare();

  useEffect(() => {
    async function fetchShareInfo() {
      try {
        const res = await fetch(`/api/shares/${shareId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setStatus("not-found");
            return;
          }
          throw new Error("Failed to fetch share info");
        }
        const data = await res.json();
        setShareInfo(data);
        setStatus("ready");
      } catch {
        setStatus("error");
        setError("Failed to load share information");
      }
    }

    fetchShareInfo();
  }, [shareId]);

  useEffect(() => {
    if (shareInfo && isConnected && address) {
      if (address.toLowerCase() !== shareInfo.recipientAddress.toLowerCase()) {
        setStatus("wrong-wallet");
      } else if (status === "wrong-wallet") {
        setStatus("ready");
      }
    }
  }, [shareInfo, isConnected, address, status]);

  const handleClaim = async () => {
    if (!address || !shareInfo) return;

    setStatus("signing");
    setProgress(0);
    setError(null);

    try {
      const message = generateClaimMessage(shareId, address);
      const signature = await signMessageAsync({ message });

      setStatus("claiming");
      setProgress(20);

      const files = await claimAndDecrypt({
        shareId,
        signature,
        walletAddress: address,
        onProgress: (stage, pct) => {
          if (stage === "claiming") {
            setProgress(20 + pct * 0.3);
          } else if (stage === "downloading") {
            setStatus("decrypting");
            setProgress(50 + pct * 0.3);
          } else if (stage === "decrypting") {
            setProgress(80 + pct * 0.2);
          }
        },
      });

      setDownloadedFiles(files);
      setStatus("done");
      setProgress(100);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed to claim files");
    }
  };

  const downloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    downloadedFiles.forEach(downloadFile);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const isProcessing = ["signing", "claiming", "decrypting"].includes(status);

  const statusText: Record<string, string> = {
    signing: "Waiting for signature...",
    claiming: "Verifying...",
    decrypting: "Decrypting...",
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="vault-card w-full p-6 lg:p-8 relative h-full flex flex-col">
        <div className="corner-accent corner-accent-tl" />
        <div className="corner-accent corner-accent-tr" />
        <div className="corner-accent corner-accent-bl" />
        <div className="corner-accent corner-accent-br" />
        <div className="flex flex-col items-center justify-center py-8">
          <svg className="w-8 h-8 animate-spin mb-4" style={{ color: 'var(--primary)' }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (status === "not-found") {
    return (
      <div className="vault-card w-full p-6 lg:p-8 relative h-full flex flex-col">
        <div className="corner-accent corner-accent-tl" />
        <div className="corner-accent corner-accent-tr" />
        <div className="corner-accent corner-accent-bl" />
        <div className="corner-accent corner-accent-br" />
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 border flex items-center justify-center" style={{ borderColor: 'var(--destructive)' }}>
            <WarningIcon className="w-6 h-6" style={{ color: 'var(--destructive)' }} />
          </div>
          <h2 className="text-2xl mb-2">Not Found</h2>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            This share may have expired or doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const totalSize = shareInfo?.fileManifest.files.reduce((acc, f) => acc + f.size, 0) || 0;

  return (
    <div className="vault-card w-full p-6 lg:p-8 relative h-full flex flex-col">
      <div className="corner-accent corner-accent-tl" />
      <div className="corner-accent corner-accent-tr" />
      <div className="corner-accent corner-accent-bl" />
      <div className="corner-accent corner-accent-br" />

      {/* Header - fixed at top */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-2xl">Receive</h2>
        <div className="w-10 h-10 border flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
          {status === "done" ? <LockOpenIcon className="w-5 h-5" /> : <LockIcon className="w-5 h-5" />}
        </div>
      </div>

      {/* From info - fixed */}
      <div className="text-sm mb-4 shrink-0" style={{ color: 'var(--muted-foreground)' }}>
        From <span className="mono" style={{ color: 'var(--foreground)' }}>{shareInfo?.senderEns || resolvedSenderEns || formatAddress(shareInfo?.senderAddress || "")}</span>
      </div>

      {/* Content area - fills available space */}
      <div className="flex-1 flex flex-col">
        {/* Not connected */}
        {!isConnected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
                <LockIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg mb-2">Connect wallet</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
                Sign in to decrypt these files
              </p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          </div>
        ) : status === "wrong-wallet" ? (
          /* Wrong wallet */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border flex items-center justify-center" style={{ borderColor: 'var(--destructive)' }}>
                <WarningIcon className="w-6 h-6" style={{ color: 'var(--destructive)' }} />
              </div>
              <h3 className="text-lg mb-2">Wrong wallet</h3>
              <p className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>
                These files are for <span className="mono" style={{ color: 'var(--foreground)' }}>{shareInfo?.recipientEns}</span>
              </p>
              <p className="text-xs mb-6" style={{ color: 'var(--muted-foreground)' }}>
                Connected: {formatAddress(address || "")}
              </p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          </div>
        ) : status === "done" ? (
          /* Success - files ready */
          <div className="flex-1 flex flex-col">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium">Files</label>
                <div className="success-check w-5 h-5 border flex items-center justify-center" style={{ borderColor: 'var(--primary)' }}>
                  <CheckIcon className="w-3 h-3" />
                </div>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Decrypted</span>
              </div>
              <ul className="space-y-1 max-h-[120px] overflow-y-auto">
                {downloadedFiles.map((file, index) => (
                  <li key={index} className="file-item group">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                      <span className="truncate text-sm">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs mono" style={{ color: 'var(--muted-foreground)' }}>
                        {formatSize(file.size)}
                      </span>
                      <button
                        onClick={() => downloadFile(file)}
                        className="p-1 hover:opacity-70 transition-opacity"
                        title="Download"
                      >
                        <DownloadIcon className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="h-4">
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {downloadedFiles.length} file{downloadedFiles.length !== 1 && "s"} ready
                </p>
              </div>
            </div>

            {/* Spacer to push button to bottom */}
            <div className="flex-1" />

            <div className="relative shrink-0">
              <button
                onClick={downloadAll}
                className="w-full py-3.5 px-4 text-sm font-medium transition-all flex items-center justify-center gap-2 btn-vault"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                <DownloadIcon className="w-4 h-4" />
                <span>{downloadedFiles.length > 1 ? "Download All" : "Download"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Ready to claim */
          <div className="flex-1 flex flex-col">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Files</label>
              <ul className="space-y-1 max-h-[120px] overflow-y-auto">
                {shareInfo?.fileManifest.files.map((file, index) => (
                  <li key={index} className="file-item">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                      <span className="truncate text-sm" style={{ color: 'var(--muted-foreground)' }}>{file.name}</span>
                    </div>
                    <span className="text-xs mono" style={{ color: 'var(--muted-foreground)' }}>
                      {formatSize(file.size)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="h-4">
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {shareInfo?.fileManifest.files.length} file{(shareInfo?.fileManifest.files.length || 0) !== 1 && "s"} ({formatSize(totalSize)})
                </p>
              </div>
            </div>

            {/* Spacer to push button to bottom */}
            <div className="flex-1" />

            {error && (
              <p className="text-xs text-center mb-3" style={{ color: 'var(--destructive)' }}>{error}</p>
            )}

            <div className="relative shrink-0">
              <button
                onClick={handleClaim}
                disabled={isProcessing}
                className={`w-full py-3.5 px-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${!isProcessing ? 'btn-vault' : ''}`}
                style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
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
                    <span>Decrypt & Download</span>
                    <ArrowIcon className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Progress bar overlay */}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
