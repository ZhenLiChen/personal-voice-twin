"use client";

import {
  useConversationClientTool,
  useConversationControls,
  useConversationInput,
  useConversationMode,
  useConversationStatus,
} from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/content";
import { useVoiceRuntime } from "@/lib/elevenlabs/voice-runtime";
import { actionFromClientTool, executeUiAction } from "@/lib/ui-actions/execute";

export type VoiceUiState = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "muted" | "error";
export type SessionKind = "voice" | "text" | null;

function microphoneErrorMessage(error: unknown, locale: Locale) {
  const name = error instanceof DOMException ? error.name : "UnknownError";
  const messages = {
    zh: {
      NotAllowedError: "麦克风权限被拒绝。你仍然可以使用文字模式。",
      NotFoundError: "没有找到可用的麦克风。你仍然可以使用文字模式。",
      NotReadableError: "麦克风正被其他应用占用。你仍然可以使用文字模式。",
      unsupported: "当前浏览器不支持麦克风访问。你仍然可以使用文字模式。",
      fallback: "无法启动麦克风。你仍然可以使用文字模式。",
    },
    en: {
      NotAllowedError: "Microphone access was denied. You can still use text mode.",
      NotFoundError: "No microphone was found. You can still use text mode.",
      NotReadableError: "The microphone is unavailable. You can still use text mode.",
      unsupported: "This browser does not support microphone access. You can still use text mode.",
      fallback: "The microphone could not start. You can still use text mode.",
    },
  } as const;
  const selected = messages[locale];
  return selected[name as keyof typeof selected] ?? selected.fallback;
}

