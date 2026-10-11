# Personal Voice Twin

一个中文优先、支持英文切换的 conversational personal interface。Voice Agent 是主要交互入口，网站是工作、研究、项目与兴趣的视觉知识层。

当前版本是 Foundation + Voice Vertical Slice：自定义 Voice Hero 使用 ElevenLabs React SDK 连接真实 Agent，并支持麦克风会话、Agent 语音、持久通话控制、实时/完整双层字幕、文字会话和受控页面动作。

## Local Setup

要求：Node.js 20.9+（本项目当前使用 Node.js 24）。

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。麦克风在生产环境中要求 HTTPS；`localhost` 可作为浏览器安全上下文用于本地开发。

质量检查：

```bash
npm run lint
npm run typecheck
npm run build
```

## Environment

```dotenv
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=
```

从 ElevenLabs Dashboard 的 Agent 页面复制 Agent ID，填入 `.env.local`，然后重启开发服务器。Agent ID 是公开标识符；不要在 `NEXT_PUBLIC_*` 中放 API key。

当前纵向切片使用 **public Agent + Agent ID**，语音会话由 SDK 通过 WebRTC 建立。生产环境若改为 private Agent，应增加服务端 Route Handler，使用服务端 `ELEVENLABS_API_KEY` 获取 conversation token（WebRTC）或 signed URL（WebSocket）；不得把 API key 暴露给浏览器。

## ElevenLabs Dashboard Checklist

为了让本地 Demo 真正工作，需要在 Dashboard 手工完成：

### 1. 创建并开放 Agent

- 在 ElevenLabs Dashboard 创建或选择一个 Agent。
- MVP 将 Agent 设为可通过 Agent ID 发起会话的 public Agent。
- 将 Agent ID 写入本地 `.env.local` 的 `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`。
- 不要把 ElevenLabs API key 写进任何 `NEXT_PUBLIC_*` 变量。

### 2. System Prompt

至少包含以下约束：

- `You are Zhenli's AI counterpart. You are not the real Zhenli.`
- 默认回答 2–4 句话，先直接回答，再提供一个可继续探索的方向。
- 依据 Knowledge Base 回答；没有记录时明确说不知道，不推测私人事实或实时决定。
- 中文问题自然使用中文，英文问题自然使用英文。
- 只有页面内容能明显帮助理解当前回答时才调用 `open_section`；不要因为提到某主题就调用。

### 3. First Message

在 Agent 的 First Message 设置中文开场：

> 你好，我是 Zhenli 的 AI 分身。你可以问我她做过的 AI 语音项目、语言学研究，或者最近在关注什么。

在 Dashboard 的英文语言配置中设置对应开场白：

> Hi, I'm Zhenli's AI counterpart. You can ask me about her work in voice AI, her linguistics research, or what she's currently exploring.

当前 Agent 的 Dashboard 配置禁止 client language override，因此代码不在 session initialization 中传入 `language`、`firstMessage`、`tts.voiceId` 或任何 Voice override，避免 ElevenLabs 以 `1008` 关闭连接。First Message、语言和 Voice 全部由 Dashboard 管理；页面不会自动开始会话。

### 4. Language 与 Voice

- 将中文（`zh`）配置为默认语言，并在 Additional Languages 添加 English（`en`）。
- 在 Agent 的 Tools 中添加系统工具 Detect language / Language detection；它不会默认启用。若需要整场对话都能切换语言，不要开启 Only at start of conversation。
- 选择能自然处理中英文和英文缩写的 Voice。
- 分别测试普通话、中英混合、`ASR`、`TTS`、`RAG`、`ElevenLabs` 等表达。
- 页面语言切换当前负责 UI 文案。Agent 回复语言依赖 Dashboard 多语言配置和用户实际输入；当前 Agent 禁止 client language override。

### 5. Client Tool：`open_section`

在 Agent → Tools 中添加 **Client Tool**：

