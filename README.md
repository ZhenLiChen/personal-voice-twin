# Personal Voice Twin

一个中文优先、支持英文切换的 conversational personal interface。Voice Agent 是主要交互入口，网站是工作、研究、项目与兴趣的视觉知识层。

当前版本是 Foundation + Voice Vertical Slice：自定义 Voice Hero 使用 ElevenLabs React SDK 连接真实 Agent，并支持麦克风会话、Agent 语音、真实 listening/speaking 状态、文字会话和 `open_section` 页面动作。

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

英文 language override 使用：

> Hi, I'm Zhenli's AI counterpart. You can ask me about her work in voice AI, her linguistics research, or what she's currently exploring.

当前 Agent 的 Dashboard 配置禁止 client language override，因此代码不在 session initialization 中传入 `language`、`firstMessage`、`tts.voiceId` 或任何 Voice override，避免 ElevenLabs 以 `1008` 关闭连接。First Message、语言和 Voice 全部由 Dashboard 管理；页面不会自动开始会话。

### 4. Language 与 Voice

- 将中文配置为主要支持语言，并添加 English。
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
- Allowed values：`about`, `product`, `research`, `interests`, `projects`
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

### 7. 浏览器与安全要求

- 首次点击“开始对话”后浏览器才请求麦克风权限。
- 允许 localhost 的麦克风权限；部署后必须使用 HTTPS。
- 若权限被拒绝或设备不可用，页面会显示错误，并仍允许启动 text-only session。

## Current Conversation Architecture

- `ConversationProvider`：官方 SDK 生命周期与回调边界。
- `useVoiceAgent()`：统一暴露连接状态、真实 speaking/listening、start/end、文字发送和用户可见错误。
- Voice CTA：请求麦克风后用 public Agent ID 建立 WebRTC session。
- Text fallback：已连接时调用同一 session 的 `sendUserMessage`；未连接时创建同一 Agent 的 text-only WebSocket session，连接后自动发送待处理消息。
- UI 不伪造 thinking。当前 Orb 只映射 SDK 可可靠提供的 idle、connecting、listening、speaking 和 error。

## Troubleshooting

- **提示 Agent ID 未配置**：检查 `.env.local`，填写后重启 `npm run dev`。
- **连接失败**：确认 Agent 为 public、Agent ID 正确、账户额度可用，并查看浏览器 Network/Console。
- **麦克风被拒绝**：在浏览器站点设置中重新允许，或直接使用文字模式。
- **有连接但没有声音**：检查 Dashboard Voice、系统输出设备、浏览器自动播放策略和音量。
- **`open_section` 不调用**：确认 Dashboard 工具类型、名称、参数名与 allowed values 完全一致，并确认 System Prompt 允许在合适情境调用。
- **工具调用了但页面不滚动**：开发环境用右下角 debug 面板验证 DOM action，再检查 console 的 `[VoiceAgentTool]` 日志。
- **语言不跟随切换**：确认 Dashboard 开启中文/英文及 client language/first-message overrides；结束旧 session 后重新开始。

## Privacy Boundary

Agent 是 Zhenli 的 AI counterpart，不是真人本人。当前内容是明确标记的结构占位数据，不包含真实业务指标或敏感个人信息。未来只有 `public: true` 且 `agent: true` 的策展内容才允许进入 Agent Knowledge Base；不会直接上传整个 Obsidian Vault。

更完整的产品和知识架构见 [docs/phase-1-architecture.md](docs/phase-1-architecture.md)。
