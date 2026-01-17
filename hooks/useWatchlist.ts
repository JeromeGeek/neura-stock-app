
import { useState, useEffect, useCallback } from 'react';

const WATCHLIST_STORAGE_KEY = 'stock_watchlist';

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (storedItems) {
        setWatchlist(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error('Failed to parse watchlist from localStorage', error);
      setWatchlist([]);
    }
  }, []);

  const saveWatchlist = (items: string[]) => {
    try {
      setWatchlist(items);
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save watchlist to localStorage', error);
    }
  };

  const addToWatchlist = useCallback((ticker: string) => {
    if (!watchlist.includes(ticker)) {
      saveWatchlist([...watchlist, ticker]);
    }
  }, [watchlist]);

  const removeFromWatchlist = useCallback((ticker: string) => {
    saveWatchlist(watchlist.filter((item) => item !== ticker));
  }, [watchlist]);

  const isinWatchlist = useCallback((ticker: string) => {
    return watchlist.includes(ticker);
  }, [watchlist]);

  return { watchlist, addToWatchlist, removeFromWatchlist, isinWatchlist };
};
