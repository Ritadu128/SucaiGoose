import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { TRPCError } from "@trpc/server";

// ─── Mock dependencies ─────────────────────────────────────────────────────

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            primaryColors: ["米白 #F5F0E8", "浅灰蓝 #B8C5D0"],
            styleLabels: ["简约", "杂志感"],
            visualElements: ["圆角框", "细线分割"],
            recommendedDirections: ["标题框", "分割线"],
            overallMood: "清新淡雅，带有轻盈的编辑质感",
          }),
        },
      },
    ],
  }),
}));

vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({
    url: "https://example.com/generated-image.png",
  }),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "reference-images/test-id.png",
    url: "https://example.com/reference.png",
  }),
}));

vi.mock("./db", () => ({
  createGeneration: vi.fn().mockResolvedValue({ insertId: 42 }),
  updateGenerationStatus: vi.fn().mockResolvedValue(undefined),
  getGenerationById: vi.fn().mockResolvedValue({
    id: 42,
    referenceImageUrl: "https://example.com/reference.png",
    status: "done",
    styleAnalysis: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  createMaterial: vi.fn().mockResolvedValue(undefined),
  getMaterialsByGenerationId: vi.fn().mockResolvedValue([]),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

// ─── Context factory ───────────────────────────────────────────────────────

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── uploadImage tests ─────────────────────────────────────────────────────

describe("materials.uploadImage", () => {
  it("uploads image and returns generationId and imageUrl", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.uploadImage({
      base64: Buffer.from("fake-image-data").toString("base64"),
      mimeType: "image/png",
      filename: "test.png",
    });

    expect(result).toHaveProperty("generationId");
    expect(result).toHaveProperty("imageUrl");
    expect(typeof result.generationId).toBe("number");
    expect(typeof result.imageUrl).toBe("string");
  });

  it("accepts jpeg mimeType", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.uploadImage({
      base64: Buffer.from("fake-image-data").toString("base64"),
      mimeType: "image/jpeg",
    });

    expect(result.generationId).toBe(42);
    expect(result.imageUrl).toBe("https://example.com/reference.png");
  });

  it("rejects invalid mimeType", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.materials.uploadImage({
        base64: "abc",
        mimeType: "image/gif" as "image/png",
      })
    ).rejects.toThrow();
  });

  it("throws when storage fails", async () => {
    const { storagePut } = await import("./storage");
    vi.mocked(storagePut).mockRejectedValueOnce(new Error("S3 unavailable"));

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.materials.uploadImage({
        base64: Buffer.from("data").toString("base64"),
        mimeType: "image/png",
      })
    ).rejects.toThrow("S3 unavailable");
  });
});

// ─── analyzeStyle tests ────────────────────────────────────────────────────

describe("materials.analyzeStyle", () => {
  it("analyzes style and returns structured analysis", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.analyzeStyle({
      generationId: 42,
      imageUrl: "https://example.com/reference.png",
    });

    expect(result.generationId).toBe(42);
    expect(result.analysis).toHaveProperty("primaryColors");
    expect(result.analysis).toHaveProperty("styleLabels");
    expect(result.analysis).toHaveProperty("visualElements");
    expect(result.analysis).toHaveProperty("recommendedDirections");
    expect(result.analysis).toHaveProperty("overallMood");
    expect(Array.isArray(result.analysis.primaryColors)).toBe(true);
    expect(Array.isArray(result.analysis.styleLabels)).toBe(true);
    expect(result.analysis.primaryColors.length).toBeGreaterThan(0);
    expect(result.analysis.styleLabels.length).toBeGreaterThan(0);
  });

  it("returns fallback analysis when LLM returns invalid JSON", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [{ message: { content: "not valid json { broken" } }],
    } as Awaited<ReturnType<typeof invokeLLM>>);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.analyzeStyle({
      generationId: 42,
      imageUrl: "https://example.com/reference.png",
    });

    // Should still return a valid fallback analysis
    expect(result.analysis).toHaveProperty("primaryColors");
    expect(result.analysis.primaryColors.length).toBeGreaterThan(0);
    expect(result.analysis.overallMood).toBeTruthy();
  });

  it("returns fallback when LLM returns empty content", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    } as Awaited<ReturnType<typeof invokeLLM>>);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.analyzeStyle({
      generationId: 42,
      imageUrl: "https://example.com/reference.png",
    });

    expect(result.analysis.styleLabels.length).toBeGreaterThan(0);
  });

  it("updates generation status to analyzing then generating", async () => {
    const { updateGenerationStatus } = await import("./db");
    const mockUpdate = vi.mocked(updateGenerationStatus);
    mockUpdate.mockClear();

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.materials.analyzeStyle({
      generationId: 42,
      imageUrl: "https://example.com/reference.png",
    });

    expect(mockUpdate).toHaveBeenCalledWith(42, "analyzing");
    expect(mockUpdate).toHaveBeenCalledWith(42, "generating", expect.any(Object));
  });
});

