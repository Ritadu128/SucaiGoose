import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import { InsertUser, users, generations, materials, InsertGeneration, InsertMaterial } from "../drizzle/schema";
import { ENV } from './_core/env';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pool: any = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getPool() {
  if (!_pool && process.env.DATABASE_URL) {
    _pool = createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 5,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      multipleStatements: false,
    });
  }
  return _pool;
}

export async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  try {
    if (!_db) {
      _db = drizzle(getPool());
    }
    return _db;
  } catch (error) {
    console.warn("[Database] Failed to initialize:", error);
    _db = null;
    _pool = null;
    return null;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Generation helpers ────────────────────────────────────────────────────

export async function createGeneration(data: InsertGeneration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(generations).values(data);
  return result[0];
}

export async function updateGenerationStatus(
  id: number,
  status: "pending" | "analyzing" | "generating" | "done" | "error",
  styleAnalysis?: unknown
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { status };
  if (styleAnalysis !== undefined) updateData.styleAnalysis = styleAnalysis;
  await db.update(generations).set(updateData).where(eq(generations.id, id));
}

export async function getGenerationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(generations).where(eq(generations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Material helpers ──────────────────────────────────────────────────────

export async function createMaterial(data: InsertMaterial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(materials).values(data);
}

export async function getMaterialsByGenerationId(generationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(materials).where(eq(materials.generationId, generationId));
}
