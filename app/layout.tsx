import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Noto_Naskh_Arabic, Outfit, Vazirmatn } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex", display: "swap" });
const vazir = Vazirmatn({ subsets: ["arabic", "latin"], variable: "--font-vazir", display: "swap" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["500", "600", "700"], variable: "--font-naskh", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Shahrokh's office — Adib Rezazadeh",
  description:
    "Portfolio of Adib Rezazadeh (Shahrokh), senior full-stack engineer and technical leader in Shiraz. React, Next.js, TypeScript, and Node.js.",
  alternates: { languages: { en: "/en", fa: "/fa", ar: "/ar" } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} ${plex.variable} ${vazir.variable} ${naskh.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
