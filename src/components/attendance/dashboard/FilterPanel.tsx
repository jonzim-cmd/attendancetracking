import React, { useState, useEffect } from 'react';
import { StudentStats } from '@/types';

interface FilterPanelProps {
  availableClasses: string[];
  selectedClasses: string[];
  selectedFilter: 'classes' | 'students';
  onFilterChange: (filter: 'classes' | 'students') => void;
  selectedEntities: string[];
  onEntitySelect: (entities: string[]) => void;
  timeRange: 'days' | 'weeks' | 'months';
  onTimeRangeChange: (range: 'days' | 'weeks' | 'months') => void;
  groupingOption: 'daily' | 'weekly' | 'monthly';
  onGroupingChange: (option: 'daily' | 'weekly' | 'monthly') => void;
  getFilteredStudents: () => [string, StudentStats][];
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  availableClasses,
  selectedClasses,
  selectedFilter,
  onFilterChange,
  selectedEntities,
  onEntitySelect,
  timeRange,
  onTimeRangeChange,
  groupingOption,
  onGroupingChange,
  getFilteredStudents
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableEntities, setAvailableEntities] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Berechne die verfügbaren Entitäten basierend auf dem ausgewählten Filter
  useEffect(() => {
    if (selectedFilter === 'classes') {
      setAvailableEntities(availableClasses);
    } else {
      // Für Schüler: Nimm alle gefilterten Schüler aus getFilteredStudents
      const students = getFilteredStudents().map(([student]) => student);
      setAvailableEntities(students);
    }
  }, [selectedFilter, availableClasses, getFilteredStudents]);
  
  // Gefilterte Entitäten basierend auf dem Suchbegriff
  const filteredEntities = availableEntities.filter(entity => 
    entity.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilter = e.target.value as 'classes' | 'students';
    onFilterChange(newFilter);
    // Reset ausgewählte Entitäten bei Filterwechsel
    onEntitySelect([]);
  };
  
  const handleEntityClick = (entity: string) => {
    const newSelected = selectedEntities.includes(entity)
      ? selectedEntities.filter(e => e !== entity) // Entfernen, wenn bereits ausgewählt
      : [...selectedEntities, entity]; // Hinzufügen, wenn noch nicht ausgewählt
    onEntitySelect(newSelected);
  };
  
  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onTimeRangeChange(e.target.value as 'days' | 'weeks' | 'months');
  };

  const handleGroupingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onGroupingChange(e.target.value as 'daily' | 'weekly' | 'monthly');
  };
  
  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Filtertyp-Auswahl */}
        <div className="min-w-[140px]">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Filter nach
          </label>
          <select
            value={selectedFilter}
            onChange={handleFilterChange}
            className="w-full rounded px-2 py-1 bg-sidebar-btn-dropdown dark:bg-sidebar-btn-dropdown-dark hover:bg-sidebar-btn-dropdown-hover dark:hover:bg-sidebar-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm"
          >
            <option value="classes">Klassen</option>
            <option value="students">Schüler</option>
          </select>
        </div>
        
        {/* Entity-Dropdown mit Suchfunktion */}
        <div className="min-w-[200px] relative">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            {selectedFilter === 'classes' ? 'Klassen auswählen' : 'Schüler auswählen'}
          </label>
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full rounded px-2 py-1 bg-sidebar-btn-dropdown dark:bg-sidebar-btn-dropdown-dark hover:bg-sidebar-btn-dropdown-hover dark:hover:bg-sidebar-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm cursor-pointer flex items-center justify-between"
          >
            <span>
              {selectedEntities.length === 0 
                ? `${selectedFilter === 'classes' ? 'Klassen' : 'Schüler'} auswählen` 
                : `${selectedEntities.length} ausgewählt`}
            </span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-sidebar-btn-dropdown dark:bg-sidebar-btn-dropdown-dark border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1 mb-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                />
                <div className="max-h-40 overflow-y-auto">
                  {filteredEntities.length > 0 ? (
                    filteredEntities.map(entity => (
                      <div
                        key={entity}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEntityClick(entity);
                        }}
                        className={`px-2 py-1 rounded cursor-pointer ${
                          selectedEntities.includes(entity)
                            ? 'bg-gray-200 dark:bg-gray-600'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEntities.includes(entity)}
                          onChange={() => {}}
                          className="mr-2"
                        />
                        {entity}
                      </div>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-gray-500 dark:text-gray-400">
                      Keine Ergebnisse gefunden
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Zeitraum-Gruppierung */}
        <div className="min-w-[140px]">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Zeitliche Gruppierung
          </label>
          <select
            value={groupingOption}
            onChange={handleGroupingChange}
            className="w-full rounded px-2 py-1 bg-sidebar-btn-dropdown dark:bg-sidebar-btn-dropdown-dark hover:bg-sidebar-btn-dropdown-hover dark:hover:bg-sidebar-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm"
          >
            <option value="daily">Täglich</option>
            <option value="weekly">Wöchentlich</option>
            <option value="monthly">Monatlich</option>
          </select>
        </div>
        
        {/* Zeitspanne für Charts */}
        <div className="min-w-[140px]">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Trendanzeige
          </label>
          <select
            value={timeRange}
            onChange={handleTimeRangeChange}
            className="w-full rounded px-2 py-1 bg-sidebar-btn-dropdown dark:bg-sidebar-btn-dropdown-dark hover:bg-sidebar-btn-dropdown-hover dark:hover:bg-sidebar-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm"
          >
            <option value="days">Tage</option>
            <option value="weeks">Wochen</option>
            <option value="months">Monate</option>
          </select>
        </div>
        
        {/* Ausgewählte Entities anzeigen */}
        {selectedEntities.length > 0 && (
          <div className="flex-1 flex flex-wrap gap-1 items-center">
            <span className="text-xs text-gray-600 dark:text-gray-400 mr-1">
              Ausgewählt:
            </span>
            {selectedEntities.map(entity => (
              <span
                key={entity}
                className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-xs flex items-center"
              >
                {entity}
                <button
                  onClick={() => handleEntityClick(entity)}
                  className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </span>
            ))}
            {selectedEntities.length > 0 && (
              <button
                onClick={() => onEntitySelect([])}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-2"
              >
                Alle löschen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;