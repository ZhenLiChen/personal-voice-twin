# Personal Voice Twin：第一阶段产品与技术架构

> 状态：实施前基线方案  
> 日期：2026-09-22  
> 范围：产品架构、信息架构、Voice Agent 集成、知识管线与 MVP 实施顺序；本阶段不展开页面实现。

## 1. 需求理解

Personal Voice Twin 不是“作品集附带聊天机器人”，而是一个以实时语音对话为入口、以网页内容为可视证据、以受控个人知识为事实边界的 conversational personal interface。

三个系统各司其职：

- **Obsidian**：长期知识源，但默认私密；只有明确授权的内容进入发布管线。
- **ElevenLabs**：实时 Voice Agent 与 MVP 阶段的 RAG serving layer。
- **Website**：对话界面、视觉反馈、内容浏览和 Agent 驱动的页面动作层。

核心产品循环是：用户主动开始会话 → 提问或点击推荐问题 → AI counterpart 简短回答 → 必要时调用页面动作展示证据 → 用户继续用语音、文字或滚动探索。

Agent 始终以“Zhenli 的 AI counterpart”出现，不冒充本人。回答只依据已策展知识；对于实时态度、私人决定或没有记录的事实，明确说明没有找到记录。

## 2. Product Architecture

```text
Visitor
  ├─ voice / typed question / starter
  ▼
Conversation Experience
  ├─ permission + session lifecycle
  ├─ transcript + status + recovery
  ├─ Voice Orb driven by real SDK signals
  └─ locale-aware controls
  ▼
ElevenLabs Agent
  ├─ ASR / turn-taking / LLM / TTS
  ├─ system prompt + first message + languages
  ├─ ElevenLabs Knowledge Base (MVP RAG)
  └─ client tool call: open_section
  ▼
Visual Knowledge Layer
  ├─ About
  ├─ Product & Technology
  ├─ Research
  ├─ Personal Curiosity
  └─ Selected Projects

Obsidian curated notes
  └─ normalize once
      ├─ website content adapter
      └─ provider-neutral knowledge sync adapter
          └─ ElevenLabs KB adapter (MVP)
```

关键边界：页面即使没有 Agent ID、没有麦克风权限或 ElevenLabs 暂时不可用，也必须仍可浏览全部公开内容。Voice 是最高视觉优先级，但不是内容访问门槛。

## 3. Information Architecture

### 全局层

- 顶部：姓名 / 简洁导航 / `中 · EN`
- Hero Voice Stage：身份、Voice Orb、启动/停止、状态、轻量文字入口、推荐问题
- Transcript Peek：只展示最近对话，不扩张为大型聊天窗口
- Knowledge Worlds：三个主题世界
- Selected Projects：结构化项目入口
- About / Boundary：身份说明与知识边界
- Footer：隐私、技术说明、联系入口（后续填充真实内容）

### Knowledge Worlds

1. **产品与技术 / Product & Technology**
   - Product Thinking
   - Technical Notes
   - Selected Projects
   - Short Essays
2. **学术研究 / Research**
   - 方言与语音学
   - 语言演化与变异
   - 神经语言学与心理语言学
   - 内容以研究问题组织，展开后再呈现背景、方法、材料、假设与当前发现
3. **兴趣 / Personal Curiosity**
   - Recently Reading
   - Recently Listening
   - Places I’ve Been
   - Things I’m Learning
   - Current Obsessions

### Project detail

统一采用：Background → Problem → My Role → Decision → Implementation → Result → What I Learned。没有证据的 Result 显示“待补充”，不生成虚构指标。

