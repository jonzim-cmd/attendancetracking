import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { CARD_CLASSES } from './styles';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DraggableDashboardProps {
  children: React.ReactNode[];
  id?: string;
}

const DraggableDashboard: React.FC<DraggableDashboardProps> = ({ 
  children, 
  id = 'main' 
}) => {
  // Define standard layout that matches exactly the vertical stacking in the standard view
  const getDefaultLayout = () => {
    // The default layout mimics the standard layout:
    // - First component (Time Series): Full width at top
    // - Second component (Weekday Analysis): Full width below first
    // - Third component (Moving Average): Full width below second
    // - Fourth component (Regression): Full width below third
    
    return {
      lg: [
        // First component - Zeitlicher Verlauf (Time Series) - Full width
        { i: '0', x: 0, y: 0, w: 12, h: 6 },
        
        // Second component - Wochentagsanalyse (Weekday Analysis) - Full width
        { i: '1', x: 0, y: 6, w: 12, h: 6 },
        
        // Third component - Gleitender Durchschnitt (Moving Average) - Full width
        { i: '2', x: 0, y: 12, w: 12, h: 6 },
        
        // Fourth component - Regressionsanalyse (Regression Analysis) - Full width
        { i: '3', x: 0, y: 18, w: 12, h: 6 },
      ]
    };
  };

  // Load layout from localStorage or use default layout
  const [layouts, setLayouts] = useState(() => {
    try {
      const savedLayouts = localStorage.getItem(`dashboardLayouts-${id}`);
      return savedLayouts ? JSON.parse(savedLayouts) : getDefaultLayout();
    } catch (e) {
      console.error('Layout konnte nicht geladen werden', e);
      return getDefaultLayout();
    }
  });

  // Reset to default layout if children count changes
  useEffect(() => {
    if (layouts && layouts.lg && layouts.lg.length !== children.length) {
      setLayouts(getDefaultLayout());
    }
  }, [children.length, layouts]);

  // Save layout changes to localStorage
  useEffect(() => {
    if (layouts) {
      localStorage.setItem(`dashboardLayouts-${id}`, JSON.stringify(layouts));
    }
  }, [layouts, id]);

  const onLayoutChange = (_layout: any, allLayouts: any) => {
    setLayouts(allLayouts);
  };

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
      rowHeight={100}
      onLayoutChange={onLayoutChange}
      draggableHandle=".chart-drag-handle"
      isDraggable={true}
      isResizable={true}
      containerPadding={[0, 0]}
      margin={[16, 16]}
    >
      {children.map((child, i) => (
        <div key={i.toString()} className={`${CARD_CLASSES} p-0 overflow-hidden border-0`}>
          {child}
        </div>
      ))}
    </ResponsiveGridLayout>
  );
};

export default DraggableDashboard;