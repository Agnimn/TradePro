import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertOrder } from "@shared/routes";
import { apiFetch } from "@/lib/fetch";
import { useToast } from "@/hooks/use-toast";

export function useOrders() {
  return useQuery({
    queryKey: [api.orders.list.path],
    queryFn: async () => {
      const res = await apiFetch(api.orders.list.path);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return api.orders.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (order: InsertOrder) => {
      const res = await apiFetch(api.orders.create.path, {
        method: api.orders.create.method,
        body: JSON.stringify(order),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create order");
      }

      return api.orders.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.portfolio.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] }); // Refresh balance
      
      const typeStr = data.type === 'BUY' ? 'Bought' : 'Sold';
      toast({
        title: `Order ${data.status}`,
        description: `Successfully ${typeStr} ${data.quantity} shares of ${data.stockSymbol}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
