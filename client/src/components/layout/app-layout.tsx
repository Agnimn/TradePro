import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePriceWebSocket } from "@/hooks/use-websocket";
import { Link, useLocation } from "wouter";
import { Loader2, LayoutDashboard, LineChart, Briefcase, History, LogOut } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: LineChart, label: "Markets", href: "/stocks" },
  { icon: Briefcase, label: "Portfolio", href: "/portfolio" },
  { icon: History, label: "Orders", href: "/orders" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const [location] = useLocation();

  // Initialize global websocket for real-time prices
  usePriceWebSocket();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-background/50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">
              <LineChart className="w-4 h-4" />
            </div>
            TradePro
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="px-4 py-3 rounded-xl bg-secondary mb-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Available Funds</p>
            <p className="font-numeric text-lg font-bold">{formatCurrency(user.balance)}</p>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-6 md:hidden">
          <div className="font-bold text-primary">TradePro</div>
          {/* Mobile nav could go here */}
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
