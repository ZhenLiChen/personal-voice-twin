"use client";

import { useState, type ReactNode } from "react";
import type { VoiceAgentController } from "@/lib/elevenlabs/use-voice-agent";
import type { Locale } from "@/lib/i18n/content";
import type { TranscriptEntry } from "@/lib/elevenlabs/voice-runtime";

type CallDockProps = {
  locale: Locale;
  agent: VoiceAgentController;
};

const stateLabels = {
  zh: {
    idle: "已结束",
    connecting: "正在连接",
    listening: "正在听",
    thinking: "正在思考",
    speaking: "正在回答",
    muted: "麦克风已关闭",
    error: "通话异常",
  },
  en: {
    idle: "Ended",
    connecting: "Connecting",
    listening: "Listening",
    thinking: "Thinking",
    speaking: "Speaking",
    muted: "Microphone muted",
    error: "Call error",
  },
} as const;

const eventLabels: Record<TranscriptEntry["kind"], { zh: string; en: string }> = {
  user_partial: { zh: "你 · 识别中", en: "You · partial" },
  user_final: { zh: "你", en: "You" },
  agent_streaming: { zh: "AI 分身 · 生成中", en: "Counterpart · streaming" },
  agent_final: { zh: "AI 分身", en: "Counterpart" },
  tool: { zh: "页面动作", en: "UI action" },
  error: { zh: "错误", en: "Error" },
};

type IconName = "mic" | "speaker" | "captions" | "voice" | "record" | "end";

function DockIcon({ name, off = false }: { name: IconName; off?: boolean }) {
  const paths: Record<IconName, ReactNode> = {
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6" /></>,
    speaker: <><path d="M4 10v4h4l5 4V6l-5 4H4Z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /></>,
    captions: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M10 10H7.5a2 2 0 0 0 0 4H10M17 10h-2.5a2 2 0 0 0 0 4H17" /></>,
    voice: <><path d="M5 12h2M9 8v8M13 5v14M17 9v6M21 11v2" /></>,
    record: <><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></>,
    end: <path d="M8 8h8v8H8z" />,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name]}{off && <path d="M4 4l16 16" />}</g></svg>;
}

function TranscriptRecord({ entries, locale }: { entries: TranscriptEntry[]; locale: Locale }) {
  return (
    <div className="transcript-record" aria-label={locale === "zh" ? "完整字幕记录" : "Full transcript"}>
      <header>
        <p>TRANSCRIPT / LIVE RECORD</p>
        <span>{entries.length} EVENTS</span>
      </header>
      <div className="transcript-scroll" aria-live="polite">
        {entries.length === 0 ? (
          <p className="transcript-empty">{locale === "zh" ? "对话开始后，字幕会记录在这里。" : "Conversation events will appear here."}</p>
        ) : entries.map((entry) => (
          <article key={entry.id} data-kind={entry.kind}>
            <div>
              <span>{eventLabels[entry.kind][locale]}</span>
              <time>{new Date(entry.createdAt).toLocaleTimeString(locale === "zh" ? "zh-CN" : "en", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
            </div>
            <p>{entry.text || "…"}</p>
            {(entry.kind === "tool" || entry.kind === "error") && <b>{entry.status}</b>}
          </article>
        ))}
      </div>
    </div>
  );
}

export function CallDock({ locale, agent }: CallDockProps) {
  const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);
  const visible = agent.sessionKind !== null || agent.status === "connecting" || agent.isConnected;
  if (!visible) return null;

  const isVoiceSession = agent.sessionKind === "voice";
  const label = stateLabels[locale][agent.uiState];

  return (
    <aside className="call-layer" aria-label={locale === "zh" ? "通话控制" : "Call controls"}>
      {agent.transcriptExpanded && <TranscriptRecord entries={agent.transcript} locale={locale} />}

      {agent.captionsEnabled && agent.latestCaption && (
        <div className="dock-caption" data-role={agent.latestCaption.role} aria-live="polite">
          <span>{agent.latestCaption.role === "user" ? (locale === "zh" ? "你" : "You") : "Zhenli AI"}</span>
          <p>{agent.latestCaption.text}</p>
        </div>
      )}

      <div className="call-dock">
        <div className="dock-state">
          <span className="dock-live-mark" data-state={agent.uiState} aria-hidden="true"><i /><i /><i /></span>
          <div><small>{agent.sessionKind === "voice" ? "LIVE / WEBRTC" : "LIVE / TEXT"}</small><b>{label}</b></div>
        </div>

        <div className="dock-controls">
          <button
            type="button"
            className="dock-control"
            data-active={agent.isMuted}
            disabled={!isVoiceSession || !agent.isConnected}
            aria-pressed={agent.isMuted}
            aria-label={locale === "zh" ? "麦克风开关" : "Toggle microphone"}
            onClick={() => agent.setMuted(!agent.isMuted)}
          >
            <DockIcon name="mic" off={agent.isMuted} />
            <span>{locale === "zh" ? "麦克风" : "Mic"}</span>
          </button>
          <button
            type="button"
            className="dock-control"
            data-active={agent.isSpeakerMuted}
            disabled={!isVoiceSession || !agent.isConnected}
            aria-pressed={agent.isSpeakerMuted}
            aria-label={locale === "zh" ? "扬声器开关" : "Toggle speaker"}
            onClick={agent.toggleSpeaker}
          >
            <DockIcon name="speaker" off={agent.isSpeakerMuted} />
            <span>{locale === "zh" ? "声音" : "Sound"}</span>
          </button>
          <button
            type="button"
            className="dock-control"
            data-active={agent.captionsEnabled}
            aria-pressed={agent.captionsEnabled}
            aria-label={locale === "zh" ? "字幕开关" : "Toggle captions"}
            onClick={() => agent.setCaptionsEnabled(!agent.captionsEnabled)}
          >
            <DockIcon name="captions" off={!agent.captionsEnabled} />
            <span>{locale === "zh" ? "字幕" : "Captions"}</span>
          </button>

          <div className="voice-selector">
            <button
              type="button"
              className="dock-control voice-control"
              aria-expanded={voiceMenuOpen}
              onClick={() => setVoiceMenuOpen(!voiceMenuOpen)}
            >
              <DockIcon name="voice" />
              <span>{locale === "zh" ? "音色" : "Voice"}</span>
            </button>
            {voiceMenuOpen && (
              <div className="voice-menu" role="dialog" aria-label={locale === "zh" ? "音色选择" : "Voice selection"}>
                <b>{locale === "zh" ? "ElevenLabs Dashboard 音色" : "ElevenLabs Dashboard voice"}</b>
                <p>{locale === "zh" ? "当前会话继承 Agent 配置。尚未加入其他已审核音色；切换不会由 Agent 自动触发。" : "This session inherits the Agent voice. No other reviewed voices are configured, and the Agent cannot switch it automatically."}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            className="dock-control"
            data-active={agent.transcriptExpanded}
            aria-expanded={agent.transcriptExpanded}
            onClick={() => agent.setTranscriptExpanded(!agent.transcriptExpanded)}
          >
            <DockIcon name="record" />
            <span>{locale === "zh" ? "记录" : "Record"}</span>
          </button>
          <button type="button" className="dock-control end-call" aria-label={locale === "zh" ? "结束通话" : "End call"} onClick={agent.endConversation}>
            <DockIcon name="end" />
            <span>{locale === "zh" ? "结束" : "End"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
