import { ShareForm } from "@/components/share-form";

export default function Home() {
  return (
    <main className="min-h-screen lg:h-screen lg:overflow-hidden overflow-auto relative flex flex-col">
      {/* Header - Brand only */}
      <header className="shrink-0 px-6 lg:px-12 pt-6 lg:pt-8 pb-6 lg:pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 animate-fade-up">
            <div className="w-8 h-8 border border-current flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="11" width="14" height="10" rx="1" />
                <path d="M8 11V7a4 4 0 1 1 8 0v4" />
              </svg>
            </div>
            <span className="text-lg font-medium tracking-tight">eshare</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="flex-1 min-h-0 px-6 lg:px-12 pb-8 lg:pb-12">
        <div className="max-w-6xl mx-auto w-full h-full">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-16 lg:items-end">
            {/* Left: Hero + Info */}
            <div className="lg:w-1/2 animate-fade-up-delay-1">
              {/* Hero */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-[0.92] mb-4">
                Files only they
                <br />
                can decrypt.
              </h1>

              <p className="text-lg lg:text-xl mb-6" style={{ color: 'var(--muted-foreground)' }}>
                End-to-end encrypted file sharing via ENS.
              </p>

              {/* Security section - hidden on mobile */}
              <div className="mb-4 hidden lg:block">
                <span className="section-label mb-3 block">Security</span>
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    Files are encrypted in your browser using the recipient&apos;s public key derived from their address. Only their wallet can decrypt. We never see your files or keys.
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    The encryption happens entirely client-side using industry-standard cryptography. Your data is protected before it ever leaves your device.
                  </p>
                </div>
              </div>

              {/* Technical specs - hidden on mobile */}
              <div className="p-4 border hidden lg:block" style={{ borderColor: 'var(--border)' }}>
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
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--muted-foreground)' }}>Max file size</span>
                    <span className="mono">100 MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:w-1/2 animate-fade-up-delay-2">
              <ShareForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
