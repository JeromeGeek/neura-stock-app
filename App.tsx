
import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import StockDetailPage from './pages/StockDetailPage';
import ComparePage from './pages/ComparePage';
import Header from './components/Header';
import LoadingOverlay from './components/LoadingOverlay';
import ScrollToTop from './components/ScrollToTop';

type View = 
  | { name: 'home' }
  | { name: 'detail'; ticker: string }
  | { name: 'compare'; tickers: string[] };

const App: React.FC = () => {
  const [view, setView] = useState<View>({ name: 'home' });
  const [isInitialLoad, setIsInitialLoad] = useState(false); // Changed to false to disable loading overlay
  const [homeDataLoaded, setHomeDataLoaded] = useState(false);

  const handleDataLoaded = () => {
    setHomeDataLoaded(true);
    // If 2 seconds have passed, hide overlay immediately
    setTimeout(() => setIsInitialLoad(false), 100);
  };

  // Add keyboard shortcut: ESC to go back to home
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && view.name !== 'home') {
        handleGoHome();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view]);

  const handleGoHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setView({ name: 'home' });
  };
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
        return <HomePage onSelectTicker={handleSelectTicker} onCompare={handleCompareTickers} onDataLoaded={handleDataLoaded} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <LoadingOverlay isLoading={isInitialLoad} />
      <Header onHomeClick={handleGoHome} />
      <main className="container mx-auto p-4 md:p-6">
        {renderContent()}
      </main>
      <ScrollToTop />
       <footer className="text-center p-4 text-gray-500 text-xs space-y-1">
        <p>NEURA. Market data is delayed and for informational purposes only. Not for trading purposes.</p>
        <p className="text-gray-600">Developed by <span className="text-emerald-500 font-semibold">Jerome Kingsly</span></p>
      </footer>
    </div>
  );
};

export default App;
