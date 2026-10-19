import type { CSSProperties } from "react";
import { ContactCard } from "@/components/ContactCard";
import { ProjectArticle } from "@/components/ProjectArticle";
import { SkillsList } from "@/components/SkillsList";
import { education, person, projects, ui } from "@/lib/profile";
import type { Lang } from "@/lib/types";

const LANG_LINKS = [
  { href: "/en", label: "English", code: "en" },
  { href: "/fa", label: "فارسی", code: "fa" },
  { href: "/ar", label: "العربية", code: "ar" },
] as const;

export function SimpleSite({ lang, onEnterOffice }: { lang: Lang; onEnterOffice: () => void }) {
  const t = ui[lang];
  return (
    <div className="simple">
      <a className="skip" href="#content">
        {t.skip}
      </a>
      <header className="topbar">
        <a className="wordmark" href={`/${lang}`}>
          <span>Shahrokh</span>
          <small>{person.name}</small>
        </a>
        <nav aria-label={t.langLabel}>
          {LANG_LINKS.map((item) => (
            <a key={item.code} href={`${item.href}?view=simple`} aria-current={item.code === lang ? "page" : undefined} lang={item.code}>
              {item.label}
            </a>
          ))}
        </nav>
        <button className="btn" type="button" onClick={onEnterOffice}>
          {t.roomMode}
        </button>
      </header>
      <main id="content">
        <section className="hero">
          <p className="kicker">{person.nickname}</p>
          <h1 className="display">{person.name}</h1>
          <p className="role">{person.roleLine[lang]}</p>
          <p className="meta">
            {person.location[lang]} · {person.relocation[lang]} · {person.years[lang]}
          </p>
          <p className="lede">{person.summary[lang]}</p>
          <p className="quiet">{t.simpleLead}</p>
          <p>
            <a className="btn" href={`/api/resume?lang=${lang}`}>
              {t.resumeDownload}
            </a>
          </p>
        </section>

        <section className="band">
          <h2>{t.currentTitle}</h2>
          <div className="cards">
            {projects
              .filter((project) => project.group === "current")
              .map((project) => (
                <article key={project.id} className="now-card">
                  <p className="kicker">{t.nowBadge}</p>
                  <h3>{project.name}</h3>
                  <p className="meta">
                    {project.role[lang]} · {project.period?.[lang]}
                  </p>
                  <p>{project.summary[lang]}</p>
                  {project.href ? (
                    <a href={project.href} target="_blank" rel="noreferrer">
                      {t.openLink}
                    </a>
                  ) : null}
                </article>
              ))}
          </div>
        </section>

        <section className="band">
          <h2>{t.projectsTitle}</h2>
          <div className="frames">
            {projects.map((project) => (
              <div key={project.id} className="hanging-frame" style={{ "--mat": project.mat } as CSSProperties}>
                <ProjectArticle project={project} lang={lang} />
              </div>
            ))}
          </div>
        </section>

        <section className="band">
          <h2>{t.skillsTitle}</h2>
          <SkillsList lang={lang} />
        </section>

        <section className="band">
          <h2>{t.educationTitle}</h2>
          <ol className="study">
            {education.map((item) => (
              <li key={item.years + item.degree.en}>
                <span>{item.years}</span>
                <div>
                  <strong>{item.degree[lang]}</strong>
                  <p>{item.school}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="band" id="contact">
          <h2>{t.contactTitle}</h2>
          <ContactCard lang={lang} />
        </section>
      </main>
      <footer className="colophon">{t.footerNote}</footer>
    </div>
  );
}
