
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint, TimeRange } from '../types';
import Card from './Card';

interface StockChartProps {
  data: ChartDataPoint[];
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  isPositive: boolean;
}

const timeRanges: TimeRange[] = ['1D', '5D', '1M', '6M', '1Y', '5Y'];

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700 p-2 rounded-md border border-gray-600">
        <p className="font-semibold">${payload[0].value.toFixed(2)}</p>
        <p className="text-xs text-gray-400">{new Date(label).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const StockChart: React.FC<StockChartProps> = ({ data, timeRange, setTimeRange, isPositive }) => {
  const chartColor = isPositive ? '#22c55e' : '#ef4444';

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    switch (timeRange) {
      case '1D': return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '5D': return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case '1M': return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      default: return date.toLocaleDateString([], { year: '2-digit', month: 'short' });
    }
  };

  return (
    <Card className="mb-6">
      <div className="h-64 md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" tickFormatter={formatXAxis} />
            <YAxis stroke="#9ca3af" domain={['dataMin', 'dataMax']} tickFormatter={(tick) => `$${tick.toFixed(0)}`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="price" stroke={chartColor} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center space-x-2 mt-4">
        {timeRanges.map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              timeRange === range
                ? 'bg-emerald-500 text-white font-semibold'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </Card>
  );
};

export default StockChart;
