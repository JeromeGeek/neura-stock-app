
import { StockQuote, StockDetails, ChartDataPoint, TimeRange, NewsArticle, FinancialMetric } from '../types';

const API_BASE_URL = '/api';

// Initial hardcoded cache for major indices to save API calls
const MEMORY_CACHE: Record<string, { name: string, ticker: string }> = {
    'SPY': { name: 'S&P 500 ETF Trust', ticker: 'SPY' },
    'QQQ': { name: 'Invesco QQQ Trust', ticker: 'QQQ' },
    'DIA': { name: 'Dow Jones Industrial Average', ticker: 'DIA' },
    'AAPL': { name: 'Apple Inc', ticker: 'AAPL' },
    'GOOGL': { name: 'Alphabet Inc', ticker: 'GOOGL' },
    'MSFT': { name: 'Microsoft Corp', ticker: 'MSFT' }
};

const getCachedProfile = (ticker: string) => {
    if (MEMORY_CACHE[ticker]) return MEMORY_CACHE[ticker];
    try {
        const stored = localStorage.getItem(`profile_${ticker}`);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                return parsed.data;
            }
        }
    } catch (e) {}
    return null;
};

const setCachedProfile = (ticker: string, data: any) => {
    try {
        localStorage.setItem(`profile_${ticker}`, JSON.stringify({
            timestamp: Date.now(),
            data
        }));
    } catch (e) {}
};

const POPULAR_TICKERS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM', 'V', 'JNJ', 'WMT', 'PG', 'DIS'];
const MARKET_INDEX_TICKERS = ['SPY', 'QQQ', 'DIA'];

// Rate limit handling: 60 per minute = 1 request every 1s.
// We use 1500ms to be extremely safe against burst detection.
let requestQueue: Promise<any> = Promise.resolve();
const REQUEST_GAP = 1500;

const apiRequest = async <T>(endpoint: string): Promise<T | null> => {
    const result = requestQueue.then(async () => {
        await new Promise(resolve => setTimeout(resolve, REQUEST_GAP));
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            if (!response.ok) {
                console.warn(`API responded with ${response.status} for ${endpoint}`);
                return null;
            }
            return response.json();
        } catch (e) {
            return null;
        }
    });

    requestQueue = result.catch(() => null);
    return result;
};

const getQuote = async (ticker: string): Promise<StockQuote | null> => {
    try {
        const quoteData = await apiRequest<any>(`/quote?symbol=${ticker}`);
        if (!quoteData || (quoteData.c === 0 && quoteData.pc === 0)) return null;

        let profile = getCachedProfile(ticker);
        if (!profile) {
            const profileData = await apiRequest<any>(`/stock/profile2?symbol=${ticker}`);
            if (profileData && profileData.name) {
                profile = { name: profileData.name, ticker: profileData.ticker || ticker };
                setCachedProfile(ticker, profile);
            } else {
                profile = { name: ticker, ticker: ticker }; // Fallback
            }
        }

        return {
            ticker: ticker,
            name: profile.name,
            price: quoteData.c || quoteData.pc || 0,
            change: quoteData.d || 0,
            changePercent: quoteData.dp || 0,
        };
    } catch (error) {
        return null;
    }
};

