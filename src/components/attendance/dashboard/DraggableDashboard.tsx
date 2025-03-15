import React, { useState, useEffect, useRef } from 'react';
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
    // Default-Layout für alle vier Kacheln
    const defaultFull = {
      lg: [
        { i: '0', x: 0, y: 0, w: 12, h: 6 },  // Top (Zeitlicher Verlauf)
        { i: '1', x: 0, y: 6, w: 12, h: 6 },  // Second (Wochentagsanalyse)
        { i: '2', x: 0, y: 12, w: 12, h: 6 }, // Third (Gleitender Durchschnitt)
        { i: '3', x: 0, y: 18, w: 12, h: 6 }, // Bottom (Regressionsanalyse)
      ]
    };

    // Welche Kacheln sind sichtbar
    const tileVisibility = [
      visibleDashboardTiles.timeSeries,
      visibleDashboardTiles.weekday,
      visibleDashboardTiles.movingAverage,
      visibleDashboardTiles.regression
    ];
    
    const visibleIndexes = tileVisibility
      .map((isVisible, index) => isVisible ? index : -1)
      .filter(index => index !== -1);

    // Wenn keine oder alle Kacheln sichtbar sind, gib das Standard-Layout zurück
    if (visibleIndexes.length === 0 || visibleIndexes.length === 4) {
      return defaultFull;
    }
    
    // Erstelle ein neues Layout basierend auf den sichtbaren Kacheln
    return {
      lg: visibleIndexes.map((originalIndex, newIndex) => ({
        i: originalIndex.toString(),  // Behalte die Original-ID
        x: 0,                         // Immer volle Breite
        y: newIndex * 6,              // Gestaffelte Positionierung (6 Einheiten Abstand)
        w: 12,                        // Volle Breite
        h: 6                          // Einheitliche Höhe
      }))
    };
  };

  const { visibleDashboardTiles } = useFilters();

  // Speichere die vorherige Konfiguration der sichtbaren Kacheln
  const previousTileConfig = useRef(JSON.stringify(visibleDashboardTiles));

  const [layouts, setLayouts] = useState(getDefaultLayout);

  const visibleChildren = children.filter((_, index) => {
    switch (index) {
      case 0: return visibleDashboardTiles.timeSeries;
      case 1: return visibleDashboardTiles.weekday;
      case 2: return visibleDashboardTiles.movingAverage;
      case 3: return visibleDashboardTiles.regression;
      default: return true;
    }
  });

  // Verfolge Änderungen in der Sichtbarkeit der Kacheln
  useEffect(() => {
    const currentTileConfig = JSON.stringify(visibleDashboardTiles);
    
    // Wenn sich die Sichtbarkeit geändert hat, setze das Layout zurück
    if (currentTileConfig !== previousTileConfig.current) {
      // Lösche das gespeicherte Layout
      try {
        localStorage.removeItem(`dashboardLayouts-${id}`);
      } catch (e) {
        console.error('Layout konnte nicht gelöscht werden', e);
      }
      
      // Statt getDefaultLayout zu verwenden, definieren wir die Logik hier direkt im Effect
      // um Abhängigkeitsprobleme zu vermeiden
      const createNewLayout = () => {
        // Default-Layout für alle vier Kacheln
        const defaultFull = {
          lg: [
            { i: '0', x: 0, y: 0, w: 12, h: 6 },  // Top (Zeitlicher Verlauf)
            { i: '1', x: 0, y: 6, w: 12, h: 6 },  // Second (Wochentagsanalyse)
            { i: '2', x: 0, y: 12, w: 12, h: 6 }, // Third (Gleitender Durchschnitt)
            { i: '3', x: 0, y: 18, w: 12, h: 6 }, // Bottom (Regressionsanalyse)
          ]
        };

        // Welche Kacheln sind sichtbar
        const tileVisibility = [
          visibleDashboardTiles.timeSeries,
          visibleDashboardTiles.weekday,
          visibleDashboardTiles.movingAverage,
          visibleDashboardTiles.regression
        ];
        
        const visibleIndexes = tileVisibility
          .map((isVisible, index) => isVisible ? index : -1)
          .filter(index => index !== -1);

        // Wenn keine oder alle Kacheln sichtbar sind, gib das Standard-Layout zurück
        if (visibleIndexes.length === 0 || visibleIndexes.length === 4) {
          return defaultFull;
        }
        
        // Erstelle ein neues Layout basierend auf den sichtbaren Kacheln
        return {
          lg: visibleIndexes.map((originalIndex, newIndex) => ({
            i: originalIndex.toString(),  // Behalte die Original-ID
            x: 0,                         // Immer volle Breite
            y: newIndex * 6,              // Gestaffelte Positionierung (6 Einheiten Abstand)
            w: 12,                        // Volle Breite
            h: 6                          // Einheitliche Höhe
          }))
        };
      };
      
      // Neues Layout basierend auf sichtbaren Kacheln setzen
      setLayouts(createNewLayout());
      
      // Aktualisiere die vorherige Konfiguration
      previousTileConfig.current = currentTileConfig;
    }
  }, [visibleDashboardTiles, id]);

  useEffect(() => {
    // Nur speichern, wenn einige Kacheln sichtbar sind
    if (layouts && visibleChildren.length > 0) {
      try {
        localStorage.setItem(`dashboardLayouts-${id}`, JSON.stringify(layouts));
      } catch (e) {
        console.error('Layout konnte nicht gespeichert werden', e);
      }
    }
  }, [layouts, id, visibleChildren.length]);

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
      rowHeight={75}
      onLayoutChange={onLayoutChange}
      draggableHandle=".chart-drag-handle"
      isDraggable={true}
      isResizable={true}
      containerPadding={[0, 0]}
      margin={[8, 8]}
    >
      {visibleChildren.map((child, i) => (
        <div key={i.toString()} className={`${CARD_CLASSES} p-0 overflow-hidden border-0 w-full`}>
          <div className="pt-0 px-1 pb-0 h-full w-full flex flex-col">
            {child}
          </div>
        </div>
      ))}
    </ResponsiveGridLayout>
  );
};

export default DraggableDashboard;