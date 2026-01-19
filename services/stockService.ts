
import { StockQuote, StockDetails, ChartDataPoint, TimeRange, NewsArticle, FinancialMetric } from '../types';

const API_BASE_URL = '/api';

// Pre-populated cache to avoid "Profile" API calls for the most common tickers
const STATIC_PROFILE_CACHE: Record<string, { name: string, ticker: string }> = {
    'AAPL': { name: 'Apple Inc', ticker: 'AAPL' },
    'GOOGL': { name: 'Alphabet Inc', ticker: 'GOOGL' },
    'MSFT': { name: 'Microsoft Corp', ticker: 'MSFT' },
    'AMZN': { name: 'Amazon.com Inc', ticker: 'AMZN' },
    'TSLA': { name: 'Tesla Inc', ticker: 'TSLA' },
    'NVDA': { name: 'NVIDIA Corp', ticker: 'NVDA' },
    'META': { name: 'Meta Platforms Inc', ticker: 'META' },
    'JPM': { name: 'JPMorgan Chase & Co', ticker: 'JPM' },
    'V': { name: 'Visa Inc', ticker: 'V' },
    'JNJ': { name: 'Johnson & Johnson', ticker: 'JNJ' },
    'WMT': { name: 'Walmart Inc', ticker: 'WMT' },
    'PG': { name: 'Procter & Gamble Co', ticker: 'PG' },
    'DIS': { name: 'Walt Disney Co', ticker: 'DIS' },
    'SPY': { name: 'S&P 500 ETF Trust', ticker: 'SPY' },
    'QQQ': { name: 'Invesco QQQ Trust', ticker: 'QQQ' },
    'DIA': { name: 'SPDR Dow Jones Industrial Average ETF', ticker: 'DIA' }
};

const getCachedProfile = (ticker: string) => {
    if (STATIC_PROFILE_CACHE[ticker]) return STATIC_PROFILE_CACHE[ticker];
    try {
        const stored = localStorage.getItem(`profile_${ticker}`);
        if (stored) {
            const { timestamp, data } = JSON.parse(stored);
            if (Date.now() - timestamp < 48 * 60 * 60 * 1000) return data;
        }
    } catch (e) {}
    return null;
};

const setCachedProfile = (ticker: string, data: any) => {
    try {
        localStorage.setItem(`profile_${ticker}`, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (e) {}
};

const POPULAR_TICKERS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM', 'V', 'JNJ', 'WMT', 'PG', 'DIS'];
const MARKET_INDEX_TICKERS = ['SPY', 'QQQ', 'DIA'];

// Global Request Queue to strictly follow Finnhub Free Tier (60 req/min)
let requestQueue: Promise<any> = Promise.resolve();
const REQ_DELAY = 1300; // 1.3s to be safe against network jitter

const apiRequest = async <T>(endpoint: string): Promise<T | null> => {
    const result = requestQueue.then(async () => {
        await new Promise(resolve => setTimeout(resolve, REQ_DELAY));
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            if (!response.ok) {
                console.error(`API request failed for ${endpoint}: Status ${response.status}`);
                return null;
            }
            return response.json();
        } catch (e) {
            console.error(`Network error fetching from ${endpoint}:`, e);
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
                profile = { name: ticker, ticker: ticker };
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

            const chartData: any = {};
            const ranges: TimeRange[] = ['1D', '5D', '1M', '6M', '1Y', '5Y'];
            for (const range of ranges) {
                chartData[range] = await this.getChartData(ticker, range);
            }
            
            const financials = await this.getFinancials(ticker);
            const news = await this.getNews(ticker);
            
            return { quote, chartData, financials: financials || [], news: news || [] };
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
