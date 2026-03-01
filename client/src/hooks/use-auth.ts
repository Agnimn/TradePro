import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type LoginData, type InsertUser } from "@shared/routes";
import { apiFetch } from "@/lib/fetch";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const meQuery = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      if (!localStorage.getItem("trade_token")) return null;
      
      const res = await apiFetch(api.auth.me.path);
      if (res.status === 401) {
        localStorage.removeItem("trade_token");
        return null;
      }
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.auth.me.responses[200].parse(await res.json());
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await apiFetch(api.auth.login.path, {
        method: api.auth.login.method,
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to login");
      }
      
      const responseData = api.auth.login.responses[200].parse(await res.json());
      return responseData;
    },
    onSuccess: (data) => {
      localStorage.setItem("trade_token", data.token);
      queryClient.setQueryData([api.auth.me.path], data.user);
      setLocation("/");
      toast({ title: "Welcome back", description: "Successfully logged in." });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiFetch(api.auth.register.path, {
        method: api.auth.register.method,
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to register");
      }
      
      return api.auth.register.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      localStorage.setItem("trade_token", data.token);
      queryClient.setQueryData([api.auth.me.path], data.user);
      setLocation("/");
      toast({ title: "Account created", description: "Welcome to the platform." });
    },
  });

  const logout = () => {
    localStorage.removeItem("trade_token");
    queryClient.setQueryData([api.auth.me.path], null);
    queryClient.clear();
    setLocation("/login");
  };

  return {
    user: meQuery.data,
    isLoading: meQuery.isLoading,
    login: loginMutation,
    register: registerMutation,
    logout,
  };
}
