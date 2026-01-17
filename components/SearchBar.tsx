
import React, { useState, useEffect } from 'react';
import { StockQuote } from '../types';
import { stockService } from '../services/stockService';
import { useDebounce } from '../hooks/useDebounce';

interface SearchBarProps {
  onSelectTicker: (ticker: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSelectTicker }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockQuote[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

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

  const handleSelect = (ticker: string) => {
    setQuery('');
    setResults([]);
    onSelectTicker(ticker);
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
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
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
              onClick={() => handleSelect(stock.ticker)}
              className="px-4 py-3 cursor-pointer hover:bg-gray-700 transition-colors duration-150 flex justify-between items-center"
            >
              <div>
                <span className="font-bold">{stock.ticker}</span>
                <span className="text-gray-400 ml-2">{stock.name}</span>
              </div>
              <span className="font-mono text-gray-300">${stock.price.toFixed(2)}</span>
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
