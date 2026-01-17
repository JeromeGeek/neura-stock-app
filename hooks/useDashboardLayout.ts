
import { useState, useEffect, useCallback } from 'react';

const LAYOUT_STORAGE_KEY = 'dashboard_layout_v3';

export interface WidgetConfig {
  id: 'watchlist' | 'market_overview' | 'global_news' | 'top_movers';
  isVisible: boolean;
}

const defaultWidgets: WidgetConfig[] = [
  { id: 'watchlist', isVisible: true },
  { id: 'market_overview', isVisible: true },
  { id: 'top_movers', isVisible: true },
  { id: 'global_news', isVisible: true },
];

export const useDashboardLayout = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(defaultWidgets);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (stored) {
        // Basic migration: ensure all default widgets are present if storage is from an older version
        const parsed = JSON.parse(stored);
        const allWidgetIds = defaultWidgets.map(w => w.id);
        const parsedWidgetIds = parsed.map((w: WidgetConfig) => w.id);
        const missingWidgets = defaultWidgets.filter(w => !parsedWidgetIds.includes(w.id));
        if (missingWidgets.length > 0) {
            setWidgets([...parsed, ...missingWidgets]);
        } else {
            setWidgets(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load dashboard layout", e);
    }
  }, []);

  const saveLayout = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newWidgets));
  };

  const moveWidget = useCallback((dragIndex: number, hoverIndex: number) => {
    setWidgets(prevWidgets => {
      const newWidgets = [...prevWidgets];
      const [removed] = newWidgets.splice(dragIndex, 1);
      newWidgets.splice(hoverIndex, 0, removed);
      // Note: we don't save on every move for performance, only on drop.
      return newWidgets;
    });
  }, []);

  const toggleWidgetVisibility = (id: string) => {
    const newWidgets = widgets.map(w => 
      w.id === id ? { ...w, isVisible: !w.isVisible } : w
    );
    saveLayout(newWidgets);
  };
  
  return { widgets, setWidgets: saveLayout, moveWidget, isEditMode, setIsEditMode, toggleWidgetVisibility };
};
