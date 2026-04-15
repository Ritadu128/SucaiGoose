import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, Upload, Sparkles, Download, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import WalkingGoose from "@/components/WalkingGoose";
import WorkArea from "./WorkArea";

// ─── Animation helpers ─────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// ─── Step card ─────────────────────────────────────────────────────────────
function StepCard({
  num,
  icon,
  title,
  desc,
  delay,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay * 0.15 }}
      viewport={{ once: true }}
      className="flex flex-col gap-4 p-8 bg-card rounded-2xl border border-border"
    >
      <div className="flex items-center gap-3">
        <span
          className="text-xs font-body tracking-widest"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          {num}
        </span>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "var(--color-sand-light)" }}
        >
          {icon}
        </div>
      </div>
      <div>
        <h3 className="font-serif text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Mock example data ─────────────────────────────────────────────────────
const EXAMPLE_COLORS = [
  { name: "米白", hex: "#F5F0E8" },
  { name: "浅灰蓝", hex: "#B8C5D0" },
  { name: "暖沙色", hex: "#D4C4A8" },
  { name: "深墨绿", hex: "#1a2e1a" },
];

const EXAMPLE_TAGS = ["简约", "杂志感", "奶油感", "轻拼贴"];
const EXAMPLE_ELEMENTS = ["圆角框", "细线分割", "小装饰点", "纸张纹理"];

// Mock material cards for the example section
const MOCK_MATERIALS = [
  { type: "主标题框", bg: "#1a2e1a", fg: "#f5f0e8", w: "100%", h: 56 },
  { type: "主标题框", bg: "#D4C4A8", fg: "#1a2e1a", w: "100%", h: 56 },
  { type: "小标题框", bg: "#B8C5D0", fg: "#1a2e1a", w: "80%", h: 40 },
  { type: "小标题框", bg: "#f5f0e8", fg: "#1a2e1a", w: "80%", h: 40, border: "#1a2e1a" },
  { type: "提示框", bg: "#ede8de", fg: "#1a2e1a", w: "100%", h: 72, border: "#D4C4A8" },
  { type: "提示框", bg: "#B8C5D0", fg: "#1a2e1a", w: "100%", h: 72 },
  { type: "分割线", bg: "#1a2e1a", fg: "#1a2e1a", w: "100%", h: 2 },
  { type: "分割线", bg: "transparent", fg: "#D4C4A8", w: "100%", h: 2, border: "#D4C4A8" },
  { type: "装饰元素", bg: "#D4C4A8", fg: "#1a2e1a", w: 48, h: 48, round: true },
  { type: "装饰元素", bg: "#B8C5D0", fg: "#1a2e1a", w: 48, h: 48, round: true },
  { type: "装饰元素", bg: "#1a2e1a", fg: "#f5f0e8", w: 48, h: 48, round: true },
];

function MockMaterialCard({ mat }: { mat: (typeof MOCK_MATERIALS)[number] }) {
  const isSmall = mat.round || (typeof mat.w === "number" && mat.w < 80);
  return (
    <div
      className="rounded-lg overflow-hidden flex items-center justify-center"
      style={{
        background: mat.bg,
        border: mat.border ? `1.5px solid ${mat.border}` : undefined,
        width: typeof mat.w === "number" ? mat.w : mat.w,
        height: mat.h,
        borderRadius: mat.round ? "50%" : undefined,
        minWidth: typeof mat.w === "number" ? mat.w : undefined,
      }}
    >
      {!isSmall && mat.type !== "分割线" && (
        <span className="text-xs opacity-40 font-body" style={{ color: mat.fg }}>
          {mat.type}
        </span>
      )}
    </div>
  );
}

