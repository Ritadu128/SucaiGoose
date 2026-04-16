import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { useLocation } from "wouter";

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
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "mirror",
    });
    return () => controls.stop();
  }, [img.y, y]);

  return (
    <motion.div
      drag
      dragMomentum={false}
      style={{
        position: "absolute",
        x: springX,
        y: springY,
        rotate,
        width: img.w,
        zIndex,
        cursor: "grab",
        userSelect: "none",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)",
      }}
      onDragStart={() => onDragStart(img.id)}
      whileDrag={{ scale: 1.04, boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}
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
type GooseMode = "walk" | "flee" | "return";

function RoamingGoose() {
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
      let bx = v.x, by = v.y;
      if (nx < 20 || nx > vw - GOOSE_SIZE - 20) bx = -bx;
      if (ny < 60 || ny > vh - GOOSE_SIZE - 20) by = -by;
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
    const angle = Math.random() * Math.PI * 2;
    velRef.current = { x: Math.cos(angle), y: Math.sin(angle) };
    modeRef.current = "flee";
    setMode("flee");
    if (fleeTimerRef.current) clearTimeout(fleeTimerRef.current);
    fleeTimerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
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
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 200,
      }}
    >
      {visible && (
        <div
          onClick={handleClick}
          style={{
            position: "absolute",
            left: pos.x,
            top: pos.y,
            width: 110,
            pointerEvents: "auto",
            cursor: "pointer",
            transform: `scaleX(${facing === "left" ? -1 : 1}) translateY(${bobY}px) rotate(${bobRotate}deg)`,
            transformOrigin: "center bottom",
            transition: "opacity 0.4s",
            opacity: visible ? 1 : 0,
          }}
        >
          <img
            src={GOOSE_IMG}
            alt="素材鹅"
            style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }}
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [, navigate] = useLocation();

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
          onClick={() => navigate("/examples")}
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
      </div>
    </nav>
  );
}

// ─── Main Home (Hero only) ────────────────────────────────────────────────────
export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div style={{ background: "#fff", minHeight: "100vh", overflowX: "hidden" }}>
      {/* Roaming goose - always on top, full page */}
      <RoamingGoose />
      <Nav />
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "140px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center", position: "relative", zIndex: 2 }}
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
            onClick={() => navigate("/generate")}
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
            onClick={() => navigate("/examples")}
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