## 4. 首页 Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ 陈贞里                                      产品 研究 兴趣 中/EN │
│                                                              │
│      AI Voice PM × Linguistics Researcher                    │
│                                                              │
│                    ┌──────────────┐                          │
│                    │              │                          │
│                    │  VOICE ORB   │  ← real state/amplitude  │
│                    │              │                          │
│                    └──────────────┘                          │
│                                                              │
│                   和我的 AI 分身聊聊                           │
│          基于我的工作、研究与兴趣构建的 AI counterpart。         │
│                                                              │
│               [ 开始对话 ]   也可以输入问题…                    │
│                    idle · 需要麦克风时再申请                     │
│                                                              │
│   [为什么从语言学转向 AI？] [你的吴语研究是什么？] [更多问题 ↗]    │
│                                                              │
│                         ↓ 探索内容                             │
├──────────────────────────────────────────────────────────────┤
│ 产品与技术                学术研究                Personal Curiosity │
│ editorial card cluster    question-led cards     curiosity map │
├──────────────────────────────────────────────────────────────┤
│ Selected Projects — horizontally composed editorial index    │
└──────────────────────────────────────────────────────────────┘
```

移动端将 Hero 变为单列，Orb 保持首屏中心；starter 使用横向滚动 chips；输入框默认折叠；会话控制固定在安全区上方，但不遮挡内容。

## 5. Component Tree

```text
RootLayout
├─ LocaleProvider
├─ ConversationProvider
└─ HomePage
   ├─ SiteHeader
   │  ├─ IdentityMark
   │  ├─ SectionNav
   │  └─ LocaleSwitch
   ├─ VoiceHero
   │  ├─ VoiceIdentity
   │  ├─ VoiceOrb
   │  ├─ SessionControls
   │  ├─ VoiceStatus
   │  ├─ TranscriptPeek
   │  ├─ TextFallback
   │  └─ ConversationStarters
   ├─ KnowledgeWorlds
   │  ├─ ProductSection
   │  ├─ ResearchSection
   │  └─ InterestsSection
   ├─ ProjectsSection
   │  └─ ProjectCard[]
   ├─ AboutSection
   └─ SiteFooter

ConversationController (headless client boundary)
├─ SDK state mapping
├─ locale overrides
├─ retry/error normalization
├─ transcript model
└─ client tool registration
```

内容组件不直接依赖 ElevenLabs；ConversationController 不直接拥有页面文案；provider adapter 不进入通用 domain types。

## 6. Voice Conversation Flow

```text
idle
  └─ user clicks Start
      ├─ explain/request microphone permission
      ├─ denied → error with retry + text-only path
      └─ granted → connecting
          ├─ failed → recoverable error / reconnect
          └─ connected → Agent first message → speaking
              └─ listening
                  ├─ user speech → ASR partial/final → thinking
                  ├─ typed question → sendUserMessage → thinking
                  ├─ starter → sendUserMessage → thinking
                  └─ stop → disconnected/idle
                      thinking
                      ├─ answer stream → speaking
                      ├─ open_section tool → page scroll + result
                      └─ failure → error + retry/end
                          speaking
                          ├─ completed → listening
                          └─ user barge-in → interrupted → listening/thinking
