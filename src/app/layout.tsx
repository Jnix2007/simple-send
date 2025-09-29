'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CDPHooksProvider } from '@coinbase/cdp-hooks';
import { wagmiConfig } from '../config/wagmi';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono", 
  subsets: ["latin"],
});

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <CDPHooksProvider config={{
          projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID!,
        }}>
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          </WagmiProvider>
        </CDPHooksProvider>
      </body>
    </html>
  );
}
