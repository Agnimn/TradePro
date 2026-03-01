import { useOrders } from "@/hooks/use-orders";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Orders() {
  const { data: orders = [], isLoading } = useOrders();

  if (isLoading) {
    return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Order History</h1>
        <p className="text-muted-foreground text-sm">Track your past transactions</p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm">Time</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm">Type</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm">Instrument</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm">Product</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm text-right">Qty</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm text-right">Price</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-sm text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), 'MMM d, HH:mm:ss')}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${order.type === 'BUY' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                        {order.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold">{order.stockSymbol}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{order.orderType}</td>
                    <td className="py-4 px-6 text-right font-numeric">{order.quantity}</td>
                    <td className="py-4 px-6 text-right font-numeric">{formatCurrency(order.price)}</td>
                    <td className="py-4 px-6 text-right">
                      <span className={`text-sm font-medium ${
                        order.status === 'EXECUTED' ? 'text-profit' : 
                        order.status === 'CANCELLED' ? 'text-loss' : 'text-muted-foreground'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