// ─── Main Home component ───────────────────────────────────────────────────
export default function Home() {
  const workAreaRef = useRef<HTMLDivElement>(null);
  const [showWork, setShowWork] = useState(false);

  const scrollToWork = () => {
    setShowWork(true);
    setTimeout(() => {
      workAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const scrollToExample = () => {
    document.getElementById("example-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      {/* ─── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: "oklch(96% 0.015 85 / 0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <GooseLogo />
          <span className="font-serif text-lg font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
            素材鹅
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={scrollToExample}
            className="text-sm font-body transition-opacity hover:opacity-60"
            style={{ color: "var(--color-ink)" }}>
            查看示例
          </button>
          <Button size="sm" onClick={scrollToWork}
            className="font-body text-sm px-5 rounded-full"
            style={{ background: "var(--color-ink)", color: "var(--color-cream)" }}>
            开始使用
          </Button>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 overflow-hidden">
        {/* Walking goose */}
        <WalkingGoose />

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-20"
            style={{ background: "var(--color-sand)", filter: "blur(80px)" }} />
          <div className="absolute bottom-1/3 left-1/5 w-48 h-48 rounded-full opacity-15"
            style={{ background: "var(--color-mist)", filter: "blur(60px)" }} />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto px-6">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.0 }}
            className="mb-8">
            <span className="tag-pill text-xs tracking-widest">
              AI 公众号素材生成器
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
            className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            style={{ color: "var(--color-ink)", letterSpacing: "-0.02em" }}>
            上传参考图，<br />
            <span style={{ color: "var(--color-ink-light)" }}>
              AI 为你生成
            </span>
            <br />
            一套公众号素材
          </motion.h1>

          {/* Subline */}
          <motion.p initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
            className="font-body text-base md:text-lg leading-relaxed mb-10 max-w-xl"
            style={{ color: "var(--color-muted-foreground)" }}>
            不需要自己抠配色，不需要自己做标题框。
            <br />
            只要上传一张喜欢的参考图，AI 就能帮你拆出一套能直接用的素材。
          </motion.p>

          {/* CTA buttons */}
          <motion.div initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.44999999999999996 }}
            className="flex flex-col sm:flex-row gap-4 items-center">
            <Button
              size="lg"
              onClick={scrollToWork}
              className="font-body text-base px-8 py-6 rounded-full gap-2 shadow-sm hover:shadow-md transition-shadow"
              style={{ background: "var(--color-ink)", color: "var(--color-cream)" }}
            >
              <Upload className="w-4 h-4" />
              上传参考图，开始生成
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToExample}
              className="font-body text-base px-8 py-6 rounded-full gap-2"
              style={{ borderColor: "var(--color-ink)", color: "var(--color-ink)", background: "transparent" }}
            >
              查看示例
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 6, 0] }}
          transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
          className="absolute bottom-8 flex flex-col items-center gap-1"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          <span className="text-xs font-body tracking-widest">向下滚动</span>
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.0 }}
      viewport={{ once: true }}
            className="text-center mb-16">
            <p className="text-xs font-body tracking-widest mb-3" style={{ color: "var(--color-muted-foreground)" }}>
              使用流程
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold" style={{ color: "var(--color-ink)" }}>
              三步，从参考图到素材包
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              num="01"
              icon={<Upload className="w-5 h-5" style={{ color: "var(--color-ink)" }} />}
              title="上传参考图"
              desc="上传一张你喜欢的图片——可以是截图、海报、杂志页面，任何你觉得好看的参考。"
              delay={0}
            />
            <StepCard
              num="02"
              icon={<Sparkles className="w-5 h-5" style={{ color: "var(--color-ink)" }} />}
              title="AI 分析风格并生成素材"
              desc="AI 自动提取配色、风格标签和视觉元素，生成 8–12 个配套的公众号素材。"
              delay={1}
            />
            <StepCard
              num="03"
              icon={<Download className="w-5 h-5" style={{ color: "var(--color-ink)" }} />}
              title="下载后直接排版"
              desc="单个下载或一键打包 ZIP，拿到 Canva、秀米等工具里直接用于公众号排版。"
              delay={2}
            />
          </div>
        </div>
      </section>

      {/* ─── EXAMPLE SECTION ──────────────────────────────────────────────── */}
      <section id="example-section" className="py-24 px-6"
        style={{ background: "var(--card)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.0 }}
      viewport={{ once: true }}
            className="text-center mb-16">
            <p className="text-xs font-body tracking-widest mb-3" style={{ color: "var(--color-muted-foreground)" }}>
              示例展示
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold" style={{ color: "var(--color-ink)" }}>
              看看 AI 能做什么
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Reference image */}
            <motion.div initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.0 }}
      viewport={{ once: true }}>
              <p className="text-xs font-body tracking-widest mb-4" style={{ color: "var(--color-muted-foreground)" }}>
                参考图
              </p>
              <div className="rounded-2xl overflow-hidden border border-border aspect-[3/4] flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #F5F0E8 0%, #B8C5D0 50%, #D4C4A8 100%)" }}>
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                    style={{ background: "rgba(26,46,26,0.1)" }}>
                    <GooseLogo size={32} />
                  </div>
                  <p className="text-xs font-body" style={{ color: "var(--color-ink)", opacity: 0.5 }}>
                    示例参考图
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Style analysis card */}
            <motion.div initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      viewport={{ once: true }}>
              <p className="text-xs font-body tracking-widest mb-4" style={{ color: "var(--color-muted-foreground)" }}>
                风格分析卡片
              </p>
              <div className="rounded-2xl border border-border p-6 space-y-5"
                style={{ background: "var(--color-cream)" }}>
                {/* Colors */}
                <div>
                  <p className="text-xs font-body tracking-wider mb-2" style={{ color: "var(--color-muted-foreground)" }}>
                    主色调
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {EXAMPLE_COLORS.map((c) => (
                      <div key={c.hex} className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full border border-border"
                          style={{ background: c.hex }} />
                        <span className="text-xs font-body" style={{ color: "var(--color-ink)" }}>
                          {c.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Tags */}
                <div>
                  <p className="text-xs font-body tracking-wider mb-2" style={{ color: "var(--color-muted-foreground)" }}>
                    风格标签
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {EXAMPLE_TAGS.map((t) => (
                      <span key={t} className="tag-pill">{t}</span>
                    ))}
                  </div>
                </div>
                {/* Elements */}
                <div>
                  <p className="text-xs font-body tracking-wider mb-2" style={{ color: "var(--color-muted-foreground)" }}>
                    视觉元素
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {EXAMPLE_ELEMENTS.map((e) => (
                      <span key={e} className="text-xs font-body px-2 py-1 rounded-md"
                        style={{ background: "var(--color-mist-light)", color: "var(--color-ink)" }}>
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Mood */}
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-body leading-relaxed italic"
                    style={{ color: "var(--color-muted-foreground)" }}>
                    "清新淡雅，带有轻盈的编辑质感，适合内容型公众号排版使用。"
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Generated materials preview */}
            <motion.div initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      viewport={{ once: true }}>
              <p className="text-xs font-body tracking-widest mb-4" style={{ color: "var(--color-muted-foreground)" }}>
                生成素材包（示意）
              </p>
              <div className="rounded-2xl border border-border p-5 space-y-3"
                style={{ background: "var(--color-cream)" }}>
                {/* Title boxes */}
                <div className="space-y-2">
                  {MOCK_MATERIALS.filter(m => m.type === "主标题框").map((mat, i) => (
                    <MockMaterialCard key={i} mat={mat} />
                  ))}
                </div>
                {/* Sub-title boxes */}
                <div className="space-y-2">
                  {MOCK_MATERIALS.filter(m => m.type === "小标题框").map((mat, i) => (
                    <MockMaterialCard key={i} mat={mat} />
                  ))}
                </div>
                {/* Tip boxes */}
                <div className="space-y-2">
                  {MOCK_MATERIALS.filter(m => m.type === "提示框").map((mat, i) => (
                    <MockMaterialCard key={i} mat={mat} />
                  ))}
                </div>
                {/* Dividers */}
                <div className="space-y-2 py-1">
                  {MOCK_MATERIALS.filter(m => m.type === "分割线").map((mat, i) => (
                    <MockMaterialCard key={i} mat={mat} />
                  ))}
                </div>
                {/* Decorations */}
                <div className="flex gap-2">
                  {MOCK_MATERIALS.filter(m => m.type === "装饰元素").map((mat, i) => (
                    <MockMaterialCard key={i} mat={mat} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.44999999999999996 }}
      viewport={{ once: true }}
            className="text-center mt-16">
            <Button
              size="lg"
              onClick={scrollToWork}
              className="font-body text-base px-10 py-6 rounded-full gap-2 shadow-sm"
              style={{ background: "var(--color-ink)", color: "var(--color-cream)" }}
            >
              <Upload className="w-4 h-4" />
              立即上传参考图，生成属于你的素材包
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── WORK AREA ────────────────────────────────────────────────────── */}
      <div ref={workAreaRef} id="work-area">
        <WorkArea />
      </div>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GooseLogo />
            <span className="font-serif text-sm font-medium" style={{ color: "var(--color-ink)" }}>
              素材鹅
            </span>
          </div>
          <p className="text-xs font-body" style={{ color: "var(--color-muted-foreground)" }}>
            上传参考图，AI 帮你生成一套能直接用于公众号排版的同风格素材
          </p>
        </div>
      </footer>
    </div>
  );
}

// ─── Goose logo SVG ────────────────────────────────────────────────────────
function GooseLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-label="素材鹅">
      {/* Body */}
      <ellipse cx="14" cy="18" rx="7" ry="5.5" fill="var(--color-cream)" stroke="var(--color-ink)" strokeWidth="1.2" />
      {/* Neck */}
      <path d="M 14 13 Q 16 10 14.5 7" stroke="var(--color-ink)" strokeWidth="3.5" strokeLinecap="round" fill="none"
        style={{ stroke: "var(--color-cream)" }} />
      <path d="M 14 13 Q 16 10 14.5 7" stroke="var(--color-ink)" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.15" />
      {/* Head */}
      <ellipse cx="14.5" cy="5.5" rx="3.5" ry="3" fill="var(--color-cream)" stroke="var(--color-ink)" strokeWidth="1.2" />
      {/* Eye */}
      <circle cx="16" cy="4.5" r="0.8" fill="var(--color-ink)" />
      {/* Beak */}
      <path d="M 17.5 5.5 L 20 5.5 L 17.5 6.5" fill="#d4a843" stroke="var(--color-ink)" strokeWidth="0.5" />
      {/* Legs */}
      <line x1="11" y1="23" x2="9" y2="26" stroke="var(--color-ink)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="17" y1="23" x2="19" y2="26" stroke="var(--color-ink)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