- Name：`open_section`（大小写必须完全一致）
- Description：`Open a major section of Zhenli's website only when showing that section would materially help the visitor understand or explore the current answer. Do not call this tool merely because the answer mentions a related topic. Do not call it repeatedly when the section is already visible.`
- Parameter：`section`
- Type：String
- Required：Yes
- Allowed values：`about`, `product`, `technical`, `research`, `interests`, `projects`
- 建议打开 **Wait for response**，让 Agent 收到成功或失败结果。

前端会验证参数、查找稳定 section ID、执行 smooth scroll 并返回 JSON result。开发模式会输出：

```text
[VoiceAgentTool] open_section -> research
```

开发环境右下角还有折叠的 `DEV · open_section` 面板，可以不经过 Agent 单独测试页面动作；production build 不显示。

### 6. Conversation Flow

- 在 Advanced / Conversation Flow 中启用 interruption/barge-in。
- 将 interruption 加入需要发送给客户端的 events（Dashboard 名称可能随版本调整）。
- Turn eagerness 首先使用 Normal，再用中文停顿、`嗯……`、自我修正等 badcase 调整。
- 不要用 System Prompt 修复抢话或不接话；这些属于 Conversation Flow。

### 7. Client Events（实时字幕必须检查）

在 Agent 的 **Advanced → Client events** 中确认启用：

- `user_transcript`：用户 ASR final；
- `tentative_user_transcript`：用户 ASR partial；
- `agent_response`：Agent final answer；
- `agent_chat_response_part`：Agent streaming text。文字会话默认发送，**语音会话必须显式启用**；
- `agent_response_correction`：用户打断后，用截断后的文本修正记录；
- `interruption`：前端观察打断事件；
- `client_tool_call`：Client Tool 调用。

Dashboard 版本若没有单独的 Advanced 标签，请在 Agent 设置中搜索 **Client events**；底层字段是 `conversation_config.conversation.client_events`。保存后重新发布 Agent，并新建会话测试，旧会话不会热更新配置。

`onAudioAlignment` 已接入，用于探测字符级音频对齐事件；当前 WebRTC 音频由 LiveKit 直接播放，不能假设每次都会收到 alignment，因此字幕文本不依赖它才能工作。

### 8. 浏览器与安全要求

- 首次点击“开始对话”后浏览器才请求麦克风权限，同时显示等待提示；等待超过 30 秒会提示检查权限。等待期间可以取消，迟到的授权不会重新开启已取消的会话。
- 允许 localhost 的麦克风权限；部署后必须使用 HTTPS。
- 若权限被拒绝或设备不可用，页面会显示错误，并仍允许启动 text-only session。

## Current Conversation Architecture

- `ConversationProvider`：官方 SDK 生命周期与回调边界。
- `VoiceRuntimeProvider`：处理 final message、ASR partial、Agent streaming text、打断修正、alignment 探测和 transcript 去重。
- `useVoiceAgent()`：统一暴露连接状态、麦克风/扬声器/字幕控制、start/end、文字发送和用户可见错误。
- Voice CTA：请求麦克风后用 public Agent ID 建立 WebRTC session。
- Text fallback：已连接时调用同一 session 的 `sendUserMessage`；未连接时创建同一 Agent 的 text-only WebSocket session，连接后自动发送待处理消息。
- 通话 Dock：进入 session 后持续可见。闭麦使用 SDK `setMuted`，保持 session；扬声器使用 `setVolume`，不会调用 Agent tool。
- `listening` / `speaking` 来自 SDK mode；`thinking` 是收到用户 final 后到 Agent 首个 streaming/final event 之间的派生状态；`muted` 来自 SDK input state。
- 当前 Voice 完全继承 ElevenLabs Dashboard 的 Agent 配置，代码不传 `tts.voiceId` 或 voice override。音色入口只展示这一边界，不允许 Agent 自动切换。

## Transcript Event Sources

