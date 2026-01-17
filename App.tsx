
import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import StockDetailPage from './pages/StockDetailPage';
import ComparePage from './pages/ComparePage';
import Header from './components/Header';

type View = 
  | { name: 'home' }
  | { name: 'detail'; ticker: string }
  | { name: 'compare'; tickers: string[] };

const App: React.FC = () => {
  const [view, setView] = useState<View>({ name: 'home' });

  const handleGoHome = () => setView({ name: 'home' });
  const handleSelectTicker = (ticker: string) => setView({ name: 'detail', ticker });
  const handleCompareTickers = (tickers: string[]) => setView({ name: 'compare', tickers });

  const renderContent = () => {
    switch (view.name) {
      case 'detail':
        return <StockDetailPage ticker={view.ticker} onBack={handleGoHome} />;
      case 'compare':
        return <ComparePage tickers={view.tickers} onBack={handleGoHome} />;
      case 'home':
      default:
        return <HomePage onSelectTicker={handleSelectTicker} onCompare={handleCompareTickers} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header onHomeClick={handleGoHome} />
      <main className="container mx-auto p-4 md:p-6">
        {renderContent()}
      </main>
       <footer className="text-center p-4 text-gray-500 text-xs">
        <p>NEURA. Market data is delayed and for informational purposes only. Not for trading purposes.</p>
      </footer>
    </div>
  );
};

export default App;