// ─── generateMaterials tests ───────────────────────────────────────────────

describe("materials.generateMaterials", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("generates materials and returns list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.generateMaterials({
      generationId: 42,
      analysis: {
        primaryColors: ["米白 #F5F0E8", "浅灰蓝 #B8C5D0"],
        styleLabels: ["简约", "杂志感"],
        visualElements: ["圆角框", "细线分割"],
        recommendedDirections: ["标题框", "分割线"],
        overallMood: "清新淡雅",
      },
    });

    expect(result.generationId).toBe(42);
    expect(Array.isArray(result.materials)).toBe(true);
    expect(result.materials.length).toBeGreaterThan(0);

    // Each material should have required fields
    for (const mat of result.materials) {
      expect(mat).toHaveProperty("type");
      expect(mat).toHaveProperty("label");
      expect(mat).toHaveProperty("imageUrl");
      expect(typeof mat.imageUrl).toBe("string");
    }
  });

  it("generates the expected number of materials (11 total)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.generateMaterials({
      generationId: 42,
      analysis: {
        primaryColors: ["米白 #F5F0E8"],
        styleLabels: ["简约"],
        visualElements: ["圆角框"],
        recommendedDirections: ["标题框"],
        overallMood: "清新",
      },
    });

    // 2 main_title + 2 sub_title + 2 tip_box + 2 divider + 3 decoration = 11
    expect(result.materials.length).toBe(11);
  });

  it("continues generating even when one image generation fails", async () => {
    const { generateImage } = await import("./_core/imageGeneration");
    const mockGen = vi.mocked(generateImage);
    // Fail first 2, succeed rest
    mockGen
      .mockRejectedValueOnce(new Error("rate limit"))
      .mockRejectedValueOnce(new Error("rate limit"))
      .mockResolvedValue({ url: "https://example.com/generated-image.png" });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.generateMaterials({
      generationId: 42,
      analysis: {
        primaryColors: ["米白 #F5F0E8"],
        styleLabels: ["简约"],
        visualElements: ["圆角框"],
        recommendedDirections: ["标题框"],
        overallMood: "清新",
      },
    });

    // Should have 9 successful results (11 - 2 failures)
    expect(result.materials.length).toBe(9);
  });

  it("marks generation as done after completion", async () => {
    const { updateGenerationStatus } = await import("./db");
    const mockUpdate = vi.mocked(updateGenerationStatus);
    mockUpdate.mockClear();

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.materials.generateMaterials({
      generationId: 42,
      analysis: {
        primaryColors: ["米白 #F5F0E8"],
        styleLabels: ["简约"],
        visualElements: ["圆角框"],
        recommendedDirections: ["标题框"],
        overallMood: "清新",
      },
    });

    expect(mockUpdate).toHaveBeenCalledWith(42, "done");
  });
});

// ─── getGeneration tests ───────────────────────────────────────────────────

describe("materials.getGeneration", () => {
  it("returns generation with materials", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.getGeneration({ generationId: 42 });

    expect(result).not.toBeNull();
    expect(result?.id).toBe(42);
    expect(Array.isArray(result?.materials)).toBe(true);
  });

  it("returns null for non-existent generation", async () => {
    const { getGenerationById } = await import("./db");
    vi.mocked(getGenerationById).mockResolvedValueOnce(undefined);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.getGeneration({ generationId: 9999 });
    expect(result).toBeNull();
  });

  it("includes materials in the response", async () => {
    const { getMaterialsByGenerationId } = await import("./db");
    vi.mocked(getMaterialsByGenerationId).mockResolvedValueOnce([
      {
        id: 1,
        generationId: 42,
        type: "main_title",
        label: "主标题框 1",
        imageUrl: "https://example.com/mat1.png",
        prompt: "test prompt",
        sortOrder: 0,
        createdAt: new Date(),
      },
    ]);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.getGeneration({ generationId: 42 });
    expect(result?.materials).toHaveLength(1);
    expect(result?.materials[0].type).toBe("main_title");
  });
});
