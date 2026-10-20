import { ContactCard } from "@/components/ContactCard";
import { ProjectArticle } from "@/components/ProjectArticle";
import { SkillsList } from "@/components/SkillsList";
import { education, person, projects, ui } from "@/lib/profile";
import type { Lang } from "@/lib/types";

/**
 * The resume as plain server-rendered HTML. The office and simple mode both render on the client,
 * so without this the first response holds no text for crawlers that do not run JavaScript.
 * Visually hidden, and removed from view once simple mode shows the same content (see globals.css).
 */
export function SeoContent({ lang }: { lang: Lang }) {
  const t = ui[lang];
  return (
    <div className="sr-only seo-copy">
      <h1>{person.names[lang]}</h1>
      <p>{person.roleLine[lang]}</p>
      <p>
        {person.location[lang]} · {person.relocation[lang]} · {person.years[lang]}
      </p>
      <p>{person.summary[lang]}</p>
      <p>
        <a href={`/api/resume?lang=${lang}`}>{t.resumeDownload}</a>
      </p>
      {(["current", "previous", "selected"] as const).map((group) => (
        <section key={group}>
          <h2>{group === "current" ? t.currentTitle : group === "previous" ? t.previousTitle : t.selectedTitle}</h2>
          {projects
            .filter((project) => project.group === group)
            .map((project) => (
              <ProjectArticle key={project.id} project={project} lang={lang} />
            ))}
        </section>
      ))}
      <section>
        <h2>{t.skillsTitle}</h2>
        <SkillsList lang={lang} />
      </section>
      <section>
        <h2>{t.educationTitle}</h2>
        <ul>
          {education.map((item) => (
            <li key={item.years + item.degree.en}>
              {item.degree[lang]} — {item.school} (<bdi>{item.years}</bdi>)
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>{t.contactTitle}</h2>
        <ContactCard lang={lang} />
      </section>
    </div>
  );
}
