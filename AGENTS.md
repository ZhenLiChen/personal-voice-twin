# Personal Voice Twin — Development Rules

## Product principles

- Treat the voice agent as the primary interaction and the website as its visual knowledge layer.
- Default to Chinese, with natural English content and interaction as a first-class alternative.
- Identify the agent as Zhenli's AI counterpart, never as the real person.
- Prefer grounded uncertainty over inference when personal facts are not explicitly documented.
- Keep the MVP architecture clear and portable; avoid premature infrastructure.

## Safety and privacy

- Never commit, push, or write real secrets automatically.
- Keep browser-safe identifiers in `NEXT_PUBLIC_*`; keep credentials server-side only.
- Never include sensitive personal information in fixtures, examples, or mock data.
- Knowledge is private by default. Only notes explicitly marked `public: true` and `agent: true` may be synchronized to an agent knowledge base.
- Never upload or expose an entire Obsidian vault.

## Implementation rules

- Use Next.js, React, TypeScript, Tailwind CSS, and Markdown/MDX unless a documented decision changes the stack.
- Use current official ElevenLabs Agents documentation and SDK behavior; do not simulate unsupported voice capabilities.
- Clearly document every required manual ElevenLabs Dashboard step.
- Keep content adapters separate from presentation and provider integrations.
- Client tool names and parameter schemas must exactly match their ElevenLabs Dashboard definitions.
- Do not invent project outcomes, business metrics, research findings, or personal claims.
- Mock content must be visibly labeled and structurally realistic without pretending to be factual.

## Quality gates

- After each meaningful implementation stage, run and fix lint, typecheck, and build.
- Maintain desktop-first polish without breaking mobile interaction.
- Do not auto-commit or auto-push.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
