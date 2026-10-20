import { education, leadership, person, projects, stack } from "./profile";
import { absolute, siteUrl } from "./site";
import type { Lang } from "./types";

export const titles: Record<Lang, string> = {
  en: "Adib Rezazadeh — Senior Full-Stack Engineer",
  fa: "ادیب رضازاده — مهندس ارشد فول‌استک",
  ar: "أديب رضازاده — مهندس فل ستاك أول",
};

// Search snippets stop around 155 characters; the full summary stays in the page and structured data.
export const descriptions: Record<Lang, string> = {
  en: "Adib Rezazadeh is a senior full-stack engineer and technical leader in Shiraz, Iran, with 6+ years building web and mobile products in React, Next.js, TypeScript, and Node.js.",
  fa: "ادیب رضازاده، مهندس ارشد فول‌استک و رهبر فنی در شیراز با بیش از ۶ سال تجربه ساخت محصولات وب و موبایل با React، Next.js، TypeScript و Node.js.",
  ar: "أديب رضازاده مهندس فل ستاك أول وقائد تقني في شيراز، إيران، بخبرة تزيد على ست سنوات في بناء منتجات الويب والموبايل بـ React وNext.js وTypeScript وNode.js.",
};

export const ogLocale: Record<Lang, string> = { en: "en_US", fa: "fa_IR", ar: "ar_AR" };

export const languageAlternates = { en: "/en", fa: "/fa", ar: "/ar", "x-default": "/" };

const PERSON_ID = `${siteUrl}/#person`;
const WEBSITE_ID = `${siteUrl}/#website`;

/** schema.org graph for one language page: the site, the profile page, and the person it is about. */
export function profileJsonLd(lang: Lang, photo: string | null) {
  const current = projects.filter((project) => project.group === "current");
  const schools = [...new Set(education.map((item) => item.school))];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: siteUrl,
        name: person.name,
        inLanguage: ["en", "fa", "ar"],
        about: { "@id": PERSON_ID },
      },
      {
        "@type": "ProfilePage",
        "@id": absolute(`/${lang}`),
        url: absolute(`/${lang}`),
        name: titles[lang],
        description: person.summary[lang],
        inLanguage: lang,
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: { "@id": PERSON_ID },
      },
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: person.names[lang],
        alternateName: [...new Set([person.name, person.names.fa, person.names.ar, person.nickname])].filter((name) => name !== person.names[lang]),
        jobTitle: person.roleLine[lang],
        description: person.summary[lang],
        url: absolute(`/${lang}`),
        ...(photo ? { image: absolute(photo) } : {}),
        email: `mailto:${person.email}`,
        telephone: person.phoneHref.replace(/^tel:/, ""),
        address: { "@type": "PostalAddress", addressLocality: "Shiraz", addressCountry: "IR" },
        sameAs: [person.linkedin, person.github],
        knowsAbout: [...stack, ...leadership.en],
        worksFor: current.map((project) => ({
          "@type": "Organization",
          name: project.name,
          ...(project.href ? { url: project.href } : {}),
        })),
        hasOccupation: current.map((project) => ({
          "@type": "Occupation",
          name: project.role[lang],
          ...(project.place ? { occupationLocation: { "@type": "Place", name: project.place[lang] } } : {}),
        })),
        alumniOf: schools.map((name) => ({ "@type": "EducationalOrganization", name })),
      },
    ],
  };
}

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
