import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ws, api } from "@shared/routes";

export function usePriceWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;
    
    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "priceUpdate") {
            const validated = ws.receive.priceUpdate.parse(message.payload);
            const { symbol, price } = validated;
            
            // Optimistically update stock list
            queryClient.setQueryData([api.stocks.list.path, undefined], (oldData: any) => {
              if (!oldData) return oldData;
              return oldData.map((stock: any) => 
                stock.symbol === symbol 
                  ? { ...stock, currentPrice: price.toString() } 
                  : stock
              );
            });

            // Optimistically update individual stock
            queryClient.setQueryData([api.stocks.get.path, symbol], (oldData: any) => {
              if (!oldData) return oldData;
              // We append to historical prices for a live sparkline effect
              const time = new Date().toISOString();
              const newHistory = [...oldData.historicalPrices, { time, price }].slice(-100); // Keep last 100 points
              return { 
                ...oldData, 
                currentPrice: price.toString(),
                historicalPrices: newHistory 
              };
            });
          }
        } catch (error) {
          console.error("[WS] Failed to parse message", error);
        }
      };

      socket.onclose = () => {
        // Attempt to reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient]);
}
