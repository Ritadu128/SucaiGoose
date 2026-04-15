import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, Download, ArrowRight } from "lucide-react";
import WorkArea from "./WorkArea";

// ─── Constants ─────────────────────────────────────────────────────────────

const GOOSE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663370025872/5mKWtQvx6AWCKgfHBWaSbd/goose-hero_a2db9d0e.png";

// Mock draggable material cards for the hero section
const HERO_CARDS: CardDef[] = [
  {
    id: "c1",
    label: "主标题框",
    bg: "#111",
    fg: "#fff",
    rotate: -8,
    x: -280,
    y: 20,
    w: 200,
    h: 64,
    type: "title",
  },
  {
    id: "c2",
    label: "小标题框",
    bg: "#F5C842",
    fg: "#111",
    rotate: 4,
    x: -80,
    y: -10,
    w: 180,
    h: 52,
    type: "subtitle",
  },
  {
    id: "c3",
    label: "提示框",
    bg: "#E8441A",
    fg: "#fff",
    rotate: -3,
    x: 100,
    y: 30,
    w: 160,
    h: 80,
    type: "tip",
  },
  {
    id: "c4",
    label: "分割线",
    bg: "#fff",
    fg: "#111",
    rotate: 6,
    x: 260,
    y: -15,
    w: 140,
    h: 44,
    type: "divider",
    border: "#111",
  },
  {
    id: "c5",
    label: "装饰元素",
    bg: "#B5D5F5",
    fg: "#111",
    rotate: -5,
    x: -180,
    y: 90,
    w: 90,
    h: 90,
    type: "decoration",
    round: true,
  },
  {
    id: "c6",
    label: "装饰元素",
    bg: "#C8F0C0",
    fg: "#111",
    rotate: 9,
    x: 380,
    y: 50,
    w: 80,
    h: 80,
    type: "decoration",
    round: true,
  },
];

// ─── Draggable Card ─────────────────────────────────────────────────────────

interface CardDef {
  id: string;
  label: string;
  bg: string;
  fg: string;
  rotate: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  border?: string | undefined;
  round?: boolean | undefined;
}

function DraggableCard({ card, zIndex, onDragStart }: {
  card: CardDef;
  zIndex: number;
  onDragStart: (id: string) => void;
}) {
  const x = useMotionValue(card.x);
  const y = useMotionValue(card.y);
  const springX = useSpring(x, { stiffness: 200, damping: 22 });
  const springY = useSpring(y, { stiffness: 200, damping: 22 });

  // Tilt based on drag velocity
  const rotate = useTransform(
    [springX, springY],
    ([latestX, latestY]) => {
      const dx = (latestX as number) - card.x;
      const dy = (latestY as number) - card.y;
      return card.rotate + dx * 0.015 + dy * 0.008;
    }
  );

  const isRound = !!card.round;
  const borderRadius = isRound ? "50%" : card.type === "divider" ? "4px" : "10px";

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.08}
      style={{
        x: springX,
        y: springY,
        rotate,
        zIndex,
        position: "absolute",
        width: card.w,
        height: card.h,
        background: card.bg,
        color: card.fg,
        borderRadius,
        border: card.border ? `2px solid ${card.border}` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "3px 6px 0px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
        cursor: "grab",
        userSelect: "none",
        touchAction: "none",
        willChange: "transform",
      }}
      whileDrag={{
        scale: 1.06,
        boxShadow: "6px 12px 0px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.08)",
        cursor: "grabbing",
        zIndex: 999,
      }}
      whileHover={{ scale: 1.03 }}
      onDragStart={() => onDragStart(card.id)}
      initial={{ opacity: 0, scale: 0.7, rotate: card.rotate - 10 }}
      animate={{ opacity: 1, scale: 1, rotate: card.rotate }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: HERO_CARDS.indexOf(card) * 0.08 }}
    >
      {!isRound && card.type !== "divider" && (
        <span style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          fontFamily: "var(--font-sans)",
          opacity: 0.7,
          padding: "0 12px",
          textAlign: "center",
        }}>
          {card.label}
        </span>
      )}
      {card.type === "divider" && (
        <div style={{ width: "80%", height: "2px", background: card.fg, opacity: 0.6, borderRadius: "1px" }} />
      )}
    </motion.div>
  );
}

