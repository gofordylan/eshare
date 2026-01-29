import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "eshare - Files only they can decrypt",
  description: "End-to-end encrypted file sharing via ENS. Your files, your keys, your control.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://eshare.dylanbrodeur.org"),
  openGraph: {
    title: "eshare - Files only they can decrypt",
    description: "End-to-end encrypted file sharing via ENS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "eshare - Files only they can decrypt",
    description: "End-to-end encrypted file sharing via ENS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${playfair.variable} antialiased font-sans`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
