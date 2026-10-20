"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AssistantDock, AssistantProvider, useAssistant } from "@/components/assistant/AssistantWidget";
import { Boot } from "@/components/Boot";
import { ContactCard } from "@/components/ContactCard";
import { ProjectArticle } from "@/components/ProjectArticle";
import { ShahrokhOS } from "@/components/os/ShahrokhOS";
import { SimpleSite } from "@/components/SimpleSite";
import { SkillsList } from "@/components/SkillsList";
import { getProject, ui } from "@/lib/profile";
import { dirFor, type Lang, type Selection } from "@/lib/types";
import { useMaxWidth } from "@/lib/use-media";

const OfficeCanvas = dynamic(() => import("@/components/scene/OfficeCanvas"), {
  ssr: false,
  loading: () => <Boot />,
});

const STORAGE_KEY = "shahrokh-view";

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

export function Experience({ lang }: { lang: Lang }) {
  return (
    <AssistantProvider lang={lang}>
      <ExperienceBody lang={lang} />
    </AssistantProvider>
  );
}

function ExperienceBody({ lang }: { lang: Lang }) {
  const t = ui[lang];
  const assistant = useAssistant();
  const narrow = useMaxWidth(800);
  const [view, setView] = useState<"room" | "simple" | null>(null);
  const [ready, setReady] = useState(false);
  const [selection, setSelection] = useState<Selection>({ kind: "room" });
  const [hover, setHover] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
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
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (assistant.open) {
        assistant.setOpen(false);
        return;
      }
      setSelection({ kind: "room" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assistant]);

  function choose(next: "room" | "simple") {
    setView(next);
    setReady(false);
    localStorage.setItem(STORAGE_KEY, next);
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    window.history.replaceState(null, "", url);
    if (next === "simple") setSelection({ kind: "room" });
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

  return (
    <div className="room-root" data-ready={ready ? "true" : "false"} data-os={selection.kind === "os" ? "open" : "closed"}>
      <a className="skip" href="#dock">
        {t.skip}
      </a>
      <OfficeCanvas
        lang={lang}
        selection={selection}
        onSelect={setSelection}
        onHover={setHover}
        onOpenAssistant={() => assistant.setOpen(true)}
        onReady={onReady}
        onProgress={onProgress}
        screenInteractive={!narrow}
      />
      {!ready ? <Boot line={t.loadingOffice} progress={progress} /> : null}
      {ready && selection.kind !== "os" ? (
        <>
          <header className="room-chrome">
            <div>
              <p className="wordmark">
                <span>Shahrokh</span>
                <small>{t.hintRoom}</small>
                <small className="look-hint">{t.lookHint}</small>
              </p>
            </div>
            <div className="chrome-actions">
              <nav aria-label={t.langLabel}>
                {(["en", "fa", "ar"] as const).map((code) => (
                  <a key={code} href={`/${code}?view=room`} lang={code} aria-current={code === lang ? "page" : undefined}>
                    {code === "en" ? "English" : code === "fa" ? "فارسی" : "العربية"}
                  </a>
                ))}
              </nav>
              <RoomTone onLabel={t.soundOn} offLabel={t.soundOff} />
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
            <span className="dock-hover">{hoverText}</span>
          </nav>
        </>
      ) : null}

      {ready && selection.kind === "project" && project ? (
        <aside className="sheet sheet-right" dir={dirFor(lang)}>
          <button className="sheet-close" type="button" onClick={() => setSelection({ kind: "room" })}>
            {t.stepBack}
          </button>
          <ProjectArticle project={project} lang={lang} />
        </aside>
      ) : null}
      {ready && selection.kind === "skills" ? (
        <aside className="sheet sheet-left" dir={dirFor(lang)}>
          <button className="sheet-close" type="button" onClick={() => setSelection({ kind: "room" })}>
            {t.stepBack}
          </button>
          <h2 className="display">{t.skillsTitle}</h2>
          <SkillsList lang={lang} />
        </aside>
      ) : null}
      {ready && selection.kind === "contact" ? (
        <aside className="sheet sheet-left" dir={dirFor(lang)}>
          <button className="sheet-close" type="button" onClick={() => setSelection({ kind: "room" })}>
            {t.stepBack}
          </button>
          <h2 className="display">{t.contactTitle}</h2>
          <ContactCard lang={lang} />
        </aside>
      ) : null}
      {narrow && selection.kind === "os" ? (
        <div className="os-fallback">
          <ShahrokhOS lang={lang} onLeave={() => setSelection({ kind: "room" })} />
        </div>
      ) : null}
      <AssistantDock hidden={selection.kind === "os"} />
    </div>
  );
}

function RoomTone({ onLabel, offLabel }: { onLabel: string; offLabel: string }) {
  const audio = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    return () => {
      void audio.current?.ctx.close();
    };
  }, []);

  function toggle() {
    if (!audio.current) {
      const ctx = new AudioContext();
      const length = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.018 * white) / 1.018;
        data[i] = last * 2.4;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 220;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      audio.current = { ctx, gain };
    }
    const next = !on;
    audio.current.gain.gain.setTargetAtTime(next ? 0.028 : 0, audio.current.ctx.currentTime, 0.08);
    if (audio.current.ctx.state === "suspended") void audio.current.ctx.resume();
    setOn(next);
  }

  return (
    <button className="btn" type="button" aria-pressed={on} onClick={toggle}>
      {on ? offLabel : onLabel}
    </button>
  );
}
