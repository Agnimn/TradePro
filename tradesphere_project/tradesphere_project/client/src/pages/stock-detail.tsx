import { useParams, Link } from "wouter";
import { useStock } from "@/hooks/use-stocks";
import { useAuth } from "@/hooks/use-auth";
import { StockChart } from "@/components/stock-chart";
import { OrderPad } from "@/components/order-pad";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const { data: stock, isLoading, error } = useStock(symbol || "");
  const { user } = useAuth();

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (error || !stock) {
    return <div className="p-8 text-center text-destructive font-medium">Failed to load stock data</div>;
  }

  const history = stock.historicalPrices || [];
  const openPrice = history.length > 0 ? parseFloat(history[0].price) : parseFloat(stock.currentPrice);
  const diff = parseFloat(stock.currentPrice) - openPrice;
  const diffPercent = (diff / openPrice) * 100;
  const isUp = diff >= 0;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col pb-4">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/stocks" className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{stock.symbol}</h1>
          <p className="text-muted-foreground">{stock.companyName}</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex-1 flex flex-col">
            <div className="flex items-end gap-4 mb-6">
              <h2 className={`text-4xl font-numeric font-bold tracking-tight ${isUp ? 'text-profit' : 'text-loss'}`}>
                {formatCurrency(stock.currentPrice)}
              </h2>
              <p className={`text-lg font-numeric font-medium mb-1 ${isUp ? 'text-profit' : 'text-loss'}`}>
                {isUp ? '+' : ''}{formatCurrency(diff)} ({diffPercent.toFixed(2)}%)
              </p>
            </div>
            
            <div className="flex-1 relative min-h-[300px]">
              <StockChart data={history} isPositive={isUp} />
            </div>
          </div>

          {/* Market Depth / Stats */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Day High</p>
              <p className="font-numeric font-bold">{formatCurrency(stock.dayHigh)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Day Low</p>
              <p className="font-numeric font-bold">{formatCurrency(stock.dayLow)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Volume</p>
              <p className="font-numeric font-bold">{stock.volume.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 h-full">
          <OrderPad stock={stock} availableBalance={user?.balance || "0"} />
        </div>
      </div>
    </div>
  );
}
