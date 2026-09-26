"use client";

import { ConversationProvider } from "@elevenlabs/react";
import type { Callbacks } from "@elevenlabs/client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

export type TranscriptKind =
  | "user_partial"
  | "user_final"
  | "agent_streaming"
  | "agent_final"
  | "tool"
  | "error";

export type TranscriptEntry = {
  id: string;
  turnId: string;
  kind: TranscriptKind;
  role: "user" | "agent" | "system";
  text: string;
  status: "partial" | "streaming" | "final" | "success" | "failed" | "mocked";
  createdAt: number;
};

export type ActionLogInput = {
  action: string;
  target: string;
  status: "success" | "failed" | "mocked";
  reason?: string;
};

type RuntimeContextValue = {
  transcript: TranscriptEntry[];
  isAwaitingAgent: boolean;
  latestCaption: TranscriptEntry | null;
  hasAudioAlignment: boolean;
  recordUserMessage: (text: string) => void;
  recordAction: (input: ActionLogInput) => void;
  clearTranscript: () => void;
};

const RuntimeContext = createContext<RuntimeContextValue | null>(null);

type AgentPart = Parameters<NonNullable<Callbacks["onAgentChatResponsePart"]>>[0];
type MessagePayload = Parameters<NonNullable<Callbacks["onMessage"]>>[0];

function eventObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function textFromTentativeEvent(value: unknown) {
  const event = eventObject(value);
  if (event?.type !== "tentative_user_transcript") return null;
  const payload = eventObject(event.tentative_user_transcription_event);
  return typeof payload?.user_transcript === "string" ? payload.user_transcript : null;
}

