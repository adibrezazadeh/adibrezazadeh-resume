"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { AssistantPanel } from "@/components/assistant/AssistantWidget";
import { ContactCard } from "@/components/ContactCard";
import { ProjectArticle } from "@/components/ProjectArticle";
import { ResumeView } from "@/components/ResumeView";
import { SkillsList } from "@/components/SkillsList";
import { usePhoto } from "@/lib/photo";
import { getProject, localeTag, person, projects, ui } from "@/lib/profile";
import { sound } from "@/lib/sound";
import { runCommand, terminalPrompt } from "@/lib/terminal";
import { dirFor, type Lang } from "@/lib/types";
import { useMaxWidth } from "@/lib/use-media";

type AppKind = "about" | "projects" | "project" | "resume" | "terminal" | "contact" | "skills" | "assistant";

type Win = {
  key: string;
  kind: AppKind;
  projectId?: string;
  x: number;
  y: number;
  z: number;
  min: boolean;
  max: boolean;
  closing: boolean;
};

type Phase = "off" | "boot" | "on";

const APPS: AppKind[] = ["about", "projects", "resume", "terminal", "skills", "contact", "assistant"];

const WIN_W = 760;

function Icon({ kind }: { kind: AppKind }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="os-glyph">
      {kind === "about" && (
        <>
          <circle cx="12" cy="8.5" r="3.5" {...common} />
          <path d="M5 20c1.2-3.6 3.8-5.4 7-5.4s5.8 1.8 7 5.4" {...common} />
        </>
      )}
      {(kind === "projects" || kind === "project") && (
        <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" {...common} />
      )}
      {kind === "resume" && (
        <>
          <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5Z" {...common} />
          <path d="M9 11h6M9 14h6M9 17h4" {...common} />
        </>
      )}
      {kind === "terminal" && (
        <>
          <rect x="3" y="4.5" width="18" height="15" rx="2" {...common} />
          <path d="m7 10 3 2.5L7 15M12.5 15H17" {...common} />
        </>
      )}
      {kind === "skills" && (
        <>
          <path d="M4 20V9M9 20V5M14 20v-8M19 20V7" {...common} />
          <path d="M2.5 20h19" {...common} />
        </>
      )}
      {kind === "contact" && (
        <>
          <rect x="3" y="5.5" width="18" height="13" rx="2" {...common} />
          <path d="m4 7 8 6 8-6" {...common} />
        </>
      )}
      {kind === "assistant" && (
        <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18l-1.8-5.4-5.7-1.8L10.2 9ZM18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z" {...common} />
      )}
    </svg>
  );
}

function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path d="M32 4 58 18v28L32 60 6 46V18Z" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M32 18 44 25v14l-12 7-12-7V25Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