export function useVoiceAgent(locale: Locale) {
  const { status, message: sdkMessage } = useConversationStatus();
  const { isSpeaking, isListening } = useConversationMode();
  const { isMuted, setMuted } = useConversationInput();
  const { startSession, endSession, sendUserMessage, setVolume } = useConversationControls();
  const runtime = useVoiceRuntime();
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sessionKind, setSessionKind] = useState<SessionKind>(null);
  const [isSpeakerMuted, setSpeakerMuted] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [ignoreSdkErrors, setIgnoreSdkErrors] = useState(false);
  const pendingMessage = useRef<string | null>(null);

  useConversationClientTool("open_section", (parameters: Record<string, unknown>) => {
    const result = executeUiAction({ version: "1.0", type: "OPEN_SECTION", target: parameters.section });
    runtime.recordAction(result);
    return JSON.stringify(result);
  });

  useConversationClientTool("open_note", (parameters: Record<string, unknown>) => {
    const result = executeUiAction(actionFromClientTool("OPEN_NOTE", parameters));
    runtime.recordAction(result);
    return JSON.stringify(result);
  });

  useConversationClientTool("open_project", (parameters: Record<string, unknown>) => {
    const result = executeUiAction(actionFromClientTool("OPEN_PROJECT", parameters));
    runtime.recordAction(result);
    return JSON.stringify(result);
  });

  useConversationClientTool("show_metric", (parameters: Record<string, unknown>) => {
    const result = executeUiAction(actionFromClientTool("SHOW_METRIC", parameters));
    runtime.recordAction(result);
    return JSON.stringify(result);
  });

  useConversationClientTool("show_research_figure", (parameters: Record<string, unknown>) => {
    const result = executeUiAction(actionFromClientTool("SHOW_RESEARCH_FIGURE", parameters));
    runtime.recordAction(result);
    return JSON.stringify(result);
  });

  useConversationClientTool("highlight_source", (parameters: Record<string, unknown>) => {
    const result = executeUiAction(actionFromClientTool("HIGHLIGHT_SOURCE", parameters));
    runtime.recordAction(result);
    return JSON.stringify(result);
  });

  useConversationClientTool("show_timeline", (parameters: Record<string, unknown>) => {
    const result = executeUiAction(actionFromClientTool("SHOW_TIMELINE", parameters));
    runtime.recordAction(result);
    return JSON.stringify(result);
  });

  useConversationClientTool("show_map", (parameters: Record<string, unknown>) => {
    const result = executeUiAction(actionFromClientTool("SHOW_MAP", parameters));
    runtime.recordAction(result);
    return JSON.stringify(result);
  });

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID?.trim();
  const isConnected = status === "connected";

  useEffect(() => {
    if (status !== "connected" || !pendingMessage.current) return;
    const text = pendingMessage.current;
    pendingMessage.current = null;
    const sendPendingMessage = window.setTimeout(() => {
      try {
        sendUserMessage(text);
        setNotice(null);
      } catch (error) {
        setLocalError(locale === "zh" ? "文字发送失败，请重试。" : "The message could not be sent. Please retry.");
        console.error("[VoiceAgent] text send failed", error);
      }
    }, 0);
    return () => window.clearTimeout(sendPendingMessage);
  }, [locale, runtime, sendUserMessage, status]);

  const getBaseOptions = useCallback(
    // Intentionally omit TTS, voice, language, and first-message overrides.
    // ElevenLabs Dashboard is the sole source of truth for the agent's voice.
    () => ({ agentId: agentId! }),
    [agentId],
  );

  const ensureConfigured = useCallback(() => {
    if (agentId) return true;
    setLocalError(
      locale === "zh"
        ? "尚未配置 ElevenLabs Agent ID。请在 .env.local 中设置 NEXT_PUBLIC_ELEVENLABS_AGENT_ID。"
        : "No ElevenLabs Agent ID is configured. Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID in .env.local.",
    );
    return false;
  }, [agentId, locale]);

  const startConversation = useCallback(async () => {
    setIgnoreSdkErrors(false);
    setLocalError(null);
    setNotice(null);
    setSpeakerMuted(false);
    if (!ensureConfigured()) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setLocalError(microphoneErrorMessage(new DOMException("unsupported", "unsupported"), locale));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setSessionKind("voice");
      startSession({ ...getBaseOptions(), connectionType: "webrtc" });
    } catch (error) {
      setSessionKind(null);
      setLocalError(microphoneErrorMessage(error, locale));
      if (process.env.NODE_ENV === "development") console.error("[VoiceAgent] microphone failed", error);
    }
  }, [ensureConfigured, getBaseOptions, locale, startSession]);

  const endConversation = useCallback(() => {
    setIgnoreSdkErrors(true);
    endSession();
    pendingMessage.current = null;
    setSessionKind(null);
    setLocalError(null);
    setNotice(locale === "zh" ? "会话已结束。" : "Session ended.");
  }, [endSession, locale]);

  const sendTextMessage = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value) return false;
      setLocalError(null);

      if (isConnected) {
        try {
          sendUserMessage(value);
          runtime.recordUserMessage(value);
          setNotice(null);
          return true;
        } catch (error) {
          setLocalError(locale === "zh" ? "文字发送失败，请重试。" : "The message could not be sent. Please retry.");
          console.error("[VoiceAgent] text send failed", error);
          return false;
        }
      }

      if (!ensureConfigured()) return false;
      setIgnoreSdkErrors(false);
      pendingMessage.current = value;
      runtime.recordUserMessage(value);
      setSessionKind("text");
      setNotice(locale === "zh" ? "正在建立文字会话，连接后会自动发送。" : "Starting a text session; your message will send when connected.");
      startSession({ ...getBaseOptions(), textOnly: true, connectionType: "websocket" });
      return true;
    },
    [ensureConfigured, getBaseOptions, isConnected, locale, runtime, sendUserMessage, startSession],
  );

  const toggleSpeaker = useCallback(() => {
    const nextMuted = !isSpeakerMuted;
    setSpeakerMuted(nextMuted);
    setVolume({ volume: nextMuted ? 0 : 1 });
  }, [isSpeakerMuted, setVolume]);

  const error = localError ?? (status === "error" && !ignoreSdkErrors
    ? sdkMessage ?? (locale === "zh" ? "Agent 连接失败。" : "Agent connection failed.")
    : null);
  const uiState: VoiceUiState = error
    ? "error"
    : status === "connecting"
      ? "connecting"
      : status !== "connected"
        ? "idle"
        : isMuted && sessionKind === "voice"
          ? "muted"
        : isSpeaking
          ? "speaking"
          : runtime.isAwaitingAgent
            ? "thinking"
          : "listening";

  return {
    status,
    uiState,
    isConnected,
    isSpeaking,
    isListening: isConnected && isListening,
    isMuted,
    setMuted,
    isSpeakerMuted,
    toggleSpeaker,
    captionsEnabled,
    setCaptionsEnabled,
    transcriptExpanded,
    setTranscriptExpanded,
    transcript: runtime.transcript,
    latestCaption: runtime.latestCaption,
    hasAudioAlignment: runtime.hasAudioAlignment,
    sessionKind,
    startConversation,
    endConversation,
    sendTextMessage,
    error,
    notice,
  };
}

export type VoiceAgentController = ReturnType<typeof useVoiceAgent>;
