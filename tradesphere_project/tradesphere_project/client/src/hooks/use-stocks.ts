import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiFetch } from "@/lib/fetch";

export function useStocks(search?: string) {
  return useQuery({
    queryKey: [api.stocks.list.path, search],
    queryFn: async () => {
      const url = search 
        ? `${api.stocks.list.path}?search=${encodeURIComponent(search)}` 
        : api.stocks.list.path;
        
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch stocks");
      return api.stocks.list.responses[200].parse(await res.json());
    },
    staleTime: 5000, // Frequent updates rely on WS, but base polling as fallback
  });
}

export function useStock(symbol: string) {
  return useQuery({
    queryKey: [api.stocks.get.path, symbol],
    queryFn: async () => {
      if (!symbol) return null;
      const url = buildUrl(api.stocks.get.path, { symbol });
      const res = await apiFetch(url);
      
      if (res.status === 404) throw new Error("Stock not found");
      if (!res.ok) throw new Error("Failed to fetch stock");
      
      return api.stocks.get.responses[200].parse(await res.json());
    },
    enabled: !!symbol,
  });
}
