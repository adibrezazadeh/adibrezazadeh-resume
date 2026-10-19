import { person, projectLines, projects, stack, leadership, education, ui } from "./profile";
import { includesTerm } from "./text";
import type { Lang } from "./types";

export type LocalAnswer = {
  answer: string;
  confident: boolean;
};

type Intent = {
  id: string;
  keys: string[];
  reply: (lang: Lang) => string;
};

function who(lang: Lang): string {
  return `${person.name} (${person.nickname}) — ${person.roleLine[lang]}. ${person.location[lang]}. ${person.relocation[lang]}. ${person.summary[lang]}`;
}

function contact(lang: Lang): string {
  return [
    `${ui[lang].email}: ${person.email}`,
    `${ui[lang].phone}: ${person.phone}`,
    `${ui[lang].linkedin}: ${person.linkedin}`,
    `${ui[lang].github}: ${person.github}`,
    `${ui[lang].locationLabel}: ${person.location[lang]}. ${person.relocation[lang]}.`,
  ].join("\n");
}

function skills(lang: Lang): string {
  return `${ui[lang].stackTitle}: ${stack.join(", ")}.\n${ui[lang].leadershipTitle}: ${leadership[lang].join(", ")}.`;
}

function study(lang: Lang): string {
  return education
    .map((item) => `${item.degree[lang]} — ${item.school} — ${item.years}`)
    .join("\n");
}

function current(lang: Lang): string {
  return projects
    .filter((project) => project.group === "current")
    .map((project) => projectLines(project, lang).join("\n"))
    .join("\n\n");
}

const intents: Intent[] = [
  {
    id: "greet",
    keys: ["hello", "hi", "hey", "salam", "salaam", "سلام", "درود", "مرحبا", "اهلا", "أهلًا", "اهلاً"],
    reply: (lang) =>
      lang === "fa"
        ? `سلام. ${ui.fa.assistantIntro}`
        : lang === "ar"
          ? `مرحبًا. ${ui.ar.assistantIntro}`
          : `Hello. ${ui.en.assistantIntro}`,
  },
  {
    id: "who",
    keys: [
      "who",
      "whoami",
      "about",
      "bio",
      "shahrokh",
      "adib",
      "rezazadeh",
      "شاهرخ",
      "شاه رخ",
      "ادیب",
      "اديب",
      "رضازاده",
      "کیست",
      "کیه",
      "من هو",
      "من انت",
      "نبذه",
      "نبذة",
    ],
    reply: who,
  },
  {
    id: "contact",
    keys: [
      "contact",
      "email",
      "e-mail",
      "phone",
      "call",
      "linkedin",
      "github",
      "reach",
      "تماس",
      "ایمیل",
      "ایمیلش",
      "تلفن",
      "شماره",
      "لینکدین",
      "گیتهاب",
      "گیت هاب",
      "تواصل",
      "بريد",
      "ايميل",
      "هاتف",
      "رقم",
      "لينكد",
    ],
    reply: contact,
  },
  {
    id: "relocation",
    keys: ["reloc", "move", "visa", "جابجایی", "مهاجرت", "ریلوک", "انتقال", "relocation"],
    reply: (lang) => `${person.relocation[lang]}. ${person.location[lang]}.`,
  },
  {
    id: "location",
    keys: ["where", "location", "shiraz", "iran", "شیراز", "ایران", "ايران", "مكان", "مکان", "کجا", "وين", "أين", "اين"],
    reply: (lang) => `${person.location[lang]}. ${person.relocation[lang]}.`,
  },
  {
    id: "skills",
    keys: [
      "skill",
      "stack",
      "react",
      "next",
      "typescript",
      "node",
      "tailwind",
      "shadcn",
      "radix",
      "sql",
      "nosql",
      "مهارت",
      "تکنولوژی",
      "فناوری",
      "پشته",
      "ری‌اکت",
      "ری اکت",
      "نکست",
      "نود",
      "مهاره",
      "مهارات",
      "تقنيات",
      "رياكت",
    ],
    reply: skills,
  },
  {
    id: "leadership",
    keys: ["leader", "mentor", "management", "architecture", "رهبری", "منتور", "مدیریت", "معماری", "قياده", "قيادة", "توجيه", "اداره"],
    reply: (lang) => `${ui[lang].leadershipTitle}: ${leadership[lang].join(", ")}.`,
  },
  {
    id: "education",
    keys: ["education", "degree", "phd", "ph.d", "university", "study", "school", "تحصیل", "تحصیلات", "دانشگاه", "دکتری", "درس", "دراسه", "دراسة", "جامعه", "جامعة", "دكتوراه"],
    reply: study,
  },
  {
    id: "current",
    keys: ["now", "current", "today", "working", "الان", "اکنون", "حالا", "مشغول", "الآن", "حاليا", "حاليًا", "يعمل"],
    reply: current,
  },
  ...projects.map((project) => ({
    id: project.id,
    keys: keysFor(project.id),
    reply: (lang: Lang) => projectLines(project, lang).join("\n"),
  })),
];

function keysFor(id: string): string[] {
  const extra: Record<string, string[]> = {
    hubly: ["hubly", "هابلی", "هبلی", "cto"],
    glonova: ["glonova", "گلونوا", "گلونووا", "engineering"],
    sazeh: ["sazeh", "peyvand", "سازه", "پیوند"],
    sepanja: ["sepanja", "سپنجا"],
    chadco: ["chadco", "چادکو"],
    tripsi: ["tripsi", "trip si", "تریپسی", "تریپ"],
    stogite: ["stogite", "استوگایت", "استوجایت", "journal", "ژورنال", "يوميات", "خاطره"],
    meraas: ["meraas", "میراث", "گالری", "معرض", "خاتم", "khatam"],
    medagold: ["medagold", "meda gold", "مداگلد", "مدا گلد"],
    agents: ["agent", "agents", "bot", "bots", "ایجنت", "عامل", "ربات", "هوش", "ذكاء", "ذكاء اصطناعي", "هوش مصنوعی"],
  };
  return extra[id] ?? [id];
}

export function answerQuestion(question: string, lang: Lang): LocalAnswer {
  const asked = question.trim();
  if (!asked) {
    return { answer: ui[lang].assistantEmpty, confident: true };
  }

  let best = 0;
  let winner: Intent | null = null;
  for (const intent of intents) {
    let score = 0;
    for (const key of intent.keys) {
      if (includesTerm(asked, key)) score += Math.max(key.length, 3);
    }
    if (score > best) {
      best = score;
      winner = intent;
    }
  }

  if (!winner || best < 3) {
    return { answer: ui[lang].assistantFallback, confident: false };
  }

  return { answer: winner.reply(lang), confident: true };
}

export function systemPrompt(lang: Lang): string {
  return [
    "You answer questions about Adib Rezazadeh (nickname Shahrokh) for visitors to his portfolio.",
    "Use only the dossier. Do not invent employers, dates, metrics, or links.",
    "If the dossier does not say it, say so.",
    `Reply in ${lang === "fa" ? "Persian" : lang === "ar" ? "Arabic" : "English"}.`,
    "Dossier:",
    who("en"),
    contact("en"),
    skills("en"),
    study("en"),
    projects.map((project) => projectLines(project, "en").join(" | ")).join("\n"),
  ].join("\n");
}