```

UI 状态映射：

- `idle`：SDK disconnected，且无待处理错误。
- `listening` / `speaking`：直接使用 SDK mode。
- `thinking`：用户 final message 已产生、Agent 尚未进入 speaking；由事件序列派生，不伪造 Agent 状态。
- `interrupted`：收到 interruption 事件时短暂显示，然后交还 listening/thinking。
- `error`：权限、网络、认证、设备或 SDK 错误被规范化后显示。

Orb 使用 `getInputByteFrequencyData` / `getOutputByteFrequencyData`、VAD score 或真实音频回调。数据不可用时只显示与状态对应的克制 breathing animation，不生成假音频波形。

## 7. ElevenLabs Integration Plan

截至本文日期，官方 React 集成推荐 `@elevenlabs/react`，并提供 `ConversationProvider`、`useConversationControls`、`useConversationStatus`、`useConversationMode`、`useConversationInput` 与 `useConversationClientTool`。语音默认使用 WebRTC，文本会话默认使用 WebSocket；`sendUserMessage` 可在会话内触发真正的用户文字轮次。

实施选择：

- 使用官方 React SDK，不使用通用嵌入 Widget，以便构建核心化的自定义体验。
- 公共 Agent MVP 可直接用 `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`。
- 上线建议切换私有 Agent：服务端 Route Handler 使用 `ELEVENLABS_API_KEY` 获取 signed URL；key 永不进入客户端。
- 用户点击 Start 后才请求麦克风和开始 session，因此不会自动播放 First Message。
- locale 变化时对新 session 传入 `agent.language` 与对应 `firstMessage` override；活动会话中切换语言需明确采用“结束并重启会话”或允许 Agent 自动跟随用户语言，MVP 选后者并在下一会话固定新 locale。
- 开启并监听 message、status、mode、error、VAD、interruption 等事件；保留 debug event 的开发模式日志。
- 重连采用显式按钮和有限次数退避，不静默无限重试。
- 如果未设置 Agent ID，Voice Hero 显示配置提示，页面内容与文字浏览仍正常；不模拟连接。

官方参考：

- [React SDK](https://elevenlabs.io/docs/eleven-agents/libraries/react)
- [Next.js quickstart](https://elevenlabs.io/docs/eleven-agents/guides/quickstarts/next-js)
- [Conversation flow](https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow)
- [Client tools](https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools)
- [Knowledge Base document management](https://elevenlabs.io/docs/eleven-agents/customization/knowledge-base/manage-documents)

## 8. Agent → UI Action Schema

### MVP tool

```json
{
  "name": "open_section",
  "description": "Open a major section of Zhenli's website only when showing that section would materially help the visitor understand or explore the current answer. Do not call this tool merely because the answer mentions a related topic. Do not call it repeatedly when the section is already visible.",
  "parameters": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "section": {
        "type": "string",
        "enum": ["product", "research", "interests", "projects", "about"],
        "description": "The website section to reveal and scroll into view."
      }
    },
    "required": ["section"]
  }
}
```

前端 handler：

1. 用共享 schema 校验输入。
2. 查询稳定 DOM id：`section-product` 等。
3. 找到后使用 reduced-motion-aware smooth scroll，并把目标短暂标记为 active context。
4. 返回 `{ ok: true, section }`；若已经可见，返回 `{ ok: true, section, alreadyVisible: true }`。
5. 参数非法或 DOM 缺失时不抛出未处理异常，返回 `{ ok: false, code, message }` 并记录开发日志。

Dashboard 中 Tool Type 必须为 Client；工具名、参数标识和大小写必须与前端完全一致。建议启用 **Wait for response**，让失败结果进入对话上下文。后续工具沿用 discriminated schema registry：`open_project`、`open_note`、`show_metric`、`show_research_figure`、`show_map`、`show_timeline`、`play_demo`。

## 9. Knowledge Architecture

统一内容域模型是系统的核心，而不是 ElevenLabs 文档 ID：

```text
CuratedSourceDocument
  sourceId       stable, provider-neutral ID
  sourcePath     relative path only
  title
  locale         zh | en | bilingual
  category
  public
  agent
  updated
  contentHash
  normalizedBody
  websiteFields
  agentFields
```

- Website adapter 读取 `public: true` 的展示内容。
- Agent sync adapter 只读取 `public: true AND agent: true`。
- provider manifest 单独保存 `sourceId ↔ providerDocumentId ↔ contentHash ↔ syncedAt ↔ status`。
- 前端永远不读取 manifest、Vault 路径或 KB credential。
- 原始私有笔记不会复制进项目 fixtures、构建产物或错误日志。

三种方案的完整比较将在实施阶段写入 `docs/knowledge-architecture.md`；当前结论是 Option B 最适合 MVP，Option C 是未来可替换的 serving adapter，而不是现在的依赖。

## 10. Obsidian Sync Architecture

```text
Explicit input roots / allowlist
  → discover .md only
  → parse frontmatter
  → deny by default
  → require public:true && agent:true for Agent branch
  → normalize title + body
  → resolve/convert wikilinks against allowed set
  → classify attachment references
  → reject unsupported/private/broken references
  → remove empty documents
  → compute stable sourceId + content hash
  → detect duplicate canonical content
  → produce dry-run plan
  → provider adapter create/update/detach+delete
  → write local sync manifest and report
