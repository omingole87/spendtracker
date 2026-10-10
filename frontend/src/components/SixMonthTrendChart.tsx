import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { MonthTrend } from '../types';
import { TrendingUp } from 'lucide-react';

interface SixMonthTrendChartProps {
  trend: MonthTrend[];
  currentMonth: string;
  onSelectMonth: (month: string) => void;
}

export const SixMonthTrendChart: React.FC<SixMonthTrendChartProps> = ({
  trend,
  currentMonth,
  onSelectMonth
}) => {
  const chartData = trend.map((t) => {
    const [year, month] = t.month.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, 1));
    const label = dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

    return {
      monthKey: t.month,
      label,
      spent: t.totalSpent,
      txCount: t.txCount,
      isCurrent: t.month === currentMonth
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs font-sans">
          <div className="font-semibold text-slate-200 mb-1">{data.monthKey}</div>
          <div className="text-indigo-400 font-bold font-mono text-sm">
            ₹{data.spent.toLocaleString('en-IN')}
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            {data.txCount} transactions
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            6-Month Spending Trend
          </h2>
        </div>
        <span className="text-[11px] text-slate-400">Click a point to jump to that month</span>
      </div>

      <div className="flex-1 w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="label" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="spent"
              stroke="#818CF8"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#spendGradient)"
              activeDot={{
                r: 6,
                fill: '#6366F1',
                stroke: '#ffffff',
                strokeWidth: 2,
                onClick: (_, payload: any) => onSelectMonth(payload.payload.monthKey)
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
