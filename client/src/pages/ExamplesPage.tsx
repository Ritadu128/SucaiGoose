import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

// ─── Goose Logo (small) ────────────────────────────────────────────────────
function GooseLogoSmall() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-label="素材鹅">
      <ellipse cx="14" cy="18" rx="7" ry="5.5" fill="#fff" stroke="#333" strokeWidth="1.4" />
      <path d="M 14 13 Q 16 10 14.5 7" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M 14 13 Q 16 10 14.5 7" stroke="#333" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <ellipse cx="14.5" cy="5.5" rx="3.5" ry="3" fill="#fff" stroke="#333" strokeWidth="1.4" />
      <circle cx="16" cy="4.5" r="0.8" fill="#333" />
      <path d="M 17.5 5.5 L 20.5 5.5 L 17.5 6.8" fill="#E8441A" stroke="#E8441A" strokeWidth="0.4" />
      <line x1="11" y1="23" x2="9" y2="26" stroke="#E8441A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="23" x2="19" y2="26" stroke="#E8441A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Example data ──────────────────────────────────────────────────────────
const EXAMPLES = [
  {
    id: "blue-stars",
    refImg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663370025872/5mKWtQvx6AWCKgfHBWaSbd/material-blue-stars_e339b32c.png",
    refAlt: "蓝色星星参考图",
    styleLabel: "深邃蓝调版画",
    tags: ["蓝调", "版画感", "星空", "手绘线条"],
    colors: [
      { name: "深蓝", hex: "#1a2d6e" },
      { name: "午夜蓝", hex: "#0d1b4b" },
      { name: "纯白", hex: "#f5f5f5" },
      { name: "星光银", hex: "#c8d4e8" },
    ],
    mood: "深邃的蓝调版画质感，带有手绘星空的诗意，适合文艺内容型公众号。",
    materials: [
      { bg: "#1a2d6e", label: "主标题框 1", h: 52, textColor: "rgba(255,255,255,0.45)" },
      { bg: "#0d1b4b", label: "主标题框 2", h: 52, textColor: "rgba(255,255,255,0.45)" },
    ],
  },
  {
    id: "manga",
    refImg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663370025872/5mKWtQvx6AWCKgfHBWaSbd/material-manga_27c66639.jpg",
    refAlt: "漫画格参考图",
    styleLabel: "日系漫画格",
    tags: ["漫画", "黑白", "网格", "手绘"],
    colors: [
      { name: "纯黑", hex: "#111111" },
      { name: "纯白", hex: "#f5f5f5" },
      { name: "网点灰", hex: "#888888" },
    ],
    mood: "干净的黑白漫画风格，网点质感浓郁，适合二次元或青年文化类公众号。",
    materials: [
      { bg: "#111111", label: "主标题框 1", h: 52, textColor: "rgba(255,255,255,0.45)" },
      { bg: "#333333", label: "主标题框 2", h: 52, textColor: "rgba(255,255,255,0.45)" },
    ],
  },
  {
    id: "film",
    refImg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663370025872/5mKWtQvx6AWCKgfHBWaSbd/material-film_6c814916.png",
    refAlt: "胶片纸参考图",
    styleLabel: "复古胶片质感",
    tags: ["复古", "胶片", "暖色调", "颗粒感"],
    colors: [
      { name: "焦糖棕", hex: "#8B5E3C" },
      { name: "奶油白", hex: "#F5EDD6" },
      { name: "暗红", hex: "#7A2B2B" },
    ],
    mood: "复古胶片的温暖颗粒感，带有岁月沉淀的质感，适合生活方式或旅行类公众号。",
    materials: [
      { bg: "#8B5E3C", label: "主标题框 1", h: 52, textColor: "rgba(255,255,255,0.45)" },
      { bg: "#7A2B2B", label: "主标题框 2", h: 52, textColor: "rgba(255,255,255,0.45)" },
    ],
  },
];

