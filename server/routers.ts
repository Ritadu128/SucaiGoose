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
  recommendedDirections: string[];// e.g. ["标题框", "文字框", "分割线"]
  overallMood: string;            // e.g. "清新淡雅，带有轻盈的编辑质感"
}

// ─── Material type definitions ─────────────────────────────────────────────

const MATERIAL_PLAN = [
  { type: "main_title" as const,  label: "主标题框", count: 2 },
  { type: "sub_title" as const,   label: "小标题框", count: 2 },
  { type: "tip_box" as const,     label: "文字框",   count: 2 },
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
  "recommendedDirections": ["推荐生成方向"],  // 如：标题框、文字框、分割线、装饰元素
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

  // Shared strict rule appended to every prompt
  const STRICT_RULES = `
CRITICAL RULES — strictly follow all of these:
- ABSOLUTELY NO text, letters, words, numbers, Chinese characters, or symbols of any kind anywhere in the image — not even decorative lettering, watermarks, or placeholder text
- The central area must be completely blank / empty white space so the user can overlay their own text
- This is a background template tile, NOT a finished design — keep it minimal and unobtrusive
- Style: ${styleStr}
- Color palette: ${colorStr}
- Visual elements: ${elemStr}
- Overall mood: ${style.overallMood}
- Variant ${index + 1}: subtly different composition from other variants of the same type
- High quality, ready to use as a WeChat article layout background`;

  const typeGuides: Record<string, string> = {
    main_title:
      `A wide horizontal banner background for a WeChat article main title. ` +
      `Collage-style or paper-cut color block aesthetic. ` +
      `Aspect ratio approximately 4:1 or 3:1. ` +
      `The center must be a large blank white or near-white area — no text, no shapes in the center. ` +
      `Decorative elements (torn paper edges, color blocks, subtle texture) only at the edges or corners. ` +
      `Feels like a designer's scrapbook background tile.`,

    sub_title:
      `A narrow horizontal banner background for a WeChat article section subtitle. ` +
      `Same collage / paper-cut style as the main title but smaller, narrower, more compact. ` +
      `Aspect ratio approximately 5:1 or 6:1. ` +
      `More understated and quieter than the main title. ` +
      `Center must be blank white space. Decorative accents only at the far left or right edges.`,

    tip_box:
      `A simple clean text-box background for body copy in a WeChat article. ` +
      `Solid color, semi-transparent, or very light tinted background. ` +
      `Subtle texture allowed: folded-paper grain, tiny dot pattern, or soft linen texture — nothing distracting. ` +
      `Aspect ratio approximately 2:1 or 3:2. ` +
      `The entire interior must be blank — no text, no icons, no decorative shapes inside. ` +
      `A thin border or soft shadow is acceptable. Prioritize readability.`,

    divider:
      `Two horizontal divider line assets on a white background, arranged vertically in the image. ` +
      `Top divider: a single long thin horizontal line spanning nearly the full width, clean and simple. ` +
      `Bottom divider: a shorter decorative line — for example two short dashes flanking a tiny heart or small diamond in the center. ` +
      `Aspect ratio of the whole image approximately 8:1 or 10:1. ` +
      `Lines should be thin, elegant, and minimal. No text anywhere.`,

    decoration:
      `A small standalone decorative graphic element for WeChat article layout. ` +
      `Examples: a small heart, star cluster, dot pattern, tiny flower, arrow, or corner ornament. ` +
      `Near-square aspect ratio. ` +
      `Should feel like it belongs to the same design system as the other elements. ` +
      `Transparent or white background. No text or letters of any kind.`,
  };

  return `${typeGuides[type] || label}${STRICT_RULES}`;
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
            recommendedDirections: ["标题框", "文字框", "分割线", "装饰元素"],
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
