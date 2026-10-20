"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AssistantDock, AssistantProvider, useAssistant } from "@/components/assistant/AssistantWidget";
import { BiosBoot } from "@/components/BiosBoot";
import { Boot } from "@/components/Boot";
import { ContactCard } from "@/components/ContactCard";
import { ProjectArticle } from "@/components/ProjectArticle";
import { AdibOS } from "@/components/os/AdibOS";
import { SimpleSite } from "@/components/SimpleSite";
import { SkillsList } from "@/components/SkillsList";
import { desk, keyDown, keyUp } from "@/lib/desk-bus";
import { PhotoProvider } from "@/lib/photo";
import { getProject, person, projects, ui } from "@/lib/profile";
import { sound } from "@/lib/sound";
import { dirFor, type Lang, type Selection } from "@/lib/types";
import { useMaxWidth } from "@/lib/use-media";

import type { Hotspot } from "@/components/scene/OfficeCanvas";

const OfficeCanvas = dynamic(() => import("@/components/scene/OfficeCanvas"), {
  ssr: false,
  loading: () => null,
});

const STORAGE_KEY = "adib-view";
const VISITED_KEY = "adib-visited";
const BOOTED_KEY = "adib-booted";
const HOTSPOTS: Hotspot[] = ["monitor", "frames", "shelf", "phone", "orb"];

function seenBoot() {
  try {
    return sessionStorage.getItem(BOOTED_KEY) === "1";
  } catch {
    return false;
  }
}

function toHash(selection: Selection): string {
  if (selection.kind === "os") return "#monitor";
  if (selection.kind === "skills") return "#skills";
  if (selection.kind === "contact") return "#contact";
  if (selection.kind === "project") return `#project=${selection.id}`;
  return "";
}

function fromHash(hash: string): Selection | null {
  if (hash === "#monitor") return { kind: "os" };
  if (hash === "#skills") return { kind: "skills" };
  if (hash === "#contact") return { kind: "contact" };
  const match = /^#project=([\w-]+)$/.exec(hash);
  if (match && getProject(match[1])) return { kind: "project", id: match[1] };
  return null;
}

function preferSimple(): boolean {
  if (window.matchMedia("(max-width: 840px)").matches) return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return true;
  if (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2) return true;
  try {
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("webgl2") && !canvas.getContext("webgl")) return true;
  } catch {
    return true;
  }
  return false;
}

export function Experience({ lang, photo }: { lang: Lang; photo: string | null }) {
  return (
    <PhotoProvider photo={photo}>
      <AssistantProvider lang={lang}>
        <ExperienceBody lang={lang} />
      </AssistantProvider>
    </PhotoProvider>
  );
}

