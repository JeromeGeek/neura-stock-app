
import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';
import { stockService } from '../services/stockService';
import { StockQuote } from '../types';
import { useRealtimeQuotes } from '../hooks/useRealtimeQuotes';

const indexTickers = stockService.getMarketIndexTickers();
const etfTickers = stockService.getMarketETFTickers();

const QuoteItem: React.FC<{ item: StockQuote }> = ({ item }) => {
    const [flashClass, setFlashClass] = useState('');
    const prevPrice = useRef(item.price);

    useEffect(() => {
        if (prevPrice.current !== 0 && item.price !== prevPrice.current) {
            setFlashClass(item.price > prevPrice.current ? 'flash-green' : 'flash-red');
            const timer = setTimeout(() => setFlashClass(''), 500);
            return () => clearTimeout(timer);
        }
        prevPrice.current = item.price;
    }, [item.price]);

    return (
        <div className={`bg-gray-900 p-4 rounded-lg transition-colors ${flashClass}`}>
            <p className="font-semibold text-gray-300">{item.name}</p>
            <p className="text-xl font-bold font-mono">{item.price.toFixed(2)}</p>
            <p className={`font-semibold font-mono text-sm ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
            </p>
        </div>
    );
};

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="relative group flex items-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div className="absolute bottom-full mb-2 w-64 bg-gray-700 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-lg">
      {text}
    </div>
  </div>
);

const MarketOverview: React.FC = () => {
  const { quotes: indices } = useRealtimeQuotes(indexTickers);
  const { quotes: etfs } = useRealtimeQuotes(etfTickers);

  const renderQuoteItems = (items: StockQuote[]) => {
    if (items.length === 0) {
      return Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-gray-900 p-4 rounded-lg animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-6 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
        </div>
      ));
    }
    return items.map(item => <QuoteItem key={item.ticker} item={item} />);
  };

  return (
    <Card>
      <h2 className="text-2xl font-bold mb-4">Market Overview</h2>
      
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-gray-300">Key Indices</h3>
          <InfoTooltip text="Indices are benchmarks that measure the performance of a group of stocks, representing a section of the market. They are not directly tradable." />
        </div>
        <p className="text-sm text-gray-400 mb-2">A snapshot of market performance.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderQuoteItems(indices)}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-gray-300">Popular ETFs</h3>
          <InfoTooltip text="ETFs (Exchange-Traded Funds) are investment funds traded on stock exchanges, much like stocks. They often track an underlying index." />
        </div>
        <p className="text-sm text-gray-400 mb-2">Tradable funds that track an index.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderQuoteItems(etfs)}
        </div>
      </div>
    </Card>
  );
};

export default MarketOverview;
