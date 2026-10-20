"use client";

import { useEffect, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { AssistantPanel } from "@/components/assistant/AssistantWidget";
import { ContactCard } from "@/components/ContactCard";
import { ProjectArticle } from "@/components/ProjectArticle";
import { ResumeView } from "@/components/ResumeView";
import { SkillsList } from "@/components/SkillsList";
import { getProject, localeTag, projects, ui } from "@/lib/profile";
import { runCommand, terminalPrompt } from "@/lib/terminal";
import { dirFor, type Lang } from "@/lib/types";

type AppKind = "projects" | "project" | "resume" | "terminal" | "contact" | "skills" | "assistant";

type Win = {
  key: string;
  kind: AppKind;
  projectId?: string;
  x: number;
  y: number;
  z: number;
};

const APPS: { kind: AppKind; glyph: string }[] = [
  { kind: "projects", glyph: "▣" },
  { kind: "resume", glyph: "☰" },
  { kind: "terminal", glyph: ">_" },
  { kind: "contact", glyph: "☎" },
  { kind: "skills", glyph: "≡" },
  { kind: "assistant", glyph: "✦" },
];

export function ShahrokhOS({ lang, onLeave, embedded = false }: { lang: Lang; onLeave: () => void; embedded?: boolean }) {
  const t = ui[lang];
  const [wins, setWins] = useState<Win[]>([
    { key: "projects", kind: "projects", x: embedded ? 148 : 78, y: embedded ? 16 : 36, z: 1 },
  ]);
  const [top, setTop] = useState(1);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString(localeTag(lang), { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, [lang]);

  function focus(key: string) {
    const next = top + 1;
    setTop(next);
    setWins((current) => current.map((win) => (win.key === key ? { ...win, z: next } : win)));
  }

  function open(kind: AppKind, projectId?: string) {
    const key = projectId ? `project:${projectId}` : kind;
    const nextZ = top + 1;
    setTop(nextZ);
    setWins((current) => {
      const existing = current.find((win) => win.key === key);
      if (existing) return current.map((win) => (win.key === key ? { ...win, z: nextZ } : win));
      const offset = current.length * 26;
      return [...current, { key, kind: projectId ? "project" : kind, projectId, x: 64 + offset, y: 28 + offset, z: nextZ }];
    });
  }

  function close(key: string) {
    setWins((current) => current.filter((win) => win.key !== key));
  }

  const labels: Record<AppKind, string> = {
    projects: t.projectsTitle,
    project: t.projectsTitle,
    resume: t.resumeTitle,
    terminal: "Terminal",
    contact: t.contactTitle,
    skills: t.skillsTitle,
    assistant: t.assistantTitle,
  };

  return (
    <div className={embedded ? "os-shell os-embedded" : "os-shell"} role="dialog" aria-label="ShahrokhOS">
      <header className="os-bar">
        <strong>ShahrokhOS</strong>
        <span className="os-caption">{t.desktopCaption}</span>
        <time dateTime={clock}>{clock}</time>
        <button type="button" onClick={onLeave}>
          {t.osLeave}
        </button>
      </header>
      <div className="os-desktop" dir="ltr">
        <nav className="os-icons" aria-label={t.projectsTitle}>
          {APPS.map((app) => (
            <button key={app.kind} type="button" onClick={() => open(app.kind)}>
              <span aria-hidden="true">{app.glyph}</span>
              <span dir={dirFor(lang)}>{labels[app.kind]}</span>
            </button>
          ))}
        </nav>
        {wins.map((win) => (
          <Window
            key={win.key}
            win={win}
            title={win.projectId ? (getProject(win.projectId)?.name ?? win.projectId) : labels[win.kind]}
            onFocus={() => focus(win.key)}
            onClose={() => close(win.key)}
            onMove={(x, y) => setWins((current) => current.map((item) => (item.key === win.key ? { ...item, x, y } : item)))}
          >
            <div dir={dirFor(lang)}>
              {win.kind === "projects" && <ProjectFolder lang={lang} onOpen={(id) => open("project", id)} />}
              {win.kind === "project" && win.projectId && getProject(win.projectId) && (
                <ProjectArticle lang={lang} project={getProject(win.projectId)!} />
              )}
              {win.kind === "resume" && <ResumeView lang={lang} />}
              {win.kind === "contact" && <ContactCard lang={lang} />}
              {win.kind === "skills" && <SkillsList lang={lang} />}
              {win.kind === "assistant" && <AssistantPanel />}
              {win.kind === "terminal" && <Terminal lang={lang} onOpen={open} />}
            </div>
          </Window>
        ))}
      </div>
    </div>
  );
}

function ProjectFolder({ lang, onOpen }: { lang: Lang; onOpen: (id: string) => void }) {
  const t = ui[lang];
  const groups = ["current", "previous", "selected"] as const;
  return (
    <div className="folder">
      {groups.map((group) => (
        <section key={group}>
          <h3>{group === "current" ? t.currentTitle : group === "previous" ? t.previousTitle : t.selectedTitle}</h3>
          <div className="folder-grid">
            {projects
              .filter((project) => project.group === group)
              .map((project) => (
                <button key={project.id} type="button" onClick={() => onOpen(project.id)}>
                  <span className="folder-tab" style={{ background: project.mat }} />
                  <strong>{project.name}</strong>
                  <span>{project.role[lang]}</span>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Window({
  win,
  title,
  children,
  onFocus,
  onClose,
  onMove,
}: {
  win: Win;
  title: string;
  children: ReactNode;
  onFocus: () => void;
  onClose: () => void;
  onMove: (x: number, y: number) => void;
}) {
  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (window.innerWidth < 800) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea")) return;
    onFocus();
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = win.x;
    const originY = win.y;
    const move = (ev: PointerEvent) => {
      onMove(Math.max(8, originX + ev.clientX - startX), Math.max(8, originY + ev.clientY - startY));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <section className="os-window" style={{ left: win.x, top: win.y, zIndex: win.z }} onPointerDown={onPointerDown}>
      <header>
        <strong>{title}</strong>
        <button type="button" onClick={onClose} aria-label="close">
          ×
        </button>
      </header>
      <div className="os-window-body">{children}</div>
    </section>
  );
}

function Terminal({ lang, onOpen }: { lang: Lang; onOpen: (kind: AppKind, projectId?: string) => void }) {
  const t = ui[lang];
  const [lines, setLines] = useState<{ kind: "in" | "out"; text: string }[]>([{ kind: "out", text: t.terminalWelcome }]);
  const [value, setValue] = useState("");

  function submit(command: string) {
    const result = runCommand(command, lang);
    if (result.clear) {
      setLines([]);
      return;
    }
    const next = [
      ...lines,
      { kind: "in" as const, text: `${terminalPrompt} ${command}` },
      ...result.lines.map((text) => ({ kind: "out" as const, text })),
    ].slice(-80);
    setLines(next);
    if (result.openApp) onOpen(result.openApp);
    if (result.openProject) onOpen("project", result.openProject);
  }

  return (
    <form
      className="term"
      dir="ltr"
      onSubmit={(event) => {
        event.preventDefault();
        const command = value;
        setValue("");
        submit(command);
      }}
    >
      <div className="term-log">
        {lines.map((line, index) => (
          <p key={`${line.kind}-${index}`} className={line.kind === "in" ? "term-in" : undefined}>
            {line.text}
          </p>
        ))}
      </div>
      <label className="term-input">
        <span>{terminalPrompt}</span>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label="terminal"
          placeholder={t.terminalPlaceholder}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>
    </form>
  );
}
