import type { Locale } from "@/lib/i18n/content";

type ContentSectionsProps = { locale: Locale };

const content = {
  zh: {
    product: {
      index: "02",
      title: "产品与技术",
      subtitle: "PRODUCT & TECHNOLOGY",
      intro: "从模型能力到真实的语音产品体验。",
      cards: ["Voice Agent 为什么 interruption 很重要？", "什么真正决定语音交互的体感延迟？", "模型能力如何转化为产品体验？"],
    },
    research: {
      index: "03",
      title: "学术研究",
      subtitle: "RESEARCH",
      intro: "从语音变化、方言地理到大脑中的声音处理。",
      cards: ["一个元音变化后，其他元音为什么也会移动？", "方言变化如何在地理空间传播？", "大脑如何发现不符合预期的语音？"],
    },
    interests: {
      index: "04",
      title: "兴趣",
      subtitle: "PERSONAL CURIOSITY",
      intro: "持续变化的阅读、聆听、旅行与学习地图。",
      cards: ["Recently Reading", "Recently Listening", "Things I’m Learning"],
    },
    projectsTitle: "Selected Projects",
    projectsIntro: "用于建立内容结构的占位项目；真实职责与结果将在验证后补充。",
  },
  en: {
    product: {
      index: "02",
      title: "Product & Technology",
      subtitle: "PRODUCT & TECHNOLOGY",
      intro: "Where model capability becomes a real voice product experience.",
      cards: ["Why does interruption matter?", "What actually shapes perceived latency?", "How does model capability become product experience?"],
    },
    research: {
      index: "03",
      title: "Research",
      subtitle: "RESEARCH",
      intro: "From sound change and dialect geography to speech processing in the brain.",
      cards: ["Why do other vowels move when one vowel changes?", "How does dialect change travel through space?", "How does the brain detect an unexpected sound?"],
    },
    interests: {
      index: "04",
      title: "Personal Curiosity",
      subtitle: "PERSONAL CURIOSITY",
      intro: "An evolving map of reading, listening, travel, and learning.",
      cards: ["Recently Reading", "Recently Listening", "Things I’m Learning"],
    },
    projectsTitle: "Selected Projects",
    projectsIntro: "Placeholder project structure only; responsibilities and results will be added after verification.",
  },
} as const;

const projectNames = ["TikTok / Dola Voice AI", "MIRA", "PaperPicker", "Personal Voice Twin", "Wu Chinese Research"];

export function ContentSections({ locale }: ContentSectionsProps) {
  const t = content[locale];
  return (
    <div className="content-worlds">
      {(["product", "research", "interests"] as const).map((id) => {
        const section = t[id];
        return (
          <section className="knowledge-section" id={id} key={id}>
            <div className="section-number">{section.index}</div>
            <div className="section-heading">
              <p>{section.subtitle}</p>
              <h2>{section.title}</h2>
              <span>{section.intro}</span>
            </div>
            <div className="editorial-cards">
              {section.cards.map((card, index) => (
                <article key={card}>
                  <span>0{index + 1}</span>
                  <h3>{card}</h3>
                  <p>{locale === "zh" ? "示例内容 · 待验证" : "Placeholder · pending verification"}</p>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <section className="projects-section" id="projects">
        <div className="section-number">05</div>
        <div className="projects-heading">
          <p>SELECTED WORK / STRUCTURED PLACEHOLDERS</p>
          <h2>{t.projectsTitle}</h2>
          <span>{t.projectsIntro}</span>
        </div>
        <div className="project-list">
          {projectNames.map((name, index) => (
            <article key={name}>
              <span>0{index + 1}</span>
              <h3>{name}</h3>
              <p>BACKGROUND · PROBLEM · DECISION · LEARNING</p>
              <b aria-hidden="true">↗</b>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <p>PERSONAL VOICE TWIN</p>
        <p>{locale === "zh" ? "AI 分身，不是真人本人。" : "An AI counterpart, not the real person."}</p>
        <a href="#about">↑ TOP</a>
      </footer>
    </div>
  );
}
