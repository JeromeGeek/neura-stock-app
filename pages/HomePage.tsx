
import React, { useState, useRef } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import SearchBar from '../components/SearchBar';
import Watchlist from '../components/Watchlist';
import MarketOverview from '../components/MarketOverview';
import GlobalNews from '../components/GlobalNews';
import TopMovers from '../components/TopMovers';
import { useWatchlist } from '../hooks/useWatchlist';
import { useDashboardLayout, WidgetConfig } from '../hooks/useDashboardLayout';

const WIDGET_TYPE = 'DASHBOARD_WIDGET';

interface HomePageProps {
  onSelectTicker: (ticker: string) => void;
  onCompare: (tickers: string[]) => void;
}

interface DraggableWidgetProps {
  id: any;
  index: number;
  moveWidget: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
  isEditMode: boolean;
}

const DraggableWidget: React.FC<DraggableWidgetProps> = ({ id, index, moveWidget, children, isEditMode }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [, drop] = useDrop({
    accept: WIDGET_TYPE,
    hover(item: { index: number }, monitor) {
      if (!ref.current || !isEditMode) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveWidget(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: WIDGET_TYPE,
    item: () => ({ id, index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    canDrag: isEditMode,
  });

  preview(drop(ref));

  // FIX: The `drag` connector function from react-dnd can have an incompatible type with
  // React's `ref` prop in some TypeScript environments. Using a `useRef` and
  // connecting it via `drag(ref)` is a documented and type-safe pattern to avoid this.
  const dragHandleRef = useRef<HTMLDivElement>(null);
  drag(dragHandleRef);

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }} className="relative">
      {isEditMode && (
        <div ref={dragHandleRef} className="absolute -top-2 -left-2 p-2 cursor-move text-gray-400 bg-gray-800 rounded-full z-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </div>
      )}
      {children}
    </div>
  );
};

const HomePage: React.FC<HomePageProps> = ({ onSelectTicker, onCompare }) => {
  const { watchlist, removeFromWatchlist } = useWatchlist();
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const { widgets, setWidgets, moveWidget, isEditMode, setIsEditMode, toggleWidgetVisibility } = useDashboardLayout();

  const handleToggleCompare = (ticker: string) => {
    setSelectedForCompare(prev =>
      prev.includes(ticker)
        ? prev.filter(t => t !== ticker)
        : [...prev, ticker]
    );
  };

  const handleCompareClick = () => {
    if (selectedForCompare.length > 1) {
      onCompare(selectedForCompare);
    }
  };
  
  const clearCompareSelection = () => setSelectedForCompare([]);

  const renderWidget = (widget: WidgetConfig) => {
    if (!widget.isVisible) return null;
    switch (widget.id) {
      case 'watchlist':
        return <Watchlist 
                    watchlistTickers={watchlist} 
                    onSelectTicker={onSelectTicker} 
                    onRemoveFromWatchlist={removeFromWatchlist} 
                    selectedForCompare={selectedForCompare} 
                    onToggleCompare={handleToggleCompare} 
                    onCompareClick={handleCompareClick}
                    onClearCompareSelection={clearCompareSelection}
                />;
      case 'market_overview':
        return <MarketOverview />;
      case 'top_movers':
        return <TopMovers onSelectTicker={onSelectTicker} />;
      case 'global_news':
        return <GlobalNews />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <SearchBar onSelectTicker={onSelectTicker} />
      
      <div className="flex justify-end items-center gap-4">
        <h3 className="text-lg font-semibold">Dashboard</h3>
        <button onClick={() => { setIsEditMode(!isEditMode); if(isEditMode) setWidgets(widgets); }} className={`py-2 px-4 rounded-full text-sm font-semibold transition-colors ${isEditMode ? 'bg-emerald-500 text-white' : 'bg-gray-700'}`}>
          {isEditMode ? 'Done Editing' : 'Customize'}
        </button>
      </div>

      {widgets.map((widget, index) => (
        widget.isVisible && (
          <DraggableWidget key={widget.id} index={index} id={widget.id} moveWidget={moveWidget} isEditMode={isEditMode}>
            {renderWidget(widget)}
          </DraggableWidget>
        )
      ))}
    </div>
  );
};

export default HomePage;
