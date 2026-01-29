"use client";

import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi-config";
import { ThemeProvider } from "@/lib/theme-context";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const rainbowTheme = lightTheme({
  accentColor: "#000000",
  accentColorForeground: "white",
  borderRadius: "medium",
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RainbowKitProvider theme={rainbowTheme}>
            {children}
          </RainbowKitProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
