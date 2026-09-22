export const sectionIds = ["about", "product", "research", "interests", "projects"] as const;

export type SectionId = (typeof sectionIds)[number];

export type OpenSectionResult =
  | { ok: true; section: SectionId; alreadyVisible: boolean }
  | { ok: false; code: "INVALID_SECTION" | "SECTION_NOT_FOUND"; message: string };

export function isSectionId(value: unknown): value is SectionId {
  return typeof value === "string" && sectionIds.includes(value as SectionId);
}

export function openSection(section: unknown): OpenSectionResult {
  if (!isSectionId(section)) {
    const result = {
      ok: false as const,
      code: "INVALID_SECTION" as const,
      message: `Unknown section: ${String(section)}`,
    };
    console.error("[VoiceAgentTool] open_section failed", result);
    return result;
  }

  const target = document.getElementById(section);
  if (!target) {
    const result = {
      ok: false as const,
      code: "SECTION_NOT_FOUND" as const,
      message: `Section element not found: ${section}`,
    };
    console.error("[VoiceAgentTool] open_section failed", result);
    return result;
  }

  const bounds = target.getBoundingClientRect();
  const alreadyVisible = bounds.top >= 0 && bounds.top < window.innerHeight * 0.55;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  target.dataset.agentTarget = "true";
  window.setTimeout(() => delete target.dataset.agentTarget, 1600);

  console.debug(`[VoiceAgentTool] open_section -> ${section}`);
  return { ok: true, section, alreadyVisible };
}
