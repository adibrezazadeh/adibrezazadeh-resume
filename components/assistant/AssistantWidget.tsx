"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { answerQuestion } from "@/lib/assistant";
import { ui } from "@/lib/profile";
import type { Lang } from "@/lib/types";

type Message = { role: "user" | "assistant"; text: string };

type AssistantApi = {
  open: boolean;
  setOpen: (open: boolean) => void;
  pending: boolean;
  messages: Message[];
  ask: (text: string) => Promise<void>;
  lang: Lang;
};

const AssistantContext = createContext<AssistantApi | null>(null);

export function AssistantProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const api = useMemo<AssistantApi>(() => {
    return {
      open,
      setOpen,
      pending,
      messages,
      lang,
      ask: async (text: string) => {
        const question = text.trim();
        if (!question || pending) return;
        const push = (role: Message["role"], value: string) => {
          setMessages((current) => [...current, { role, text: value }].slice(-24));
        };
        push("user", question);
        const local = answerQuestion(question, lang);
        if (local.confident) {
          push("assistant", local.answer);
          return;
        }
        setPending(true);
        try {
          const response = await fetch("/api/assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, lang }),
          });
          const data = (await response.json()) as { answer?: string };
          const answer = typeof data.answer === "string" && data.answer.trim() ? data.answer : local.answer;
          push("assistant", answer);
        } catch {
          push("assistant", local.answer);
        } finally {
          setPending(false);
        }
      },
    };
  }, [open, pending, messages, lang]);

  return <AssistantContext.Provider value={api}>{children}</AssistantContext.Provider>;
}

export function useAssistant(): AssistantApi {
  const value = useContext(AssistantContext);
  if (!value) throw new Error("Assistant is only available inside the office.");
  return value;
}

export function AssistantPanel() {
  const assistant = useAssistant();
  const t = ui[assistant.lang];
  const [draft, setDraft] = useState("");

  return (
    <div className="assistant-panel">
      <div className="assistant-log" aria-live="polite">
        {assistant.messages.length === 0 ? (
          <div className="assistant-empty">
            <p>{t.assistantIntro}</p>
            <div className="chips">
              {t.suggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => assistant.ask(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          assistant.messages.map((message, index) => (
            <p key={`${message.role}-${index}`} className={message.role === "user" ? "bubble user" : "bubble"}>
              {message.text}
            </p>
          ))
        )}
        {assistant.pending ? <p className="bubble quiet">{t.assistantThinking}</p> : null}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const next = draft;
          setDraft("");
          void assistant.ask(next);
        }}
      >
        <label className="sr-only" htmlFor="assistant-q">
          {t.assistantTitle}
        </label>
        <input
          id="assistant-q"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t.assistantPlaceholder}
          maxLength={500}
        />
        <button className="btn" type="submit" disabled={assistant.pending || draft.trim().length === 0}>
          {t.assistantSend}
        </button>
      </form>
    </div>
  );
}

export function AssistantDock({ hidden }: { hidden?: boolean }) {
  const assistant = useAssistant();
  const t = ui[assistant.lang];
  if (hidden) return null;
  return (
    <div className="assistant-dock">
      {assistant.open ? (
        <section className="assistant-card" aria-label={t.assistantTitle}>
          <header>
            <h2>{t.assistantTitle}</h2>
            <button type="button" onClick={() => assistant.setOpen(false)} aria-label={t.close}>
              ×
            </button>
          </header>
          <AssistantPanel />
        </section>
      ) : null}
      <button
        className="orb-button"
        type="button"
        aria-expanded={assistant.open}
        onClick={() => assistant.setOpen(!assistant.open)}
      >
        {t.dockAssistant}
      </button>
    </div>
  );
}
