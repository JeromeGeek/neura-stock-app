import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { StockDetails, TimeRange } from '../types';

interface ComparisonChartProps {
  stockData: StockDetails[];
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042'];
const timeRanges: TimeRange[] = ['1M', '6M', '1Y', '5Y'];

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700 p-3 rounded-md border border-gray-600 shadow-lg">
        <p className="text-sm text-gray-300 mb-2">{new Date(label).toLocaleDateString()}</p>
        {payload.map((pld: any, index: number) => (
          <div key={index} style={{ color: pld.color }}>
            <span className="font-semibold">{pld.name}: </span>
            <span>{pld.value.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ComparisonChart: React.FC<ComparisonChartProps> = ({ stockData, timeRange, setTimeRange }) => {
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

  const combinedData = useMemo(() => {
    if (stockData.length === 0) return [];
    
    const allChartData = stockData.map(s => s.chartData[timeRange]);
    const firstStockData = allChartData[0];
    if (!firstStockData) return [];

    return firstStockData.map((dataPoint, index) => {
      const entry: { [key: string]: any } = { date: dataPoint.date };
      stockData.forEach((stock, stockIndex) => {
        const firstPrice = allChartData[stockIndex]?.[0]?.price;
        const currentPrice = allChartData[stockIndex]?.[index]?.price;
        if (firstPrice && currentPrice) {
          entry[stock.quote.ticker] = ((currentPrice - firstPrice) / firstPrice) * 100;
        }
      });
      return entry;
    });
  }, [stockData, timeRange]);

  const toggleSeries = (dataKey: string) => {
    setHiddenSeries(prev => 
      prev.includes(dataKey) ? prev.filter(key => key !== dataKey) : [...prev, dataKey]
    );
  };

  const formatYAxis = (tick: number) => `${tick.toFixed(0)}%`;
  const formatXAxis = (tick: string) => new Date(tick).toLocaleDateString([], { year: '2-digit', month: 'short' });

  return (
    <div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" tickFormatter={formatXAxis} />
            <YAxis stroke="#9ca3af" tickFormatter={formatYAxis} />
            <Tooltip content={<CustomTooltip />} />
            {/* FIX: The recharts Legend's onClick payload has a dataKey of a broad type.
            Converting it to a string ensures compatibility with our toggleSeries handler. */}
            <Legend onClick={(e) => toggleSeries(String(e.dataKey))} />
            {stockData.map((stock, index) => (
              !hiddenSeries.includes(stock.quote.ticker) && (
                <Line 
                  key={stock.quote.ticker}
                  type="monotone"
                  dataKey={stock.quote.ticker}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  name={stock.quote.ticker}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center space-x-2 mt-4">
        {timeRanges.map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              timeRange === range ? 'bg-emerald-500 text-white font-semibold' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ComparisonChart;
