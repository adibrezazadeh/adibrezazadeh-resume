import { education, leadership, person, projects, stack } from "@/lib/profile";
import { absolute } from "@/lib/site";

// https://llmstxt.org — a plain Markdown brief for AI assistants and answer engines.
export function GET() {
  const groups = [
    { key: "current", title: "Current engagements" },
    { key: "previous", title: "Previous experience" },
    { key: "selected", title: "Selected work" },
  ] as const;
  const lines = [
    `# ${person.name}`,
    "",
    `> ${person.roleLine.en}. ${person.location.en}. ${person.relocation.en}. ${person.years.en} of experience.`,
    "",
    person.summary.en,
    "",
    `Also written ${person.names.fa} (Persian) and ${person.names.ar} (Arabic).`,
    "",
    "## Pages",
    "",
    `- [English](${absolute("/en")}): full portfolio and resume`,
    `- [فارسی](${absolute("/fa")}): Persian version`,
    `- [العربية](${absolute("/ar")}): Arabic version`,
    `- [Resume (plain text)](${absolute("/api/resume?lang=en")})`,
    "",
    "## Contact",
    "",
    `- Email: ${person.email}`,
    `- Phone: ${person.phone}`,
    `- LinkedIn: ${person.linkedin}`,
    `- GitHub: ${person.github}`,
  ];
  for (const group of groups) {
    lines.push("", `## ${group.title}`);
    for (const project of projects.filter((item) => item.group === group.key)) {
      const head = [project.role.en, project.period?.en, project.place?.en].filter(Boolean).join(" · ");
      lines.push("", `### ${project.href ? `[${project.name}](${project.href})` : project.name}`, "", head, "", project.summary.en);
      lines.push(...project.bullets.en.map((bullet) => `- ${bullet}`));
    }
  }
  lines.push(
    "",
    "## Skills",
    "",
    `- Stack: ${stack.join(", ")}`,
    `- Leadership: ${leadership.en.join(", ")}`,
    "",
    "## Education",
    "",
    ...education.map((item) => `- ${item.degree.en}, ${item.school} (${item.years})`),
    "",
  );
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
