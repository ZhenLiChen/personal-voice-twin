import type { Locale } from "@/lib/i18n/content";

type ContentSectionsProps = { locale: Locale };
type Card = { title: string; summary: string; source: string };
type Section = { index: string; title: string; subtitle: string; intro: string; cards: Card[] };
type SectionId = "product" | "technical" | "research" | "interests";

const zh: Record<SectionId, Section> = {
  product: {
    index: "02", title: "产品思考", subtitle: "PRODUCT THINKING",
    intro: "关心的不只是模型能做什么，而是能力如何成为可感知、可依赖的体验。",
    cards: [
      { title: "为什么 interruption 是语音产品的核心能力？", summary: "打断不是附加功能，而是轮次控制、信任感与实时性的交汇点。", source: "思考主题 · 待展开" },
      { title: "什么时候 Agent 才是真需求？", summary: "先判断任务是否需要持续理解、决策与行动，而不是把每个入口都改成对话框。", source: "思考主题 · 待展开" },
      { title: "模型能力如何转化为产品体验？", summary: "准确率只是起点；恢复能力、反馈速度和边界表达共同决定用户感受。", source: "思考主题 · 待展开" },
    ],
  },
  technical: {
    index: "03", title: "技术思考", subtitle: "TECHNICAL NOTES",
    intro: "把语音系统拆开来看：信号、识别、推理、合成，以及它们之间的时间关系。",
    cards: [
      { title: "体感延迟不是一个 API 耗时", summary: "端到端体验还包含端点检测、首 token、首音频、播放缓冲与打断响应。", source: "VOICE SYSTEMS" },
      { title: "语音感知不只是一组声学特征", summary: "声学、发音动作、听觉与神经表征可以并存，解释同一段语音的不同层次。", source: "Obsidian · 24 Experimental Phonetics" },
      { title: "ASR 时间戳应该精确到什么程度？", summary: "字幕对齐、检索定位与可编辑转写需要不同的精度口径。", source: "TECHNICAL NOTE · 待展开" },
    ],
  },
  research: {
    index: "04", title: "学术研究", subtitle: "RESEARCH",
    intro: "从吴语元音链、方言扩散到大脑如何发现声音规律。",
    cards: [
      { title: "吴语太湖片的元音链如何重组？", summary: "研究把 S0–S5 链位、声母条件与地理分布放在同一框架中。当前分析显示，裂化主要集中在 S2，其次是 S3；S3 还可能存在局部降低支线。", source: "WUYU VOWEL CHAIN · 分析整理" },
      { title: "方言变化如何穿过词汇、人群与空间？", summary: "词汇扩散、人群传播和地理扩散，提供了观察共时变异如何成为历时变化的三种尺度。", source: "Obsidian · 24 Chinese Dialectology" },
      { title: "大脑如何发现一个意外的声音？", summary: "MMN 通过标准刺激与偏差刺激的差异波，观察听觉系统对规律破坏的自动检测；它不等同于原始 ERP 波形。", source: "Obsidian · 25 Neuroimage / MMN" },
      { title: "人如何从连续输入里学到语言结构？", summary: "统计学习关注频率、共现和转移概率：学习者未必能说出规则，却会逐渐对边界与分布结构变得敏感。", source: "Obsidian · 25 Neurolinguistics" },
    ],
  },
  interests: {
    index: "05", title: "兴趣", subtitle: "PERSONAL CURIOSITY",
    intro: "持续变化的阅读、聆听、旅行与学习地图。",
    cards: [
      { title: "Recently Reading", summary: "文学、语言与技术之间不断移动的阅读路径。", source: "待本人更新" },
      { title: "Recently Listening", summary: "音乐与声音如何塑造空间、情绪和记忆。", source: "待本人更新" },
      { title: "Things I’m Learning", summary: "正在学习的工具、方法，以及尚未想明白的问题。", source: "待本人更新" },
    ],
  },
};

