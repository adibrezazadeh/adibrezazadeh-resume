import { education, leadership, person, projects, stack, ui } from "@/lib/profile";
import type { Lang } from "@/lib/types";

export function ResumeView({ lang }: { lang: Lang }) {
  const t = ui[lang];
  return (
    <article className="resume-doc">
      <header>
        <p className="kicker">{person.roleLine[lang]}</p>
        <h3 className="display">{person.names[lang]}</h3>
        <p>{person.roleLine[lang]}</p>
        <p className="meta">
          {person.location[lang]} · {person.relocation[lang]}
        </p>
      </header>
      <p>{person.summary[lang]}</p>
      <p>
        <a className="btn" href={`/api/resume?lang=${lang}`}>
          {t.resumeDownload}
        </a>
      </p>
      {(["current", "previous", "selected"] as const).map((group) => (
        <section key={group}>
          <h4>{group === "current" ? t.currentTitle : group === "previous" ? t.previousTitle : t.selectedTitle}</h4>
          {projects
            .filter((project) => project.group === group)
            .map((project) => (
              <div key={project.id} className="resume-role">
                <p>
                  <strong>{project.role[lang]}</strong>
                  {project.period ? ` · ${project.period[lang]}` : ""}
                </p>
                <p className="meta">
                  {project.name}
                  {project.place ? ` — ${project.place[lang]}` : ""}
                </p>
                <p>{project.summary[lang]}</p>
              </div>
            ))}
        </section>
      ))}
      <section>
        <h4>{t.stackTitle}</h4>
        <p>{stack.join(" · ")}</p>
      </section>
      <section>
        <h4>{t.leadershipTitle}</h4>
        <p>{leadership[lang].join(" · ")}</p>
      </section>
      <section>
        <h4>{t.educationTitle}</h4>
        {education.map((item) => (
          <p key={item.years + item.school}>
            <strong>{item.degree[lang]}</strong>
            <br />
            {item.school}
            <br />
            {item.years}
          </p>
        ))}
      </section>
    </article>
  );
}