export const stockService = {
    async getStockDetails(ticker: string): Promise<StockDetails | null> {
        try {
            const quote = await getQuote(ticker);
            if (!quote) return null;

            // Fetch details one by one to respect the queue
            const chartData: any = {};
            for (const range of ['1D', '5D', '1M', '6M', '1Y', '5Y']) {
                chartData[range] = await this.getChartData(ticker, range as TimeRange);
            }
            
            const financials = await this.getFinancials(ticker) || [];
            const news = await this.getNews(ticker) || [];
            
            return { quote, chartData, financials, news };
        } catch (error) {
            return null;
        }
    },

    async getChartData(ticker: string, range: TimeRange): Promise<ChartDataPoint[]> {
        const to = Math.floor(Date.now() / 1000);
        let from = 0;
        let resolution = 'D';
        const getFromDate = (modifier: (d: Date) => void) => {
            const d = new Date();
            modifier(d);
            return Math.floor(d.getTime() / 1000);
        };

        switch (range) {
            case '1D': resolution = '30'; from = getFromDate(d => d.setDate(d.getDate() - 1)); break;
            case '5D': resolution = '60'; from = getFromDate(d => d.setDate(d.getDate() - 5)); break;
            case '1M': resolution = 'D'; from = getFromDate(d => d.setMonth(d.getMonth() - 1)); break;
            case '6M': resolution = 'D'; from = getFromDate(d => d.setMonth(d.getMonth() - 6)); break;
            case '1Y': resolution = 'W'; from = getFromDate(d => d.setFullYear(d.getFullYear() - 1)); break;
            case '5Y': resolution = 'M'; from = getFromDate(d => d.setFullYear(d.getFullYear() - 5)); break;
        }

        const data = await apiRequest<any>(`/stock/candle?symbol=${ticker}&resolution=${resolution}&from=${from}&to=${to}`);
        if (!data || !data.c) return [];
        return data.c.map((price: number, i: number) => ({
            price: parseFloat(price.toFixed(2)),
            date: new Date(data.t[i] * 1000).toISOString(),
        }));
    },

    async getFinancials(ticker: string): Promise<FinancialMetric[]> {
        const metrics = await apiRequest<any>(`/stock/metric?symbol=${ticker}&metric=all`);
        if (!metrics || !metrics.metric) return [];
        const f = (n: number) => {
            if (!n) return 'N/A';
            if (n > 1e12) return `${(n / 1e12).toFixed(2)}T`;
            if (n > 1e9) return `${(n / 1e9).toFixed(2)}B`;
            if (n > 1e6) return `${(n / 1e6).toFixed(2)}M`;
            return n.toString();
        };
        return [
            { label: 'Market Cap', value: f(metrics.metric.marketCapitalization) },
            { label: '52W High', value: `$${metrics.metric['52WeekHigh']?.toFixed(2) ?? 'N/A'}` },
            { label: '52W Low', value: `$${metrics.metric['52WeekLow']?.toFixed(2) ?? 'N/A'}` },
            { label: 'P/E Ratio', value: metrics.metric.peNormalizedAnnual?.toFixed(2) ?? 'N/A' },
        ];
    },

    async getNews(ticker: string): Promise<NewsArticle[]> {
        const today = new Date();
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        const data = await apiRequest<any[]>(`/company-news?symbol=${ticker}&from=${formatDate(monthAgo)}&to=${formatDate(today)}`);
        if (!data) return [];
        return data.slice(0, 10).map(a => ({
            headline: a.headline,
            source: a.source,
            publishedAt: a.datetime,
            url: a.url,
            impact: a.headline.toLowerCase().includes('earnings') ? 'High' : 'Medium',
        }));
    },

    async searchStocks(query: string): Promise<StockQuote[]> {
        if (!query) return [];
        const data = await apiRequest<any>(`/search?q=${query}`);
        if (!data || !data.result) return [];
        const symbols = data.result.filter((r: any) => !r.symbol.includes('.')).slice(0, 3).map((r: any) => r.symbol);
        return this.getWatchlistQuotes(symbols);
    },

    async getWatchlistQuotes(tickers: string[]): Promise<StockQuote[]> {
        const quotes = [];
        for (const t of tickers) {
            const q = await getQuote(t);
            if (q) quotes.push(q);
        }
        return quotes;
    },

    async getGlobalNews(): Promise<NewsArticle[]> {
        const data = await apiRequest<any[]>(`/news?category=general`);
        if (!data) return [];
        return data.slice(0, 10).map(a => ({
            headline: a.headline,
            source: a.source,
            publishedAt: a.datetime,
            url: a.url,
            impact: 'Medium',
        }));
    },

    getAllStockTickers: (): string[] => POPULAR_TICKERS,
    getMarketIndexTickers: (): string[] => MARKET_INDEX_TICKERS,
    getMarketETFTickers: (): string[] => MARKET_INDEX_TICKERS,
};
