import { useState } from "react";
import { useCreateOrder } from "@/hooks/use-orders";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { type StockResponse } from "@shared/routes";

interface OrderPadProps {
  stock: StockResponse;
  availableBalance: string;
}

export function OrderPad({ stock, availableBalance }: OrderPadProps) {
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [quantity, setQuantity] = useState<string>("1");
  const [price, setPrice] = useState<string>("");

  const { mutate: createOrder, isPending } = useCreateOrder();

  const numQty = parseInt(quantity) || 0;
  const numPrice = orderType === "MARKET" ? parseFloat(stock.currentPrice) : parseFloat(price) || 0;
  const marginRequired = numQty * numPrice;
  const isInsufficient = type === "BUY" && marginRequired > parseFloat(availableBalance);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numQty || numQty <= 0) return;
    
    createOrder({
      stockSymbol: stock.symbol,
      type,
      orderType,
      quantity: numQty,
      price: numPrice.toString(),
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex">
        <button
          className={`flex-1 py-4 font-bold text-sm transition-colors ${
            type === "BUY" 
              ? "bg-profit/10 text-profit border-b-2 border-profit" 
              : "bg-background text-muted-foreground border-b-2 border-transparent hover:bg-secondary"
          }`}
          onClick={() => setType("BUY")}
        >
          BUY
        </button>
        <button
          className={`flex-1 py-4 font-bold text-sm transition-colors ${
            type === "SELL" 
              ? "bg-loss/10 text-loss border-b-2 border-loss" 
              : "bg-background text-muted-foreground border-b-2 border-transparent hover:bg-secondary"
          }`}
          onClick={() => setType("SELL")}
        >
          SELL
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 flex-1">
        <div className="flex bg-secondary p-1 rounded-lg">
          {(["MARKET", "LIMIT"] as const).map((ot) => (
            <button
              key={ot}
              type="button"
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                orderType === ot ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
              }`}
              onClick={() => {
                setOrderType(ot);
                if (ot === "MARKET") setPrice("");
                else setPrice(stock.currentPrice);
              }}
            >
              {ot}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-background border-2 border-border rounded-lg px-3 py-2 font-numeric text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Price</label>
            <input
              type="number"
              step="0.01"
              value={orderType === "MARKET" ? stock.currentPrice : price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={orderType === "MARKET"}
              className="w-full bg-background border-2 border-border rounded-lg px-3 py-2 font-numeric text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:bg-secondary"
            />
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-border space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Margin required</span>
            <span className={`font-numeric font-bold ${isInsufficient ? 'text-destructive' : ''}`}>
              {formatCurrency(marginRequired)}
            </span>
          </div>

          <button
            type="submit"
            disabled={isPending || isInsufficient || numQty <= 0 || (orderType === 'LIMIT' && !numPrice)}
            className={`w-full py-3 rounded-lg font-bold text-primary-foreground shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${
              type === "BUY"
                ? "bg-profit hover:bg-profit/90 hover:shadow-profit/20 shadow-profit/10"
                : "bg-loss hover:bg-loss/90 hover:shadow-loss/20 shadow-loss/10"
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none`}
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              `${type} ${stock.symbol}`
            )}
          </button>
          
          {isInsufficient && (
            <p className="text-xs text-center text-destructive">Insufficient balance</p>
          )}
        </div>
      </form>
    </div>
  );
}