```

同步策略：

- **新增**：create 后记录 provider ID。
- **更新**：hash 变化时 update content/name；等待/检查 indexing 状态。
- **删除**：默认只在 `--apply --prune` 时执行。ElevenLabs 文档若被 Agent 依赖，先从 Agent/文件夹解除依赖，再删除；默认不 force delete。
- **重复**：优先依据稳定 `sourceId`，其次 normalized-content hash；冲突进入报告而不是自动覆盖。
- **wikilink**：`[[Note|Label]]` 转为普通可读文本；只允许链接到策展集合内文档。嵌入、块引用、Dataview/Canvas 等不支持语法给出 warning 或 reject。
- **附件**：MVP 不上传二进制附件；保留可读说明，敏感/未发布附件链接剔除并报告。
- **状态**：每次生成 `created/updated/unchanged/skipped/failed/stale` 汇总。
- **安全**：默认 dry-run；Vault 路径由本地环境变量或 CLI 参数传入，不进入仓库；日志不输出完整私密内容。

建议 frontmatter：

```yaml
---
id: product-voice-agent-thinking
agent: true
public: true
category: product
locale: zh
title: Voice Agent 产品思考
updated: 2026-09-22
---
```

`agent` 或 `public` 缺失、类型错误或不为 `true` 时一律不上传。

## 11. Folder Structure

```text
personal-voice-twin/
├─ AGENTS.md
├─ README.md
├─ .env.example
├─ app/
│  ├─ api/elevenlabs/signed-url/route.ts
│  ├─ [locale]/...
│  └─ globals.css
├─ components/
│  ├─ voice/
│  ├─ sections/
│  └─ ui/
├─ lib/
│  ├─ content/
│  ├─ conversation/
│  ├─ i18n/
│  └─ tools/
├─ content/                 # curated project-local Markdown/MDX
│  ├─ profile/
│  ├─ product/
│  ├─ projects/
│  ├─ research/
│  ├─ interests/
│  └─ faq/
├─ knowledge/
│  ├─ schemas/
│  └─ fixtures/             # non-sensitive pipeline test fixtures only
├─ scripts/
│  └─ sync-knowledge/
│     ├─ adapters/
│     ├─ normalize/
│     └─ tests/
├─ docs/
│  ├─ phase-1-architecture.md
│  ├─ knowledge-architecture.md
│  └─ elevenlabs-agent-debugging.md
└─ public/
```

项目内 `content/` 可以是经策展后的导出目录或用于网站的相邻公开内容，不等于 Obsidian Vault。未来可将同步输入改为外部 Vault allowlist，而无需改变渲染与 provider adapter。

## 12. MVP Implementation Sequence

每个阶段完成后运行 lint、typecheck、build，并修复问题。

1. **Foundation**：初始化 Next.js/TypeScript/Tailwind、质量脚本、环境变量示例、i18n 骨架。
2. **Content domain**：schema、无敏感信息的结构化 mock、Markdown/MDX loader、中文/英文内容策略。
3. **Visual shell**：Hero、三大 Knowledge World、Projects、About、响应式与 reduced motion。
4. **Conversation core**：SDK provider、权限、start/stop、真实状态、transcript、错误恢复、文字 fallback。
5. **Voice visual system**：以 SDK mode/VAD/frequency data 驱动 Orb；无信号时仅做状态动画。
6. **Agent actions**：`open_section` schema、handler、Dashboard 配置说明、单元/浏览器测试。
7. **Knowledge pipeline**：frontmatter parser、filter、normalize、manifest、dry-run、ElevenLabs adapter、更新/删除策略测试。
8. **Agent configuration & content**：system prompt、双语 first message、KB 附加、真实策展内容导入。
9. **Debug/evaluation**：中文调试指南、30+ 测试集、badcase taxonomy、上线 checklist。
10. **Hardening**：移动端、浏览器兼容、性能、无障碍、secret audit、生产 build/deploy 文档。

## 13. 必须在 ElevenLabs Dashboard 配置

- 创建 Agent，并决定 public Agent 或需要 signed URL 的 private Agent。
- System Prompt 与身份/事实边界。
- 中文和英文 First Message；它只会在用户主动开始 session 后播放。
- Voice、TTS 表现与发音词典（如需要）。
- Languages、主语言及语言覆盖。
- ASR/语言相关设置。
- Knowledge Base 文档/文件夹关联与 RAG 开关。
- Client Tool `open_section` 的名称、描述、参数 enum、required、Wait for response。
- Conversation Flow：turn eagerness、silence timeout、soft timeout。
- Client Events：启用 interruption，才能获得预期的 barge-in 行为。
- 最大会话时长、数据区域及 Agent 权限策略。

这些能力不能通过前端动画“补出来”。尤其 interruption、turn-taking、Voice/TTS、RAG attachment 和 Agent prompt 必须在真实 Agent 中配置并测试。

## 14. 应通过代码实现

- 中/英 UI、内容与 starter；locale 状态和 session overrides。
- 用户主动触发 session、麦克风许可说明、start/stop/mute/retry。
- SDK 状态到视觉状态的映射、真实振幅与 reduced-motion fallback。
- typed question 和 starter 的 `sendUserMessage`。
- transcript 展示、错误分类与恢复入口。
- `open_section` 注册、输入校验、滚动、tool result 和错误日志。
- 私有 Agent 的服务端 signed URL endpoint；API key 只在服务端。
- Markdown/MDX 内容读取、schema 校验、知识同步脚本与 manifest。
- 响应式、无障碍、debug logging、evaluation harness。

## 15. Mock Data 边界

MVP 可 mock：

- 三大 Knowledge World 的卡片结构和示例主题。
- 项目页面的字段结构。
- Recently Reading / Listening / Learning 的展示形态。
- 研究图表的占位框与“待补充已验证材料”状态。

不可 mock 为事实：

- TikTok / Dola、MIRA、PaperPicker 等项目的业务结果、指标、用户规模与具体职责。
- 论文结论、实验结果、研究图表数据。
- 就业状态、offer、relocation、行程、私人意见或未来选择。
- Agent 已连接、正在听、正在说、已检索等运行状态。

所有 placeholder 需在数据层带 `status: "placeholder"` 或 `verified: false`，发布前可审计。

## 16. 未来升级 Custom RAG 的迁移路径

1. 保持 `CuratedSourceDocument` 和 normalization pipeline 不变。
2. 将 ElevenLabs 文档 ID 限制在 provider manifest，不写入内容文件或 UI。
3. 定义 `KnowledgePublisher` 接口：`plan/create/update/delete/status`。
4. 新增 Supabase/Postgres + pgvector publisher 与 embedding job。
5. 暴露最小化 server-side retrieval API / webhook tool，返回答案所需片段和来源标识。
6. 在 ElevenLabs 中将内置 KB retrieval 替换或并行为 webhook/MCP knowledge tool。
7. 先 shadow evaluation：同一测试集比较召回率、groundedness、延迟和成本。
8. 达标后迁移流量，再解除旧 KB 依赖并清理文档。

迁移时网页渲染、frontmatter 策略、内容 ID、隐私过滤、evaluation set 和 Agent UI 均无需重写。这样 ElevenLabs 是 MVP 的 serving adapter，而不是内容模型本身。

## 当前无 blocking issue

可以按上述顺序进入初始化与 Foundation 阶段。真正接通 Voice Agent 前需要用户在 ElevenLabs Dashboard 创建 Agent，并提供非敏感 Agent ID；若选择 private Agent，还需由用户在本地环境中放置 API key。代码和文档会在对应阶段明确提示，不会写入真实 secret。
