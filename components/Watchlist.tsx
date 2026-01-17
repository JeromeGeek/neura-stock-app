
import React, { useState, useEffect, useRef } from 'react';
import { StockQuote } from '../types';
import Card from './Card';
import { useRealtimeQuotes } from '../hooks/useRealtimeQuotes';

interface WatchlistProps {
  watchlistTickers: string[];
  onSelectTicker: (ticker: string) => void;
  onRemoveFromWatchlist: (ticker: string) => void;
  selectedForCompare: string[];
  onToggleCompare: (ticker: string) => void;
  onCompareClick: () => void;
  onClearCompareSelection: () => void;
}

const WatchlistRow: React.FC<{ 
  stock: StockQuote, 
  onSelectTicker: (ticker: string) => void, 
  onRemoveFromWatchlist: (ticker: string) => void, 
  onToggleCompare: (ticker: string) => void, 
  isSelected: boolean,
  isCompareMode: boolean
}> = 
({ stock, onSelectTicker, onRemoveFromWatchlist, onToggleCompare, isSelected, isCompareMode }) => {
  const [flashClass, setFlashClass] = useState('');
  const prevPrice = useRef(stock.price);

  useEffect(() => {
    if (prevPrice.current !== 0 && prevPrice.current !== stock.price) {
      const className = stock.price > prevPrice.current ? 'flash-green' : 'flash-red';
      setFlashClass(className);
      const timer = setTimeout(() => setFlashClass(''), 500);
      return () => clearTimeout(timer);
    }
    prevPrice.current = stock.price;
  }, [stock.price]);

  const handleRowClick = () => {
    if (isCompareMode) {
      onToggleCompare(stock.ticker);
    } else {
      onSelectTicker(stock.ticker);
    }
  };

  const rowClasses = `
    border-b border-gray-700 last:border-b-0 transition-colors duration-150
    ${isCompareMode ? 'cursor-pointer' : ''}
    ${isSelected ? 'bg-emerald-800/40 hover:bg-emerald-800/60' : 'hover:bg-gray-700/50'}
  `;

  return (
    <tr className={rowClasses} onClick={handleRowClick}>
      {isCompareMode && (
        <td className="p-2 w-10 text-center">
          {isSelected && (
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </td>
      )}
      <td className="p-2">
        <div className="font-bold">{stock.ticker}</div>
        <div className="text-xs text-gray-400 truncate max-w-[100px] md:max-w-xs">{stock.name}</div>
      </td>
      <td className={`p-2 font-mono ${flashClass}`}>
        ${stock.price.toFixed(2)}
      </td>
      <td className={`p-2 font-mono text-right ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
      </td>
      <td className="p-2 text-right">
        <button onClick={(e) => { e.stopPropagation(); onRemoveFromWatchlist(stock.ticker); }} className="text-gray-500 hover:text-red-500 p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </td>
    </tr>
  );
};

const Watchlist: React.FC<WatchlistProps> = ({ watchlistTickers, onSelectTicker, onRemoveFromWatchlist, selectedForCompare, onToggleCompare, onCompareClick, onClearCompareSelection }) => {
  const { quotes: watchlistQuotes } = useRealtimeQuotes(watchlistTickers);
  const [isCompareMode, setIsCompareMode] = useState(false);
  
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Watchlist</h2>
        {!isCompareMode ? (
          <button
            onClick={() => setIsCompareMode(true)}
            className="py-1 px-3 bg-gray-700 hover:bg-gray-600 rounded-full text-sm font-semibold transition-colors"
          >
            Compare
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onCompareClick}
              disabled={selectedForCompare.length < 2}
              className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 rounded-full text-sm font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Compare {selectedForCompare.length} items
            </button>
            <button
              onClick={() => {
                setIsCompareMode(false);
                onClearCompareSelection();
              }}
              className="py-1 px-3 bg-gray-600 hover:bg-gray-500 rounded-full text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {watchlistTickers.length === 0 ? (
        <p className="text-gray-400">Your watchlist is empty. Add stocks using the search bar.</p>
      ) : watchlistQuotes.length === 0 ? (
        <p className="text-gray-400">Loading watchlist data...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                {isCompareMode && <th className="p-2 w-10"></th>}
                <th className="p-2 font-semibold text-gray-400">Ticker</th>
                <th className="p-2 font-semibold text-gray-400">Price</th>
                <th className="p-2 font-semibold text-gray-400 text-right">Change</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {watchlistQuotes.map((stock) => (
                <WatchlistRow
                  key={stock.ticker}
                  stock={stock}
                  onSelectTicker={onSelectTicker}
                  onRemoveFromWatchlist={onRemoveFromWatchlist}
                  onToggleCompare={onToggleCompare}
                  isSelected={selectedForCompare.includes(stock.ticker)}
                  isCompareMode={isCompareMode}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default Watchlist;
