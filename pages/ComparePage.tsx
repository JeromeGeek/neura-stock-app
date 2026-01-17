
import React, { useState, useEffect } from 'react';
import { stockService } from '../services/stockService';
import { StockDetails, TimeRange } from '../types';
import ComparisonChart from '../components/ComparisonChart';
import Card from '../components/Card';

interface ComparePageProps {
  tickers: string[];
  onBack: () => void;
}

const ComparePage: React.FC<ComparePageProps> = ({ tickers, onBack }) => {
  const [stockData, setStockData] = useState<StockDetails[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const dataPromises = tickers.map(t => stockService.getStockDetails(t));
      const results = await Promise.all(dataPromises);
      const validData = results.filter((d): d is StockDetails => d !== null);
      setStockData(validData);
      setLoading(false);
    };
    fetchData();
  }, [tickers]);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
       <button onClick={onBack} className="text-emerald-400 hover:text-emerald-300 mb-2 flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>
      <Card>
        <h1 className="text-3xl font-bold mb-4">Stock Comparison</h1>
        <ComparisonChart stockData={stockData} timeRange={timeRange} setTimeRange={setTimeRange} />
      </Card>
    </div>
  );
};

export default ComparePage;
