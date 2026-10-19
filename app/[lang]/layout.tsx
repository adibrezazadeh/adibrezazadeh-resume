import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { person, ui } from "@/lib/profile";
import { dirFor, isLang, LANGS, type Lang } from "@/lib/types";

export const instant = false;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const titles: Record<Lang, string> = {
    en: "Shahrokh's office — Adib Rezazadeh",
    fa: "دفتر شاهرخ — ادیب رضازاده",
    ar: "مكتب شاهرخ — أديب رضازاده",
  };
  return {
    title: titles[lang],
    description: person.summary[lang],
    alternates: { canonical: `/${lang}`, languages: { en: "/en", fa: "/fa", ar: "/ar" } },
  };
}

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dir = dirFor(lang);
  return (
    <div className={dir === "rtl" ? "locale-rtl" : "locale-ltr"} lang={lang} dir={dir}>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(lang)};document.documentElement.dir=${JSON.stringify(dir)};`,
        }}
      />
      <span className="sr-only">{ui[lang].bootLine}</span>
      {children}
    </div>
  );
}
