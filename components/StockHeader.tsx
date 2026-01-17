
import React, { useState, useEffect, useRef } from 'react';
import { StockQuote } from '../types';

interface StockHeaderProps {
  quote: StockQuote;
  isinWatchlist: boolean;
  onToggleWatchlist: () => void;
  lastUpdated: number | null;
}

const useTimeSince = (timestamp: number | null) => {
    const [timeSince, setTimeSince] = useState('');

    useEffect(() => {
        const update = () => {
            if (timestamp) {
                const seconds = Math.floor((Date.now() - timestamp) / 1000);
                setTimeSince(`${seconds}s ago`);
            }
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [timestamp]);

    return timeSince;
}

const StockHeader: React.FC<StockHeaderProps> = ({ quote, isinWatchlist, onToggleWatchlist, lastUpdated }) => {
  const [flashClass, setFlashClass] = useState('');
  const prevPrice = useRef(quote.price);
  const timeSinceUpdate = useTimeSince(lastUpdated);
  
  useEffect(() => {
    if (prevPrice.current !== 0 && quote.price !== prevPrice.current) {
        setFlashClass(quote.price > prevPrice.current ? 'flash-green' : 'flash-red');
        const timer = setTimeout(() => setFlashClass(''), 500);
        return () => clearTimeout(timer);
    }
    prevPrice.current = quote.price;
  }, [quote.price]);

  const isPositive = quote.change >= 0;
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white">{quote.name}</h1>
        <p className="text-lg text-gray-400">{quote.ticker}</p>
      </div>
      <div className={`text-left md:text-right mt-4 md:mt-0 p-2 rounded-lg transition-colors ${flashClass}`}>
        <p className="text-4xl font-bold font-mono">${quote.price.toFixed(2)}</p>
        <div className="flex items-center justify-end gap-2">
             <p className={`text-lg font-semibold font-mono ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
             </p>
             {lastUpdated && <p className="text-xs text-gray-500">Updated {timeSinceUpdate}</p>}
        </div>
      </div>
        <button
          onClick={onToggleWatchlist}
          className={`mt-4 md:mt-0 md:ml-6 py-2 px-4 rounded-full font-semibold transition-colors flex items-center gap-2 ${
            isinWatchlist
              ? 'bg-yellow-500 text-black hover:bg-yellow-600'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          {isinWatchlist ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
             </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          )}
          {isinWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
        </button>
    </div>
  );
};

export default StockHeader;
