import { answerQuestion } from "./assistant";
import { education, leadership, person, projects, stack, ui } from "./profile";
import type { Lang } from "./types";

export type CommandResult = {
  lines: string[];
  clear?: boolean;
  openProject?: string;
  openApp?: "resume" | "projects" | "contact" | "skills" | "assistant";
};

const helpRows: { cmd: string; about: Record<Lang, string> }[] = [
  { cmd: "help", about: { en: "show this list", fa: "همین فهرست", ar: "إظهار هذه القائمة" } },
  { cmd: "whoami", about: { en: "who Adib is", fa: "ادیب کیست", ar: "من هو أديب" } },
  { cmd: "projects", about: { en: "list the work", fa: "فهرست کارها", ar: "قائمة الأعمال" } },
  { cmd: "contact", about: { en: "email, phone, links", fa: "ایمیل، تلفن، لینک‌ها", ar: "البريد والهاتف والروابط" } },
  { cmd: "skills", about: { en: "stack and leadership", fa: "مهارت و رهبری", ar: "المهارات والقيادة" } },
  { cmd: "education", about: { en: "degrees", fa: "تحصیلات", ar: "الدراسة" } },
  { cmd: "resume", about: { en: "open the resume", fa: "باز کردن رزومه", ar: "فتح السيرة" } },
  { cmd: "open <id>", about: { en: "open a project or app", fa: "باز کردن پروژه یا برنامه", ar: "فتح مشروع أو تطبيق" } },
  { cmd: "clear", about: { en: "clear the screen", fa: "پاک کردن صفحه", ar: "مسح الشاشة" } },
];

const aliases: Record<string, string> = {
  help: "help",
  راهنما: "help",
  مساعدة: "help",
  مساعده: "help",
  کمک: "help",
  whoami: "whoami",
  who: "whoami",
  projects: "projects",
  project: "projects",
  ls: "projects",
  پروژه: "projects",
  پروژه‌ها: "projects",
  مشاريع: "projects",
  contact: "contact",
  تماس: "contact",
  تواصل: "contact",
  skills: "skills",
  skill: "skills",
  مهارت: "skills",
  مهارت‌ها: "skills",
  مهارات: "skills",
  education: "education",
  تحصیل: "education",
  تحصیلات: "education",
  تعليم: "education",
  دراسة: "education",
  resume: "resume",
  cv: "resume",
  رزومه: "resume",
  السيرة: "resume",
  clear: "clear",
  cls: "clear",
  open: "open",
  lang: "lang",
  pwd: "pwd",
};

export function runCommand(input: string, lang: Lang): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) return { lines: [] };
  const [head, ...rest] = trimmed.split(/\s+/);
  const verb = aliases[head.toLowerCase()] ?? aliases[head] ?? head.toLowerCase();
  const arg = rest.join(" ").trim();

  if (verb === "help") {
    return {
      lines: helpRows.map((row) => `${row.cmd.padEnd(12, " ")} ${row.about[lang]}`),
    };
  }

  if (verb === "whoami") {
    return { lines: answerQuestion("who is adib", lang).answer.split("\n") };
  }

  if (verb === "projects") {
    return {
      lines: projects.map(
        (project) =>
          `${project.id.padEnd(10, " ")} ${project.name} — ${project.role[lang]}${project.period ? ` (${project.period[lang]})` : ""}`,
      ),
    };
  }

  if (verb === "contact") {
    return { lines: answerQuestion("contact", lang).answer.split("\n") };
  }

  if (verb === "skills") {
    return {
      lines: [`${ui[lang].stackTitle}: ${stack.join(", ")}`, `${ui[lang].leadershipTitle}: ${leadership[lang].join(", ")}`],
    };
  }

  if (verb === "education") {
    return {
      lines: education.map((item) => `${item.years}  ${item.degree[lang]} — ${item.school}`),
    };
  }

  if (verb === "resume") return { lines: [ui[lang].resumeTitle], openApp: "resume" };
  if (verb === "clear") return { lines: [], clear: true };
  if (verb === "pwd") return { lines: ["/home/adib/office"] };
  if (verb === "lang") return { lines: [lang] };

  if (verb === "open") {
    const needle = arg.toLowerCase();
    if (!needle) return { lines: [helpRows.find((row) => row.cmd.startsWith("open"))?.about[lang] ?? "open <id>"] };
    if (["resume", "cv", "رزومه"].includes(needle)) return { lines: [ui[lang].resumeTitle], openApp: "resume" };
    if (["projects", "project"].includes(needle)) return { lines: [ui[lang].projectsTitle], openApp: "projects" };
    if (["contact"].includes(needle)) return { lines: [ui[lang].contactTitle], openApp: "contact" };
    if (["skills", "skill"].includes(needle)) return { lines: [ui[lang].skillsTitle], openApp: "skills" };
    if (["assistant", "bot"].includes(needle)) return { lines: [ui[lang].assistantTitle], openApp: "assistant" };
    const project = projects.find(
      (item) => item.id === needle || item.name.toLowerCase() === needle || item.name.toLowerCase().includes(needle),
    );
    if (!project) {
      return { lines: [`${arg}: ${ui[lang].terminalHelpHint}`] };
    }
    return { lines: [`${project.name} — ${project.role[lang]}`], openProject: project.id };
  }

  return {
    lines: [
      lang === "fa"
        ? `فرمان پیدا نشد: ${head}`
        : lang === "ar"
          ? `الأمر غير موجود: ${head}`
          : `command not found: ${head}`,
      ui[lang].terminalHelpHint,
    ],
  };
}

export const terminalPrompt = `${person.nickname.toLowerCase()}@office:~$`;
