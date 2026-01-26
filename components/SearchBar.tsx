
import React, { useState, useEffect } from 'react';
import { StockQuote } from '../types';
import { stockService } from '../services/stockService';
import { useDebounce } from '../hooks/useDebounce';
import { useWatchlist } from '../hooks/useWatchlist';

interface SearchBarProps {
  onSelectTicker: (ticker: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSelectTicker }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockQuote[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const { addToWatchlist, isinWatchlist, watchlist } = useWatchlist();

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length > 1) {
        setIsLoading(true);
        const searchResults = await stockService.searchStocks(debouncedQuery);
        setResults(searchResults);
        setIsLoading(false);
      } else {
        setResults([]);
      }
    };
    performSearch();
  }, [debouncedQuery]);

  // Force re-render when watchlist changes
  useEffect(() => {
    // This ensures the component re-renders when watchlist updates
  }, [watchlist]);

  const handleSelect = (ticker: string) => {
    setQuery('');
    setResults([]);
    onSelectTicker(ticker);
  };

  const handleAddToWatchlist = (e: React.MouseEvent, ticker: string) => {
    e.stopPropagation(); // Prevent triggering the select
    addToWatchlist(ticker);
    setJustAdded(ticker);
    setTimeout(() => setJustAdded(null), 2000); // Clear after 2 seconds
  };

  return (
    <div className="relative w-full max-w-lg mx-auto mb-8">
      <div className="relative">
        <svg xmlns="http://www.w.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 300)}
          placeholder="Search by ticker or company name"
          className="w-full bg-gray-800 border border-gray-700 rounded-full py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
        />
        {isLoading && <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-emerald-500"></div>}
      </div>
      {isFocused && (results.length > 0 || query.length > 0) && (
        <ul className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {results.length > 0 ? results.map((stock) => (
            <li
              key={stock.ticker}
              className="px-4 py-3 cursor-pointer hover:bg-gray-700 transition-colors duration-150 flex justify-between items-center group"
            >
              <div onClick={() => handleSelect(stock.ticker)} className="flex-1 flex justify-between items-center">
                <div>
                  <span className="font-bold">{stock.ticker}</span>
                  <span className="text-gray-400 ml-2 text-sm">{stock.name}</span>
                </div>
                <span className="font-mono text-gray-300">${stock.price.toFixed(2)}</span>
              </div>
              {!isinWatchlist(stock.ticker) && justAdded !== stock.ticker && (
                <button
                  onClick={(e) => handleAddToWatchlist(e, stock.ticker)}
                  className="ml-3 p-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 transition-all opacity-70 group-hover:opacity-100 hover:scale-110"
                  title="Add to Watchlist"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              {justAdded === stock.ticker && (
                <span className="ml-3 p-1.5 text-emerald-400 animate-pulse" title="Added!">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              {isinWatchlist(stock.ticker) && justAdded !== stock.ticker && (
                <span className="ml-3 p-1.5 text-emerald-500" title="Already in Watchlist">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </li>
          )) : !isLoading && debouncedQuery.length > 1 ? (
            <li className="px-4 py-3 text-gray-400">No results found.</li>
          ) : null}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
