import { education, leadership, person, projects, stack, ui } from "./profile";
import type { Lang } from "./types";

const headings: Record<Lang, { summary: string; current: string; previous: string; selected: string }> = {
  en: { summary: "SUMMARY", current: "CURRENT ENGAGEMENTS", previous: "PREVIOUS EXPERIENCE", selected: "SELECTED WORK" },
  fa: { summary: "خلاصه", current: "همکاری‌های جاری", previous: "تجربه قبلی", selected: "کارهای انتخابی" },
  ar: { summary: "الملخص", current: "الأعمال الحالية", previous: "الخبرة السابقة", selected: "أعمال مختارة" },
};

export function resumeText(lang: Lang): string {
  const t = ui[lang];
  const h = headings[lang];
  const blocks: string[] = [
    `${person.name} (${person.nickname})`,
    person.roleLine[lang],
    `${person.location[lang]} · ${person.relocation[lang]}`,
    "",
    `${t.email}: ${person.email}`,
    `${t.phone}: ${person.phone}`,
    `${t.linkedin}: ${person.linkedin}`,
    `${t.github}: ${person.github}`,
    "",
    h.summary,
    person.summary[lang],
  ];

  for (const group of ["current", "previous", "selected"] as const) {
    blocks.push("", group === "current" ? h.current : group === "previous" ? h.previous : h.selected);
    for (const project of projects.filter((item) => item.group === group)) {
      blocks.push(
        "",
        `${project.role[lang]}${project.period ? ` — ${project.period[lang]}` : ""}`,
        `${project.name}${project.place ? ` — ${project.place[lang]}` : ""}`,
        project.summary[lang],
        ...project.bullets[lang].map((bullet) => `• ${bullet}`),
        ...(project.href ? [project.href] : []),
      );
    }
  }

  blocks.push(
    "",
    t.stackTitle.toUpperCase(),
    stack.join(" · "),
    "",
    t.leadershipTitle.toUpperCase(),
    leadership[lang].join(" · "),
    "",
    t.educationTitle.toUpperCase(),
    ...education.map((item) => `${item.degree[lang]}\n${item.school}\n${item.years}`),
    "",
  );

  return blocks.join("\n");
}
