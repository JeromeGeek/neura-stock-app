
export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface ChartDataPoint {
  date: string;
  price: number;
}

export type TimeRange = '1D' | '5D' | '1M' | '6M' | '1Y' | '5Y';

export interface FinancialMetric {
  label: string;
  value: string;
}

export type NewsImpact = 'High' | 'Medium' | 'Low';

export interface NewsArticle {
  headline: string;
  source: string;
  publishedAt: number; // Changed from string to number for Unix timestamp
  url: string;
  impact: NewsImpact; // This will be determined heuristically
}

export interface StockDetails {
  quote: StockQuote;
  chartData: {
    [key in TimeRange]: ChartDataPoint[];
  };
  financials: FinancialMetric[];
  news: NewsArticle[];
}
