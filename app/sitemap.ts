import type { MetadataRoute } from "next";
import { absolute } from "@/lib/site";
import { LANGS } from "@/lib/types";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries([...LANGS.map((lang) => [lang, absolute(`/${lang}`)]), ["x-default", absolute("/")]]);
  return [
    { url: absolute("/"), changeFrequency: "monthly", priority: 0.6, alternates: { languages } },
    ...LANGS.map((lang) => ({
      url: absolute(`/${lang}`),
      changeFrequency: "monthly" as const,
      priority: lang === "en" ? 1 : 0.9,
      alternates: { languages },
    })),
  ];
}
