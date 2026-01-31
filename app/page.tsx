import Link from "next/link";
import { ShareForm } from "@/components/share-form";
import { SetupE2ECard } from "@/components/setup-e2e-card";

export default function Home() {
  return (
    <main className="h-screen overflow-hidden relative flex flex-col">
      {/* Header - Brand only */}
      <header className="shrink-0 px-6 lg:px-12 pt-6 lg:pt-8 pb-6 lg:pb-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-3 animate-fade-up hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 border border-current flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="11" width="14" height="10" rx="1" />
                <path d="M8 11V7a4 4 0 1 1 8 0v4" />
              </svg>
            </div>
            <span className="text-lg font-medium tracking-tight">eshare</span>
          </Link>
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
                Send files no one
                <br />
                else can read.
              </h1>

              <p className="text-lg lg:text-xl mb-6" style={{ color: 'var(--muted-foreground)' }}>
                End-to-end encrypted file sharing via ENS.
              </p>

              {/* Security section */}
              <div className="mb-4">
                <span className="section-label mb-3 block">How it works</span>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  Your files are encrypted in your browser with a random AES-256 key. That key is then wrapped using the recipient&apos;s public key (derived from their wallet). The encrypted blob is stored and automatically deleted after 7 days. Only the recipient&apos;s wallet can unwrap the key and then decrypt the files.
                </p>
              </div>

              {/* Technical specs */}
              <div className="p-4 border mb-4" style={{ borderColor: 'var(--border)' }}>
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

              {/* E2E Setup Card */}
              <SetupE2ECard />
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
