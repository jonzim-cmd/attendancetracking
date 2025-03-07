// src/components/ui/StudentSearchSelect.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';

interface StudentSearchSelectProps {
  placeholder?: string;
  className?: string;
  getAvailableStudents: () => string[];
  mode?: 'table' | 'dashboard';
}

const StudentSearchSelect: React.FC<StudentSearchSelectProps> = ({
  placeholder = 'Schüler suchen/auswählen',
  className = '',
  getAvailableStudents,
  mode = 'table'
}) => {
  // Hole die Filter aus dem Context
  const {
    selectedStudents,
    setSelectedStudents,
    searchQuery,
    setSearchQuery
  } = useFilters();

  // Lokale States für das Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isUpdatingFromGlobal, setIsUpdatingFromGlobal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Timer für verzögertes Schließen bei Hover
  const dropdownTimer = useRef<NodeJS.Timeout | null>(null);

  // Click-Outside Handler für das Dropdown
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
  }, [dropdownRef]);

  // Hilfsfunktionen für das Dropdown
  const handleMouseEnterDropdown = () => {
    if (dropdownTimer.current) {
      clearTimeout(dropdownTimer.current);
      dropdownTimer.current = null;
    }
    setIsDropdownOpen(true);
  };

  const handleMouseLeaveDropdown = () => {
    dropdownTimer.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 300);
  };

  // Handler für die Schülerauswahl
  const handleStudentToggle = (student: string) => {
    if (student === '') {
      setSelectedStudents([]);
    } else if (selectedStudents.includes(student)) {
      setSelectedStudents(selectedStudents.filter(s => s !== student));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
    // Dropdown bleibt geöffnet für Mehrfachauswahl
  };
  
  // Hole alle verfügbaren Schüler - unabhängig von der aktuellen Auswahl
  const allAvailableStudents = getAvailableStudents();
  
  // Filtere die Schüler basierend auf dem Suchbegriff
  const filteredStudents = allAvailableStudents.filter(student => 
    student.toLowerCase().includes(localSearchQuery.toLowerCase())
  );
  
  // Focus auf das Sucheingabefeld setzen, wenn das Dropdown geöffnet wird
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);
  
  // Vermeidung von Endlosschleifen bei State-Updates
  
  // Lokale Änderungen an den globalen State übergeben
  useEffect(() => {
    // Wenn die Änderung nicht vom globalen State kam
    if (!isUpdatingFromGlobal && localSearchQuery !== searchQuery) {
      // Immer den globalen searchQuery aktualisieren, unabhängig vom Modus
      setSearchQuery(localSearchQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearchQuery, setSearchQuery, isUpdatingFromGlobal]);
  
  // Globale Änderungen lokal übernehmen
  useEffect(() => {
    // Nur ausführen, wenn sich der globale searchQuery geändert hat
    if (searchQuery !== localSearchQuery) {
      setIsUpdatingFromGlobal(true);
      setLocalSearchQuery(searchQuery);
      // Flag zurücksetzen nach kurzer Verzögerung
      setTimeout(() => {
        setIsUpdatingFromGlobal(false);
      }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Handler für lokale Sucheingabe
  const handleLocalSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalSearchQuery(newValue);
    
    // In beiden Modi direkt aktualisieren
    setSearchQuery(newValue);
  };

  // Kombiniere Standardklassen mit den übergebenen Klassen
  const combinedClassName = `min-w-[120px] w-auto rounded px-2 py-1 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm flex items-center justify-between cursor-pointer ${className}`;

  // Generiere eine eindeutige ID für jede Instanz
  const instanceId = useRef(`student-search-${Math.random().toString(36).substring(2, 9)}`);

  return (
    <div 
      className="relative"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnterDropdown}
      onMouseLeave={handleMouseLeaveDropdown}
    >
      {/* Suchfeld mit Dropdown-Trigger */}
      <div
        className={combinedClassName}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        title={mode === 'table' ? "Schüler suchen oder auswählen - Dropdown für Mehrfachauswahl" : "Schüler filtern - es werden nur Schüler der ausgewählten Klassen angezeigt"}
      >
        <div className="flex items-center flex-grow overflow-hidden">
          {/* Kombiniertes Anzeigeelement */}
          {!isDropdownOpen && mode === 'table' ? (
            // Im geschlossenen Zustand im Tabellenmodus: Zeige Suchfeld
            <input
              type="text"
              id={`${instanceId.current}-search`}
              name={`${instanceId.current}-search`}
              value={localSearchQuery}
              onChange={handleLocalSearchChange}
              placeholder={placeholder}
              className="bg-transparent border-none focus:outline-none w-full truncate"
              onClick={(e) => e.stopPropagation()}
              title="Suche nach Schülernamen - Eingabe filtert die Ergebnisse"
              autoComplete="off"
            />
          ) : (
            // Ansonsten: Zeige ausgewählte Schüler oder Platzhalter
            <span className="truncate mr-2">
              {selectedStudents.length === 0 
                ? 'Alle Schüler' 
                : selectedStudents.length === 1 
                  ? selectedStudents[0].split(',')[0] + ' ' + selectedStudents[0].split(',')[1]
                  : `${selectedStudents.length} Schüler ausgewählt`}
            </span>
          )}
        </div>
        
        {/* Badge für Anzahl ausgewählter Schüler (nur wenn Schüler ausgewählt sind) */}
        {selectedStudents.length > 0 && mode === 'table' && !isDropdownOpen && (
          <span className="bg-header-btn dark:bg-header-btn-dark px-1.5 py-0.5 text-xs rounded-full mr-1">
            {selectedStudents.length}
          </span>
        )}
        
        <ChevronDown className="w-4 h-4 ml-1 flex-shrink-0" />
      </div>
      
      {/* Dropdown für die Mehrfachauswahl */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-1 w-auto min-w-full max-w-md bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark shadow-lg rounded-md overflow-hidden border border-tableBorder-light dark:border-tableBorder-dark z-50">
          <div className="p-2 space-y-1">
            {/* Suchfeld innerhalb des Dropdowns */}
            <input
              ref={searchInputRef}
              type="text"
              id={`${instanceId.current}-dropdown-search`}
              name={`${instanceId.current}-dropdown-search`}
              placeholder="Suchen..."
              value={localSearchQuery}
              onChange={handleLocalSearchChange}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 mb-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-chatGray-textLight dark:text-chatGray-textDark text-sm"
              autoComplete="off"
            />
            
            {/* Schülerliste mit Checkboxen */}
            <div className="max-h-56 overflow-y-auto">
              {/* "Alle auswählen" Option */}
              <div
                className="flex items-center px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStudentToggle('');
                }}
              >
                <input
                  type="checkbox"
                  id={`${instanceId.current}-student-all`}
                  name={`${instanceId.current}-student-all`}
                  checked={selectedStudents.length === 0}
                  onChange={() => handleStudentToggle('')}
                  className="mr-2 text-chatGray-textLight dark:text-chatGray-textDark cursor-pointer"
                />
                <label 
                  htmlFor={`${instanceId.current}-student-all`} 
                  className="text-sm cursor-pointer text-chatGray-textLight dark:text-chatGray-textDark"
                >
                  Alle Schüler
                </label>
              </div>
              
              {/* Gefilterte Schülerliste */}
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const safeStudentId = student.replace(/[,\s.]/g, '-');
                  const checkboxId = `${instanceId.current}-student-${safeStudentId}`;
                  
                  return (
                    <div
                      key={student}
                      className="flex items-center px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStudentToggle(student);
                      }}
                    >
                      <input
                        type="checkbox"
                        id={checkboxId}
                        name={checkboxId}
                        checked={selectedStudents.includes(student)}
                        onChange={() => handleStudentToggle(student)}
                        className="mr-2 text-chatGray-textLight dark:text-chatGray-textDark cursor-pointer"
                      />
                      <label 
                        htmlFor={checkboxId}
                        className="text-sm cursor-pointer text-chatGray-textLight dark:text-chatGray-textDark whitespace-nowrap"
                      >
                        {student}
                      </label>
                    </div>
                  );
                })
              ) : (
                <div className="px-2 py-1 text-gray-500 dark:text-gray-400">
                  {allAvailableStudents.length === 0 
                    ? 'Keine Schüler verfügbar' 
                    : 'Keine Schüler gefunden'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSearchSelect;