
import { StockQuote, StockDetails, ChartDataPoint, TimeRange, NewsArticle, FinancialMetric } from '../types';

const API_BASE_URL = '/api';

// Cache for company names to avoid hitting /stock/profile2 repeatedly (Rate Limit 429 prevention)
const profileCache: Record<string, { name: string, ticker: string } | null> = {
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

const POPULAR_TICKERS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM', 'V', 'JNJ', 'WMT', 'PG', 'DIS'];
const MARKET_INDEX_TICKERS = ['SPY', 'QQQ', 'DIA'];

// A simple queue to ensure we don't burst past rate limits
let requestQueue: Promise<any> = Promise.resolve();
const DELAY_BETWEEN_REQUESTS = 250; // ms

const apiRequest = async <T>(endpoint: string): Promise<T> => {
    // Chain onto the end of the current queue
    const result = requestQueue.then(async () => {
        // Wait a bit before starting the next request
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            if (response.status === 429) {
                console.warn('Finnhub Rate Limit Hit (429). Throttling...');
                // Return null or throw - we'll handle it in the service
                throw new Error('RATE_LIMIT');
            }
            throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
    });

    // Update the queue pointer to wait for this request to finish
    requestQueue = result.catch(() => {});
    return result;
};

const getQuote = async (ticker: string): Promise<StockQuote | null> => {
    try {
        // 1. Fetch price data
        const quoteData = await apiRequest<any>(`/quote?symbol=${ticker}`);
        if (!quoteData || (quoteData.c === 0 && quoteData.pc === 0)) return null;

        // 2. Fetch or used cached profile data
        let profile = profileCache[ticker];
        
        // If profile isn't in cache (and we haven't tried before), fetch it
        if (profile === undefined) {
            try {
                const profileData = await apiRequest<any>(`/stock/profile2?symbol=${ticker}`);
                if (profileData && profileData.name) {
                    profile = { name: profileData.name, ticker: profileData.ticker || ticker };
                    profileCache[ticker] = profile;
                } else {
                    // Cache the "Not Found" state so we don't try again
                    profileCache[ticker] = null;
                }
            } catch (e) {
                // On error, don't update cache, let it try once more later
                profile = null;
            }
        }

        return {
            ticker: ticker,
            name: profile?.name || ticker,
            price: quoteData.c || quoteData.pc || 0,
            change: quoteData.d || 0,
            changePercent: quoteData.dp || 0,
        };
    } catch (error: any) {
        if (error.message !== 'RATE_LIMIT') {
            console.error(`Error fetching ${ticker}:`, error);
        }
        return null;
    }
};

export const stockService = {
    async getStockDetails(ticker: string): Promise<StockDetails | null> {
        try {
            const quote = await getQuote(ticker);
            if (!quote) return null;

            const [chartData, financials, news] = await Promise.all([
                Promise.all(
                    ['1D', '5D', '1M', '6M', '1Y', '5Y'].map(range => this.getChartData(ticker, range as TimeRange))
                ).then(results => ({
                    '1D': results[0], '5D': results[1], '1M': results[2], '6M': results[3], '1Y': results[4], '5Y': results[5],
                })),
                this.getFinancials(ticker),
                this.getNews(ticker)
            ]);
            
            return { quote, chartData, financials, news };
        } catch (error) {
            return null;
        }
    },

    async getChartData(ticker: string, range: TimeRange): Promise<ChartDataPoint[]> {
        let resolution = 'D';
        const to = Math.floor(Date.now() / 1000);
        let from = 0;
        const getFromDate = (modifier: (d: Date) => void): number => {
            const date = new Date();
            modifier(date);
            return Math.floor(date.getTime() / 1000);
        };

        switch (range) {
            case '1D': resolution = '30'; from = getFromDate(d => d.setDate(d.getDate() - 1)); break;
            case '5D': resolution = '60'; from = getFromDate(d => d.setDate(d.getDate() - 5)); break;
            case '1M': resolution = 'D'; from = getFromDate(d => d.setMonth(d.getMonth() - 1)); break;
            case '6M': resolution = 'D'; from = getFromDate(d => d.setMonth(d.getMonth() - 6)); break;
            case '1Y': resolution = 'W'; from = getFromDate(d => d.setFullYear(d.getFullYear() - 1)); break;
            case '5Y': resolution = 'M'; from = getFromDate(d => d.setFullYear(d.getFullYear() - 5)); break;
        }

        try {
            const candleData = await apiRequest<any>(`/stock/candle?symbol=${ticker}&resolution=${resolution}&from=${from}&to=${to}`);
            if (!candleData || !candleData.c) return [];

            return candleData.c.map((price: number, index: number) => ({
                price: parseFloat(price.toFixed(2)),
                date: new Date(candleData.t[index] * 1000).toISOString(),
            }));
        } catch(e) { return []; }
    },

    async getFinancials(ticker: string): Promise<FinancialMetric[]> {
        try {
            const metrics = await apiRequest<any>(`/stock/metric?symbol=${ticker}&metric=all`);
            if (!metrics || !metrics.metric) return [];
            
            const formatLargeNumber = (num: number) => {
                if (!num) return 'N/A';
                if (num > 1e12) return `${(num / 1e12).toFixed(2)}T`;
                if (num > 1e9) return `${(num / 1e9).toFixed(2)}B`;
                if (num > 1e6) return `${(num / 1e6).toFixed(2)}M`;
                return num.toString();
            };

            return [
                { label: 'Market Cap', value: formatLargeNumber(metrics.metric.marketCapitalization) },
                { label: '52W High', value: `$${metrics.metric['52WeekHigh']?.toFixed(2) ?? 'N/A'}` },
                { label: '52W Low', value: `$${metrics.metric['52WeekLow']?.toFixed(2) ?? 'N/A'}` },
                { label: 'P/E Ratio', value: metrics.metric.peNormalizedAnnual?.toFixed(2) ?? 'N/A' },
            ];
        } catch(e) { return []; }
    },

    async getNews(ticker: string): Promise<NewsArticle[]> {
        try {
            const today = new Date();
            const monthAgo = new Date();
            monthAgo.setMonth(today.getMonth() - 1);
            const formatDate = (date: Date) => date.toISOString().split('T')[0];

            const articles = await apiRequest<any[]>(`/company-news?symbol=${ticker}&from=${formatDate(monthAgo)}&to=${formatDate(today)}`);
            if (!articles) return [];

            return articles.slice(0, 10).map(article => ({
                headline: article.headline,
                source: article.source,
                publishedAt: article.datetime,
                url: article.url,
                impact: article.headline.toLowerCase().includes('earnings') ? 'High' : 'Medium',
            }));
        } catch(e) { return []; }
    },

    async searchStocks(query: string): Promise<StockQuote[]> {
        if (!query) return [];
        try {
            const searchResults = await apiRequest<any>(`/search?q=${query}`);
            if (!searchResults.result) return [];
            const filteredResults = searchResults.result.filter((r: any) => !r.symbol.includes('.'));
            return this.getWatchlistQuotes(filteredResults.slice(0, 5).map((r: any) => r.symbol));
        } catch(e) { return []; }
    },

    async getWatchlistQuotes(tickers: string[]): Promise<StockQuote[]> {
        const quotes = [];
        // Sequential fetching is mandatory for the free tier
        for (const ticker of tickers) {
            const q = await getQuote(ticker);
            if (q) quotes.push(q);
        }
        return quotes;
    },

    async getGlobalNews(): Promise<NewsArticle[]> {
        try {
            const articles = await apiRequest<any[]>(`/news?category=general`);
            if (!articles) return [];
            return articles.slice(0, 10).map(article => ({
                headline: article.headline,
                source: article.source,
                publishedAt: article.datetime,
                url: article.url,
                impact: 'Medium',
            }));
        } catch (e) {
            return [];
        }
    },

    getAllStockTickers: (): string[] => POPULAR_TICKERS,
    getMarketIndexTickers: (): string[] => MARKET_INDEX_TICKERS,
    getMarketETFTickers: (): string[] => MARKET_INDEX_TICKERS,
};
