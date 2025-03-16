import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Layers, RotateCcw, GripVertical } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';
import type { DashboardTileType } from '@/contexts/FilterContext';

interface TileVisibilityDropdownProps {
  className?: string;
}

// Mapping für Anzeigenamen der Kacheln
const TILE_DISPLAY_NAMES: Record<DashboardTileType, string> = {
  timeSeries: 'Zeitlicher Verlauf',
  weekday: 'Wochentagsanalyse',
  movingAverage: 'Gleitender Durchschnitt',
  regression: 'Regressionsanalyse'
};

const TileVisibilityDropdown: React.FC<TileVisibilityDropdownProps> = ({
  className = ''
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimer = useRef<NodeJS.Timeout | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  
  // Drag & Drop State
  const [draggedTile, setDraggedTile] = useState<DashboardTileType | null>(null);
  const [dragOverTile, setDragOverTile] = useState<DashboardTileType | null>(null);

  const {
    visibleDashboardTiles,
    toggleDashboardTile,
    toggleAllDashboardTiles,
    dashboardTilesOrder,
    setDashboardTileOrder,
    resetDashboardTilesOrder
  } = useFilters();

  // Click-Outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Dynamische Positionierung des Dropdowns
  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      const buttonRect = dropdownRef.current.getBoundingClientRect();
      const dropdownMenu = dropdownRef.current.querySelector('.dropdown-menu') as HTMLElement;
      
      if (dropdownMenu) {
        const dropdownRect = dropdownMenu.getBoundingClientRect();
        const windowWidth = window.innerWidth;

        // Berechne die Position relativ zum Button
        let leftOffset = 0;
        const rightEdge = buttonRect.left + dropdownRect.width;

        // Wenn das Dropdown den rechten Rand überschreitet
        if (rightEdge > windowWidth) {
          const overflow = rightEdge - windowWidth;
          leftOffset = -overflow - 5; // Verschiebe nach links mit etwas Abstand
        }

        // Wenn das Dropdown den linken Rand überschreitet
        if (buttonRect.left + leftOffset < 0) {
          leftOffset = -buttonRect.left + 5; // Begrenze am linken Rand mit etwas Abstand
        }

        setDropdownStyle({
          left: `${leftOffset}px`,
          transformOrigin: 'top left' // Optional: Für bessere Animationen
        });
      }
    }
  }, [isDropdownOpen]);

  // Hover-Handler
  const handleMouseEnter = () => {
    if (dropdownTimer.current) {
      clearTimeout(dropdownTimer.current);
      dropdownTimer.current = null;
    }
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimer.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 300);
  };

  // Berechne, ob alle Kacheln sichtbar sind
  const allTilesVisible = Object.values(visibleDashboardTiles).every(visible => visible);
  
  // Berechne, ob keine Kachel sichtbar ist
  const noTilesVisible = Object.values(visibleDashboardTiles).every(visible => !visible);

  // Drag & Drop Handler
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, tileType: DashboardTileType) => {
    setDraggedTile(tileType);
    
    // Setze ein Drag-Bild (optional)
    if (e.dataTransfer.setDragImage) {
      const dragElement = e.currentTarget.cloneNode(true) as HTMLDivElement;
      dragElement.style.position = 'absolute';
      dragElement.style.top = '-1000px';
      dragElement.style.opacity = '0.8';
      document.body.appendChild(dragElement);
      e.dataTransfer.setDragImage(dragElement, 0, 0);
      
      // Entferne das Element nach kurzer Zeit
      setTimeout(() => {
        document.body.removeChild(dragElement);
      }, 0);
    }
    
    e.dataTransfer.setData('text/plain', tileType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, tileType: DashboardTileType) => {
    e.preventDefault();
    if (draggedTile !== tileType) {
      setDragOverTile(tileType);
    }
  };

  const handleDragLeave = () => {
    setDragOverTile(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetTileType: DashboardTileType) => {
    e.preventDefault();
    setDragOverTile(null);
    
    if (!draggedTile || draggedTile === targetTileType) return;
    
    // Finde die aktuelle Position des Ziel-Elements
    const targetIndex = dashboardTilesOrder.indexOf(targetTileType);
    
    // Setze das gezogene Element auf die neue Position
    setDashboardTileOrder(draggedTile, targetIndex);
    
    setDraggedTile(null);
  };

  return (
    <div 
      className={`relative ${className}`}
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-1 px-2 py-1 text-sm bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark"
        title="Dashboard-Kacheln ein-/ausblenden und anordnen"
      >
        <Layers className="w-4 h-4 mr-1" />
        <ChevronDown className="w-4 h-4 ml-1" />
      </button>
      
      {isDropdownOpen && (
        <div 
          className="absolute top-full mt-1 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark shadow-lg rounded-md overflow-hidden z-50 border border-tableBorder-light dark:border-tableBorder-dark w-60 dropdown-menu"
          style={dropdownStyle}
        >
          <div className="p-2 space-y-1">
            {/* Header mit Reset-Button */}
            <div className="flex justify-between items-center mb-1 pb-1 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm font-medium text-chatGray-textLight dark:text-chatGray-textDark whitespace-nowrap">
                Dashboard-Kacheln
              </span>
              <button
                onClick={resetDashboardTilesOrder}
                className="p-1 rounded hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark"
                title="Standardreihenfolge wiederherstellen"
              >
                <RotateCcw className="w-3.5 h-3.5 text-chatGray-textLight dark:text-chatGray-textDark" />
              </button>
            </div>

            {/* Alle ein-/ausblenden */}
            <div 
              className="flex items-center px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded cursor-pointer"
              onClick={() => toggleAllDashboardTiles(!allTilesVisible)}
            >
              <input
                type="checkbox"
                checked={allTilesVisible}
                onChange={() => {}}
                className="mr-2 text-chatGray-textLight dark:text-chatGray-textDark"
              />
              <label className="text-sm cursor-pointer whitespace-nowrap text-chatGray-textLight dark:text-chatGray-textDark">
                Alle Kacheln {allTilesVisible ? 'ausblenden' : 'einblenden'}
              </label>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
            
            {/* Hilfstext für Drag & Drop */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">
              Zum Sortieren ziehen
            </div>
            
            {/* Kacheln - sortiert in der durch dashboardTilesOrder definierten Reihenfolge */}
            {dashboardTilesOrder.map((tileType) => (
              <div 
                key={tileType}
                className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark ${
                  dragOverTile === tileType ? 'bg-gray-200 dark:bg-gray-700' : ''
                } ${
                  draggedTile === tileType ? 'opacity-50' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, tileType)}
                onDragOver={(e) => handleDragOver(e, tileType)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, tileType)}
              >
                <div className="flex items-center w-full">
                  <GripVertical className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500 cursor-grab flex-shrink-0" />
                  <input
                    type="checkbox"
                    checked={visibleDashboardTiles[tileType]}
                    onChange={() => toggleDashboardTile(tileType)}
                    className="mr-2 text-chatGray-textLight dark:text-chatGray-textDark flex-shrink-0"
                  />
                  <span className="text-sm text-chatGray-textLight dark:text-chatGray-textDark truncate">
                    {TILE_DISPLAY_NAMES[tileType]}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Warnung, wenn keine Kachel sichtbar ist */}
            {noTilesVisible && (
              <div className="text-orange-500 dark:text-orange-400 text-xs px-2 py-1 mt-1 border-t border-gray-200 dark:border-gray-600">
                Mindestens eine Kachel sollte sichtbar sein
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TileVisibilityDropdown;