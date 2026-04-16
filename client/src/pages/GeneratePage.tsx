import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, Download, X, Archive, ImageIcon, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useLocation } from "wouter";

// ─── Types ─────────────────────────────────────────────────────────────────
interface StyleAnalysis {
  primaryColors: string[];
  styleLabels: string[];
  visualElements: string[];
  recommendedDirections: string[];
  overallMood: string;
}

interface MaterialItem {
  type: string;
  label: string;
  imageUrl: string;
  prompt: string;
}

type Stage = "upload" | "analyzing" | "analyzed" | "generating" | "done" | "error";

const TOTAL_MATERIALS = 11;

// ─── Color swatch parser ───────────────────────────────────────────────────
function parseColorEntry(entry: string): { name: string; hex: string } {
  const hexMatch = entry.match(/#([0-9A-Fa-f]{3,6})/);
  const hex = hexMatch ? hexMatch[0] : "#888";
  const name = entry.replace(/#[0-9A-Fa-f]{3,6}/, "").trim().replace(/^[-\s]+/, "");
  return { name: name || hex, hex };
}

// ─── Style Analysis Card ───────────────────────────────────────────────────
function StyleCard({ analysis }: { analysis: StyleAnalysis }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Sparkles size={14} color="#E8441A" />
        <h3 style={{
          fontFamily: "var(--font-display)",
          fontSize: "15px",
          fontWeight: 600,
          color: "#111",
          margin: 0,
          letterSpacing: "-0.02em",
        }}>
          风格分析结果
        </h3>
      </div>

      {/* Primary colors */}
      <div>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: "8px" }}>
          主色调
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {analysis.primaryColors.map((c, i) => {
            const { name, hex } = parseColorEntry(c);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: hex, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "#555" }}>{name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Style labels */}
      <div>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: "8px" }}>
          风格标签
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {analysis.styleLabels.map((tag) => (
            <span key={tag} style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              fontWeight: 600,
              background: "#111",
              color: "#fff",
              padding: "3px 10px",
              borderRadius: "100px",
              letterSpacing: "0.04em",
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Visual elements */}
      <div>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: "8px" }}>
          视觉元素倾向
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {analysis.visualElements.map((el) => (
            <span key={el} style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              background: "#f5f5f5",
              color: "#555",
              padding: "3px 10px",
              borderRadius: "6px",
              border: "1px solid rgba(0,0,0,0.06)",
            }}>
              {el}
            </span>
          ))}
        </div>
      </div>

      {/* Recommended directions */}
      <div>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: "8px" }}>
          推荐生成方向
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {analysis.recommendedDirections.map((dir) => (
            <span key={dir} style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              background: "#fff",
              color: "#E8441A",
              padding: "3px 10px",
              borderRadius: "6px",
              border: "1.5px solid #E8441A",
            }}>
              {dir}
            </span>
          ))}
        </div>
      </div>

      {/* Overall mood */}
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "12px" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "#888", fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>
          "{analysis.overallMood}"
        </p>
      </div>
    </motion.div>
  );
}

// ─── Material Card ─────────────────────────────────────────────────────────
function MaterialCard({ material, index }: { material: MaterialItem; index: number }) {
  const [downloading, setDownloading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleDownload = async (format: "png" | "jpg") => {
    if (!material.imageUrl) {
      toast.error("图片 URL 无效，无法下载");
      return;
    }
    setDownloading(true);
    try {
      const response = await fetch(material.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${material.label}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("下载失败，请重试");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: "10px",
        overflow: "hidden",
        position: "relative",
      }}
      className="group"
    >
      {/* Image preview */}
      <div style={{ position: "relative", aspectRatio: "16/9", background: "#f5f5f5", overflow: "hidden" }}>
        {material.imageUrl && !imgError ? (
          <img
            src={material.imageUrl}
            alt={material.label}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: "8px",
          }}>
            <ImageIcon size={24} color="#ccc" />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#ccc" }}>
              {imgError ? "图片加载失败" : "暂无图片"}
            </span>
          </div>
        )}
        {/* Hover overlay */}
        {material.imageUrl && !imgError && (
          <div
            className="group-hover:opacity-100"
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              opacity: 0,
              transition: "opacity 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <button
              onClick={() => handleDownload("png")}
              disabled={downloading}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "6px 12px",
                borderRadius: "100px",
                background: "#fff",
                color: "#111",
                border: "none",
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              {downloading ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
              PNG
            </button>
            <button
              onClick={() => handleDownload("jpg")}
              disabled={downloading}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "6px 12px",
                borderRadius: "100px",
                background: "#fff",
                color: "#111",
                border: "none",
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {downloading ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
              JPG
            </button>
          </div>
        )}
      </div>
      {/* Label */}
      <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#888" }}>
          {material.label}
        </span>
        <ImageIcon size={11} color="#ccc" />
      </div>
    </motion.div>
  );
}

// ─── Skeleton card ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      aspectRatio: "16/9",
      borderRadius: "8px",
      background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    }} />
  );
}

