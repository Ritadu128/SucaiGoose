import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import {
  createGeneration,
  updateGenerationStatus,
  getGenerationById,
  createMaterial,
  getMaterialsByGenerationId,
} from "./db";
import { z } from "zod";
import { nanoid } from "nanoid";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface StyleAnalysis {
  primaryColors: string[];        // e.g. ["米白 #F5F0E8", "浅灰蓝 #B8C5D0"]
  styleLabels: string[];          // e.g. ["简约", "杂志感", "奶油感"]
  visualElements: string[];       // e.g. ["圆角框", "细线分割", "小装饰点"]
  recommendedDirections: string[];// e.g. ["标题框", "提示框", "分割线"]
  overallMood: string;            // e.g. "清新淡雅，带有轻盈的编辑质感"
}

// ─── Material type definitions ─────────────────────────────────────────────

const MATERIAL_PLAN = [
  { type: "main_title" as const,  label: "主标题框", count: 2 },
  { type: "sub_title" as const,   label: "小标题框", count: 2 },
  { type: "tip_box" as const,     label: "提示框",   count: 2 },
  { type: "divider" as const,     label: "分割线",   count: 2 },
  { type: "decoration" as const,  label: "装饰元素", count: 3 },
];

// ─── Prompt builders ───────────────────────────────────────────────────────

function buildAnalysisPrompt(): string {
  return `你是一位专业的视觉设计师，请分析这张参考图的视觉风格，以 JSON 格式返回以下信息：

{
  "primaryColors": ["颜色描述 + 色值，如：米白 #F5F0E8"],  // 2-4 个主色调
  "styleLabels": ["风格标签"],  // 3-5 个，如：简约、杂志感、奶油感、轻拼贴、手账感、复古
  "visualElements": ["视觉元素倾向"],  // 3-5 个，如：圆角框、纸张纹理、细线分割、胶带、小装饰点
  "recommendedDirections": ["推荐生成方向"],  // 如：标题框、提示框、分割线、装饰元素
  "overallMood": "一句话描述整体氛围"
}

请严格返回 JSON，不要包含任何其他文字。`;
}

function buildMaterialPrompt(
  type: string,
  label: string,
  index: number,
  style: StyleAnalysis
): string {
  const colorStr = style.primaryColors.join("、");
  const styleStr = style.styleLabels.join("、");
  const elemStr = style.visualElements.join("、");

  const typeGuides: Record<string, string> = {
    main_title: `公众号主标题框素材，宽横幅设计，突出标题文字区域，留有文字占位空间，尺寸比例约 4:1 或 3:1`,
    sub_title: `公众号小标题框素材，较窄横幅，适合段落小标题，尺寸比例约 3:1`,
    tip_box: `公众号提示框/引用框素材，带有边框或背景色块，适合放置提示文字，尺寸比例约 2:1`,
    divider: `公众号分割线素材，细长横向装饰线条，可带有装饰元素，尺寸比例约 8:1 或 10:1`,
    decoration: `公众号装饰元素素材，小型独立装饰图形，如角标、小图标、装饰点，接近正方形`,
  };

  return `Create a ${label} graphic element for WeChat Official Account (公众号) layout.

Style: ${styleStr}
Color palette: ${colorStr}
Visual elements: ${elemStr}
Overall mood: ${style.overallMood}

Design requirements:
- ${typeGuides[type] || label}
- Pure graphic element, NO real text content, use placeholder lines or shapes for text areas
- Clean white or transparent-friendly background
- Flat design, minimal and editorial aesthetic
- Variant ${index + 1}: slightly different composition from other variants
- High quality, ready to use in WeChat article layout
- Soft, clean, modern editorial style`;
}

