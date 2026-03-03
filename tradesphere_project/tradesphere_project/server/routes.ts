import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "fallback_secret_for_development";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth Middleware
  const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.status(401).json({ message: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(401).json({ message: "Unauthorized" });
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      
      const { password, ...userWithoutPassword } = user;
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      
      res.status(201).json({ token, user: userWithoutPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByEmail(input.email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(input.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const { password, ...userWithoutPassword } = user;
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      
      res.status(200).json({ token, user: userWithoutPassword });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.auth.me.path, authenticateToken, async (req: any, res: any) => {
    const user = await storage.getUser(req.user.id);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Stocks
  app.get(api.stocks.list.path, async (req, res) => {
    const stocks = await storage.getStocks();
    res.json(stocks);
  });

  app.get(api.stocks.get.path, async (req, res) => {
    const stock = await storage.getStock(req.params.symbol);
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    res.json(stock);
  });

  // Portfolio
  app.get(api.portfolio.get.path, authenticateToken, async (req: any, res: any) => {
    const portfolio = await storage.getUserPortfolio(req.user.id);
    res.json(portfolio);
  });

  // Orders
  app.get(api.orders.list.path, authenticateToken, async (req: any, res: any) => {
    const orders = await storage.getOrders(req.user.id);
    res.json(orders);
  });

  app.post(api.orders.create.path, authenticateToken, async (req: any, res: any) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const stock = await storage.getStock(input.stockSymbol);
      if (!stock) return res.status(400).json({ message: "Stock not found" });

      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(401).json({ message: "User not found" });

      const totalValue = Number(input.quantity) * Number(input.price);

      if (input.type === 'BUY') {
        if (Number(user.balance) < totalValue) {
          return res.status(400).json({ message: "Insufficient balance" });
        }
        await storage.updateUserBalance(user.id, (Number(user.balance) - totalValue).toString());
        await storage.updatePortfolio(user.id, input.stockSymbol, input.quantity, input.price.toString());
      } else if (input.type === 'SELL') {
        const portfolio = await storage.getUserPortfolio(user.id);
        const stockInPortfolio = portfolio.find(p => p.stockSymbol === input.stockSymbol);
        
        if (!stockInPortfolio || stockInPortfolio.quantity < input.quantity) {
          return res.status(400).json({ message: "Insufficient stock quantity" });
        }
        
        await storage.updateUserBalance(user.id, (Number(user.balance) + totalValue).toString());
        await storage.updatePortfolio(user.id, input.stockSymbol, -input.quantity, input.price.toString());
      }

      const order = await storage.createOrder({ ...input, userId: user.id });
      await storage.updateOrderStatus(order.id, 'EXECUTED');
      
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  seedDatabase().catch(console.error);

  return httpServer;
}

// Generate historical data
function generateHistoricalData(basePrice: number) {
  const data = [];
  let price = basePrice;
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    price = price * (1 + (Math.random() - 0.5) * 0.05);
    data.push({ time: d.toISOString().split('T')[0], price: Number(price.toFixed(2)) });
  }
  return data;
}

async function seedDatabase() {
  const stocks = await storage.getStocks();
  if (stocks.length === 0) {
    const initialStocks = [
      { symbol: "REPL", companyName: "Replit Inc.", currentPrice: "150.00", dayHigh: "155.00", dayLow: "148.00", volume: 1000000 },
      { symbol: "AAPL", companyName: "Apple Inc.", currentPrice: "175.50", dayHigh: "178.00", dayLow: "174.20", volume: 50000000 },
      { symbol: "GOOGL", companyName: "Alphabet Inc.", currentPrice: "140.20", dayHigh: "142.50", dayLow: "139.80", volume: 25000000 },
      { symbol: "MSFT", companyName: "Microsoft Corp.", currentPrice: "400.10", dayHigh: "405.00", dayLow: "398.50", volume: 30000000 },
      { symbol: "TSLA", companyName: "Tesla Inc.", currentPrice: "200.00", dayHigh: "205.00", dayLow: "195.00", volume: 100000000 }
    ];

    for (const stock of initialStocks) {
      const historicalPrices = generateHistoricalData(Number(stock.currentPrice));
      await storage.createStock({ ...stock, historicalPrices });
    }
    console.log("Seeded database with initial stocks");
  }
}