const en: Record<SectionId, Section> = {
  product: { index: "02", title: "Product Thinking", subtitle: "PRODUCT THINKING", intro: "How capability becomes an experience people can feel and trust.", cards: [
    { title: "Why is interruption central to voice products?", summary: "Barge-in sits at the intersection of turn control, trust, and real-time response.", source: "TOPIC · TO EXPAND" },
    { title: "When is an agent actually necessary?", summary: "Start with whether a task needs sustained understanding, decisions, and actions.", source: "TOPIC · TO EXPAND" },
    { title: "How does capability become experience?", summary: "Accuracy is only a start; recovery, feedback speed, and boundaries shape the experience.", source: "TOPIC · TO EXPAND" },
  ] },
  technical: { index: "03", title: "Technical Thinking", subtitle: "TECHNICAL NOTES", intro: "Signals, recognition, reasoning, synthesis, and the timing between them.", cards: [
    { title: "Perceived latency is not one API metric", summary: "Endpointing, first token, first audio, buffering, and interruption all contribute.", source: "VOICE SYSTEMS" },
    { title: "Speech perception is more than acoustics", summary: "Acoustic, articulatory, auditory, and neural representations can coexist.", source: "OBSIDIAN · PHONETICS" },
    { title: "How precise should ASR timestamps be?", summary: "Captioning, retrieval, and editable transcripts require different definitions of precision.", source: "TECHNICAL NOTE" },
  ] },
  research: { index: "04", title: "Research", subtitle: "RESEARCH", intro: "From Wu vowel chains and dialect diffusion to how the brain detects sound patterns.", cards: [
    { title: "How do Taihu Wu vowel chains reorganize?", summary: "The analysis connects chain positions, onset conditions, and geography. Current results place most splitting at S2, followed by S3.", source: "WUYU VOWEL CHAIN · SYNTHESIS" },
    { title: "How does change travel through words, people, and space?", summary: "Lexical, social, and geographic diffusion offer three scales for observing change in progress.", source: "OBSIDIAN · DIALECTOLOGY" },
    { title: "How does the brain detect an unexpected sound?", summary: "MMN uses a deviant-minus-standard difference wave to study automatic detection of broken auditory regularities.", source: "OBSIDIAN · MMN" },
    { title: "How is structure learned from continuous input?", summary: "Statistical learning tracks frequency, co-occurrence, and transition probabilities without explicit rules.", source: "OBSIDIAN · NEUROLINGUISTICS" },
  ] },
  interests: { index: "05", title: "Personal Curiosity", subtitle: "PERSONAL CURIOSITY", intro: "An evolving map of reading, listening, travel, and learning.", cards: [
    { title: "Recently Reading", summary: "Reading paths across literature, language, and technology.", source: "TO UPDATE" },
    { title: "Recently Listening", summary: "How music and sound shape space, emotion, and memory.", source: "TO UPDATE" },
    { title: "Things I’m Learning", summary: "Tools, methods, and questions still in progress.", source: "TO UPDATE" },
  ] },
};

const projects = [
  { id: "dola", name: "TikTok / Dola Voice AI" }, { id: "mira", name: "MIRA" },
  { id: "paperpicker", name: "PaperPicker" }, { id: "personal-voice-twin", name: "Personal Voice Twin" },
  { id: "wu-chinese-research", name: "Wu Chinese Research" },
] as const;

export function ContentSections({ locale }: ContentSectionsProps) {
  const content = locale === "zh" ? zh : en;
  return <div className="content-worlds">
    {(["product", "technical", "research", "interests"] as const).map((id) => {
      const section = content[id];
      return <section className="knowledge-section" id={id} key={id}>
        <div className="section-number">{section.index}</div>
        <div className="section-heading"><p>{section.subtitle}</p><h2>{section.title}</h2><span>{section.intro}</span></div>
        <div className="editorial-cards">{section.cards.map((card, index) => <article key={card.title}>
          <span>0{index + 1}</span><div><h3>{card.title}</h3><p className="card-summary">{card.summary}</p></div><p className="card-source">{card.source}</p>
        </article>)}</div>
      </section>;
    })}
    <section className="projects-section" id="projects"><div className="section-number">06</div><div className="projects-heading"><p>SELECTED WORK</p><h2>Selected Projects</h2><span>{locale === "zh" ? "真实职责与结果将在审核后补充。" : "Responsibilities and outcomes will be added after review."}</span></div>
      <div className="project-list">{projects.map((project, index) => <article key={project.id} data-project-id={project.id}><span>0{index + 1}</span><h3>{project.name}</h3><p>BACKGROUND · PROBLEM · DECISION · LEARNING</p><b aria-hidden="true">↗</b></article>)}</div>
    </section>
    <footer className="site-footer"><p>PERSONAL VOICE TWIN</p><p>{locale === "zh" ? "AI 分身，不是真人本人。" : "An AI counterpart, not the real person."}</p><a href="#about">↑ TOP</a></footer>
  </div>;
}
