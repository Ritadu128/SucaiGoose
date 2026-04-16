import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence, animate } from "framer-motion";
import { Upload, Sparkles, Download } from "lucide-react";
import WorkArea from "./WorkArea";

// ─── CDN Assets ──────────────────────────────────────────────────────────────

const GOOSE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663370025872/5mKWtQvx6AWCKgfHBWaSbd/goose-v3_9ba08e6a.png";

// Floating material images for Hero section
const FLOAT_IMGS = [
  {
    id: "f1",
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663370025872/5mKWtQvx6AWCKgfHBWaSbd/material-manga_27c66639.jpg",
    alt: "漫画格素材",
    rotate: -8,
    x: -380,
    y: -30,
    w: 185,
    zIndex: 12,
  },
  {
    id: "f2",
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663370025872/5mKWtQvx6AWCKgfHBWaSbd/material-goose-poster_e554e693.jpg",
    alt: "鹅拼贴海报",
    rotate: 5,
    x: -160,
    y: 20,
    w: 210,
    zIndex: 14,
  },
  {
    id: "f3",
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663370025872/5mKWtQvx6AWCKgfHBWaSbd/material-tv-eye_92080f88.png",
    alt: "电视眼素材",
    rotate: -4,
    x: 60,
    y: -50,
    w: 175,
    zIndex: 13,
  },
  {
    id: "f4",
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663370025872/5mKWtQvx6AWCKgfHBWaSbd/material-film_6c814916.png",
    alt: "胶片纸素材",
    rotate: 9,
    x: 240,
    y: 10,
    w: 155,
    zIndex: 11,
  },
  {
    id: "f5",
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663370025872/5mKWtQvx6AWCKgfHBWaSbd/material-blue-stars_e339b32c.png",
    alt: "蓝色星星素材",
    rotate: -11,
    x: 390,
    y: -20,
    w: 160,
    zIndex: 10,
  },
];

// ─── Floating Image Card (draggable, with parallax float) ───────────────────

interface FloatImgDef {
  id: string;
  src: string;
  alt: string;
  rotate: number;
  x: number;
  y: number;
  w: number;
  zIndex: number;
}

function FloatingImgCard({ img, zIndex, onDragStart }: {
  img: FloatImgDef;
  zIndex: number;
  onDragStart: (id: string) => void;
}) {
  const x = useMotionValue(img.x);
  const y = useMotionValue(img.y);
  const springX = useSpring(x, { stiffness: 180, damping: 24 });
  const springY = useSpring(y, { stiffness: 180, damping: 24 });

  const rotate = useTransform(
    [springX, springY],
    ([lx, ly]) => {
      const dx = (lx as number) - img.x;
      const dy = (ly as number) - img.y;
      return img.rotate + dx * 0.012 + dy * 0.006;
    }
  );

  // Subtle idle float animation
  useEffect(() => {
    const floatY = img.y + (Math.random() - 0.5) * 10;
    const controls = animate(y, [img.y, floatY, img.y], {
      duration: 3 + Math.random() * 2,
      repeat: Infinity,
      ease: "easeInOut",
      delay: Math.random() * 2,
    });
    return controls.stop;
  }, []);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.06}
      style={{
        x: springX,
        y: springY,
        rotate,
        zIndex,
        position: "absolute",
        width: img.w,
        cursor: "grab",
        userSelect: "none",
        touchAction: "none",
        willChange: "transform",
        borderRadius: "6px",
        overflow: "hidden",
        boxShadow: "4px 8px 24px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.6) inset",
      }}
      whileDrag={{
        scale: 1.04,
        boxShadow: "8px 16px 40px rgba(0,0,0,0.28)",
        cursor: "grabbing",
        zIndex: 999,
      }}
      whileHover={{ scale: 1.025 }}
      onDragStart={() => onDragStart(img.id)}
      initial={{ opacity: 0, scale: 0.85, rotate: img.rotate - 8 }}
      animate={{ opacity: 1, scale: 1, rotate: img.rotate }}
      transition={{ type: "spring", stiffness: 240, damping: 22, delay: FLOAT_IMGS.findIndex(f => f.id === img.id) * 0.1 }}
    >
      <img
        src={img.src}
        alt={img.alt}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          pointerEvents: "none",
        }}
        draggable={false}
      />
    </motion.div>
  );
}

