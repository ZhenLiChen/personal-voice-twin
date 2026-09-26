import { openSection } from "@/lib/elevenlabs/open-section";
import { validateUiAction, type UiAction } from "@/lib/ui-actions/schema";

export type UiActionExecution = {
  ok: boolean;
  action: string;
  target: string;
  status: "success" | "failed" | "mocked";
  reason?: string;
};

const noteSections: Record<string, "product" | "technical" | "research"> = {
  "voice-agent-interruption": "product",
  "voice-latency": "technical",
  "wu-vowel-chain": "research",
  "asr-timestamps": "technical",
};

function highlightElement(element: HTMLElement) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  element.dataset.agentTarget = "true";
  window.setTimeout(() => delete element.dataset.agentTarget, 1600);
}

export function executeUiAction(input: unknown): UiActionExecution {
  const validation = validateUiAction(input);
  if (!validation.ok) {
    const failed = { ok: false, action: "UNKNOWN", target: "UNKNOWN", status: "failed" as const, reason: validation.reason };
    console.error("[VoiceAgentAction] rejected", failed);
    return failed;
  }

  const action = validation.action;
  let result: UiActionExecution;

  if (action.type === "OPEN_SECTION") {
    const sectionResult = openSection(action.target);
    result = sectionResult.ok
      ? { ok: true, action: action.type, target: action.target, status: "success" }
      : { ok: false, action: action.type, target: action.target, status: "failed", reason: sectionResult.message };
  } else if (action.type === "OPEN_PROJECT") {
    const project = document.querySelector<HTMLElement>(`[data-project-id="${action.target}"]`);
    if (project) {
      highlightElement(project);
      result = { ok: true, action: action.type, target: action.target, status: "success" };
    } else {
      result = { ok: false, action: action.type, target: action.target, status: "failed", reason: "Project target is not rendered." };
    }
  } else if (action.type === "OPEN_NOTE") {
    const section = noteSections[action.target];
    const sectionResult = openSection(section);
    result = sectionResult.ok
      ? { ok: true, action: action.type, target: action.target, status: "success" }
      : { ok: false, action: action.type, target: action.target, status: "failed", reason: sectionResult.message };
  } else {
    result = {
      ok: true,
      action: action.type,
      target: action.target,
      status: "mocked",
      reason: "Whitelisted action accepted; visual artifact is not published yet.",
    };
  }

  const logger = result.status === "failed" ? console.error : console.debug;
  logger(`[VoiceAgentAction] ${result.action} -> ${result.target}`, result);
  return result;
}

export function actionFromClientTool(type: UiAction["type"], parameters: Record<string, unknown>) {
  return {
    version: "1.0",
    type,
    target: parameters.target,
    ...(parameters.focus === undefined ? {} : { focus: parameters.focus }),
  };
}
