"use client";

import { useState } from "react";
import { ContentSections } from "@/components/sections/content-sections";
import { CallDock } from "@/components/voice/call-dock";
import { VoiceHero } from "@/components/voice/voice-hero";
import { VoiceRuntimeProvider } from "@/lib/elevenlabs/voice-runtime";
import { useVoiceAgent } from "@/lib/elevenlabs/use-voice-agent";
import type { Locale } from "@/lib/i18n/content";

function VoiceExperience({ locale, onLocaleChange }: { locale: Locale; onLocaleChange: (locale: Locale) => void }) {
  const agent = useVoiceAgent(locale);

  return (
    <>
      <main>
        <VoiceHero locale={locale} onLocaleChange={onLocaleChange} agent={agent} />
        <ContentSections locale={locale} />
      </main>
      <CallDock locale={locale} agent={agent} />
    </>
  );
}

export function HomeExperience() {
  const [locale, setLocale] = useState<Locale>("zh");

  return (
    <VoiceRuntimeProvider>
      <VoiceExperience locale={locale} onLocaleChange={setLocale} />
    </VoiceRuntimeProvider>
  );
}
