import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CategorySpend } from '../types';
import { PieChart as PieIcon } from 'lucide-react';

interface CategoryBreakdownChartProps {
  categories: CategorySpend[];
  totalSpent: number;
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
}

const DEFAULT_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#64748B'];

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  categories,
  totalSpent,
  selectedCategoryId,
  onSelectCategory
}) => {
  const activeCategories = categories.filter(c => c.totalSpent > 0);

  const chartData = activeCategories.map((c, idx) => ({
    id: c.categoryId,
    name: c.categoryName,
    value: c.totalSpent,
    color: c.categoryColor || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
    percentage: c.percentageOfTotal
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-sans">
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="font-semibold text-white">{data.name}</span>
          </div>
          <div className="font-mono text-indigo-300 font-bold">
            ₹{data.value.toLocaleString('en-IN')} ({data.percentage}%)
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
          <PieIcon className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Spending by Category
          </h2>
        </div>
        {selectedCategoryId !== null && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
          >
            Clear Filter
          </button>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-sm">
          <p>No expense data recorded this month.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row items-center gap-6">
          {/* Donut Chart */}
          <div className="w-full md:w-1/2 h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  onClick={(entry) => onSelectCategory(entry.id === selectedCategoryId ? null : entry.id)}
                  cursor="pointer"
                >
                  {chartData.map((entry) => (
                    <Cell 
                      key={`cell-${entry.id}`} 
                      fill={entry.color}
                      stroke={selectedCategoryId === entry.id ? '#ffffff' : '#0f172a'}
                      strokeWidth={selectedCategoryId === entry.id ? 2 : 1}
                      opacity={selectedCategoryId === null || selectedCategoryId === entry.id ? 1 : 0.4}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Total</span>
              <span className="text-sm font-bold text-white font-mono">₹{Math.round(totalSpent).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Interactive Legend */}
          <div className="w-full md:w-1/2 flex flex-col space-y-2 max-h-56 overflow-y-auto pr-1">
            {chartData.map((item) => {
              const isSelected = selectedCategoryId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectCategory(isSelected ? null : item.id)}
                  className={`flex items-center justify-between p-2 rounded-lg text-left text-xs transition border ${
                    isSelected 
                      ? 'bg-slate-800 border-indigo-500/50 ring-1 ring-indigo-500/20' 
                      : 'bg-slate-800/40 hover:bg-slate-800/80 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-slate-200 truncate">{item.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-slate-100 font-semibold">₹{item.value.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({item.percentage}%)</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
