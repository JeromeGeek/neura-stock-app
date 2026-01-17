import { StockQuote, StockDetails, ChartDataPoint, TimeRange, NewsArticle, FinancialMetric } from '../types';

// IMPORTANT: For local development, you might need to run a local proxy.
// For production, this should be the URL of your deployed serverless function.
const API_BASE_URL = '/api';

// Pre-defined lists for widgets, as fetching "all" is not feasible with the free API.
const POPULAR_TICKERS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM', 'V', 'JNJ', 'WMT', 'PG', 'DIS'];
const MARKET_INDEX_TICKERS = ['SPY', 'QQQ', 'DIA']; // Using ETFs to represent indices

const apiRequest = async <T>(endpoint: string): Promise<T> => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            console.error(`API request failed for ${endpoint}: ${response.statusText}`);
            throw new Error('Network response was not ok');
        }
        return response.json();
    } catch (error) {
        console.error(`Error fetching from ${endpoint}:`, error);
        throw error;
    }
};

const getQuote = async (ticker: string): Promise<StockQuote | null> => {
    const quoteData = await apiRequest<any>(`/quote?symbol=${ticker}`);
    const profileData = await apiRequest<any>(`/stock/profile2?symbol=${ticker}`);

    if (!quoteData || !profileData || quoteData.c === 0) return null;

    return {
        ticker: profileData.ticker || ticker,
        name: profileData.name || 'N/A',
        price: quoteData.c,
        change: quoteData.d,
        changePercent: quoteData.dp,
    };
};

const getChartData = async (ticker: string, range: TimeRange): Promise<ChartDataPoint[]> => {
    let resolution = 'D';
    const to = Math.floor(Date.now() / 1000);
    let from = 0;

    // Helper to avoid mutating the same Date object
    const getFromDate = (modifier: (d: Date) => void): number => {
        const date = new Date();
        modifier(date);
        return Math.floor(date.getTime() / 1000);
    };

    switch (range) {
        case '1D':
            resolution = '30'; // 30-minute intervals
            from = getFromDate(d => d.setDate(d.getDate() - 2)); // Fetch 2 days to be safe
            break;
        case '5D':
            resolution = '60'; // 60-minute intervals
            from = getFromDate(d => d.setDate(d.getDate() - 7));
            break;
        case '1M':
            resolution = 'D';
            from = getFromDate(d => d.setMonth(d.getMonth() - 1));
            break;
        case '6M':
            resolution = 'D';
            from = getFromDate(d => d.setMonth(d.getMonth() - 6));
            break;
        case '1Y':
            resolution = 'W';
            from = getFromDate(d => d.setFullYear(d.getFullYear() - 1));
            break;
        case '5Y':
            resolution = 'M';
            from = getFromDate(d => d.setFullYear(d.getFullYear() - 5));
            break;
    }

    const candleData = await apiRequest<any>(`/stock/candle?symbol=${ticker}&resolution=${resolution}&from=${from}&to=${to}`);
    if (!candleData.c) return [];

    return candleData.c.map((price: number, index: number) => ({
        price: parseFloat(price.toFixed(2)),
        date: new Date(candleData.t[index] * 1000).toISOString(),
    }));
};

const getFinancials = async (ticker: string): Promise<FinancialMetric[]> => {
    const metrics = await apiRequest<any>(`/stock/metric?symbol=${ticker}&metric=all`);
    const profile = await apiRequest<any>(`/stock/profile2?symbol=${ticker}`);
    if (!metrics || !metrics.metric || !profile) return [];
    
    const formatLargeNumber = (num: number) => {
        if (!num) return 'N/A';
        if (num > 1e12) return `${(num / 1e12).toFixed(2)}T`;
        if (num > 1e9) return `${(num / 1e9).toFixed(2)}B`;
        if (num > 1e6) return `${(num / 1e6).toFixed(2)}M`;
        return num.toString();
    };

    return [
        { label: 'Market Cap', value: formatLargeNumber(profile.marketCapitalization * 1e6) },
        { label: '52W High', value: `$${metrics.metric['52WeekHigh']?.toFixed(2) ?? 'N/A'}` },
        { label: '52W Low', value: `$${metrics.metric['52WeekLow']?.toFixed(2) ?? 'N/A'}` },
        { label: 'P/E Ratio', value: metrics.metric.peNormalizedAnnual?.toFixed(2) ?? 'N/A' },
    ];
};

const getNews = async (ticker: string): Promise<NewsArticle[]> => {
    const today = new Date();
    const yearAgo = new Date();
    yearAgo.setFullYear(today.getFullYear() - 1);
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const articles = await apiRequest<any[]>(`/company-news?symbol=${ticker}&from=${formatDate(yearAgo)}&to=${formatDate(today)}`);
    if (!articles) return [];

    // Simple heuristic for impact
    const assignImpact = (headline: string) => {
      const lowerHeadline = headline.toLowerCase();
      if (lowerHeadline.includes('earnings') || lowerHeadline.includes('record') || lowerHeadline.includes('beats')) return 'High';
      if (lowerHeadline.includes('upgrade') || lowerHeadline.includes('downgrade') || lowerHeadline.includes('new product')) return 'Medium';
      return 'Low';
    };

    return articles.slice(0, 10).map(article => ({
        headline: article.headline,
        source: article.source,
        publishedAt: article.datetime,
        url: article.url,
        impact: assignImpact(article.headline),
    }));
};

export const stockService = {
    async getStockDetails(ticker: string): Promise<StockDetails | null> {
        try {
            const quote = await getQuote(ticker);
            if (!quote) return null;

            const [chartData, financials, news] = await Promise.all([
                Promise.all(
                    ['1D', '5D', '1M', '6M', '1Y', '5Y'].map(range => getChartData(ticker, range as TimeRange))
                ).then(results => ({
                    '1D': results[0], '5D': results[1], '1M': results[2], '6M': results[3], '1Y': results[4], '5Y': results[5],
                })),
                getFinancials(ticker),
                getNews(ticker)
            ]);
            
            return { quote, chartData, financials, news };
        } catch (error) {
            console.error(`Failed to get details for ${ticker}`, error);
            return null;
        }
    },
    async searchStocks(query: string): Promise<StockQuote[]> {
        if (!query) return [];
        const searchResults = await apiRequest<any>(`/search?q=${query}`);
        if (!searchResults.result) return [];
        const filteredResults = searchResults.result.filter((r: any) => !r.symbol.includes('.'));
        const quotes = await this.getWatchlistQuotes(filteredResults.slice(0, 5).map((r: any) => r.symbol));
        return quotes;
    },
    async getWatchlistQuotes(tickers: string[]): Promise<StockQuote[]> {
        const quotePromises = tickers.map(ticker => getQuote(ticker));
        const quotes = await Promise.all(quotePromises);
        return quotes.filter((q): q is StockQuote => q !== null);
    },
    async getGlobalNews(): Promise<NewsArticle[]> {
        const articles = await apiRequest<any[]>(`/news?category=general`);
        if (!articles) return [];
        return articles.slice(0, 10).map(article => ({
            headline: article.headline,
            source: article.source,
            publishedAt: article.datetime,
            url: article.url,
            impact: 'Medium',
        }));
    },
    getAllStockTickers: (): string[] => POPULAR_TICKERS,
    getMarketIndexTickers: (): string[] => MARKET_INDEX_TICKERS,
    getMarketETFTickers: (): string[] => MARKET_INDEX_TICKERS, // Using same for simplicity
};