// ─── Cards Stage ────────────────────────────────────────────────────────────

function CardsStage() {
  const [topCard, setTopCard] = useState<string | null>(null);

  const getZIndex = (id: string) => {
    if (id === topCard) return 50;
    return HERO_CARDS.findIndex(c => c.id === id) + 10;
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
      }}
    >
      {HERO_CARDS.map((card) => (
        <DraggableCard
          key={card.id}
          card={card}
          zIndex={getZIndex(card.id)}
          onDragStart={setTopCard}
        />
      ))}
    </div>
  );
}

// ─── Nav ────────────────────────────────────────────────────────────────────

function Nav({ onScrollToWork, onScrollToExample }: {
  onScrollToWork: () => void;
  onScrollToExample: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
        height: "56px",
        background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.08)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <GooseLogoSmall />
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: "18px",
          fontWeight: 600,
          color: "#111",
          letterSpacing: "-0.02em",
        }}>
          素材鹅
        </span>
      </div>

      {/* Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <button
          onClick={onScrollToExample}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            fontWeight: 500,
            color: "#555",
            background: "none",
            border: "none",
            padding: 0,
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#111")}
          onMouseLeave={e => (e.currentTarget.style.color = "#555")}
        >
          示例
        </button>
        <button
          onClick={onScrollToWork}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            fontWeight: 600,
            color: "#fff",
            background: "#111",
            border: "none",
            padding: "8px 20px",
            borderRadius: "100px",
            transition: "background 0.2s, transform 0.15s",
          }}
      onMouseEnter={e => { e.currentTarget.style.background = "#E8441A"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#111"; }}
        >
          开始使用
        </button>
      </div>
    </nav>
  );
}

// ─── Step Row ───────────────────────────────────────────────────────────────

function StepRow({ num, icon, title, desc }: {
  num: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "20px",
        padding: "28px 0",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <span style={{
        fontFamily: "var(--font-display)",
        fontSize: "48px",
        fontWeight: 700,
        color: "rgba(0,0,0,0.06)",
        lineHeight: 1,
        minWidth: "56px",
        letterSpacing: "-0.04em",
      }}>
        {num}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{
            width: "32px", height: "32px",
            background: "#111",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {icon}
          </div>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontSize: "20px",
            fontWeight: 600,
            color: "#111",
            letterSpacing: "-0.02em",
            margin: 0,
          }}>
            {title}
          </h3>
        </div>
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          color: "#666",
          lineHeight: 1.7,
          margin: 0,
          paddingLeft: "42px",
        }}>
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

/// ─── Mock example materials for the demo section ───────────────────────────
interface DemoCard {
  label: string;
  bg: string;
  fg: string;
  w: number | string;
  h: number;
  type: string;
  border?: string;
  round?: boolean;
}
const DEMO_CARDS: DemoCard[] = [
  { label: "主标题框 1", bg: "#111", fg: "#fff", w: "100%", h: 60, type: "title" },
  { label: "主标题框 2", bg: "#F5C842", fg: "#111", w: "100%", h: 60, type: "title" },
  { label: "小标题框 1", bg: "#E8441A", fg: "#fff", w: "75%", h: 44, type: "subtitle" },
  { label: "小标题框 2", bg: "#fff", fg: "#111", w: "75%", h: 44, type: "subtitle", border: "#111" },
  { label: "提示框 1", bg: "#f5f5f5", fg: "#111", w: "100%", h: 72, type: "tip", border: "#ddd" },
  { label: "提示框 2", bg: "#B5D5F5", fg: "#111", w: "100%", h: 72, type: "tip" },
  { label: "分割线 1", bg: "#111", fg: "#111", w: "100%", h: 2, type: "divider" },
  { label: "分割线 2", bg: "#E8441A", fg: "#E8441A", w: "60%", h: 2, type: "divider" },
  { label: "装饰元素 1", bg: "#F5C842", fg: "#111", w: 52, h: 52, type: "decoration", round: true },
  { label: "装饰元素 2", bg: "#C8F0C0", fg: "#111", w: 52, h: 52, type: "decoration", round: true },
  { label: "装饰元素 3", bg: "#111", fg: "#fff", w: 52, h: 52, type: "decoration", round: true },
];

// ─── Main Home ──────────────────────────────────────────────────────────────

export default function Home() {
  const workAreaRef = useRef<HTMLDivElement>(null);
  const exampleRef = useRef<HTMLDivElement>(null);
  const [showWork, setShowWork] = useState(false);

  const scrollToWork = useCallback(() => {
    setShowWork(true);
    setTimeout(() => {
      workAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, []);

  const scrollToExample = useCallback(() => {
    exampleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div style={{ background: "#fff", minHeight: "100vh", overflowX: "hidden" }}>
      <Nav onScrollToWork={scrollToWork} onScrollToExample={scrollToExample} />

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "120px",
        paddingBottom: 0,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Top label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: "24px" }}
        >
          <span style={{
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#888",
            background: "#f5f5f5",
            padding: "6px 14px",
            borderRadius: "100px",
          }}>
            AI 公众号素材生成器
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          style={{ textAlign: "center", maxWidth: "780px", padding: "0 24px" }}
        >
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(52px, 8vw, 96px)",
            fontWeight: 700,
            lineHeight: 1.0,
            letterSpacing: "-0.04em",
            color: "#111",
            margin: 0,
          }}>
            上传参考图，
            <br />
            <span style={{ color: "#E8441A" }}>AI</span> 为你生成
            <br />
            一套公众号素材
          </h1>
        </motion.div>

        {/* Subline + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            marginTop: "32px",
            marginBottom: "48px",
          }}
        >
          <p style={{
            fontFamily: "var(--font-sans)",
            fontSize: "16px",
            color: "#666",
            lineHeight: 1.7,
            textAlign: "center",
            maxWidth: "480px",
            margin: 0,
          }}>
            不需要自己抠配色，不需要自己做标题框。
            <br />
            上传一张喜欢的参考图，AI 帮你拆出一套能直接用的素材。
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={scrollToWork}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "15px",
                fontWeight: 600,
                color: "#fff",
                background: "#111",
                border: "none",
                padding: "14px 28px",
                borderRadius: "100px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background 0.2s, transform 0.15s",
                boxShadow: "0 2px 0 rgba(0,0,0,0.15)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#E8441A"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#111"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <Upload size={16} />
              上传参考图，开始生成
            </button>
            <button
              onClick={scrollToExample}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "15px",
                fontWeight: 500,
                color: "#111",
                background: "transparent",
                border: "1.5px solid rgba(0,0,0,0.15)",
                padding: "14px 24px",
                borderRadius: "100px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#111"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)"; }}
            >
              查看示例
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>

        {/* ── Cards + Goose stage ──────────────────────────────────────────── */}
        {/* This is the key visual: cards spread out, goose peeking from bottom */}
        <div style={{
          position: "relative",
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          {/* Drag hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              color: "#aaa",
              letterSpacing: "0.06em",
              marginBottom: "12px",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            ↕ 拖动这些素材卡片试试
          </motion.p>

          {/* Cards stage */}
          <CardsStage />

          {/* Goose image — peeking from bottom, overlapping the cards */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 120, damping: 18 }}
            style={{
              position: "relative",
              zIndex: 5,
              marginTop: "-40px",
              width: "min(340px, 55vw)",
              pointerEvents: "none",
            }}
          >
            <img
              src={GOOSE_IMG}
              alt="素材鹅"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                filter: "drop-shadow(0px 8px 24px rgba(0,0,0,0.12))",
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{
        padding: "100px 24px",
        maxWidth: "680px",
        margin: "0 auto",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ marginBottom: "48px" }}
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
            使用流程
          </span>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(36px, 5vw, 52px)",
            fontWeight: 700,
            color: "#111",
            letterSpacing: "-0.03em",
            margin: 0,
            lineHeight: 1.1,
          }}>
            三步，从参考图<br />到素材包
          </h2>
        </motion.div>

        <StepRow
          num="01"
          icon={<Upload size={16} color="#fff" />}
          title="上传参考图"
          desc="任何你觉得好看的图片都可以——截图、海报、杂志页面、小红书截图。"
        />
        <StepRow
          num="02"
          icon={<Sparkles size={16} color="#fff" />}
          title="AI 分析风格并生成素材"
          desc="AI 自动提取配色、风格标签和视觉元素，生成 8–12 个配套公众号素材。"
        />
        <StepRow
          num="03"
          icon={<Download size={16} color="#fff" />}
          title="下载后直接排版"
          desc="单个下载或一键打包 ZIP，拿到 Canva、秀米、135 编辑器直接用。"
        />
      </section>

      {/* ─── EXAMPLE SECTION ──────────────────────────────────────────────── */}
      <section
        ref={exampleRef}
        id="example-section"
        style={{
          background: "#f9f9f9",
          padding: "80px 24px",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginBottom: "52px", textAlign: "center" }}
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
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 700,
              color: "#111",
              letterSpacing: "-0.03em",
              margin: 0,
              lineHeight: 1.1,
            }}>
              看看 AI 能做什么
            </h2>
          </motion.div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            alignItems: "start",
          }}>
            {/* Reference image mock */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
            >
              <p style={{
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#aaa",
                marginBottom: "12px",
              }}>
                参考图
              </p>
              <div style={{
                background: "linear-gradient(135deg, #f0ece4 0%, #c8d8e8 50%, #e0d4bc 100%)",
                borderRadius: "12px",
                aspectRatio: "3/4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(0,0,0,0.06)",
              }}>
                <div style={{ textAlign: "center", opacity: 0.4 }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>🖼</div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "#666" }}>
                    示例参考图
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Style analysis card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <p style={{
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#aaa",
                marginBottom: "12px",
              }}>
                风格分析卡片
              </p>
              <div style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}>
                {/* Colors */}
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#aaa", marginBottom: "8px" }}>
                    主色调
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[
                      { name: "米白", hex: "#F5F0E8" },
                      { name: "浅灰蓝", hex: "#B8C5D0" },
                      { name: "暖沙色", hex: "#D4C4A8" },
                      { name: "深墨绿", hex: "#1a2e1a" },
                    ].map(c => (
                      <div key={c.hex} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: c.hex, border: "1px solid rgba(0,0,0,0.1)" }} />
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "#555" }}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Tags */}
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#aaa", marginBottom: "8px" }}>
                    风格标签
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {["简约", "杂志感", "奶油感", "轻拼贴"].map(t => (
                      <span key={t} style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: "#111",
                        color: "#fff",
                        padding: "3px 10px",
                        borderRadius: "100px",
                        letterSpacing: "0.04em",
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Elements */}
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#aaa", marginBottom: "8px" }}>
                    视觉元素
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {["圆角框", "细线分割", "小装饰点", "纸张纹理"].map(e => (
                      <span key={e} style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "11px",
                        background: "#f5f5f5",
                        color: "#555",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}>
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Mood */}
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "12px" }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "#888", fontStyle: "italic", lineHeight: 1.6 }}>
                    "清新淡雅，带有轻盈的编辑质感，适合内容型公众号排版使用。"
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Generated materials preview */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <p style={{
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#aaa",
                marginBottom: "12px",
              }}>
                生成素材包（示意）
              </p>
              <div style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}>
                {DEMO_CARDS.filter(c => c.type === "title").map((c, i) => (
                  <div key={i} style={{
                    width: "100%", height: c.h,
                    background: c.bg,
                    borderRadius: "6px",
                    border: c.border ? `1.5px solid ${c.border}` : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: c.fg, opacity: 0.5 }}>{c.label}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "8px" }}>
                  {DEMO_CARDS.filter(c => c.type === "subtitle").map((c, i) => (
                    <div key={i} style={{
                      width: c.w, height: c.h,
                      background: c.bg,
                      borderRadius: "6px",
                      border: c.border ? `1.5px solid ${c.border}` : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flex: 1,
                    }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: c.fg, opacity: 0.5 }}>{c.label}</span>
                    </div>
                  ))}
                </div>
                {DEMO_CARDS.filter(c => c.type === "tip").slice(0, 1).map((c, i) => (
                  <div key={i} style={{
                    width: "100%", height: c.h,
                    background: c.bg,
                    borderRadius: "6px",
                    border: c.border ? `1.5px solid ${c.border}` : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: c.fg, opacity: 0.5 }}>{c.label}</span>
                  </div>
                ))}
                {DEMO_CARDS.filter(c => c.type === "divider").map((c, i) => (
                  <div key={i} style={{
                    width: c.w, height: c.h,
                    background: c.bg,
                    borderRadius: "2px",
                    margin: "2px 0",
                  }} />
                ))}
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", paddingTop: "4px" }}>
                  {DEMO_CARDS.filter(c => c.type === "decoration").map((c, i) => (
                    <div key={i} style={{
                      width: c.w, height: c.h,
                      background: c.bg,
                      borderRadius: "50%",
                      border: c.border ? `1.5px solid ${c.border}` : "none",
                    }} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginTop: "52px" }}
          >
            <button
              onClick={scrollToWork}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "15px",
                fontWeight: 600,
                color: "#fff",
                background: "#111",
                border: "none",
                padding: "14px 32px",
                borderRadius: "100px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 0 rgba(0,0,0,0.15)",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget.style.background = "#E8441A"); }}
              onMouseLeave={e => { (e.currentTarget.style.background = "#111"); }}
            >
              <Upload size={16} />
              立即上传参考图，生成属于你的素材包
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── WORK AREA ────────────────────────────────────────────────────── */}
      <div ref={workAreaRef} id="work-area">
        <AnimatePresence>
          {showWork && (
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <WorkArea />
            </motion.div>
          )}
        </AnimatePresence>
        {!showWork && (
          <div style={{
            padding: "80px 24px",
            textAlign: "center",
            borderTop: "1px solid rgba(0,0,0,0.06)",
          }}>
            <button
              onClick={scrollToWork}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "15px",
                fontWeight: 600,
                color: "#fff",
                background: "#111",
                border: "none",
                padding: "16px 36px",
                borderRadius: "100px",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0 2px 0 rgba(0,0,0,0.15)",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget.style.background = "#E8441A"); }}
              onMouseLeave={e => { (e.currentTarget.style.background = "#111"); }}
            >
              <Upload size={18} />
              开始上传参考图
            </button>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "#aaa", marginTop: "12px" }}>
              点击后工作区将在下方展开
            </p>
          </div>
        )}
      </div>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        padding: "40px 24px",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <GooseLogoSmall />
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: "16px",
            fontWeight: 600,
            color: "#111",
            letterSpacing: "-0.02em",
          }}>
            素材鹅
          </span>
        </div>
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          color: "#aaa",
          margin: 0,
        }}>
          上传参考图，AI 帮你生成一套能直接用于公众号排版的同风格素材
        </p>
      </footer>
    </div>
  );
}

// ─── Goose Logo (small, for nav/footer) ────────────────────────────────────

function GooseLogoSmall() {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-label="素材鹅">
      <ellipse cx="14" cy="18" rx="7" ry="5.5" fill="#fff" stroke="#111" strokeWidth="1.5" />
      <path d="M 14 13 Q 16 10 14.5 7" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M 14 13 Q 16 10 14.5 7" stroke="#111" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <ellipse cx="14.5" cy="5.5" rx="3.5" ry="3" fill="#fff" stroke="#111" strokeWidth="1.5" />
      <circle cx="16" cy="4.5" r="0.9" fill="#111" />
      <path d="M 17.5 5.5 L 20.5 5.5 L 17.5 6.8" fill="#E8441A" stroke="#111" strokeWidth="0.5" />
      <line x1="11" y1="23" x2="9" y2="26" stroke="#E8441A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="23" x2="19" y2="26" stroke="#E8441A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
