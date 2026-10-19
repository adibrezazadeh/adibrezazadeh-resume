export const LANGS = ["en", "fa", "ar"] as const;

export type Lang = (typeof LANGS)[number];

export type Selection =
  | { kind: "room" }
  | { kind: "os" }
  | { kind: "project"; id: string }
  | { kind: "skills" }
  | { kind: "contact" };

export type ProjectGroup = "current" | "previous" | "selected";

export type Localized = Record<Lang, string>;

export type Project = {
  id: string;
  name: string;
  href?: string;
  group: ProjectGroup;
  period: Localized | null;
  place: Localized | null;
  role: Localized;
  summary: Localized;
  bullets: Record<Lang, string[]>;
  mat: string;
};

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

export function dirFor(lang: Lang): "ltr" | "rtl" {
  return lang === "en" ? "ltr" : "rtl";
}
