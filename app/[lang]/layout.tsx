import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { person, ui } from "@/lib/profile";
import { descriptions, languageAlternates, ogLocale, titles } from "@/lib/seo";
import { dirFor, isLang, LANGS } from "@/lib/types";

export const instant = false;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const description = descriptions[lang];
  return {
    title: titles[lang],
    description,
    alternates: { canonical: `/${lang}`, languages: languageAlternates },
    openGraph: {
      type: "profile",
      url: `/${lang}`,
      siteName: person.names[lang],
      title: titles[lang],
      description,
      locale: ogLocale[lang],
      alternateLocale: LANGS.filter((code) => code !== lang).map((code) => ogLocale[code]),
      firstName: lang === "en" ? "Adib" : undefined,
      lastName: lang === "en" ? "Rezazadeh" : undefined,
    },
    twitter: { card: "summary_large_image", title: titles[lang], description },
  };
}

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dir = dirFor(lang);
  return (
    <div className={lang === "ar" ? "locale-rtl locale-ar" : dir === "rtl" ? "locale-rtl" : "locale-ltr"} lang={lang} dir={dir}>
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
