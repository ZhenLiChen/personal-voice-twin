import { isSectionId, type SectionId } from "@/lib/elevenlabs/open-section";

export const uiActionTypes = [
  "OPEN_SECTION",
  "OPEN_NOTE",
  "OPEN_PROJECT",
  "SHOW_METRIC",
  "SHOW_RESEARCH_FIGURE",
  "HIGHLIGHT_SOURCE",
  "SHOW_TIMELINE",
  "SHOW_MAP",
] as const;

export type UiActionType = (typeof uiActionTypes)[number];

export const targetAllowlist = {
  OPEN_SECTION: ["about", "product", "technical", "research", "interests", "projects"],
  OPEN_NOTE: ["voice-agent-interruption", "voice-latency", "wu-vowel-chain", "asr-timestamps"],
  OPEN_PROJECT: ["dola", "mira", "paperpicker", "personal-voice-twin", "wu-chinese-research"],
  SHOW_METRIC: ["tts-usage-depth", "voice-latency-breakdown"],
  SHOW_RESEARCH_FIGURE: ["vowel-chain-map", "mainlayer-clusters", "dialect-topography"],
  HIGHLIGHT_SOURCE: ["dola-public-case", "wu-research-overview", "asr-timestamp-note"],
  SHOW_TIMELINE: ["research-to-ai"],
  SHOW_MAP: ["wu-dialect-geography", "travel-map"],
} as const satisfies Record<UiActionType, readonly string[]>;

export const focusAllowlist = ["multilingual-tts", "method", "findings", "product-thinking"] as const;

export type UiAction = {
  version: "1.0";
  type: UiActionType;
  target: string;
  focus?: (typeof focusAllowlist)[number];
};

export type UiActionValidation =
  | { ok: true; action: UiAction }
  | { ok: false; reason: string };

export const uiActionJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    version: { const: "1.0" },
    type: { type: "string", enum: uiActionTypes },
    target: { type: "string", enum: [...new Set(Object.values(targetAllowlist).flat())] },
    focus: { type: "string", enum: focusAllowlist },
  },
  required: ["version", "type", "target"],
  allOf: uiActionTypes.map((type) => ({
    if: { properties: { type: { const: type } }, required: ["type"] },
    then: { properties: { target: { enum: targetAllowlist[type] } } },
  })),
} as const;

function isUiActionType(value: unknown): value is UiActionType {
  return typeof value === "string" && uiActionTypes.includes(value as UiActionType);
}

export function validateUiAction(value: unknown): UiActionValidation {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, reason: "Action payload must be an object." };
  }

  const payload = value as Record<string, unknown>;
  const unknownKeys = Object.keys(payload).filter((key) => !["version", "type", "target", "focus"].includes(key));
  if (unknownKeys.length) return { ok: false, reason: `Unknown parameters: ${unknownKeys.join(", ")}` };
  if (payload.version !== "1.0") return { ok: false, reason: "Unsupported action schema version." };
  if (!isUiActionType(payload.type)) return { ok: false, reason: "Unknown action type." };
  if (typeof payload.target !== "string") return { ok: false, reason: "Target must be a string." };

  const targets = targetAllowlist[payload.type] as readonly string[];
  if (!targets.includes(payload.target)) {
    return { ok: false, reason: `Target is not allowed for ${payload.type}.` };
  }

  if (payload.focus !== undefined) {
    if (typeof payload.focus !== "string" || !focusAllowlist.includes(payload.focus as (typeof focusAllowlist)[number])) {
      return { ok: false, reason: "Focus is not allowed." };
    }
  }

  return {
    ok: true,
    action: {
      version: "1.0",
      type: payload.type,
      target: payload.target,
      ...(payload.focus ? { focus: payload.focus as UiAction["focus"] } : {}),
    },
  };
}

export function sectionAction(section: unknown): UiActionValidation {
  if (!isSectionId(section)) return { ok: false, reason: "Unknown section target." };
  return { ok: true, action: { version: "1.0", type: "OPEN_SECTION", target: section as SectionId } };
}
