"use client";

import { useEffect, useMemo, useState } from "react";
import { person, projects, stack, ui } from "@/lib/profile";
import type { Lang } from "@/lib/types";

type Props = {
  lang: Lang;
  progress: number;
  ready: boolean;
  leaving: boolean;
  /** Already booted once this session: show the text at once. */
  quick?: boolean;
  onStart: () => void;
  onSimple: () => void;
};

function dots(label: string, width = 30) {
  return `${label} ${".".repeat(Math.max(3, width - label.length))}`;
}

export function BiosBoot({ lang, progress, ready, leaving, quick = false, onStart, onSimple }: Props) {
  const t = ui[lang];
  const year = new Date().getFullYear();

  const lines = useMemo(
    () => [
      { text: `SHAHROKH BIOS v6.${projects.length}  (C) 2019-${year} ${person.name}`, strong: true },
      { text: `${person.roleLine.en}, ${person.location.en}` },
      { text: "" },
      { text: `CPU: ${stack.slice(0, 3).join(" / ")} @ ${person.years.en}` },
      { text: `${dots("Memory test")} ${projects.length} projects OK` },
      { text: `${dots("Detecting stack")} ${stack.slice(3, 7).join(", ")}` },
      { text: `${dots("Mounting /office/desk")} OK` },
      { text: `${dots("Warming up the lamp")} OK` },
      { text: "" },
    ],
    [year],
  );
  const [shown, setShown] = useState(() => (quick || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? lines.length : 0));

  useEffect(() => {
    if (shown >= lines.length) return;
    const id = window.setTimeout(() => setShown((n) => n + 1), shown === 0 ? 260 : 120 + Math.random() * 140);
    return () => window.clearTimeout(id);
  }, [shown, lines.length]);

  const typed = shown >= lines.length;
  const canStart = ready && typed;

  useEffect(() => {
    if (!canStart || leaving) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Tab") return;
      onStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canStart, leaving, onStart]);

  const pct = Math.round(Math.max(0, Math.min(100, progress)));
  const bar = "█".repeat(Math.round(pct / 5)).padEnd(20, "░");

  return (
    <div
      className="bios"
      data-leaving={leaving ? "true" : "false"}
      data-ready={canStart ? "true" : "false"}
      role="status"
      onClick={canStart ? onStart : undefined}
    >
      <div className="bios-inner" dir="ltr">
        <svg className="bios-logo" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 4 58 18v28L32 60 6 46V18Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <path d="M32 16 46 24v16l-14 8-14-8V24Z" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.7" />
          <circle cx="32" cy="32" r="4" fill="currentColor" />
        </svg>
        {lines.slice(0, shown).map((line, index) => (
          <p key={index} className={line.strong ? "bios-strong" : undefined}>
            {line.text || " "}
          </p>
        ))}
        {typed ? (
          <p>
            {dots("Loading office assets")} [{bar}] {pct}%
          </p>
        ) : null}
        {canStart ? (
          <>
            <p>&nbsp;</p>
            <p className="bios-ok">All systems nominal.</p>
          </>
        ) : null}
        <span className="bios-caret" aria-hidden="true" />
      </div>

      <div className="bios-start" aria-live="polite">
        {canStart ? (
          <button type="button" className="bios-cta" lang={lang} onClick={onStart} autoFocus>
            {t.clickToStart}
          </button>
        ) : (
          <span className="bios-wait">{t.loadingOffice}…</span>
        )}
      </div>

      <footer className="bios-foot" onClick={(event) => event.stopPropagation()}>
        <nav aria-label={t.langLabel}>
          {(["en", "fa", "ar"] as const).map((code) => (
            <a key={code} href={`/${code}?view=room`} lang={code} aria-current={code === lang ? "page" : undefined}>
              {code === "en" ? "EN" : code === "fa" ? "فا" : "عر"}
            </a>
          ))}
        </nav>
        <button type="button" onClick={onSimple}>
          {t.simpleMode}
        </button>
      </footer>
    </div>
  );
}
