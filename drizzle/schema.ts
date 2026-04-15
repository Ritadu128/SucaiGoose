import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Stores each generation session (one reference image → one set of materials)
export const generations = mysqlTable("generations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  referenceImageUrl: text("referenceImageUrl").notNull(),
  styleAnalysis: json("styleAnalysis"), // StyleAnalysis JSON
  status: mysqlEnum("status", ["pending", "analyzing", "generating", "done", "error"])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = typeof generations.$inferInsert;

// Each generated material asset
export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  generationId: int("generationId").notNull(),
  type: mysqlEnum("type", ["main_title", "sub_title", "tip_box", "divider", "decoration"]).notNull(),
  label: varchar("label", { length: 128 }),
  imageUrl: text("imageUrl").notNull(),
  prompt: text("prompt"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;
