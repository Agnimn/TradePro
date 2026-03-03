import { usePortfolio } from "@/hooks/use-portfolio";
import { useStocks } from "@/hooks/use-stocks";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

export default function Portfolio() {
  const { data: portfolio = [], isLoading: pLoading } = usePortfolio();
  const { data: stocks = [], isLoading: sLoading } = useStocks();

  if (pLoading || sLoading) {
    return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Holdings</h1>
        <p className="text-muted-foreground text-sm">Your current open positions</p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm">Instrument</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm text-right">Qty</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm text-right">Avg. Cost</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm text-right">LTP</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm text-right">Current Value</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm text-right">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {portfolio.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    You have no active holdings. <Link href="/stocks" className="text-primary hover:underline">Explore markets</Link>
                  </td>
                </tr>
              ) : (
                portfolio.map((pos) => {
                  const stock = stocks.find(s => s.symbol === pos.stockSymbol);
                  const currentPrice = parseFloat(stock?.currentPrice || "0");
                  const avgPrice = parseFloat(pos.averagePrice);
                  const currentValue = pos.quantity * currentPrice;
                  const investedValue = pos.quantity * avgPrice;
                  const pnl = currentValue - investedValue;
                  const pnlPercent = (pnl / investedValue) * 100;
                  const isProfit = pnl >= 0;

                  return (
                    <tr key={pos.id} className="group hover:bg-secondary/30 transition-colors">
                      <td className="py-4 px-6">
                        <Link href={`/stocks/${pos.stockSymbol}`} className="font-bold text-base hover:text-primary transition-colors block">
                          {pos.stockSymbol}
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-right font-numeric">{pos.quantity}</td>
                      <td className="py-4 px-6 text-right font-numeric text-muted-foreground">{formatCurrency(avgPrice)}</td>
                      <td className="py-4 px-6 text-right font-numeric font-medium">{formatCurrency(currentPrice)}</td>
                      <td className="py-4 px-6 text-right font-numeric font-medium">{formatCurrency(currentValue)}</td>
                      <td className="py-4 px-6 text-right">
                        <div className={`font-numeric font-bold ${isProfit ? 'text-profit' : 'text-loss'}`}>
                          {isProfit ? '+' : ''}{formatCurrency(pnl)}
                          <span className="block text-xs opacity-80">{isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