// ─── Progress step indicator ───────────────────────────────────────────────
function ProgressStep({
  label,
  status,
}: {
  step: number;
  label: string;
  status: "pending" | "active" | "done";
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{
        width: 24, height: 24,
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: status === "done" ? "#111" : status === "active" ? "#fff" : "#f0f0f0",
        border: status === "active" ? "2px solid #E8441A" : status === "done" ? "none" : "2px solid #e0e0e0",
        transition: "all 0.3s",
        flexShrink: 0,
      }}>
        {status === "done" && <CheckCircle2 size={13} color="#fff" />}
        {status === "active" && <Loader2 size={12} className="animate-spin" color="#E8441A" />}
      </div>
      <span style={{
        fontFamily: "var(--font-sans)",
        fontSize: "12px",
        fontWeight: status === "active" ? 600 : 400,
        color: status === "active" ? "#111" : status === "done" ? "#555" : "#bbb",
        transition: "color 0.3s",
      }}>
        {label}
      </span>
    </div>
  );
}

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

// ─── Main GeneratePage ─────────────────────────────────────────────────────
export default function GeneratePage() {
  const [, navigate] = useLocation();
  const [stage, setStage] = useState<Stage>("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(0);
  const stageRef = useRef<Stage>("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC mutations
  const uploadMutation = trpc.materials.uploadImage.useMutation();
  const analyzeMutation = trpc.materials.analyzeStyle.useMutation();
  const generateMutation = trpc.materials.generateMaterials.useMutation();

  // tRPC query for polling during generation
  const pollQuery = trpc.materials.getGeneration.useQuery(
    { generationId: generationId ?? 0 },
    {
      enabled: stage === "generating" && generationId !== null,
      refetchInterval: 2500,
      refetchIntervalInBackground: false,
      staleTime: 0,
    }
  );

  // Sync polled materials into state while generating
  useEffect(() => {
    if (stageRef.current !== "generating") return;
    const polled = pollQuery.data?.materials;
    if (!polled || polled.length === 0) return;

    const mapped: MaterialItem[] = polled
      .filter((m) => m.imageUrl && m.imageUrl.length > 0)
      .map((m) => ({
        type: m.type,
        label: m.label ?? "",
        imageUrl: m.imageUrl,
        prompt: m.prompt ?? "",
      }));
    setMaterials(mapped);
    setGeneratingCount(mapped.length);
  }, [pollQuery.data]);

  // Keep stageRef in sync
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  // ─── File processing ─────────────────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      toast.error("请上传 PNG 或 JPG 格式的图片");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("图片大小不能超过 10MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setStage("analyzing");
    setAnalysis(null);
    setMaterials([]);
    setGeneratingCount(0);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";
      const uploadResult = await uploadMutation.mutateAsync({
        base64,
        mimeType,
        filename: file.name,
      });

      setGenerationId(uploadResult.generationId);

      const analyzeResult = await analyzeMutation.mutateAsync({
        generationId: uploadResult.generationId,
        imageUrl: uploadResult.imageUrl,
      });

      setAnalysis(analyzeResult.analysis);
      setStage("analyzed");
    } catch (err) {
      console.error(err);
      toast.error("分析失败，请重试");
      setStage("error");
    }
  }, [uploadMutation, analyzeMutation]);

  // ─── Drag & drop handlers ─────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // ─── Generate materials ───────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!generationId || !analysis) return;
    setStage("generating");
    setMaterials([]);
    setGeneratingCount(0);
    try {
      const result = await generateMutation.mutateAsync({
        generationId,
        analysis,
      });
      // Final sync: use the definitive result from mutation
      const mapped: MaterialItem[] = result.materials
        .filter((m) => m.imageUrl && m.imageUrl.length > 0)
        .map((m) => ({
          type: m.type,
          label: m.label ?? "",
          imageUrl: m.imageUrl,
          prompt: m.prompt ?? "",
        }));
      setMaterials(mapped);
      setGeneratingCount(mapped.length);
      setStage("done");
      toast.success(`已生成 ${mapped.length} 个素材！`);
    } catch (err) {
      console.error(err);
      toast.error("生成失败，请重试");
      setStage("error");
    }
  };

  // ─── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStage("upload");
    setPreviewUrl(null);
    setGenerationId(null);
    setAnalysis(null);
    setMaterials([]);
    setGeneratingCount(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Batch download ───────────────────────────────────────────────────────
  const handleBatchDownload = async () => {
    if (materials.length === 0) return;
    setBatchDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("素材鹅-素材包");
      if (!folder) throw new Error("Failed to create zip folder");

      await Promise.all(
        materials.map(async (mat, i) => {
          if (!mat.imageUrl) return;
          const response = await fetch(mat.imageUrl);
          const blob = await response.blob();
          const ext = blob.type.includes("png") ? "png" : "jpg";
          folder.file(`${String(i + 1).padStart(2, "0")}-${mat.label}.${ext}`, blob);
        })
      );

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "素材鹅-素材包.zip");
      toast.success("素材包已打包下载！");
    } catch {
      toast.error("打包下载失败，请重试");
    } finally {
      setBatchDownloading(false);
    }
  };

  // ─── Progress steps ───────────────────────────────────────────────────────
  const getStepStatus = (stepStage: Stage): "pending" | "active" | "done" => {
    const order: Stage[] = ["upload", "analyzing", "analyzed", "generating", "done"];
    const current = order.indexOf(stage);
    const target = order.indexOf(stepStage);
    if (current > target) return "done";
    if (current === target) return "active";
    return "pending";
  };

  // How many skeletons to show while generating
  const skeletonCount = stage === "generating"
    ? Math.max(0, TOTAL_MATERIALS - materials.length)
    : 0;

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
        <div style={{ width: "80px" }} />
      </nav>

      {/* ─── Main Content ────────────────────────────────────────────────── */}
      <section style={{ padding: "60px 24px 80px", background: "#fff" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: "48px" }}>
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
              开始生成
            </span>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 700,
              color: "#111",
              letterSpacing: "-0.03em",
              margin: 0,
              lineHeight: 1.1,
            }}>
              上传你的参考图
            </h1>
          </div>

          {/* Progress indicator */}
          <AnimatePresence>
            {stage !== "upload" && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "32px",
                  flexWrap: "wrap",
                }}
              >
                <ProgressStep step={1} label="上传图片" status={getStepStatus("analyzing") === "pending" ? "pending" : "done"} />
                <div style={{ width: "24px", height: "1px", background: "rgba(0,0,0,0.12)" }} />
                <ProgressStep step={2} label="分析风格" status={stage === "analyzing" ? "active" : stage === "analyzed" || stage === "generating" || stage === "done" ? "done" : "pending"} />
                <div style={{ width: "24px", height: "1px", background: "rgba(0,0,0,0.12)" }} />
                <ProgressStep step={3} label="生成素材" status={stage === "generating" ? "active" : stage === "done" ? "done" : "pending"} />
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "32px", alignItems: "start" }}>
            {/* Left column: upload + analysis */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Upload zone */}
              {stage === "upload" ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? "#111" : "rgba(0,0,0,0.15)"}`,
                    borderRadius: "12px",
                    background: isDragging ? "#f9f9f9" : "#fff",
                    minHeight: "260px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    padding: "32px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{
                    width: 48, height: 48,
                    background: "#f5f5f5",
                    borderRadius: "12px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Upload size={22} color="#888" />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "#111", margin: "0 0 4px" }}>
                      拖拽图片到这里，或点击上传
                    </p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "#aaa", margin: 0 }}>
                      支持 PNG / JPG，最大 10MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="参考图"
                      style={{ width: "100%", objectFit: "cover", maxHeight: "260px", display: "block" }}
                    />
                  )}
                  <button
                    onClick={handleReset}
                    style={{
                      position: "absolute", top: "10px", right: "10px",
                      width: 28, height: 28,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.5)",
                      border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                      color: "#fff",
                    }}
                    title="重新上传"
                  >
                    <X size={14} />
                  </button>
                  <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#aaa", margin: 0 }}>
                      参考图已上传
                    </p>
                  </div>
                </div>
              )}

              {/* Style analysis card */}
              <AnimatePresence>
                {stage === "analyzing" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      background: "#fff",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Loader2 size={16} className="animate-spin" color="#E8441A" style={{ flexShrink: 0 }} />
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "#111", margin: "0 0 2px" }}>
                        正在分析图片风格…
                      </p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#aaa", margin: 0 }}>
                        AI 正在提取配色、风格标签和视觉元素
                      </p>
                    </div>
                  </motion.div>
                )}
                {(stage === "analyzed" || stage === "generating" || stage === "done") && analysis && (
                  <StyleCard analysis={analysis} />
                )}
                {stage === "error" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      background: "#fff",
                      border: "1.5px solid #E8441A",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <AlertCircle size={16} color="#E8441A" style={{ flexShrink: 0 }} />
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "#E8441A", margin: "0 0 2px" }}>
                        出现错误
                      </p>
                      <button
                        onClick={handleReset}
                        style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#aaa", background: "none", border: "none", padding: 0, textDecoration: "underline", cursor: "pointer" }}
                      >
                        重新上传图片
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generate button */}
              {stage === "analyzed" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <button
                    onClick={handleGenerate}
                    style={{
                      width: "100%",
                      fontFamily: "var(--font-sans)",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#fff",
                      background: "#111",
                      border: "none",
                      padding: "14px 20px",
                      borderRadius: "100px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      cursor: "pointer",
                      boxShadow: "0 2px 0 rgba(0,0,0,0.15)",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#E8441A"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#111"; }}
                  >
                    <Sparkles size={15} />
                    生成素材包（8–12 个）
                  </button>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#aaa", textAlign: "center", marginTop: "8px" }}>
                    预计需要 20–60 秒，素材将逐批出现
                  </p>
                </motion.div>
              )}

              {/* Generating progress */}
              {stage === "generating" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Loader2 size={14} className="animate-spin" color="#E8441A" style={{ flexShrink: 0 }} />
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "#111", margin: 0 }}>
                      正在生成素材…
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ flex: 1, height: 4, background: "#f0f0f0", borderRadius: "2px", overflow: "hidden" }}>
                      <motion.div
                        animate={{ width: `${(generatingCount / TOTAL_MATERIALS) * 100}%` }}
                        transition={{ duration: 0.4 }}
                        style={{ height: "100%", background: "#111", borderRadius: "2px" }}
                      />
                    </div>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#888", flexShrink: 0 }}>
                      {generatingCount}/{TOTAL_MATERIALS}
                    </span>
                  </div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#aaa", margin: 0 }}>
                    素材将逐批出现，请稍候…
                  </p>
                </motion.div>
              )}

              {/* Done: batch download */}
              {stage === "done" && materials.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <button
                    onClick={handleBatchDownload}
                    disabled={batchDownloading}
                    style={{
                      width: "100%",
                      fontFamily: "var(--font-sans)",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#fff",
                      background: "#111",
                      border: "none",
                      padding: "14px 20px",
                      borderRadius: "100px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      cursor: batchDownloading ? "not-allowed" : "pointer",
                      opacity: batchDownloading ? 0.6 : 1,
                      boxShadow: "0 2px 0 rgba(0,0,0,0.15)",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={e => { if (!batchDownloading) e.currentTarget.style.background = "#E8441A"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#111"; }}
                  >
                    {batchDownloading ? <Loader2 size={15} className="animate-spin" /> : <Archive size={15} />}
                    {batchDownloading ? "打包中…" : `批量下载全部 ${materials.length} 个素材`}
                  </button>
                  <button
                    onClick={handleReset}
                    style={{
                      width: "100%",
                      fontFamily: "var(--font-sans)",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#888",
                      background: "none",
                      border: "none",
                      padding: "10px",
                      cursor: "pointer",
                      marginTop: "4px",
                    }}
                  >
                    重新上传参考图
                  </button>
                </motion.div>
              )}
            </div>

            {/* Right column: materials grid */}
            <div>
              {(stage === "generating" || stage === "done") && (
                <div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}>
                    <h3 style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#111",
                      letterSpacing: "-0.02em",
                      margin: 0,
                    }}>
                      {stage === "done" ? `素材包（${materials.length} 个）` : "生成中…"}
                    </h3>
                    {stage === "done" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckCircle2 size={14} color="#111" />
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "#888" }}>
                          已完成
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "12px",
                  }}>
                    {materials.map((mat, i) => (
                      <MaterialCard key={`${mat.type}-${i}`} material={mat} index={i} />
                    ))}
                    {Array.from({ length: skeletonCount }).map((_, i) => (
                      <SkeletonCard key={`skeleton-${i}`} />
                    ))}
                  </div>
                </div>
              )}

              {/* Upload prompt when no generation started */}
              {(stage === "upload" || stage === "analyzing" || stage === "analyzed" || stage === "error") && (
                <div style={{
                  height: "300px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  border: "1px dashed rgba(0,0,0,0.1)",
                  borderRadius: "12px",
                  background: "#fafafa",
                }}>
                  <div style={{
                    width: 48, height: 48,
                    background: "#f0f0f0",
                    borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <ImageIcon size={20} color="#ccc" />
                  </div>
                  <p style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "13px",
                    color: "#ccc",
                    margin: 0,
                    textAlign: "center",
                  }}>
                    {stage === "analyzed" ? "点击「生成素材包」开始生成" : "上传参考图后，素材将在这里显示"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
