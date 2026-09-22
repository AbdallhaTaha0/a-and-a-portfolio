import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { headers } from "next/headers";

import { AmbientBackground } from "@/components/brand/ambient-background";
import { getSiteOrigin, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

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
  metadataBase: new URL(getSiteOrigin()),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
    url: "/",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Enables Next.js to attach the per-request CSP nonce from src/proxy.ts.
  await headers();

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
