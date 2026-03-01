import { useAuth } from "@/hooks/use-auth";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useStocks } from "@/hooks/use-stocks";
import { useOrders } from "@/hooks/use-orders";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Wallet, Activity, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: portfolio = [] } = usePortfolio();
  const { data: stocks = [] } = useStocks();
  const { data: orders = [] } = useOrders();

  // Calculate stats
  let investedValue = 0;
  let currentValue = 0;

  portfolio.forEach(pos => {
    const stock = stocks.find(s => s.symbol === pos.stockSymbol);
    if (!stock) return;
    
    investedValue += pos.quantity * parseFloat(pos.averagePrice);
    currentValue += pos.quantity * parseFloat(stock.currentPrice);
  });

  const totalPnL = currentValue - investedValue;
  const pnlPercentage = investedValue > 0 ? (totalPnL / investedValue) * 100 : 0;
  const isProfit = totalPnL >= 0;

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground">Here's an overview of your account today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-medium">Account Balance</h3>
          </div>
          <p className="text-3xl font-numeric font-bold">{formatCurrency(user?.balance || "0")}</p>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-medium">Portfolio Value</h3>
          </div>
          <p className="text-3xl font-numeric font-bold">{formatCurrency(currentValue)}</p>
          <p className="text-sm font-numeric text-muted-foreground mt-1">
            Invested: {formatCurrency(investedValue)}
          </p>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className={`absolute right-0 top-0 w-32 h-32 blur-3xl opacity-20 pointer-events-none rounded-full ${isProfit ? 'bg-profit' : 'bg-loss'}`} />
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isProfit ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-medium">Total P&L</h3>
          </div>
          <div className="flex items-baseline gap-3">
            <p className={`text-3xl font-numeric font-bold ${isProfit ? 'text-profit' : 'text-loss'}`}>
              {totalPnL > 0 ? '+' : ''}{formatCurrency(totalPnL)}
            </p>
            <div className={`flex items-center text-sm font-numeric font-bold ${isProfit ? 'text-profit' : 'text-loss'}`}>
              {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(pnlPercentage).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Watchlist */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Top Movers</h2>
            <Link href="/stocks" className="text-primary text-sm font-medium hover:underline">View all markets</Link>
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
            {stocks.slice(0, 5).map(stock => {
              const diff = parseFloat(stock.currentPrice) - parseFloat(stock.historicalPrices?.[0]?.price || stock.currentPrice);
              const isUp = diff >= 0;
              return (
                <Link key={stock.symbol} href={`/stocks/${stock.symbol}`} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors block">
                  <div>
                    <h4 className="font-bold">{stock.symbol}</h4>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{stock.companyName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-numeric font-bold">{formatCurrency(stock.currentPrice)}</p>
                    <p className={`text-xs font-numeric font-medium flex items-center justify-end ${isUp ? 'text-profit' : 'text-loss'}`}>
                      {isUp ? '+' : ''}{diff.toFixed(2)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Orders</h2>
            <Link href="/orders" className="text-primary text-sm font-medium hover:underline">View history</Link>
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border overflow-hidden">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No recent orders found.</div>
            ) : (
              recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={`px-2 py-1 rounded text-xs font-bold ${order.type === 'BUY' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                      {order.type}
                    </div>
                    <div>
                      <h4 className="font-bold">{order.stockSymbol}</h4>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-numeric font-bold">{order.quantity} @ {formatCurrency(order.price)}</p>
                    <p className="text-xs text-muted-foreground">{order.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
