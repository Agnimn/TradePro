import { z } from "zod";
import { insertUserSchema, loginSchema, authResponseSchema, insertOrderSchema, users, stocks, portfolios, orders } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: "POST" as const,
      path: "/api/auth/register" as const,
      input: insertUserSchema,
      responses: {
        201: authResponseSchema,
        400: errorSchemas.validation,
      },
    },
    login: {
      method: "POST" as const,
      path: "/api/auth/login" as const,
      input: loginSchema,
      responses: {
        200: authResponseSchema,
        401: errorSchemas.unauthorized,
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/auth/me" as const,
      responses: {
        200: z.custom<Omit<typeof users.$inferSelect, "password">>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  stocks: {
    list: {
      method: "GET" as const,
      path: "/api/stocks" as const,
      input: z.object({ search: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof stocks.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/stocks/:symbol" as const,
      responses: {
        200: z.custom<typeof stocks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  portfolio: {
    get: {
      method: "GET" as const,
      path: "/api/portfolio" as const,
      responses: {
        200: z.array(z.custom<typeof portfolios.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
  },
  orders: {
    list: {
      method: "GET" as const,
      path: "/api/orders" as const,
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/orders" as const,
      input: insertOrderSchema,
      responses: {
        201: z.custom<typeof orders.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export const ws = {
  receive: {
    priceUpdate: z.object({ symbol: z.string(), price: z.number() }),
  }
};

export type StockResponse = z.infer<typeof api.stocks.list.responses[200]>[0];
export type PortfolioResponse = z.infer<typeof api.portfolio.get.responses[200]>;
export type OrderResponse = z.infer<typeof api.orders.list.responses[200]>;
