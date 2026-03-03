import { useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { type PricePoint } from '@shared/routes';

interface StockChartProps {
  data: PricePoint[];
  isPositive?: boolean;
}

export function StockChart({ data, isPositive = true }: StockChartProps) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      time: new Date(d.time).getTime(),
    }));
  }, [data]);

  const color = isPositive ? 'hsl(var(--profit))' : 'hsl(var(--loss))';

  if (!data || data.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-muted-foreground">No chart data available</div>;
  }

  // Calculate min/max for Y axis to give the chart some padding
  const prices = data.map(d => Number(d.price));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            type="number" 
            domain={['dataMin', 'dataMax']} 
            tickFormatter={(unixTime) => format(unixTime, 'HH:mm')}
            hide
          />
          <YAxis 
            domain={[minPrice - padding, maxPrice + padding]} 
            hide 
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover border border-border shadow-xl rounded-lg p-3">
                    <p className="font-numeric font-bold text-lg">{formatCurrency(data.price)}</p>
                    <p className="text-xs text-muted-foreground">{format(data.time, 'MMM d, HH:mm:ss')}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorGradient)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
