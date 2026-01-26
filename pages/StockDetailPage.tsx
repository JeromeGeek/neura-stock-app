
import React, { useState, useEffect } from 'react';
import { stockService } from '../services/stockService';
import { StockDetails, TimeRange } from '../types';
import { useWatchlist } from '../hooks/useWatchlist';
import { useRealtimeQuotes } from '../hooks/useRealtimeQuotes';
import StockHeader from '../components/StockHeader';
import StockChart from '../components/StockChart';
import Financials from '../components/Financials';
import News from '../components/News';

interface StockDetailPageProps {
  ticker: string;
  onBack: () => void;
}

const StockDetailPage: React.FC<StockDetailPageProps> = ({ ticker, onBack }) => {
  const [staticStockData, setStaticStockData] = useState<StockDetails | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');
  const [loading, setLoading] = useState(true);
  const { addToWatchlist, removeFromWatchlist, isinWatchlist } = useWatchlist();
  
  const { quotes: realtimeQuotes, lastUpdated } = useRealtimeQuotes([ticker]);
  const currentQuote = realtimeQuotes.length > 0 ? realtimeQuotes[0] : staticStockData?.quote;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await stockService.getStockDetails(ticker);
      setStaticStockData(data);
      setLoading(false);
    };
    fetchData();
  }, [ticker]);

  const handleToggleWatchlist = () => {
    if (isinWatchlist(ticker)) {
      removeFromWatchlist(ticker);
    } else {
      addToWatchlist(ticker);
    }
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
    );
  }

  if (!staticStockData || !currentQuote) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-500">Stock not found or failed to load.</h2>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-700">
          Go Back
        </button>
      </div>
    );
  }
  
  const { chartData, financials, news } = staticStockData;
  const isPositive = currentQuote.change >= 0;

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack} 
        className="text-emerald-400 hover:text-emerald-300 mb-2 flex items-center gap-1 group"
        title="Press ESC to go back"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
        <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2">(ESC)</span>
      </button>

      <StockHeader 
        quote={currentQuote} 
        isinWatchlist={isinWatchlist(ticker)}
        onToggleWatchlist={handleToggleWatchlist} 
        lastUpdated={lastUpdated}
      />
      <StockChart 
        data={chartData[timeRange]} 
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        isPositive={isPositive}
      />
      <Financials data={financials} />
      <News articles={news} ticker={ticker} />
    </div>
  );
};

export default StockDetailPage;
