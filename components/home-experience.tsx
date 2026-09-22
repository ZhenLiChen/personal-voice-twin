"use client";

import { ConversationProvider } from "@elevenlabs/react";
import { useState } from "react";
import { ContentSections } from "@/components/sections/content-sections";
import { VoiceHero } from "@/components/voice/voice-hero";
import type { Locale } from "@/lib/i18n/content";

export function HomeExperience() {
  const [locale, setLocale] = useState<Locale>("zh");

  return (
    <ConversationProvider
      onError={(message, context) => {
        if (process.env.NODE_ENV === "development") {
          console.error("[VoiceAgent] SDK error", message, context);
        }
      }}
      onDisconnect={(details) => {
        if (process.env.NODE_ENV === "development") {
          console.debug("[VoiceAgent] disconnected", details);
        }
      }}
      onInterruption={(event) => {
        if (process.env.NODE_ENV === "development") {
          console.debug("[VoiceAgent] interruption", event);
        }
      }}
    >
      <main>
        <VoiceHero locale={locale} onLocaleChange={setLocale} />
        <ContentSections locale={locale} />
      </main>
    </ConversationProvider>
  );
}
