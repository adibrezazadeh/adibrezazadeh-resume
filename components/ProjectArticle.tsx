import { ui } from "@/lib/profile";
import type { Lang, Project } from "@/lib/types";

export function ProjectArticle({ project, lang }: { project: Project; lang: Lang }) {
  const t = ui[lang];
  return (
    <article className="article">
      <p className="kicker">
        <span className="swatch" style={{ background: project.mat }} />
        {t.groupLabel[project.group]}
      </p>
      <h3 className="display">{project.name}</h3>
      <p className="meta">
        {project.role[lang]}
        {project.period ? ` · ${project.period[lang]}` : ""}
        {project.place ? ` · ${project.place[lang]}` : ""}
      </p>
      <p>{project.summary[lang]}</p>
      {project.bullets[lang].length > 0 && (
        <ul>
          {project.bullets[lang].map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      )}
      {project.href ? (
        <a className="btn" href={project.href} target="_blank" rel="noreferrer">
          {t.openLink}
          <span aria-hidden="true">↗</span>
        </a>
      ) : (
        <p className="quiet">{t.noPublicLink}</p>
      )}
    </article>
  );
}
