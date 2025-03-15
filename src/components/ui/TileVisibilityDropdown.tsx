import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Layers } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';

interface TileVisibilityDropdownProps {
  className?: string;
}

const TileVisibilityDropdown: React.FC<TileVisibilityDropdownProps> = ({
  className = ''
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimer = useRef<NodeJS.Timeout | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const {
    visibleDashboardTiles,
    toggleDashboardTile,
    toggleAllDashboardTiles
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
          leftOffset = -overflow; // Verschiebe nach links
        }

        // Wenn das Dropdown den linken Rand überschreitet
        if (buttonRect.left + leftOffset < 0) {
          leftOffset = -buttonRect.left; // Begrenze am linken Rand
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
        title="Dashboard-Kacheln ein-/ausblenden"
      >
        <Layers className="w-4 h-4 mr-1" />
        <ChevronDown className="w-4 h-4 ml-1" />
      </button>
      
      {isDropdownOpen && (
        <div 
          className="absolute top-full mt-1 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark shadow-lg rounded-md overflow-hidden z-50 border border-tableBorder-light dark:border-tableBorder-dark min-w-[180px] dropdown-menu"
          style={dropdownStyle}
        >
          <div className="p-2 space-y-1">
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
            
            {/* Zeitlicher Verlauf */}
            <div 
              className="flex items-center px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded cursor-pointer"
              onClick={() => toggleDashboardTile('timeSeries')}
            >
              <input
                type="checkbox"
                checked={visibleDashboardTiles.timeSeries}
                onChange={() => {}}
                className="mr-2 text-chatGray-textLight dark:text-chatGray-textDark"
              />
              <label className="text-sm cursor-pointer whitespace-nowrap text-chatGray-textLight dark:text-chatGray-textDark">
                Zeitlicher Verlauf
              </label>
            </div>
            
            {/* Wochentagsanalyse */}
            <div 
              className="flex items-center px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded cursor-pointer"
              onClick={() => toggleDashboardTile('weekday')}
            >
              <input
                type="checkbox"
                checked={visibleDashboardTiles.weekday}
                onChange={() => {}}
                className="mr-2 text-chatGray-textLight dark:text-chatGray-textDark"
              />
              <label className="text-sm cursor-pointer whitespace-nowrap text-chatGray-textLight dark:text-chatGray-textDark">
                Wochentagsanalyse
              </label>
            </div>
            
            {/* Gleitender Durchschnitt */}
            <div 
              className="flex items-center px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded cursor-pointer"
              onClick={() => toggleDashboardTile('movingAverage')}
            >
              <input
                type="checkbox"
                checked={visibleDashboardTiles.movingAverage}
                onChange={() => {}}
                className="mr-2 text-chatGray-textLight dark:text-chatGray-textDark"
              />
              <label className="text-sm cursor-pointer whitespace-nowrap text-chatGray-textLight dark:text-chatGray-textDark">
                Gleitender Durchschnitt
              </label>
            </div>
            
            {/* Regressionsanalyse */}
            <div 
              className="flex items-center px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded cursor-pointer"
              onClick={() => toggleDashboardTile('regression')}
            >
              <input
                type="checkbox"
                checked={visibleDashboardTiles.regression}
                onChange={() => {}}
                className="mr-2 text-chatGray-textLight dark:text-chatGray-textDark"
              />
              <label className="text-sm cursor-pointer whitespace-nowrap text-chatGray-textLight dark:text-chatGray-textDark">
                Regressionsanalyse
              </label>
            </div>
            
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