function ExperienceBody({ lang }: { lang: Lang }) {
  const t = ui[lang];
  const assistant = useAssistant();
  const narrow = useMaxWidth(800);
  const [view, setView] = useState<"room" | "simple" | null>(null);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [bootGone, setBootGone] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [powered, setPowered] = useState(false);
  const [selection, setSelection] = useState<Selection>({ kind: "room" });
  const [hover, setHover] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const timers = useRef<number[]>([]);
  const onReady = useCallback(() => setReady(true), []);
  const onProgress = useCallback((value: number) => setProgress(value), []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("view");
    if (query === "room" || query === "simple") {
      setView(query);
      return;
    }
    const narrow = window.matchMedia("(max-width: 840px)").matches;
    if (narrow) {
      setView("simple");
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "room" || saved === "simple") {
      setView(saved);
      return;
    }
    setView(preferSimple() ? "simple" : "room");
  }, []);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const field = event.target as HTMLInputElement | null;
      const typing = !!field && (field.tagName === "INPUT" || field.tagName === "TEXTAREA");
      if (event.key === "Escape") {
        // Esc in a field with text clears the field first instead of leaving.
        if (typing && field.value) return;
        if (assistant.open) {
          assistant.setOpen(false);
          return;
        }
        setSelection({ kind: "room" });
        return;
      }
      if (typing || selection.kind !== "project") return;
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const ids = projects.map((item) => item.id);
      const index = ids.indexOf(selection.id);
      const step = event.key === "ArrowRight" ? 1 : -1;
      setSelection({ kind: "project", id: ids[(index + step + ids.length) % ids.length] });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assistant, selection]);

  // Every place in the room has a URL: deep links work and Back steps out instead of leaving the site.
  const fromPop = useRef(false);
  // Read once at first render: effects run twice in development, and by the second run the
  // URL sync below would otherwise have cleared the hash before the deep link was used.
  const [deepLink] = useState<Selection | null>(() => (typeof window === "undefined" ? null : fromHash(window.location.hash)));
  const pending = useRef<Selection | null>(deepLink);
  useEffect(() => {
    const onPop = () => {
      fromPop.current = true;
      setSelection(fromHash(window.location.hash) ?? { kind: "room" });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (fromPop.current) {
      fromPop.current = false;
      return;
    }
    // A deep link waiting for the intro keeps its hash in the address bar.
    if (pending.current) return;
    const hash = toHash(selection);
    if (window.location.hash === hash || (!hash && !window.location.hash)) return;
    const url = `${window.location.pathname}${window.location.search}${hash}`;
    const inside = !!window.location.hash;
    if (!hash && (window.history.state as { adib?: boolean } | null)?.adib) {
      fromPop.current = true;
      window.history.back();
    } else if (inside || !hash) {
      window.history.replaceState(window.history.state, "", url);
    } else {
      window.history.pushState({ adib: true }, "", url);
    }
  }, [selection]);
  useEffect(() => {
    if (!introDone || !pending.current) return;
    const next = pending.current;
    pending.current = null;
    fromPop.current = true;
    setSelection(next);
  }, [introDone]);

  // Pulsing hints mark what can be clicked until the visitor has been there.
  const [visited, setVisited] = useState<Hotspot[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(VISITED_KEY) ?? "[]") as Hotspot[];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    const spot: Hotspot | null =
      selection.kind === "os" ? "monitor" : selection.kind === "skills" ? "shelf" : selection.kind === "contact" ? "phone" : selection.kind === "project" ? "frames" : assistant.open ? "orb" : null;
    if (!spot || visited.includes(spot)) return;
    const next = [...visited, spot];
    setVisited(next);
    try {
      localStorage.setItem(VISITED_KEY, JSON.stringify(next));
    } catch {
      // Private mode: hints just come back next time.
    }
  }, [selection, assistant.open, visited]);

  // The desk mirrors the visitor: keys, pointer, and clicks, with sound.
  useEffect(() => {
    if (!started) return;
    const down = (event: KeyboardEvent) => {
      keyDown(event.code);
      if (!event.repeat) sound.key();
    };
    const up = (event: KeyboardEvent) => keyUp(event.code);
    const move = (event: PointerEvent) => {
      desk.pointer.x = event.clientX / window.innerWidth;
      desk.pointer.y = event.clientY / window.innerHeight;
    };
    const press = () => {
      desk.pressed = true;
      sound.mouse(true);
    };
    const release = () => {
      desk.pressed = false;
      sound.mouse(false);
    };
    const blur = () => {
      desk.held.clear();
      desk.pressed = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("blur", blur);
    };
  }, [started]);

  // A soft whoosh whenever the camera travels somewhere new.
  const lastKind = useRef<string>("room");
  useEffect(() => {
    const id = selection.kind === "project" ? `project:${selection.id}` : selection.kind;
    if (started && id !== lastKind.current) sound.whoosh(selection.kind === "os" || lastKind.current === "os" ? 1.5 : 1.2);
    lastKind.current = id;
  }, [selection, started]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const start = useCallback(() => {
    if (started) return;
    sound.unlock();
    sound.post();
    sound.room(1);
    setStarted(true);
    try {
      sessionStorage.setItem(BOOTED_KEY, "1");
    } catch {
      // Ignore: the boot text just types out again next time.
    }
    const quick = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    later(() => setBootGone(true), 900);
    later(() => sound.lampSwitch(), 350);
    later(() => {
      setPowered(true);
      sound.powerOn();
    }, quick ? 300 : 2300);
    later(() => setIntroDone(true), quick ? 400 : 3600);
  }, [started]);

  function choose(next: "room" | "simple") {
    setView(next);
    setReady(false);
    localStorage.setItem(STORAGE_KEY, next);
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    window.history.replaceState(null, "", url);
    if (next === "simple") {
      setSelection({ kind: "room" });
      sound.room(0);
    }
  }

  if (view === null) return <Boot line={t.bootLine} />;

  if (view === "simple") {
    return (
      <>
        <SimpleSite lang={lang} onEnterOffice={() => choose("room")} />
        <AssistantDock />
      </>
    );
  }

  const project = selection.kind === "project" ? getProject(selection.id) : undefined;
  const hoverText =
    hover === "monitor"
      ? t.dockMonitor
      : hover === "shelf"
        ? t.dockShelf
        : hover === "phone"
          ? t.dockPhone
          : hover === "orb"
            ? t.dockAssistant
            : hover
              ? (getProject(hover)?.name ?? null)
              : null;

  const chrome = introDone && selection.kind !== "os";

  return (
    <div
      className="room-root"
      data-ready={ready ? "true" : "false"}
      data-started={started ? "true" : "false"}
      data-os={selection.kind === "os" ? "open" : "closed"}
    >
      <a className="skip" href="#dock">
        {t.skip}
      </a>
      <OfficeCanvas
        lang={lang}
        selection={selection}
        started={started}
        powered={powered}
        hints={introDone ? HOTSPOTS.filter((spot) => !visited.includes(spot)) : []}
        hintLabels={{ monitor: t.dockMonitor, shelf: t.dockShelf, phone: t.dockPhone, orb: t.dockAssistant, frames: t.dockWall }}
        onSelect={setSelection}
        onHover={setHover}
        onOpenAssistant={() => assistant.setOpen(true)}
        onReady={onReady}
        onProgress={onProgress}
        screenInteractive={!narrow}
      />
      <ScreenOverlay lang={lang} powered={powered} active={selection.kind === "os" && !narrow} onLeave={() => setSelection({ kind: "room" })} />
      {!bootGone ? (
        <BiosBoot lang={lang} progress={progress} ready={ready} leaving={started} quick={seenBoot()} onStart={start} onSimple={() => choose("simple")} />
      ) : null}
      {started ? <CursorTip text={selection.kind === "room" ? hoverText : null} /> : null}
      {started ? (
        <div className="room-ui" data-visible={chrome ? "true" : "false"}>
          <header className="room-chrome">
            <div>
              <p className="wordmark">
                <span>{person.names[lang]}</span>
                <small>{t.hintRoom}</small>
                <small className="look-hint">{t.lookHint}</small>
              </p>
            </div>
            <div className="chrome-actions">
              <nav aria-label={t.langLabel}>
                {(["en", "fa", "ar"] as const).map((code) => (
                  <a key={code} href={`/${code}?view=room`} lang={code} aria-current={code === lang ? "page" : undefined}>
                    {code === "en" ? "EN" : code === "fa" ? "فا" : "عر"}
                  </a>
                ))}
              </nav>
              <SoundToggle onLabel={t.soundOn} offLabel={t.soundOff} />
              <button className="btn" type="button" onClick={() => choose("simple")}>
                {t.simpleMode}
              </button>
            </div>
          </header>
          <nav id="dock" className="dock" aria-label={t.projectsTitle}>
            <button type="button" onClick={() => setSelection({ kind: "os" })}>
              {t.dockMonitor}
            </button>
            <button type="button" aria-pressed={selection.kind === "project"} onClick={() => setSelection({ kind: "project", id: "hubly" })}>
              {t.dockWall}
            </button>
            <button type="button" aria-pressed={selection.kind === "skills"} onClick={() => setSelection({ kind: "skills" })}>
              {t.dockShelf}
            </button>
            <button type="button" aria-pressed={selection.kind === "contact"} onClick={() => setSelection({ kind: "contact" })}>
              {t.dockPhone}
            </button>
            <button type="button" aria-pressed={assistant.open} onClick={() => assistant.setOpen(!assistant.open)}>
              {t.dockAssistant}
            </button>
          </nav>
        </div>
      ) : null}

      {selection.kind === "os" && !narrow ? (
        <div className="os-hint" key="os-hint">
          {t.osHint}
        </div>
      ) : null}

      {chrome && selection.kind === "project" && project ? (
        <aside className="sheet sheet-right" dir={dirFor(lang)} key={project.id}>
          <ProjectNav current={project.id} onPick={(id) => setSelection({ kind: "project", id })} />
          <button className="sheet-close" type="button" autoFocus onClick={() => setSelection({ kind: "room" })}>
            {t.stepBack}
          </button>
          <ProjectArticle project={project} lang={lang} />
        </aside>
      ) : null}
      {chrome && selection.kind === "skills" ? (
        <aside className="sheet sheet-left" dir={dirFor(lang)}>
          <button className="sheet-close" type="button" autoFocus onClick={() => setSelection({ kind: "room" })}>
            {t.stepBack}
          </button>
          <h2 className="display">{t.skillsTitle}</h2>
          <SkillsList lang={lang} />
        </aside>
      ) : null}
      {chrome && selection.kind === "contact" ? (
        <aside className="sheet sheet-left" dir={dirFor(lang)}>
          <button className="sheet-close" type="button" autoFocus onClick={() => setSelection({ kind: "room" })}>
            {t.stepBack}
          </button>
          <h2 className="display">{t.contactTitle}</h2>
          <ContactCard lang={lang} />
        </aside>
      ) : null}
      {narrow && selection.kind === "os" ? (
        <div className="os-fallback">
          <AdibOS lang={lang} onLeave={() => setSelection({ kind: "room" })} />
        </div>
      ) : null}
      {introDone ? <AssistantDock hidden={selection.kind === "os"} /> : null}
    </div>
  );
}

