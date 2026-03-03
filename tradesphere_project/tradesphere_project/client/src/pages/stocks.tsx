import { useState } from "react";
import { useStocks } from "@/hooks/use-stocks";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { Search, TrendingUp, TrendingDown } from "lucide-react";

export default function Stocks() {
  const [search, setSearch] = useState("");
  const { data: stocks = [], isLoading } = useStocks(search);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Markets</h1>
          <p className="text-muted-foreground text-sm">Real-time quotes and market data</p>
        </div>

        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search symbols or companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border-2 border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm">Instrument</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm text-right">LTP</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm text-right">Day High</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm text-right">Day Low</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm text-right">Volume</th>
                <th className="py-4 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-muted rounded w-24 mb-2"/><div className="h-3 bg-muted rounded w-32"/></td>
                    <td className="py-4 px-6"><div className="h-4 bg-muted rounded w-16 ml-auto"/></td>
                    <td className="py-4 px-6"><div className="h-4 bg-muted rounded w-16 ml-auto"/></td>
                    <td className="py-4 px-6"><div className="h-4 bg-muted rounded w-16 ml-auto"/></td>
                    <td className="py-4 px-6"><div className="h-4 bg-muted rounded w-16 ml-auto"/></td>
                    <td className="py-4 px-6"></td>
                  </tr>
                ))
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No stocks found matching "{search}"
                  </td>
                </tr>
              ) : (
                stocks.map((stock) => {
                  const history = stock.historicalPrices || [];
                  const openPrice = history.length > 0 ? parseFloat(history[0].price) : parseFloat(stock.currentPrice);
                  const isUp = parseFloat(stock.currentPrice) >= openPrice;
                  
                  return (
                    <tr key={stock.symbol} className="group hover:bg-secondary/30 transition-colors">
                      <td className="py-4 px-6">
                        <Link href={`/stocks/${stock.symbol}`} className="block">
                          <span className="font-bold text-base hover:text-primary transition-colors">{stock.symbol}</span>
                          <span className="block text-xs text-muted-foreground mt-0.5">{stock.companyName}</span>
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className={`font-numeric font-bold ${isUp ? 'text-profit' : 'text-loss'} flex items-center justify-end gap-1.5`}>
                          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {formatCurrency(stock.currentPrice)}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-numeric text-muted-foreground">{formatCurrency(stock.dayHigh)}</td>
                      <td className="py-4 px-6 text-right font-numeric text-muted-foreground">{formatCurrency(stock.dayLow)}</td>
                      <td className="py-4 px-6 text-right font-numeric text-muted-foreground">{(stock.volume).toLocaleString()}</td>
                      <td className="py-4 px-6 text-right">
                        <Link href={`/stocks/${stock.symbol}`} className="inline-flex px-4 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                          Trade
                        </Link>
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