function FloatStage() {
  const [topCard, setTopCard] = useState<string | null>(null);
  const getZ = (id: string) => id === topCard ? 999 : FLOAT_IMGS.find(f => f.id === id)!.zIndex;

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: 300,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "visible",
    }}>
      {FLOAT_IMGS.map(img => (
        <FloatingImgCard
          key={img.id}
          img={img}
          zIndex={getZ(img.id)}
          onDragStart={setTopCard}
        />
      ))}
    </div>
  );
}

// ─── Roaming Goose ───────────────────────────────────────────────────────────
// Small goose that wanders around the full page, idle bob + click-to-flee

type GooseMode = "walk" | "flee" | "return";

function RoamingGoose() {
  const containerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 120, y: 200 });
  const velRef = useRef({ x: 0.6, y: 0.3 });
  const modeRef = useRef<GooseMode>("walk");
  const fleeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number>(0);
  const [pos, setPos] = useState({ x: 120, y: 200 });
  const [facing, setFacing] = useState<"left" | "right">("right");
  const [mode, setMode] = useState<GooseMode>("walk");
  const [bobPhase, setBobPhase] = useState(0);
  const [visible, setVisible] = useState(true);

  // Idle bob timer
  useEffect(() => {
    let t = 0;
    const id = setInterval(() => {
      t += 0.12;
      setBobPhase(t);
    }, 50);
    return () => clearInterval(id);
  }, []);

  // Main movement loop
  useEffect(() => {
    const GOOSE_SIZE = 110;
    const WALK_SPEED = 0.55;
    const FLEE_SPEED = 6.5;

    const loop = () => {
      const vw = window.innerWidth;
      const vh = document.documentElement.scrollHeight;
      const p = posRef.current;
      const v = velRef.current;
      const currentMode = modeRef.current;

      const speed = currentMode === "flee" ? FLEE_SPEED : WALK_SPEED;
      const len = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
      const nx = p.x + (v.x / len) * speed;
      const ny = p.y + (v.y / len) * speed;

      // Bounce off walls
      let bx = v.x, by = v.y;
      if (nx < 20 || nx > vw - GOOSE_SIZE - 20) bx = -bx;
      if (ny < 60 || ny > vh - GOOSE_SIZE - 20) by = -by;

      // Randomly change direction while walking
      if (currentMode === "walk" && Math.random() < 0.003) {
        const angle = Math.random() * Math.PI * 2;
        bx = Math.cos(angle);
        by = Math.sin(angle);
      }

      velRef.current = { x: bx, y: by };
      posRef.current = {
        x: Math.max(20, Math.min(vw - GOOSE_SIZE - 20, nx)),
        y: Math.max(60, Math.min(vh - GOOSE_SIZE - 20, ny)),
      };

      setPos({ ...posRef.current });
      setFacing(bx > 0 ? "right" : "left");

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleClick = useCallback(() => {
    if (modeRef.current === "flee") return;

    // Flee: pick a random off-screen direction
    const angle = Math.random() * Math.PI * 2;
    velRef.current = { x: Math.cos(angle), y: Math.sin(angle) };
    modeRef.current = "flee";
    setMode("flee");

    // After 1.2s, hide, then reappear from a random edge after 2s
    if (fleeTimerRef.current) clearTimeout(fleeTimerRef.current);
    fleeTimerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        // Reappear from a random edge
        const vw = window.innerWidth;
        const vh = document.documentElement.scrollHeight;
        const edge = Math.floor(Math.random() * 4);
        let nx = 0, ny = 0, vx = 0, vy = 0;
        if (edge === 0) { nx = Math.random() * vw; ny = 80; vx = (Math.random() - 0.5) * 2; vy = 1; }
        else if (edge === 1) { nx = vw - 80; ny = Math.random() * vh * 0.5; vx = -1; vy = (Math.random() - 0.5); }
        else if (edge === 2) { nx = Math.random() * vw; ny = vh - 100; vx = (Math.random() - 0.5) * 2; vy = -1; }
        else { nx = 80; ny = Math.random() * vh * 0.5 + 80; vx = 1; vy = (Math.random() - 0.5); }

        posRef.current = { x: nx, y: ny };
        velRef.current = { x: vx, y: vy };
        modeRef.current = "walk";
        setMode("walk");
        setPos({ x: nx, y: ny });
        setVisible(true);
      }, 1800);
    }, 1200);
  }, []);

  const bobY = Math.sin(bobPhase) * (mode === "flee" ? 0 : 2.5);
  const bobRotate = Math.sin(bobPhase * 0.7) * (mode === "flee" ? 3 : 1.2);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 200,
      }}
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            key="goose"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.35, type: "spring" }}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: 110,
              height: 110,
              pointerEvents: "auto",
              cursor: "pointer",
              transform: `scaleX(${facing === "left" ? -1 : 1}) translateY(${bobY}px) rotate(${bobRotate}deg)`,
              transformOrigin: "center center",
              willChange: "transform",
            }}
            onClick={handleClick}
            title="点我！"
          >
            <img
              src={GOOSE_IMG}
              alt="素材鹅"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
                filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.15))",
                pointerEvents: "none",
              }}
              draggable={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

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
    <nav style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 2.5rem",
      height: "56px",
      background: scrolled ? "rgba(255,255,255,0.94)" : "transparent",
      backdropFilter: scrolled ? "blur(14px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(0,0,0,0.07)" : "none",
      transition: "all 0.3s ease",
    }}>
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
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <button
          onClick={onScrollToExample}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            fontWeight: 500,
            color: "#666",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#111")}
          onMouseLeave={e => (e.currentTarget.style.color = "#666")}
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
      </div>
    </nav>
  );
}