export function AdibOS({
  lang,
  onLeave,
  embedded = false,
  powered = true,
}: {
  lang: Lang;
  onLeave: () => void;
  embedded?: boolean;
  powered?: boolean;
}) {
  const t = ui[lang];
  const compact = useMaxWidth(800) && !embedded;
  const desktop = useRef<HTMLDivElement>(null);
  const [booted, setBooted] = useState(!embedded || powered);
  const phase: Phase = !embedded || (powered && booted) ? "on" : powered ? "boot" : "off";
  const [wins, setWins] = useState<Win[]>([
    { key: "about", kind: "about", x: embedded ? (1600 - WIN_W) / 2 : 78, y: embedded ? 70 : 36, z: 1, min: false, max: false, closing: false },
  ]);
  const [top, setTop] = useState(1);
  const [menu, setMenu] = useState(false);
  const [clock, setClock] = useState({ local: "", shiraz: "" });

  useEffect(() => {
    if (!embedded || !powered || booted) return;
    const id = window.setTimeout(() => setBooted(true), 1900);
    return () => window.clearTimeout(id);
  }, [embedded, powered, booted]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
      setClock({
        local: now.toLocaleTimeString(localeTag(lang), opts),
        shiraz: now.toLocaleTimeString(localeTag(lang), { ...opts, timeZone: "Asia/Tehran" }),
      });
    };
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, [lang]);

  const visible = wins.filter((win) => !win.min && !win.closing);
  const active = visible.length ? visible.reduce((a, b) => (a.z > b.z ? a : b)) : null;

  function raise(key: string, patch: Partial<Win> = {}) {
    const next = top + 1;
    setTop(next);
    setWins((current) => current.map((win) => (win.key === key ? { ...win, ...patch, z: next } : win)));
  }

  function open(kind: AppKind, projectId?: string) {
    setMenu(false);
    const key = projectId ? `project:${projectId}` : kind;
    const existing = wins.find((win) => win.key === key && !win.closing);
    if (existing) {
      raise(key, { min: false });
      return;
    }
    sound.pop();
    const nextZ = top + 1;
    setTop(nextZ);
    setWins((current) => {
      const offset = (current.filter((win) => !win.closing).length % 6) * 30;
      return [
        ...current.filter((win) => win.key !== key),
        {
          key,
          kind: projectId ? "project" : kind,
          projectId,
          x: embedded ? 180 + offset : 64 + offset,
          y: embedded ? 40 + offset : 28 + offset,
          z: nextZ,
          min: false,
          max: false,
          closing: false,
        },
      ];
    });
  }

  function close(key: string) {
    setWins((current) => current.map((win) => (win.key === key ? { ...win, closing: true } : win)));
    window.setTimeout(() => setWins((current) => current.filter((win) => !(win.key === key && win.closing))), 170);
  }

  function dockClick(kind: AppKind) {
    const win = wins.find((item) => item.key === kind && !item.closing);
    if (!win) return open(kind);
    if (win.min) return raise(kind, { min: false });
    if (active?.key === kind) {
      setWins((current) => current.map((item) => (item.key === kind ? { ...item, min: true } : item)));
      return;
    }
    raise(kind);
  }

  const labels: Record<AppKind, string> = {
    about: t.aboutTitle,
    projects: t.projectsTitle,
    project: t.projectsTitle,
    resume: t.resumeTitle,
    terminal: "Terminal",
    contact: t.contactTitle,
    skills: t.skillsTitle,
    assistant: t.assistantTitle,
  };

  const scale = () => {
    const el = desktop.current;
    if (!el || !el.offsetWidth) return 1;
    return el.getBoundingClientRect().width / el.offsetWidth || 1;
  };

  const shellClass = ["os-shell", embedded ? "os-embedded" : "", compact ? "os-compact" : ""].filter(Boolean).join(" ");

  return (
    <div className={shellClass} role="dialog" aria-label="AdibOS" data-phase={phase} data-empty={active ? "false" : "true"}>
      {phase !== "on" ? (
        <div className="os-power" aria-hidden={phase === "off"}>
          {phase === "boot" ? (
            <div className="os-boot">
              <Mark size={72} />
              <p>{t.osBooting}</p>
              <span className="os-boot-bar">
                <span />
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <header className="os-bar">
        <button type="button" className="os-start" aria-expanded={menu} onClick={() => setMenu((value) => !value)}>
          <Mark size={16} />
          <strong>AdibOS</strong>
        </button>
        <span className="os-active" dir={dirFor(lang)}>
          {active ? (active.projectId ? (getProject(active.projectId)?.name ?? "") : labels[active.kind]) : t.desktopCaption}
        </span>
        <span className="os-clocks">
          <span className="os-city">
            {t.shirazTime} <time>{clock.shiraz}</time>
          </span>
          <time className="os-local" title={t.osClock}>
            {clock.local}
          </time>
        </span>
        <button type="button" className="os-leave" onClick={onLeave}>
          {t.osLeave}
        </button>
      </header>

      {menu ? (
        <div className="os-menu" dir={dirFor(lang)} role="menu">
          <div className="os-menu-head">
            <strong>{person.names[lang]}</strong>
            <span>{person.roleLine[lang]}</span>
          </div>
          {APPS.map((kind) => (
            <button key={kind} type="button" role="menuitem" onClick={() => open(kind)}>
              <Icon kind={kind} />
              <span>{labels[kind]}</span>
            </button>
          ))}
          <hr />
          <button type="button" role="menuitem" onClick={onLeave}>
            <span className="os-menu-exit">←</span>
            <span>{t.osLeave}</span>
          </button>
        </div>
      ) : null}

      <div className="os-desktop" dir="ltr" ref={desktop} onPointerDown={() => menu && setMenu(false)}>
        <div className="os-wallpaper" aria-hidden="true">
          <span>{person.names.en}</span>
        </div>
        <nav className="os-icons" aria-label={t.projectsTitle}>
          {APPS.map((kind) => (
            <button key={kind} type="button" onClick={() => open(kind)}>
              <span className="os-icon-tile">
                <Icon kind={kind} />
              </span>
              <span dir={dirFor(lang)}>{labels[kind]}</span>
            </button>
          ))}
        </nav>
        {(compact ? (active ? [active] : []) : wins.filter((win) => !win.min)).map((win) => (
          <Window
            key={win.key}
            win={win}
            focused={active?.key === win.key}
            title={win.projectId ? (getProject(win.projectId)?.name ?? win.projectId) : labels[win.kind]}
            kind={win.kind}
            lang={lang}
            draggable={!compact}
            scale={scale}
            onFocus={() => active?.key !== win.key && raise(win.key)}
            onClose={() => close(win.key)}
            onMin={() => setWins((current) => current.map((item) => (item.key === win.key ? { ...item, min: true } : item)))}
            onMax={() => setWins((current) => current.map((item) => (item.key === win.key ? { ...item, max: !item.max } : item)))}
            onMove={(x, y) => setWins((current) => current.map((item) => (item.key === win.key ? { ...item, x, y } : item)))}
          >
            <div dir={dirFor(lang)}>
              {win.kind === "about" && <About lang={lang} onOpen={open} />}
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
        {!compact ? (
          <nav className="os-dock" aria-label="Dock">
            {APPS.map((kind) => {
              const running = wins.some((win) => win.key === kind && !win.closing);
              return (
                <button key={kind} type="button" data-running={running ? "true" : "false"} onClick={() => dockClick(kind)} aria-label={labels[kind]}>
                  <Icon kind={kind} />
                  <span className="os-dock-tip" dir={dirFor(lang)}>
                    {labels[kind]}
                  </span>
                </button>
              );
            })}
          </nav>
        ) : null}
      </div>
    </div>
  );
}

function About({ lang, onOpen }: { lang: Lang; onOpen: (kind: AppKind) => void }) {
  const t = ui[lang];
  const photo = usePhoto();
  return (
    <div className="os-about">
      <div className="os-about-head">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- inside a zoomed overlay, a plain img renders crisper than next/image's responsive sizes.
          <img className="os-avatar os-avatar-photo" src={photo} alt={person.names[lang]} width={84} height={84} />
        ) : (
          <div className="os-avatar" aria-hidden="true">
            {person.nickname.slice(0, 1)}
          </div>
        )}
        <div>
          <p className="kicker">{person.location[lang]}</p>
          <h2 className="display">{person.names[lang]}</h2>
          <p className="os-about-role">{person.roleLine[lang]}</p>
          <p className="meta">
            {person.location[lang]} · {person.years[lang]} · {person.relocation[lang]}
          </p>
        </div>
      </div>
      <p>{t.welcomeLead}</p>
      <div className="os-about-actions">
        {(["projects", "resume", "terminal", "contact"] as const).map((kind) => (
          <button key={kind} type="button" className="os-chip" onClick={() => onOpen(kind)}>
            <Icon kind={kind} />
            {kind === "projects" ? t.projectsTitle : kind === "resume" ? t.resumeTitle : kind === "terminal" ? "Terminal" : t.contactTitle}
          </button>
        ))}
      </div>
      <ul className="os-tips">
        <li>⌨ {t.typeHint}</li>
        <li>◐ {t.skyHint}</li>
        <li>⎋ {t.osHint}</li>
      </ul>
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
                  <span className="folder-thumb" style={{ backgroundImage: `url(/frames/${project.id}.jpg)` }} />
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
  kind,
  lang,
  focused,
  draggable,
  scale,
  children,
  onFocus,
  onClose,
  onMin,
  onMax,
  onMove,
}: {
  win: Win;
  title: string;
  kind: AppKind;
  lang: Lang;
  focused: boolean;
  draggable: boolean;
  scale: () => number;
  children: ReactNode;
  onFocus: () => void;
  onClose: () => void;
  onMin: () => void;
  onMax: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const t = ui[lang];

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    onFocus();
    if (!draggable || win.max) return;
    const target = event.target as HTMLElement;
    if (!target.closest(".os-window > header") || target.closest("button, a, input, textarea")) return;
    const s = scale();
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = win.x;
    const originY = win.y;
    const move = (ev: PointerEvent) => {
      onMove(Math.max(-WIN_W + 120, originX + (ev.clientX - startX) / s), Math.max(0, originY + (ev.clientY - startY) / s));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <section
      className="os-window"
      data-focused={focused ? "true" : "false"}
      data-max={win.max ? "true" : "false"}
      data-closing={win.closing ? "true" : "false"}
      style={win.max ? { zIndex: win.z } : { left: win.x, top: win.y, zIndex: win.z }}
      onPointerDown={onPointerDown}
    >
      <header onDoubleClick={draggable ? onMax : undefined}>
        <Icon kind={kind} />
        <strong>{title}</strong>
        <span className="os-win-buttons">
          {draggable ? (
            <>
              <button type="button" onClick={onMin} aria-label={t.minimize} title={t.minimize}>
                <svg viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>
              <button type="button" onClick={onMax} aria-label={t.maximize} title={t.maximize}>
                <svg viewBox="0 0 12 12" aria-hidden="true">
                  <rect x="2.5" y="2.5" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </button>
            </>
          ) : null}
          <button type="button" className="os-close" onClick={onClose} aria-label={t.close} title={t.close}>
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="m3 3 6 6M9 3 3 9" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </span>
      </header>
      <div className="os-window-body">{children}</div>
    </section>
  );
}

function Terminal({ lang, onOpen }: { lang: Lang; onOpen: (kind: AppKind, projectId?: string) => void }) {
  const t = ui[lang];
  const [lines, setLines] = useState<{ kind: "in" | "out"; text: string }[]>([{ kind: "out", text: t.terminalWelcome }]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [lines]);

  // autoFocus would scroll the 3D-transformed screen layer; focus without scrolling instead.
  useEffect(() => {
    input.current?.focus({ preventScroll: true });
  }, []);

  function submit(command: string) {
    if (command.trim()) setHistory((current) => [...current, command].slice(-40));
    setCursor(-1);
    const result = runCommand(command, lang);
    if (result.clear) {
      setLines([]);
      return;
    }
    setLines((current) =>
      [...current, { kind: "in" as const, text: `${terminalPrompt} ${command}` }, ...result.lines.map((text) => ({ kind: "out" as const, text }))].slice(-80),
    );
    if (result.openApp) onOpen(result.openApp);
    if (result.openProject) onOpen("project", result.openProject);
  }

  return (
    <form
      className="term"
      dir="ltr"
      onClick={() => input.current?.focus({ preventScroll: true })}
      onSubmit={(event) => {
        event.preventDefault();
        const command = value;
        setValue("");
        submit(command);
      }}
    >
      <div className="term-log" ref={log}>
        {lines.map((line, index) => (
          <p key={`${line.kind}-${index}`} className={line.kind === "in" ? "term-in" : undefined}>
            {line.text}
          </p>
        ))}
      </div>
      <label className="term-input">
        <span>{terminalPrompt}</span>
        <input
          ref={input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp" && history.length) {
              event.preventDefault();
              const next = cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1);
              setCursor(next);
              setValue(history[next]);
            }
            if (event.key === "ArrowDown" && cursor >= 0) {
              event.preventDefault();
              const next = cursor + 1;
              if (next >= history.length) {
                setCursor(-1);
                setValue("");
              } else {
                setCursor(next);
                setValue(history[next]);
              }
            }
          }}
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