/**
 * One live AdibOS for the whole visit, in a flat overlay laid exactly over the monitor and drawn
 * with CSS zoom, so text renders at full resolution. It only shows once the camera has landed on
 * the screen; from the room the monitor shows a painted texture instead, which keeps the 3D scene
 * cheap. Hiding (not unmounting) keeps open windows and typed text.
 */
function ScreenOverlay({ lang, powered, active, onLeave }: { lang: Lang; powered: boolean; active: boolean; onLeave: () => void }) {
  const [host] = useState(() => {
    const el = document.createElement("div");
    el.className = "os-host";
    return el;
  });
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (inner.current && host.parentElement !== inner.current) inner.current.insertBefore(host, inner.current.firstChild);
    let raf = 0;
    let shown = false;
    const tick = () => {
      const lift = activeRef.current && desk.settledOn === "os" && desk.screenRect.w > 0;
      if (box.current && inner.current && (lift || shown)) {
        const s = box.current.style;
        if (lift) {
          // Positioned from the 3D projection of the monitor's screen.
          const r = desk.screenRect;
          s.left = `${r.x}px`;
          s.top = `${r.y}px`;
          s.width = `${r.w}px`;
          s.height = `${r.h}px`;
          inner.current.style.zoom = String(r.w / 1600);
        }
        box.current.dataset.on = lift ? "true" : "false";
        // Set inline: the CSS build drops a `visibility: visible` override inside an attribute rule.
        s.visibility = lift ? "visible" : "hidden";
        shown = lift;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [host]);

  return (
    <>
      {createPortal(<AdibOS lang={lang} embedded powered={powered} onLeave={onLeave} />, host)}
      <div className="os-overlay" ref={box} aria-hidden={!active}>
        <div className="os-overlay-inner" ref={inner} />
        <div className="ips-glass" />
      </div>
    </>
  );
}

/** Previous / next between the frames, so the wall reads like a gallery. */
function ProjectNav({ current, onPick }: { current: string; onPick: (id: string) => void }) {
  const ids = projects.map((project) => project.id);
  const index = Math.max(0, ids.indexOf(current));
  const prev = ids[(index - 1 + ids.length) % ids.length];
  const next = ids[(index + 1) % ids.length];
  return (
    <div className="frame-nav" dir="ltr">
      <button type="button" aria-label="Previous" onClick={() => onPick(prev)}>
        ←
      </button>
      <span>
        {index + 1} / {ids.length}
      </span>
      <button type="button" aria-label="Next" onClick={() => onPick(next)}>
        →
      </button>
    </div>
  );
}

function CursorTip({ text }: { text: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (ref.current) ref.current.style.transform = `translate3d(${event.clientX + 16}px, ${event.clientY + 18}px, 0)`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <div className="cursor-tip" ref={ref} data-on={text ? "true" : "false"} aria-hidden="true">
      {text}
    </div>
  );
}

function SoundToggle({ onLabel, offLabel }: { onLabel: string; offLabel: string }) {
  const [on, setOn] = useState(sound.enabled);
  useEffect(() => sound.subscribe(setOn), []);
  return (
    <button
      className="btn sound-btn"
      type="button"
      aria-pressed={on}
      onClick={() => {
        sound.unlock();
        sound.setEnabled(!on);
      }}
    >
      <span className="sound-bars" data-on={on ? "true" : "false"} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {on ? offLabel : onLabel}
    </button>
  );
}
