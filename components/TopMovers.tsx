
import React from 'react';
import { stockService } from '../services/stockService';
import { useRealtimeQuotes } from '../hooks/useRealtimeQuotes';
import { StockQuote } from '../types';
import Card from './Card';

const popularTickers = stockService.getAllStockTickers();

interface TopMoversProps {
    onSelectTicker: (ticker: string) => void;
}

const MoverItem: React.FC<{ stock: StockQuote, onSelectTicker: (ticker: string) => void }> = ({ stock, onSelectTicker }) => {
    const isPositive = stock.changePercent >= 0;
    return (
        <div 
            className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0 hover:bg-gray-700/50 -mx-4 px-4 cursor-pointer"
            onClick={() => onSelectTicker(stock.ticker)}
        >
            <div>
                <p className="font-bold">{stock.ticker}</p>
                <p className="text-xs text-gray-400">${stock.price.toFixed(2)}</p>
            </div>
            <p className={`font-semibold font-mono text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </p>
        </div>
    );
};


const TopMovers: React.FC<TopMoversProps> = ({ onSelectTicker }) => {
    const { quotes } = useRealtimeQuotes(popularTickers);

    // Show partial data as it loads (progressive rendering)
    const hasData = quotes.length > 0;
    const isFullyLoaded = quotes.length === popularTickers.length;

    if (!hasData) {
        return (
            <Card>
                <h2 className="text-2xl font-bold mb-4">Top Movers</h2>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                    <p className="text-gray-400 ml-3">Loading market data...</p>
                </div>
            </Card>
        );
    }

    const sortedQuotes = [...quotes].sort((a, b) => b.changePercent - a.changePercent);
    const gainers = sortedQuotes.slice(0, 5);
    const losers = sortedQuotes.slice(-5).reverse();

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Top Movers</h2>
                {!isFullyLoaded && (
                    <span className="text-xs text-gray-500 flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-emerald-500 mr-2"></div>
                        Loading {quotes.length}/{popularTickers.length}
                    </span>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-green-500 mb-2">Top Gainers</h3>
                    <div>
                        {gainers.map(stock => <MoverItem key={stock.ticker} stock={stock} onSelectTicker={onSelectTicker} />)}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-red-500 mb-2">Top Losers</h3>
                     <div>
                        {losers.map(stock => <MoverItem key={stock.ticker} stock={stock} onSelectTicker={onSelectTicker} />)}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default TopMovers;
