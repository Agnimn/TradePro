import { users, stocks, portfolios, orders, type User, type InsertUser, type Stock, type InsertStock, type Portfolio, type Order, type InsertOrder } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, newBalance: string): Promise<User>;

  getStocks(): Promise<Stock[]>;
  getStock(symbol: string): Promise<Stock | undefined>;
  createStock(stock: InsertStock): Promise<Stock>;
  updateStockPrice(symbol: string, newPrice: string): Promise<Stock | undefined>;

  getUserPortfolio(userId: number): Promise<Portfolio[]>;
  updatePortfolio(userId: number, stockSymbol: string, quantity: number, averagePrice: string): Promise<Portfolio>;

  getOrders(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(orderId: number, status: string): Promise<Order>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserBalance(userId: number, newBalance: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getStocks(): Promise<Stock[]> {
    return await db.select().from(stocks);
  }

  async getStock(symbol: string): Promise<Stock | undefined> {
    const [stock] = await db.select().from(stocks).where(eq(stocks.symbol, symbol));
    return stock || undefined;
  }

  async createStock(stock: InsertStock): Promise<Stock> {
    const [newStock] = await db.insert(stocks).values(stock).returning();
    return newStock;
  }

  async updateStockPrice(symbol: string, newPrice: string): Promise<Stock | undefined> {
    const [stock] = await db
      .update(stocks)
      .set({ currentPrice: newPrice })
      .where(eq(stocks.symbol, symbol))
      .returning();
    return stock;
  }

  async getUserPortfolio(userId: number): Promise<Portfolio[]> {
    return await db.select().from(portfolios).where(eq(portfolios.userId, userId));
  }

  async updatePortfolio(userId: number, stockSymbol: string, quantityChange: number, price: string): Promise<Portfolio> {
    const existing = await db.select().from(portfolios).where(and(eq(portfolios.userId, userId), eq(portfolios.stockSymbol, stockSymbol)));

    if (existing.length > 0) {
      const p = existing[0];
      const newQuantity = p.quantity + quantityChange;

      if (newQuantity <= 0) {
         await db.delete(portfolios).where(eq(portfolios.id, p.id));
         return { ...p, quantity: 0 };
      }

      // Simple average price calc for buy
      let newAvgPrice = p.averagePrice;
      if (quantityChange > 0) {
         const totalCost = (parseFloat(p.averagePrice) * p.quantity) + (parseFloat(price) * quantityChange);
         newAvgPrice = (totalCost / newQuantity).toFixed(2);
      }

      const [updated] = await db.update(portfolios).set({ quantity: newQuantity, averagePrice: newAvgPrice }).where(eq(portfolios.id, p.id)).returning();
      return updated;
    } else {
      const [newPortfolio] = await db.insert(portfolios).values({
        userId,
        stockSymbol,
        quantity: quantityChange,
        averagePrice: price
      }).returning();
      return newPortfolio;
    }
  }

  async getOrders(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values({ ...order, status: 'PENDING' }).returning();
    return newOrder;
  }

  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
     const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, orderId)).returning();
     return updated;
  }
}

export const storage = new DatabaseStorage();