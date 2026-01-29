import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "eshare - Files only they can decrypt";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#fafafa",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Left Zone */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "45%",
            height: "100%",
          }}
        >
          {/* Logo + Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "2px solid #0a0a0a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0a0a0a"
                strokeWidth="1.5"
              >
                <rect x="5" y="11" width="14" height="10" rx="1" />
                <path d="M8 11V7a4 4 0 1 1 8 0v4" />
              </svg>
            </div>
            <span
              style={{
                fontSize: "28px",
                fontWeight: 500,
                color: "#0a0a0a",
                letterSpacing: "-0.02em",
              }}
            >
              eshare
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h1
              style={{
                fontSize: "64px",
                fontWeight: 400,
                color: "#0a0a0a",
                letterSpacing: "-0.04em",
                lineHeight: 0.95,
                margin: 0,
              }}
            >
              Files only they
              <br />
              can decrypt.
            </h1>
            <p
              style={{
                fontSize: "20px",
                color: "#71717a",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              End-to-end encrypted file sharing via ENS
            </p>
          </div>
        </div>

        {/* Right Zone - Floating Panel */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            width: "55%",
            height: "100%",
            paddingLeft: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "420px",
              background: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e4e4e7",
              boxShadow:
                "0 0 0 1px rgba(0,0,0,0.03), 0 4px 8px rgba(0,0,0,0.04), 0 24px 48px rgba(0,0,0,0.08)",
              padding: "32px",
              gap: "24px",
            }}
          >
            {/* Panel Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #e4e4e7",
                paddingBottom: "20px",
              }}
            >
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: 400,
                  color: "#0a0a0a",
                  letterSpacing: "-0.03em",
                }}
              >
                Send
              </span>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  border: "1px solid #e4e4e7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0a0a0a"
                  strokeWidth="1.5"
                >
                  <rect x="5" y="11" width="14" height="10" rx="1" />
                  <path d="M8 11V7a4 4 0 1 1 8 0v4" />
                </svg>
              </div>
            </div>

            {/* Dropzone placeholder */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100px",
                background: "#fafafa",
                border: "1px dashed #d4d4d8",
                gap: "8px",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#71717a"
                strokeWidth="1.5"
              >
                <path d="M12 15V3m0 0l-4 4m4-4l4 4" />
                <path d="M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17" />
              </svg>
              <span style={{ fontSize: "14px", color: "#71717a" }}>
                Drop files here
              </span>
            </div>

            {/* Input placeholder */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  color: "#71717a",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                To
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "44px",
                  background: "#ffffff",
                  border: "1px solid #e4e4e7",
                  padding: "0 16px",
                }}
              >
                <span style={{ fontSize: "14px", color: "#a1a1aa" }}>
                  vitalik.eth
                </span>
              </div>
            </div>

            {/* Button placeholder */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "48px",
                background: "#0a0a0a",
                color: "#fafafa",
                fontSize: "14px",
                fontWeight: 500,
                gap: "8px",
              }}
            >
              <span>Encrypt & Send</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