export function VoiceRuntimeProvider({ children }: PropsWithChildren) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isAwaitingAgent, setAwaitingAgent] = useState(false);
  const [hasAudioAlignment, setHasAudioAlignment] = useState(false);
  const sequence = useRef(0);
  const activeUserTurn = useRef<string | null>(null);
  const activeAgentTurn = useRef<string | null>(null);
  const lastUserFinal = useRef<{ text: string; at: number } | null>(null);
  const ignoreTeardownErrorsUntil = useRef(0);

  const nextId = useCallback((prefix: string) => {
    sequence.current += 1;
    return `${prefix}-${sequence.current}`;
  }, []);

  const upsert = useCallback((entry: TranscriptEntry) => {
    setTranscript((current) => {
      const index = current.findIndex((item) => item.id === entry.id);
      if (index < 0) return [...current, entry];
      const updated = [...current];
      updated[index] = { ...current[index], ...entry };
      return updated;
    });
  }, []);

  const recordUserMessage = useCallback((text: string) => {
    const normalized = text.trim();
    if (!normalized) return;
    const now = Date.now();
    const duplicate = lastUserFinal.current
      && lastUserFinal.current.text === normalized
      && now - lastUserFinal.current.at < 2000;
    if (duplicate) return;

    const turnId = activeUserTurn.current ?? nextId("user-turn");
    activeUserTurn.current = null;
    lastUserFinal.current = { text: normalized, at: now };
    upsert({
      id: turnId,
      turnId,
      kind: "user_final",
      role: "user",
      text: normalized,
      status: "final",
      createdAt: now,
    });
    setAwaitingAgent(true);
  }, [nextId, upsert]);

  const handleMessage = useCallback((message: MessagePayload) => {
    if (message.role === "user") {
      recordUserMessage(message.message);
      return;
    }

    const now = Date.now();
    const turnId = activeAgentTurn.current ?? nextId("agent-turn");
    activeAgentTurn.current = null;
    upsert({
      id: turnId,
      turnId,
      kind: "agent_final",
      role: "agent",
      text: message.message,
      status: "final",
      createdAt: now,
    });
    setAwaitingAgent(false);
  }, [nextId, recordUserMessage, upsert]);

  const handleAgentPart = useCallback((part: AgentPart) => {
    // Current ElevenLabs events include response_id, while @elevenlabs/client
    // 1.25.0 has not added it to TextResponsePart's TypeScript declaration yet.
    const responseId = (part as AgentPart & { response_id?: string }).response_id;
    const turnId = responseId || activeAgentTurn.current || nextId("agent-turn");
    activeAgentTurn.current = turnId;
    setAwaitingAgent(false);

    if (part.type === "start") {
      upsert({
        id: turnId,
        turnId,
        kind: "agent_streaming",
        role: "agent",
        text: "",
        status: "streaming",
        createdAt: Date.now(),
      });
      return;
    }

    if (part.type === "delta") {
      setTranscript((current) => {
        const existing = current.find((item) => item.id === turnId);
        if (!existing) {
          return [...current, {
            id: turnId,
            turnId,
            kind: "agent_streaming",
            role: "agent",
            text: part.text,
            status: "streaming",
            createdAt: Date.now(),
          }];
        }
        return current.map((item) => item.id === turnId
          ? { ...item, text: `${item.text}${part.text}`, kind: "agent_streaming", status: "streaming" }
          : item);
      });
      return;
    }

    if (part.type === "stop") {
      setTranscript((current) => current.map((item) => item.id === turnId
        ? { ...item, status: "final" }
        : item));
    }
  }, [nextId, upsert]);

  const handleAgentCorrection = useCallback((correction: {
    original_agent_response: string;
    corrected_agent_response: string;
  }) => {
    setTranscript((current) => {
      const index = current.findLastIndex((entry) => (
        entry.role === "agent" && entry.text === correction.original_agent_response
      ));
      if (index < 0) return current;
      const updated = [...current];
      updated[index] = { ...updated[index], text: correction.corrected_agent_response, status: "final" };
      return updated;
    });
  }, []);

  const handleIncomingEvent = useCallback((event: unknown) => {
    const partial = textFromTentativeEvent(event);
    if (partial === null) return;
    const turnId = activeUserTurn.current ?? nextId("user-turn");
    activeUserTurn.current = turnId;
    upsert({
      id: turnId,
      turnId,
      kind: "user_partial",
      role: "user",
      text: partial,
      status: "partial",
      createdAt: Date.now(),
    });
  }, [nextId, upsert]);

  const handleError = useCallback((message: string, context?: unknown) => {
    // LiveKit can emit a late signal-stream error after a user-requested
    // WebRTC disconnect. The room and tracks are already closed successfully,
    // so do not turn that teardown race into a visible conversation error.
    if (Date.now() < ignoreTeardownErrorsUntil.current) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[VoiceAgent] ignored post-disconnect SDK error", message, context);
      }
      return;
    }
    const id = nextId("error");
    upsert({
      id,
      turnId: id,
      kind: "error",
      role: "system",
      text: message,
      status: "failed",
      createdAt: Date.now(),
    });
    setAwaitingAgent(false);
    if (process.env.NODE_ENV === "development") {
      console.error("[VoiceAgent] SDK error", message, context);
    }
  }, [nextId, upsert]);

  const handleAudioAlignment = useCallback(() => {
    setHasAudioAlignment(true);
  }, []);

  const recordAction = useCallback((input: ActionLogInput) => {
    const id = nextId("action");
    const reason = input.reason ? ` · ${input.reason}` : "";
    upsert({
      id,
      turnId: id,
      kind: "tool",
      role: "system",
      text: `${input.action} → ${input.target}${reason}`,
      status: input.status,
      createdAt: Date.now(),
    });
  }, [nextId, upsert]);

  const clearTranscript = useCallback(() => {
    setTranscript([]);
    activeUserTurn.current = null;
    activeAgentTurn.current = null;
    lastUserFinal.current = null;
  }, []);

  const latestCaption = useMemo(() => {
    for (let index = transcript.length - 1; index >= 0; index -= 1) {
      const entry = transcript[index];
      if (entry.kind !== "tool" && entry.kind !== "error" && entry.text.trim()) return entry;
    }
    return null;
  }, [transcript]);

  const value = useMemo<RuntimeContextValue>(() => ({
    transcript,
    isAwaitingAgent,
    latestCaption,
    hasAudioAlignment,
    recordUserMessage,
    recordAction,
    clearTranscript,
  }), [
    clearTranscript,
    hasAudioAlignment,
    isAwaitingAgent,
    latestCaption,
    recordAction,
    recordUserMessage,
    transcript,
  ]);

  return (
    <ConversationProvider
      onMessage={handleMessage}
      onAgentChatResponsePart={handleAgentPart}
      onAgentResponseCorrection={handleAgentCorrection}
      onIncomingEvent={handleIncomingEvent}
      onAudioAlignment={handleAudioAlignment}
      onError={handleError}
      onDisconnect={(details) => {
        if (details.reason === "user") ignoreTeardownErrorsUntil.current = Date.now() + 6000;
        if (process.env.NODE_ENV === "development") console.debug("[VoiceAgent] disconnected", details);
      }}
      onInterruption={(event) => {
        if (process.env.NODE_ENV === "development") console.debug("[VoiceAgent] interruption", event);
      }}
    >
      <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>
    </ConversationProvider>
  );
}

export function useVoiceRuntime() {
  const context = useContext(RuntimeContext);
  if (!context) throw new Error("useVoiceRuntime must be used inside VoiceRuntimeProvider");
  return context;
}
