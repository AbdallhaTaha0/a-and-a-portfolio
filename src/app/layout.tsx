import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

import { AmbientBackground } from "@/components/brand/ambient-background";

import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "A&A Portfolio",
    template: "%s | A&A Portfolio",
  },
  description: "The shared portfolio of the A&A team and its members.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} min-h-screen overflow-x-hidden bg-[#080808] font-[family-name:var(--font-body)] text-white antialiased selection:bg-[#ffb800] selection:text-[#080808]`}
      >
        <AmbientBackground />
        {children}
      </body>
    </html>
  );
}
