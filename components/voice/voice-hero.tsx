"use client";

import { type FormEvent, useState } from "react";
import { copy, type Locale } from "@/lib/i18n/content";
import { openSection, sectionIds } from "@/lib/elevenlabs/open-section";
import { useVoiceAgent } from "@/lib/elevenlabs/use-voice-agent";
import { VoiceOrb } from "./voice-orb";

type VoiceHeroProps = {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
};

export function VoiceHero({ locale, onLocaleChange }: VoiceHeroProps) {
  const t = copy[locale];
  const agent = useVoiceAgent(locale);
  const [text, setText] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (agent.sendTextMessage(text)) setText("");
  }

  return (
    <section className="hero" id="about">
      <header className="site-header">
        <a className="wordmark" href="#about" aria-label={t.name}>
          {t.name}
        </a>
        <nav className="section-nav" aria-label={locale === "zh" ? "主要内容" : "Main sections"}>
          {(["product", "research", "interests", "projects"] as const).map((section) => (
            <button type="button" key={section} onClick={() => openSection(section)}>
              {t.nav[section]}
            </button>
          ))}
        </nav>
        <div className="locale-switch" aria-label="Language">
          <button type="button" data-active={locale === "zh"} onClick={() => onLocaleChange("zh")}>
            中
          </button>
          <span>/</span>
          <button type="button" data-active={locale === "en"} onClick={() => onLocaleChange("en")}>
            EN
          </button>
        </div>
      </header>

      <div className="hero-grid">
        <div className="hero-intro">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.name}</h1>
          <p className="role">{t.role}</p>
          <p className="hero-note">VOICE AS INTERFACE<br />KNOWLEDGE AS SPACE</p>
        </div>

        <div className="voice-console">
          <VoiceOrb state={agent.uiState} label={t.statuses[agent.uiState]} />
          <div className="voice-copy">
            <h2>{t.title}</h2>
            <p>{t.description}</p>
          </div>

          <div className="session-actions">
            {agent.isConnected || agent.status === "connecting" ? (
              <button className="primary-action stop-action" type="button" onClick={agent.endConversation}>
                <span aria-hidden="true">■</span> {t.stop}
              </button>
            ) : (
              <button className="primary-action" type="button" onClick={agent.startConversation}>
                <span aria-hidden="true">●</span> {t.start}
              </button>
            )}
            <span className="session-kind">
              {agent.sessionKind === "text" ? "TEXT SESSION" : agent.sessionKind === "voice" ? "VOICE SESSION" : t.configuredHint}
            </span>
          </div>

          <form className="text-fallback" onSubmit={submit}>
            <label className="sr-only" htmlFor="voice-question">{t.placeholder}</label>
            <input
              id="voice-question"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t.placeholder}
              disabled={agent.status === "connecting"}
            />
            <button type="submit" disabled={!text.trim() || agent.status === "connecting"}>{t.send} ↗</button>
          </form>
          <p className="text-hint">{t.textHint}</p>

          {(agent.error || agent.notice) && (
            <div className={agent.error ? "inline-message error-message" : "inline-message"} role={agent.error ? "alert" : "status"}>
              {agent.error ?? agent.notice}
            </div>
          )}
        </div>
      </div>

      <div className="starters" aria-label={locale === "zh" ? "推荐问题" : "Suggested questions"}>
        <span className="starters-label">{locale === "zh" ? "从这里开始" : "START HERE"}</span>
        {t.starters.map((starter, index) => (
          <button type="button" key={starter} onClick={() => agent.sendTextMessage(starter)}>
            <span>0{index + 1}</span>{starter}
          </button>
        ))}
      </div>

      {process.env.NODE_ENV === "development" && (
        <details className="dev-tools">
          <summary>DEV · open_section</summary>
          <div>
            {sectionIds.map((section) => (
              <button type="button" key={section} onClick={() => openSection(section)}>{section}</button>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
