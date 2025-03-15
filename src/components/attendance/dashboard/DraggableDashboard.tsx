import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { CARD_CLASSES } from './styles';
import { useFilters } from '@/contexts/FilterContext';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DraggableDashboardProps {
  children: React.ReactNode[];
  id?: string;
}

const DraggableDashboard: React.FC<DraggableDashboardProps> = ({ 
  children, 
  id = 'main' 
}) => {
  const getDefaultLayout = () => {
    return {
      lg: [
        { i: '0', x: 0, y: 18, w: 12, h: 6 },
        { i: '1', x: 0, y: 6, w: 12, h: 6 },
        { i: '2', x: 0, y: 12, w: 12, h: 6 },
        { i: '3', x: 0, y: 0, w: 12, h: 6 },
      ]
    };
  };

  const [layouts, setLayouts] = useState(() => {
    try {
      const savedLayouts = localStorage.getItem(`dashboardLayouts-${id}`);
      return savedLayouts ? JSON.parse(savedLayouts) : getDefaultLayout();
    } catch (e) {
      console.error('Layout konnte nicht geladen werden', e);
      return getDefaultLayout();
    }
  });

  const { visibleDashboardTiles } = useFilters();

  const visibleChildren = children.filter((_, index) => {
    switch (index) {
      case 0: return visibleDashboardTiles.timeSeries;
      case 1: return visibleDashboardTiles.weekday;
      case 2: return visibleDashboardTiles.movingAverage;
      case 3: return visibleDashboardTiles.regression;
      default: return true;
    }
  });

  // Move useEffect hooks to the top, before any early return
  useEffect(() => {
    if (layouts && layouts.lg && layouts.lg.length !== children.length) {
      setLayouts(getDefaultLayout());
    }
  }, [children.length, layouts]);

  useEffect(() => {
    if (layouts) {
      localStorage.setItem(`dashboardLayouts-${id}`, JSON.stringify(layouts));
    }
  }, [layouts, id]);

  // Early return after all hooks are called
  if (visibleChildren.length === 0) {
    return (
      <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-300">
          Keine Dashboard-Kacheln sichtbar. Bitte aktivieren Sie mindestens eine Kachel über die Kachel-Auswahl.
        </p>
      </div>
    );
  }

  const onLayoutChange = (_layout: any, allLayouts: any) => {
    setLayouts(allLayouts);
  };

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
      rowHeight={92}
      onLayoutChange={onLayoutChange}
      draggableHandle=".chart-drag-handle"
      isDraggable={true}
      isResizable={true}
      containerPadding={[0, 0]}
      margin={[8, 8]}
    >
      {visibleChildren.map((child, i) => (
        <div key={i.toString()} className={`${CARD_CLASSES} p-0 overflow-hidden border-0 w-full`}>
          <div className="pt-0 px-1 pb-1 h-full w-full">
            {child}
          </div>
        </div>
      ))}
    </ResponsiveGridLayout>
  );
};

export default DraggableDashboard;