// ─── Step Row ────────────────────────────────────────────────────────────────

function StepRow({ num, icon, title, desc }: {
  num: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "20px",
        padding: "28px 0",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
      }}
    >
      <span style={{
        fontFamily: "var(--font-display)",
        fontSize: "44px",
        fontWeight: 700,
        color: "rgba(0,0,0,0.05)",
        lineHeight: 1,
        minWidth: "52px",
        letterSpacing: "-0.04em",
      }}>
        {num}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{
            width: "30px", height: "30px",
            background: "#111",
            borderRadius: "7px",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {icon}
          </div>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontSize: "18px",
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
          color: "#777",
          lineHeight: 1.7,
          margin: 0,
          paddingLeft: "40px",
        }}>
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Home ───────────────────────────────────────────────────────────────

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
      {/* Roaming goose - always on top, full page */}
      <RoamingGoose />

      <Nav onScrollToWork={scrollToWork} onScrollToExample={scrollToExample} />

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "140px",
        paddingBottom: "60px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Main headline - very minimal */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          style={{ textAlign: "center", padding: "0 24px", maxWidth: "820px" }}
        >
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(48px, 7.5vw, 92px)",
            fontWeight: 700,
            lineHeight: 1.0,
            letterSpacing: "-0.04em",
            color: "#111",
            margin: 0,
          }}>
            把喜欢的风格
            <br />
            变成你的素材
          </h1>
        </motion.div>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22 }}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "16px",
            color: "#888",
            lineHeight: 1.7,
            textAlign: "center",
            maxWidth: "360px",
            margin: "24px 0 0",
            padding: "0 24px",
          }}
        >
          上传一张你喜欢的图，剩下的交给鹅。
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.36 }}
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "36px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
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
              padding: "13px 28px",
              borderRadius: "100px",
              cursor: "pointer",
              boxShadow: "0 2px 0 rgba(0,0,0,0.14)",
              transition: "background 0.2s, transform 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#E8441A"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#111"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            开始生成
          </button>
          <button
            onClick={scrollToExample}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "15px",
              fontWeight: 500,
              color: "#555",
              background: "transparent",
              border: "1.5px solid rgba(0,0,0,0.14)",
              padding: "13px 24px",
              borderRadius: "100px",
              cursor: "pointer",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#111"; e.currentTarget.style.color = "#111"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.14)"; e.currentTarget.style.color = "#555"; }}
          >
            查看示例
          </button>
        </motion.div>

        {/* ── Floating material images ──────────────────────────────────────── */}
        <div style={{
          position: "relative",
          width: "100%",
          maxWidth: "960px",
          margin: "72px auto 0",
          padding: "0 24px",
        }}>
          <FloatStage />
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{
        padding: "120px 24px",
        maxWidth: "640px",
        margin: "0 auto",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ marginBottom: "52px" }}
        >
          <span style={{
            fontFamily: "var(--font-sans)",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#bbb",
            display: "block",
            marginBottom: "14px",
          }}>
            使用流程
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
            三步，从参考图<br />到素材包
          </h2>
        </motion.div>

        <StepRow
          num="01"
          icon={<Upload size={15} color="#fff" />}
          title="上传参考图"
          desc="任何你觉得好看的图片都可以--截图、海报、杂志页面、小红书截图。"
        />
        <StepRow
          num="02"
          icon={<Sparkles size={15} color="#fff" />}
          title="AI 分析风格并生成素材"
          desc="AI 自动提取配色、风格标签和视觉元素，生成 8–12 个配套公众号素材。"
        />
        <StepRow
          num="03"
          icon={<Download size={15} color="#fff" />}
          title="下载后直接排版"
          desc="单个下载或一键打包 ZIP，拿到 Canva、秀米、135 编辑器直接用。"
        />
      </section>

      {/* ─── EXAMPLE SECTION ──────────────────────────────────────────────── */}
      <section
        ref={exampleRef}
        id="example-section"
        style={{
          background: "#f8f8f8",
          padding: "100px 24px",
          borderTop: "1px solid rgba(0,0,0,0.05)",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginBottom: "56px", textAlign: "center" }}
          >
            <span style={{
              fontFamily: "var(--font-sans)",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#bbb",
              display: "block",
              marginBottom: "14px",
            }}>
              示例展示
            </span>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4.5vw, 44px)",
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
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "28px",
            alignItems: "start",
          }}>
            {/* Reference image mock */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
            >
              <p style={{
                fontFamily: "var(--font-sans)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#bbb",
                marginBottom: "12px",
              }}>
                参考图
              </p>
              <div style={{
                borderRadius: "10px",
                aspectRatio: "3/4",
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.06)",
              }}>
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663370025872/5mKWtQvx6AWCKgfHBWaSbd/material-blue-stars_e339b32c.png"
                  alt="示例参考图"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            </motion.div>

            {/* Style analysis card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <p style={{
                fontFamily: "var(--font-sans)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#bbb",
                marginBottom: "12px",
              }}>
                风格分析卡片
              </p>
              <div style={{
                background: "#fff",
                borderRadius: "10px",
                padding: "20px",
                border: "1px solid rgba(0,0,0,0.07)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}>
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#bbb", marginBottom: "8px" }}>
                    主色调
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[
                      { name: "深蓝", hex: "#1a2d6e" },
                      { name: "午夜蓝", hex: "#0d1b4b" },
                      { name: "纯白", hex: "#f5f5f5" },
                      { name: "星光银", hex: "#c8d4e8" },
                    ].map(c => (
                      <div key={c.hex} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: c.hex, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "#666" }}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#bbb", marginBottom: "8px" }}>
                    风格标签
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {["蓝调", "版画感", "星空", "手绘线条"].map(t => (
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
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#bbb", marginBottom: "8px" }}>
                    视觉元素
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {["星形装饰", "手绘花卉", "版画网点", "双色块"].map(e => (
                      <span key={e} style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "11px",
                        background: "#f4f4f4",
                        color: "#666",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        border: "1px solid rgba(0,0,0,0.05)",
                      }}>
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "12px" }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "#999", fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>
                    "深邃的蓝调版画质感，带有手绘星空的诗意，适合文艺内容型公众号。"
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Generated materials preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <p style={{
                fontFamily: "var(--font-sans)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#bbb",
                marginBottom: "12px",
              }}>
                生成素材包（示意）
              </p>
              <div style={{
                background: "#fff",
                borderRadius: "10px",
                padding: "16px",
                border: "1px solid rgba(0,0,0,0.07)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}>
                {/* Title bars */}
                {[
                  { bg: "#1a2d6e", label: "主标题框 1", h: 52 },
                  { bg: "#0d1b4b", label: "主标题框 2", h: 52 },
                ].map((c, i) => (
                  <div key={i} style={{
                    width: "100%", height: c.h,
                    background: c.bg,
                    borderRadius: "5px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "rgba(255,255,255,0.45)" }}>{c.label}</span>
                  </div>
                ))}
                {/* Subtitle bars */}
                <div style={{ display: "flex", gap: "6px" }}>
                  {[
                    { bg: "#c8d4e8", label: "小标题 1", fg: "#1a2d6e" },
                    { bg: "#f5f5f5", label: "小标题 2", fg: "#1a2d6e", border: "#c8d4e8" },
                  ].map((c, i) => (
                    <div key={i} style={{
                      flex: 1, height: 38,
                      background: c.bg,
                      borderRadius: "5px",
                      border: c.border ? `1.5px solid ${c.border}` : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: c.fg, opacity: 0.55 }}>{c.label}</span>
                    </div>
                  ))}
                </div>
                {/* Tip box */}
                <div style={{
                  width: "100%", height: 56,
                  background: "#f0f3f8",
                  borderRadius: "5px",
                  border: "1px solid #c8d4e8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "#1a2d6e", opacity: 0.5 }}>提示框</span>
                </div>
                {/* Dividers */}
                <div style={{ width: "100%", height: 2, background: "#1a2d6e", borderRadius: "1px" }} />
                <div style={{ width: "60%", height: 2, background: "#c8d4e8", borderRadius: "1px" }} />
                {/* Decorations */}
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", paddingTop: "4px" }}>
                  {["#1a2d6e", "#c8d4e8", "#f5f5f5"].map((bg, i) => (
                    <div key={i} style={{
                      width: 40, height: 40,
                      background: bg,
                      borderRadius: "50%",
                      border: bg === "#f5f5f5" ? "1.5px solid #c8d4e8" : "none",
                    }} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginTop: "56px" }}
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
                cursor: "pointer",
                boxShadow: "0 2px 0 rgba(0,0,0,0.14)",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#E8441A"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#111"; }}
            >
              立即上传参考图
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── WORK AREA ────────────────────────────────────────────────────── */}
      <div ref={workAreaRef} id="work-area">
        <AnimatePresence>
          {showWork && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <WorkArea />
            </motion.div>
          )}
        </AnimatePresence>
        {!showWork && (
          <div style={{
            padding: "100px 24px",
            textAlign: "center",
            borderTop: "1px solid rgba(0,0,0,0.05)",
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
                cursor: "pointer",
                boxShadow: "0 2px 0 rgba(0,0,0,0.14)",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#E8441A"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#111"; }}
            >
              开始上传参考图
            </button>
          </div>
        )}
      </div>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        padding: "48px 24px",
        borderTop: "1px solid rgba(0,0,0,0.05)",
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
          fontSize: "12px",
          color: "#bbb",
          margin: 0,
        }}>
          上传参考图，AI 帮你生成一套能直接用于公众号排版的同风格素材
        </p>
      </footer>
    </div>
  );
}

// ─── Goose Logo (small, for nav/footer) ──────────────────────────────────────

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
