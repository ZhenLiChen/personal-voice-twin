"use client";

import {
  useConversationClientTool,
  useConversationControls,
  useConversationMode,
  useConversationStatus,
} from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/content";
import { openSection } from "@/lib/elevenlabs/open-section";

export type VoiceUiState = "idle" | "connecting" | "listening" | "speaking" | "error";
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
  const { startSession, endSession, sendUserMessage } = useConversationControls();
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sessionKind, setSessionKind] = useState<SessionKind>(null);
  const pendingMessage = useRef<string | null>(null);

  useConversationClientTool("open_section", (parameters: Record<string, unknown>) => {
    const result = openSection(parameters.section);
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
  }, [locale, sendUserMessage, status]);

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
    setLocalError(null);
    setNotice(null);
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
          setNotice(null);
          return true;
        } catch (error) {
          setLocalError(locale === "zh" ? "文字发送失败，请重试。" : "The message could not be sent. Please retry.");
          console.error("[VoiceAgent] text send failed", error);
          return false;
        }
      }

      if (!ensureConfigured()) return false;
      pendingMessage.current = value;
      setSessionKind("text");
      setNotice(locale === "zh" ? "正在建立文字会话，连接后会自动发送。" : "Starting a text session; your message will send when connected.");
      startSession({ ...getBaseOptions(), textOnly: true, connectionType: "websocket" });
      return true;
    },
    [ensureConfigured, getBaseOptions, isConnected, locale, sendUserMessage, startSession],
  );

  const error = localError ?? (status === "error" ? sdkMessage ?? (locale === "zh" ? "Agent 连接失败。" : "Agent connection failed.") : null);
  const uiState: VoiceUiState = error
    ? "error"
    : status === "connecting"
      ? "connecting"
      : status !== "connected"
        ? "idle"
        : isSpeaking
          ? "speaking"
          : "listening";

  return {
    status,
    uiState,
    isConnected,
    isSpeaking,
    isListening: isConnected && isListening,
    sessionKind,
    startConversation,
    endConversation,
    sendTextMessage,
    error,
    notice,
  };
}
