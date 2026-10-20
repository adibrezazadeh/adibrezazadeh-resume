import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adib Rezazadeh — choose a language",
  description: "Full-stack engineer and technical lead. Shiraz.",
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