// ─── Router ────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Image upload ──────────────────────────────────────────────────────
  materials: router({
    uploadImage: publicProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        filename: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType === "image/png" ? "png" : "jpg";
        const key = `reference-images/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);

        // Create a generation record
        const result = await createGeneration({
          referenceImageUrl: url,
          status: "pending",
        });
        const insertId = (result as unknown as { insertId: number }).insertId;

        return { generationId: insertId, imageUrl: url };
      }),

    // ─── Style analysis ──────────────────────────────────────────────────
    analyzeStyle: publicProcedure
      .input(z.object({
        generationId: z.number(),
        imageUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        await updateGenerationStatus(input.generationId, "analyzing");

        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: input.imageUrl, detail: "high" },
                },
                {
                  type: "text",
                  text: buildAnalysisPrompt(),
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "style_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  primaryColors: { type: "array", items: { type: "string" } },
                  styleLabels: { type: "array", items: { type: "string" } },
                  visualElements: { type: "array", items: { type: "string" } },
                  recommendedDirections: { type: "array", items: { type: "string" } },
                  overallMood: { type: "string" },
                },
                required: ["primaryColors", "styleLabels", "visualElements", "recommendedDirections", "overallMood"],
                additionalProperties: false,
              },
            },
          },
        });

        const raw = response.choices[0]?.message?.content;
        let analysis: StyleAnalysis;
        try {
          if (!raw || typeof raw !== "string") throw new Error("empty content");
          analysis = JSON.parse(raw);
        } catch {
          // Fallback analysis
          analysis = {
            primaryColors: ["米白 #F5F0E8", "浅灰蓝 #B8C5D0", "暖沙色 #D4C4A8"],
            styleLabels: ["简约", "杂志感", "奶油感"],
            visualElements: ["圆角框", "细线分割", "小装饰点"],
            recommendedDirections: ["标题框", "提示框", "分割线", "装饰元素"],
            overallMood: "清新淡雅，带有轻盈的编辑质感",
          };
        }

        await updateGenerationStatus(input.generationId, "generating", analysis);
        return { generationId: input.generationId, analysis };
      }),

    // ─── Generate materials ───────────────────────────────────────────────
    generateMaterials: publicProcedure
      .input(z.object({
        generationId: z.number(),
        analysis: z.object({
          primaryColors: z.array(z.string()),
          styleLabels: z.array(z.string()),
          visualElements: z.array(z.string()),
          recommendedDirections: z.array(z.string()),
          overallMood: z.string(),
        }),
      }))
      .mutation(async ({ input }) => {
        const { generationId, analysis } = input;

        // Build all generation tasks
        const tasks: Array<{ type: typeof MATERIAL_PLAN[number]["type"]; label: string; index: number }> = [];
        for (const plan of MATERIAL_PLAN) {
          for (let i = 0; i < plan.count; i++) {
            tasks.push({ type: plan.type, label: plan.label, index: i });
          }
        }

        // Generate images in parallel batches of 3 to balance speed and rate limits
        const BATCH_SIZE = 3;
        const results: Array<{ type: string; label: string; imageUrl: string; prompt: string }> = [];

        for (let batchStart = 0; batchStart < tasks.length; batchStart += BATCH_SIZE) {
          const batch = tasks.slice(batchStart, batchStart + BATCH_SIZE);
          const batchResults = await Promise.allSettled(
            batch.map(async (task, batchIdx) => {
              const sortOrder = batchStart + batchIdx;
              const prompt = buildMaterialPrompt(task.type, task.label, task.index, analysis);
              const genResult = await generateImage({ prompt });
              const url: string = genResult.url ?? "";
              await createMaterial({
                generationId,
                type: task.type,
                label: `${task.label} ${task.index + 1}`,
                imageUrl: url,
                prompt,
                sortOrder,
              });
              return { type: task.type as string, label: `${task.label} ${task.index + 1}`, imageUrl: url, prompt };
            })
          );
          for (const r of batchResults) {
            if (r.status === "fulfilled") {
              results.push(r.value);
            } else {
              console.error(`[generateMaterials] Batch item failed:`, r.reason);
            }
          }
        }

        await updateGenerationStatus(generationId, "done");
        return { generationId, materials: results };
      }),

    // ─── Get generation with materials ───────────────────────────────────
    getGeneration: publicProcedure
      .input(z.object({ generationId: z.number() }))
      .query(async ({ input }) => {
        const gen = await getGenerationById(input.generationId);
        if (!gen) return null;
        const mats = await getMaterialsByGenerationId(input.generationId);
        return { ...gen, materials: mats };
      }),
  }),
});

export type AppRouter = typeof appRouter;
