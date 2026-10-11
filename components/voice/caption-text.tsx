"use client";

import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "@/lib/elevenlabs/voice-runtime";

export function CaptionText({ entry, className, label }: {
  entry: TranscriptEntry;
  className: string;
  label: string;
}) {
  const element = useRef<HTMLParagraphElement>(null);
  const following = useRef(true);
  const previousId = useRef<string | null>(null);

  useEffect(() => {
    const node = element.current;
    if (!node) return;
    if (previousId.current !== entry.id) {
      previousId.current = entry.id;
      following.current = true;
      node.scrollTop = 0;
    } else if (following.current) {
      node.scrollTop = node.scrollHeight;
    }
  }, [entry.id, entry.text]);

  return (
    <p
      ref={element}
      className={className}
      data-role={entry.role}
      tabIndex={0}
      role="region"
      aria-label={label}
      onScroll={(event) => {
        const node = event.currentTarget;
        following.current = node.scrollHeight - node.scrollTop - node.clientHeight < 32;
      }}
    >
      {entry.text}
    </p>
  );
}
