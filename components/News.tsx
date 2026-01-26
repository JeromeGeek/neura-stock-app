
import React, { useState } from 'react';
import { NewsArticle, NewsImpact } from '../types';
import Card from './Card';
import ToggleSwitch from './ToggleSwitch';
import { formatTimeAgo } from '../utils/formatTime';

interface NewsProps {
  articles: NewsArticle[];
  ticker?: string; // Optional ticker to show in title
}

const impactInfo: Record<NewsImpact, { label: string; emoji: string; color: string }> = {
  High: { label: 'Material Impact', emoji: '🟢', color: 'text-green-400' },
  Medium: { label: 'Contextual', emoji: '🟡', color: 'text-yellow-400' },
  Low: { label: 'Noise / Opinion', emoji: '🔴', color: 'text-red-400' },
};

const News: React.FC<NewsProps> = ({ articles, ticker }) => {
  const [hideLowImpact, setHideLowImpact] = useState(false);

  const filteredArticles = articles.filter(a => !hideLowImpact || a.impact !== 'Low');

  return (
    <Card>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold">
          {ticker ? `${ticker} News` : 'News'}
        </h2>
        <ToggleSwitch 
          label="Hide low-impact news"
          isChecked={hideLowImpact}
          onChange={() => setHideLowImpact(!hideLowImpact)}
        />
      </div>
      <div className="space-y-4">
        {filteredArticles.map((article, index) => (
          <a
            key={index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-gray-900 rounded-lg hover:bg-gray-700/50 transition-colors"
          >
            <div className={`flex items-center gap-2 mb-1 text-xs font-semibold ${impactInfo[article.impact].color}`}>
              <span>{impactInfo[article.impact].emoji}</span>
              <span>{impactInfo[article.impact].label}</span>
            </div>
            <h3 className="font-semibold mb-1">{article.headline}</h3>
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span>{article.source}</span>
              <span>&bull;</span>
              <span>{formatTimeAgo(article.publishedAt)}</span>
            </div>
          </a>
        ))}
        {filteredArticles.length === 0 && (
          <p className="text-gray-400 text-sm">No high or medium impact news to display.</p>
        )}
      </div>
    </Card>
  );
};

export default News;
