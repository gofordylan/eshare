import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fafafa"
          strokeWidth="2"
        >
          <rect x="5" y="11" width="14" height="10" rx="1" />
          <path d="M8 11V7a4 4 0 1 1 8 0v4" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