| 记录类型 | 来源 | 行为 |
| --- | --- | --- |
| User ASR partial | `onIncomingEvent` 中的 `tentative_user_transcript` | 同一活动 turn 覆盖更新，不重复追加 |
| User ASR final | `onMessage` / 文字发送 | 覆盖 partial 并固化 |
| Agent streaming | `onAgentChatResponsePart` | `start/delta/stop` 聚合为同一 turn |
| Agent final | `onMessage` | 用 final answer 固化 streaming turn |
| Interrupted correction | `onAgentResponseCorrection` | 用服务端修正文本替换被打断的回答 |
| UI action / error | 前端执行器 / SDK error callback | 作为 system event 进入记录层 |

当前字幕保留完整文本，长回复可以在字幕区域滚动阅读。流式追加时跟随最新内容，用户向上翻看时暂停跟随。底部字幕提供“完整记录”入口；展开记录后隐藏重复的底部字幕。

## Controlled UI Actions

浏览器动作全部使用 ElevenLabs **Client Tool**。前端仅接受版本 `1.0`、已知 action、该 action 对应的 target 白名单，以及可选 focus 白名单；任意 URL、DOM selector、未知属性或未知 target 都会被拒绝并记录原因。

| Client Tool | Action | 当前执行状态 |
| --- | --- | --- |
| `open_section` | `OPEN_SECTION` | 真实滚动：`about/product/technical/research/interests/projects` |
| `open_note` | `OPEN_NOTE` | 真实滚动到对应知识区域（首版） |
| `open_project` | `OPEN_PROJECT` | 真实滚动并短暂强调白名单项目 |
| `show_metric` | `SHOW_METRIC` | 安全 mock：只记录，不伪造指标 |
| `show_research_figure` | `SHOW_RESEARCH_FIGURE` | 安全 mock：等待审核后图表 |
| `highlight_source` | `HIGHLIGHT_SOURCE` | 安全 mock：等待公开来源组件 |
| `show_timeline` | `SHOW_TIMELINE` | 安全 mock：等待 timeline 组件 |
| `show_map` | `SHOW_MAP` | 安全 mock：等待 map 组件 |

只有在 Dashboard 创建且名称与前端完全一致的 Client Tool，Agent 才能主动调用它。每个工具建议使用一个必填 String 参数 `target`（`open_section` 为兼容现有配置继续使用 `section`），把该行对应白名单填入 Enum values，并启用 response；前端会把 `{ ok, action, target, status, reason? }` 的安全结果返回 Agent。

## Troubleshooting

- **提示 Agent ID 未配置**：检查 `.env.local`，填写后重启 `npm run dev`。
- **连接失败**：确认 Agent 为 public、Agent ID 正确、账户额度可用，并查看浏览器 Network/Console。
- **麦克风被拒绝**：在浏览器站点设置中重新允许，或直接使用文字模式。
- **有连接但没有声音**：检查 Dashboard Voice、系统输出设备、浏览器自动播放策略和音量。
- **`open_section` 不调用**：确认 Dashboard 工具类型、名称、参数名与 allowed values 完全一致，并确认 System Prompt 允许在合适情境调用。
- **工具调用了但页面不滚动**：开发环境用右下角 debug 面板验证 DOM action，再检查 console 的 `[VoiceAgentTool]` 日志。
- **语言不跟随切换**：确认 Dashboard 默认语言为中文、已添加英文，并启用 Language detection 系统工具；保存配置后结束旧 session 并重新开始。当前页面中 / EN 按钮只切换 UI，代码不发送语言 override。

## Privacy Boundary

Agent 是 Zhenli 的 AI counterpart，不是真人本人。当前内容是明确标记的结构占位数据，不包含真实业务指标或敏感个人信息。未来只有 `public: true` 且 `agent: true` 的策展内容才允许进入 Agent Knowledge Base；不会直接上传整个 Obsidian Vault。

更完整的产品和知识架构见 [docs/phase-1-architecture.md](docs/phase-1-architecture.md)。
