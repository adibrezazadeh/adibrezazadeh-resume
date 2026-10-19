import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shahrokh's office — choose a language",
};

export default function HomePage() {
  return (
    <main className="gate">
      <div className="gate-card">
        <p className="kicker">Shiraz · Adib Rezazadeh</p>
        <h1 className="display">Shahrokh&apos;s office</h1>
        <div className="gate-names">
          <p className="gate-role" lang="fa" dir="rtl">
            دفتر شاهرخ
          </p>
          <p className="gate-role" lang="ar" dir="rtl">
            مكتب شاهرخ
          </p>
        </div>
        <p className="gate-role">Senior full-stack engineer & technical leader</p>
        <p className="gate-role" lang="fa" dir="rtl">
          مهندس ارشد فول‌استک و رهبر فنی
        </p>
        <p className="gate-role" lang="ar" dir="rtl">
          مهندس فل ستاك أول وقائد تقني
        </p>
        <nav className="gate-nav" aria-label="Language">
          <a href="/en">
            English
            <small>EN</small>
          </a>
          <a href="/fa" lang="fa" dir="rtl">
            فارسی
            <small>FA</small>
          </a>
          <a href="/ar" lang="ar" dir="rtl">
            العربية
            <small>AR</small>
          </a>
        </nav>
        <p className="gate-foot">React · Next.js · TypeScript · Node.js</p>
      </div>
    </main>
  );
}
