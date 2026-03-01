import { pgTable, text, serial, integer, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  balance: numeric("balance").notNull().default('100000.00'),
});

export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  companyName: text("company_name").notNull(),
  currentPrice: numeric("current_price").notNull(),
  dayHigh: numeric("day_high").notNull(),
  dayLow: numeric("day_low").notNull(),
  volume: integer("volume").notNull().default(0),
  historicalPrices: jsonb("historical_prices").default('[]').notNull(),
});

export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stockSymbol: text("stock_symbol").notNull(),
  quantity: integer("quantity").notNull(),
  averagePrice: numeric("average_price").notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stockSymbol: text("stock_symbol").notNull(),
  type: text("type").notNull(), // 'BUY' or 'SELL'
  orderType: text("order_type").notNull().default('MARKET'), // 'MARKET', 'LIMIT', 'STOP_LOSS'
  quantity: integer("quantity").notNull(),
  price: numeric("price").notNull(),
  status: text("status").notNull(), // 'PENDING', 'EXECUTED', 'CANCELLED'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, balance: true });
export const insertStockSchema = createInsertSchema(stocks).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, status: true, createdAt: true, userId: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Stock = typeof stocks.$inferSelect;
export type InsertStock = z.infer<typeof insertStockSchema>;

export type Portfolio = typeof portfolios.$inferSelect;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Auth types
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
export type LoginData = z.infer<typeof loginSchema>;

export const authResponseSchema = z.object({
  token: z.string(),
  user: createInsertSchema(users).omit({ password: true }).extend({ id: z.number(), balance: z.string() })
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

// Historical price point
export const pricePointSchema = z.object({
  time: z.string(),
  price: z.number()
});
export type PricePoint = z.infer<typeof pricePointSchema>;
