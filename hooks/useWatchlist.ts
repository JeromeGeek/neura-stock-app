
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
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
      setWatchlist(items);
      // Trigger a storage event for other components
      window.dispatchEvent(new Event('watchlist-updated'));
    } catch (error) {
      console.error('Failed to save watchlist to localStorage', error);
    }
  };

  const addToWatchlist = useCallback((ticker: string) => {
    setWatchlist(prev => {
      if (!prev.includes(ticker)) {
        const newList = [...prev, ticker];
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newList));
        window.dispatchEvent(new Event('watchlist-updated'));
        return newList;
      }
      return prev;
    });
  }, []);

  const removeFromWatchlist = useCallback((ticker: string) => {
    setWatchlist(prev => {
      const newList = prev.filter((item) => item !== ticker);
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newList));
      window.dispatchEvent(new Event('watchlist-updated'));
      return newList;
    });
  }, []);

  const isinWatchlist = useCallback((ticker: string) => {
    return watchlist.includes(ticker);
  }, [watchlist]);

  // Listen for watchlist updates from other parts of the app
  useEffect(() => {
    const handleUpdate = () => {
      const storedItems = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (storedItems) {
        setWatchlist(JSON.parse(storedItems));
      }
    };
    window.addEventListener('watchlist-updated', handleUpdate);
    return () => window.removeEventListener('watchlist-updated', handleUpdate);
  }, []);

  return { watchlist, addToWatchlist, removeFromWatchlist, isinWatchlist };
};
