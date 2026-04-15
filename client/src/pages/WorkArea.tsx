import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, Download, X, Archive, ImageIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";

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
      className="rounded-2xl border border-border p-6 space-y-5"
      style={{ background: "var(--card)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4" style={{ color: "var(--color-sand)" }} />
        <h3 className="font-serif text-base font-semibold" style={{ color: "var(--color-ink)" }}>
          风格分析结果
        </h3>
      </div>

      {/* Primary colors */}
      <div>
        <p className="text-xs font-body tracking-wider mb-2.5" style={{ color: "var(--color-muted-foreground)" }}>
          主色调
        </p>
        <div className="flex flex-wrap gap-3">
          {analysis.primaryColors.map((c, i) => {
            const { name, hex } = parseColorEntry(c);
            return (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-border shadow-sm flex-shrink-0"
                  style={{ background: hex }}
                />
                <span className="text-xs font-body" style={{ color: "var(--color-ink)" }}>
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Style labels */}
      <div>
        <p className="text-xs font-body tracking-wider mb-2.5" style={{ color: "var(--color-muted-foreground)" }}>
          风格标签
        </p>
        <div className="flex flex-wrap gap-2">
          {analysis.styleLabels.map((tag) => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </div>
      </div>

      {/* Visual elements */}
      <div>
        <p className="text-xs font-body tracking-wider mb-2.5" style={{ color: "var(--color-muted-foreground)" }}>
          视觉元素倾向
        </p>
        <div className="flex flex-wrap gap-2">
          {analysis.visualElements.map((el) => (
            <span
              key={el}
              className="text-xs font-body px-2.5 py-1 rounded-lg"
              style={{ background: "var(--color-mist-light)", color: "var(--color-ink)" }}
            >
              {el}
            </span>
          ))}
        </div>
      </div>

      {/* Recommended directions */}
      <div>
        <p className="text-xs font-body tracking-wider mb-2.5" style={{ color: "var(--color-muted-foreground)" }}>
          推荐生成方向
        </p>
        <div className="flex flex-wrap gap-2">
          {analysis.recommendedDirections.map((dir) => (
            <span
              key={dir}
              className="text-xs font-body px-2.5 py-1 rounded-lg"
              style={{ background: "var(--color-sand-light)", color: "var(--color-ink)", border: "1px solid var(--color-sand)" }}
            >
              {dir}
            </span>
          ))}
        </div>
      </div>

      {/* Overall mood */}
      <div className="pt-3 border-t border-border">
        <p className="text-xs font-body italic leading-relaxed"
          style={{ color: "var(--color-muted-foreground)" }}>
          "{analysis.overallMood}"
        </p>
      </div>
    </motion.div>
  );
}

// ─── Material Card ─────────────────────────────────────────────────────────
function MaterialCard({ material, index }: { material: MaterialItem; index: number }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (format: "png" | "jpg") => {
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group rounded-xl border border-border overflow-hidden"
      style={{ background: "var(--card)" }}
    >
      {/* Image preview */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img
          src={material.imageUrl}
          alt={material.label}
          className="w-full h-full object-contain"
          loading="lazy"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => handleDownload("png")}
            disabled={downloading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-colors"
            style={{ background: "var(--color-cream)", color: "var(--color-ink)" }}
          >
            {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            PNG
          </button>
          <button
            onClick={() => handleDownload("jpg")}
            disabled={downloading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-colors"
            style={{ background: "var(--color-cream)", color: "var(--color-ink)" }}
          >
            {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            JPG
          </button>
        </div>
      </div>
      {/* Label */}
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-body" style={{ color: "var(--color-muted-foreground)" }}>
          {material.label}
        </span>
        <ImageIcon className="w-3 h-3" style={{ color: "var(--color-muted-foreground)" }} />
      </div>
    </motion.div>
  );
}

// ─── Progress step indicator ───────────────────────────────────────────────
function ProgressStep({
  step,
  label,
  status,
}: {
  step: number;
  label: string;
  status: "pending" | "active" | "done";
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-body font-medium flex-shrink-0 transition-colors"
        style={{
          background: status === "done" ? "var(--color-sage)" : status === "active" ? "var(--color-ink)" : "var(--border)",
          color: status === "pending" ? "var(--color-muted-foreground)" : "var(--color-cream)",
        }}
      >
        {status === "done" ? <CheckCircle2 className="w-3.5 h-3.5" /> : step}
      </div>
      <span
        className="text-xs font-body"
        style={{
          color: status === "pending" ? "var(--color-muted-foreground)" : "var(--color-ink)",
          fontWeight: status === "active" ? 600 : 400,
        }}
      >
        {label}
      </span>
      {status === "active" && <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--color-ink)" }} />}
    </div>
  );
}

// ─── Main WorkArea ─────────────────────────────────────────────────────────
export default function WorkArea() {
  const [stage, setStage] = useState<Stage>("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [batchDownloading, setBatchDownloading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC mutations
  const uploadMutation = trpc.materials.uploadImage.useMutation();
  const analyzeMutation = trpc.materials.analyzeStyle.useMutation();
  const generateMutation = trpc.materials.generateMaterials.useMutation();

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

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setStage("analyzing");
    setAnalysis(null);
    setMaterials([]);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload
      const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";
      const uploadResult = await uploadMutation.mutateAsync({
        base64,
        mimeType,
        filename: file.name,
      });

      setGenerationId(uploadResult.generationId);

      // Analyze style
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
    try {
      const result = await generateMutation.mutateAsync({
        generationId,
        analysis,
      });
      setMaterials(result.materials);
      setStage("done");
      toast.success(`已生成 ${result.materials.length} 个素材！`);
    } catch (err) {
      console.error(err);
      toast.error("生成失败，请重试");
      setStage("error");
    }
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

  // ─── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStage("upload");
    setPreviewUrl(null);
    setGenerationId(null);
    setAnalysis(null);
    setMaterials([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  return (
    <section
      className="py-24 px-6"
      style={{ background: "var(--color-cream)" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-body tracking-widest mb-3" style={{ color: "var(--color-muted-foreground)" }}>
            开始生成
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold" style={{ color: "var(--color-ink)" }}>
            上传你的参考图
          </h2>
        </div>

        {/* Progress indicator */}
        {stage !== "upload" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-6 mb-10 flex-wrap"
          >
            <ProgressStep step={1} label="上传图片" status={getStepStatus("analyzing") === "pending" ? "pending" : "done"} />
            <div className="w-8 h-px" style={{ background: "var(--border)" }} />
            <ProgressStep step={2} label="分析风格" status={stage === "analyzing" ? "active" : stage === "analyzed" || stage === "generating" || stage === "done" ? "done" : "pending"} />
            <div className="w-8 h-px" style={{ background: "var(--border)" }} />
            <ProgressStep step={3} label="生成素材" status={stage === "generating" ? "active" : stage === "done" ? "done" : "pending"} />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left column: upload + analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload zone */}
            <div>
              {stage === "upload" ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 p-10 min-h-[280px]"
                  style={{
                    borderColor: isDragging ? "var(--color-ink)" : "var(--border)",
                    background: isDragging ? "var(--color-sand-light)" : "var(--card)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--color-sand-light)" }}
                  >
                    <Upload className="w-6 h-6" style={{ color: "var(--color-ink)" }} />
                  </div>
                  <div className="text-center">
                    <p className="font-body font-medium mb-1" style={{ color: "var(--color-ink)" }}>
                      拖拽图片到这里，或点击上传
                    </p>
                    <p className="text-xs font-body" style={{ color: "var(--color-muted-foreground)" }}>
                      支持 PNG / JPG，最大 10MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-border"
                  style={{ background: "var(--card)" }}>
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="参考图"
                      className="w-full object-cover max-h-72"
                    />
                  )}
                  <button
                    onClick={handleReset}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                    title="重新上传"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                  <div className="px-4 py-3 border-t border-border">
                    <p className="text-xs font-body" style={{ color: "var(--color-muted-foreground)" }}>
                      参考图已上传
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Style analysis card */}
            <AnimatePresence>
              {stage === "analyzing" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-border p-6 flex items-center gap-3"
                  style={{ background: "var(--card)" }}
                >
                  <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" style={{ color: "var(--color-ink)" }} />
                  <div>
                    <p className="font-body text-sm font-medium" style={{ color: "var(--color-ink)" }}>
                      正在分析图片风格…
                    </p>
                    <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
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
                  className="rounded-2xl border border-destructive/30 p-5 flex items-center gap-3"
                  style={{ background: "oklch(98% 0.01 25)" }}
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: "var(--destructive)" }} />
                  <div>
                    <p className="font-body text-sm font-medium" style={{ color: "var(--destructive)" }}>
                      出现错误
                    </p>
                    <button
                      onClick={handleReset}
                      className="text-xs font-body underline mt-0.5"
                      style={{ color: "var(--color-muted-foreground)" }}
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
                <Button
                  size="lg"
                  onClick={handleGenerate}
                  className="w-full font-body text-base py-6 rounded-xl gap-2"
                  style={{ background: "var(--color-ink)", color: "var(--color-cream)" }}
                >
                  <Sparkles className="w-4 h-4" />
                  生成素材包（8–12 个）
                </Button>
                <p className="text-xs font-body text-center mt-2" style={{ color: "var(--color-muted-foreground)" }}>
                  预计需要 30–60 秒
                </p>
              </motion.div>
            )}

            {stage === "generating" && (
              <div className="rounded-xl border border-border p-5 flex items-center gap-3"
                style={{ background: "var(--card)" }}>
                <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" style={{ color: "var(--color-ink)" }} />
                <div>
                  <p className="font-body text-sm font-medium" style={{ color: "var(--color-ink)" }}>
                    正在生成素材…
                  </p>
                  <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                    AI 正在生成主标题框、提示框、分割线等素材
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right column: materials grid */}
          <div className="lg:col-span-3">
            {stage === "upload" && (
              <div className="h-full min-h-[280px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3"
                style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "var(--color-sand-light)" }}>
                  <ImageIcon className="w-5 h-5" style={{ color: "var(--color-muted-foreground)" }} />
                </div>
                <p className="text-sm font-body" style={{ color: "var(--color-muted-foreground)" }}>
                  上传参考图后，素材将在这里展示
                </p>
              </div>
            )}

            {(stage === "analyzing" || stage === "analyzed" || stage === "generating") && materials.length === 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-xl aspect-video animate-shimmer" />
                ))}
              </div>
            )}

            {materials.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Batch download bar */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-body font-medium" style={{ color: "var(--color-ink)" }}>
                    已生成 {materials.length} 个素材
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchDownload}
                    disabled={batchDownloading}
                    className="font-body text-xs gap-1.5 rounded-full"
                    style={{ borderColor: "var(--color-ink)", color: "var(--color-ink)" }}
                  >
                    {batchDownloading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Archive className="w-3 h-3" />
                    )}
                    一键打包下载 ZIP
                  </Button>
                </div>

                {/* Materials grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {materials.map((mat, i) => (
                    <MaterialCard key={i} material={mat} index={i} />
                  ))}
                </div>

                {/* Usage hint */}
                <div className="mt-6 rounded-xl p-4 border border-border"
                  style={{ background: "var(--color-sand-light)" }}>
                  <p className="text-xs font-body leading-relaxed" style={{ color: "var(--color-ink)" }}>
                    <strong>下一步：</strong>将下载的素材导入 Canva、秀米、135 编辑器等工具，直接用于公众号排版。
                    透明背景素材推荐使用 PNG 格式。
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
