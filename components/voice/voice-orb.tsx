import type { VoiceUiState } from "@/lib/elevenlabs/use-voice-agent";

type VoiceOrbProps = {
  state: VoiceUiState;
  label: string;
};

export function VoiceOrb({ state, label }: VoiceOrbProps) {
  return (
    <div className="orb-stage" aria-live="polite">
      <div className="orb-rings" data-state={state} aria-hidden="true">
        <span className="orb-ring orb-ring-one" />
        <span className="orb-ring orb-ring-two" />
        <span className="orb-core" />
      </div>
      <div className="orb-status">
        <span className="status-dot" data-state={state} aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}