// ─── Example Card ──────────────────────────────────────────────────────────
function ExampleCard({ example, index }: { example: typeof EXAMPLES[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.07)",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      {/* Reference image */}
      <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", background: "#f5f5f5" }}>
        <img
          src={example.refImg}
          alt={example.refAlt}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          loading="lazy"
        />
        <div style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(8px)",
          borderRadius: "100px",
          padding: "4px 10px",
        }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
            参考图
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Style label */}
        <div>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontSize: "18px",
            fontWeight: 700,
            color: "#111",
            letterSpacing: "-0.02em",
            margin: "0 0 8px",
          }}>
            {example.styleLabel}
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {example.tags.map(tag => (
              <span key={tag} style={{
                fontFamily: "var(--font-sans)",
                fontSize: "10px",
                fontWeight: 600,
                background: "#111",
                color: "#fff",
                padding: "2px 8px",
                borderRadius: "100px",
                letterSpacing: "0.04em",
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: "8px" }}>
            主色调
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {example.colors.map(c => (
              <div key={c.hex} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: c.hex, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#666" }}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mood */}
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          color: "#888",
          fontStyle: "italic",
          lineHeight: 1.6,
          margin: 0,
          borderTop: "1px solid rgba(0,0,0,0.06)",
          paddingTop: "12px",
        }}>
          "{example.mood}"
        </p>

        {/* Material preview (simplified) */}
        <div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: "8px" }}>
            生成素材示意
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {example.materials.map((m, i) => (
              <div key={i} style={{
                width: "100%",
                height: m.h,
                background: m.bg,
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: m.textColor }}>
                  {m.label}
                </span>
              </div>
            ))}
            {/* Subtitle bars */}
            <div style={{ display: "flex", gap: "6px" }}>
              {[0, 1].map(i => (
                <div key={i} style={{
                  flex: 1, height: 32,
                  background: example.colors[i % example.colors.length]?.hex ?? "#eee",
                  borderRadius: "5px",
                  opacity: 0.35,
                }} />
              ))}
            </div>
            {/* Dividers */}
            <div style={{ width: "100%", height: 2, background: example.colors[0]?.hex ?? "#111", borderRadius: "1px", opacity: 0.5 }} />
            <div style={{ width: "60%", height: 2, background: example.colors[1]?.hex ?? "#888", borderRadius: "1px", opacity: 0.4 }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main ExamplesPage ─────────────────────────────────────────────────────
export default function ExamplesPage() {
  const [, navigate] = useLocation();

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      {/* ─── Top Nav ────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
        height: "56px",
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: "13px", color: "#666",
            padding: 0,
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#111")}
          onMouseLeave={e => (e.currentTarget.style.color = "#666")}
        >
          <ArrowLeft size={15} />
          返回首页
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <GooseLogoSmall />
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: "17px",
            fontWeight: 600,
            color: "#111",
            letterSpacing: "-0.02em",
          }}>
            素材鹅
          </span>
        </div>
        <button
          onClick={() => navigate("/generate")}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            fontWeight: 600,
            color: "#fff",
            background: "#111",
            border: "none",
            padding: "8px 18px",
            borderRadius: "100px",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#E8441A"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#111"; }}
        >
          开始生成
        </button>
      </nav>

      {/* ─── Main Content ────────────────────────────────────────────────── */}
      <section style={{ padding: "60px 24px 80px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: "56px" }}
          >
            <span style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#aaa",
              display: "block",
              marginBottom: "12px",
            }}>
              示例展示
            </span>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 700,
              color: "#111",
              letterSpacing: "-0.03em",
              margin: "0 0 16px",
              lineHeight: 1.1,
            }}>
              看看 AI 能做什么
            </h1>
            <p style={{
              fontFamily: "var(--font-sans)",
              fontSize: "15px",
              color: "#888",
              lineHeight: 1.7,
              margin: 0,
              maxWidth: "480px",
            }}>
              上传任意参考图，AI 自动提取风格，生成一套配套的公众号素材包。以下是几个真实示例。
            </p>
          </motion.div>

          {/* Examples grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
            marginBottom: "64px",
          }}>
            {EXAMPLES.map((ex, i) => (
              <ExampleCard key={ex.id} example={ex} index={i} />
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center" }}
          >
            <p style={{
              fontFamily: "var(--font-sans)",
              fontSize: "14px",
              color: "#888",
              marginBottom: "20px",
            }}>
              准备好了？上传你的参考图，立刻生成专属素材包。
            </p>
            <button
              onClick={() => navigate("/generate")}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "15px",
                fontWeight: 600,
                color: "#fff",
                background: "#111",
                border: "none",
                padding: "14px 32px",
                borderRadius: "100px",
                cursor: "pointer",
                boxShadow: "0 2px 0 rgba(0,0,0,0.14)",
                transition: "background 0.2s, transform 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#E8441A"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#111"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              立即上传参考图
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
