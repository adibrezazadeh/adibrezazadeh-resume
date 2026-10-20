import type { Metadata } from "next";
import { descriptions, languageAlternates, titles } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Adib Rezazadeh — choose a language",
  description: descriptions.en,
  alternates: { canonical: "/", languages: languageAlternates },
  openGraph: { type: "website", url: "/", siteName: "Adib Rezazadeh", title: titles.en, description: descriptions.en },
  twitter: { card: "summary_large_image", title: titles.en, description: descriptions.en },
};

export default function HomePage() {
  return (
    <main className="gate">
      <div className="gate-card">
        <p className="gate-kicker">Shiraz</p>
        <h1>Adib Rezazadeh</h1>
        <p className="gate-tag">Full-stack engineer and technical lead.</p>
        <hr className="gate-rule" />
        <p className="gate-line font-fa" lang="fa" dir="rtl">
          <strong>ادیب رضازاده</strong>
          <span>مهندس فول‌استک و رهبر فنی.</span>
        </p>
        <p className="gate-line font-ar" lang="ar" dir="rtl">
          <strong>أديب رضازاده</strong>
          <span>مهندس فل ستاك وقائد تقني.</span>
        </p>
        <nav className="gate-nav" aria-label="Language">
          <a href="/en">English</a>
          <a href="/fa" lang="fa">
            فارسی
          </a>
          <a href="/ar" lang="ar">
            العربية
          </a>
        </nav>
      </div>
    </main>
  );
}
