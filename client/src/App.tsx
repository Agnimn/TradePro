import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";

import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Stocks from "@/pages/stocks";
import StockDetail from "@/pages/stock-detail";
import Portfolio from "@/pages/portfolio";
import Orders from "@/pages/orders";
import NotFound from "@/pages/not-found";

import { useAuth } from "@/hooks/use-auth";

function ProtectedRoute({ component: Component }: { component: any }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null; // Handled by AppLayout
  if (!user) return <Redirect to="/login" />;
  
  return <Component />;
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/login" component={AuthPage} />
        
        {/* Protected Routes */}
        <Route path="/">
          <ProtectedRoute component={Dashboard} />
        </Route>
        <Route path="/stocks">
          <ProtectedRoute component={Stocks} />
        </Route>
        <Route path="/stocks/:symbol">
          <ProtectedRoute component={StockDetail} />
        </Route>
        <Route path="/portfolio">
          <ProtectedRoute component={Portfolio} />
        </Route>
        <Route path="/orders">
          <ProtectedRoute component={Orders} />
        </Route>

        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
