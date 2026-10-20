import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Outfit, Vazirmatn } from "next/font/google";
import { descriptions, languageAlternates, titles } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex", display: "swap" });
// Vazirmatn (SIL OFL 1.1) for Persian and Arabic.
const vazir = Vazirmatn({ subsets: ["arabic", "latin"], variable: "--font-vazir", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: titles.en,
  description: descriptions.en,
  applicationName: "Adib Rezazadeh",
  authors: [{ name: "Adib Rezazadeh", url: siteUrl }],
  creator: "Adib Rezazadeh",
  alternates: { languages: languageAlternates },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} ${plex.variable} ${vazir.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
