import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Outfit, Vazirmatn } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex", display: "swap" });
const vazir = Vazirmatn({ subsets: ["arabic", "latin"], variable: "--font-vazir", display: "swap" });
// Emkan (FontIran, licensed by the site owner) for Persian and Arabic; Vazirmatn fills any missing glyph.
const emkan = localFont({
  src: [
    { path: "./fonts/emkan/Emkan-Thin.woff2", weight: "200", style: "normal" },
    { path: "./fonts/emkan/Emkan-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/emkan/Emkan-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/emkan/Emkan-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-emkan",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Adib Rezazadeh — Senior Full-Stack Engineer",
  description:
    "Portfolio of Adib Rezazadeh, senior full-stack engineer and technical leader in Shiraz. React, Next.js, TypeScript, and Node.js.",
  alternates: { languages: { en: "/en", fa: "/fa", ar: "/ar" } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} ${plex.variable} ${vazir.variable} ${emkan.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
