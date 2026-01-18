
import { useState, useEffect } from 'react';
import { stockService } from '../services/stockService';
import { StockQuote } from '../types';

export function useRealtimeQuotes(tickers: string[]): { quotes: StockQuote[], lastUpdated: number | null } {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchQuotes = async () => {
      if (!isMounted || tickers.length === 0) {
        if(isMounted) setQuotes([]);
        return;
      }
      try {
        const newQuotes = await stockService.getWatchlistQuotes(tickers);
        if (isMounted) {
          setQuotes(newQuotes);
          setLastUpdated(Date.now());
        }
      } catch (error) {
        // Log locally but don't spam console if it's just a rate limit
        if (error instanceof Error && !error.message.includes('429')) {
            console.error("Failed to fetch realtime quotes", error);
        }
      }
    };

    fetchQuotes(); // Initial fetch
    // Use a longer interval for the free tier (60 seconds)
    const interval = setInterval(fetchQuotes, 60000); 

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [JSON.stringify(tickers)]); // Re-run effect if tickers array changes

  return { quotes, lastUpdated };
}
