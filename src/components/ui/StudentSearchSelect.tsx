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

  // Lokale States für das Dropdown und Keyboard-Navigation
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isUpdatingFromGlobal, setIsUpdatingFromGlobal] = useState(false);
  
  // State für den aktuell ausgewählten Schüler im Keyboard-Modus
  const [currentStudentIndex, setCurrentStudentIndex] = useState<number>(-1);
  
  // State für den Input-Fokus
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Refs für DOM-Elemente
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownButtonRef = useRef<HTMLDivElement>(null);
  
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
  };

  const handleMouseLeaveDropdown = () => {
    if (!isInputFocused) {
      dropdownTimer.current = setTimeout(() => {
        setIsDropdownOpen(false);
      }, 300);
    }
  };

  // Handler für Dropdown-Button-Click (explizites Öffnen/Schließen)
  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(prev => !prev);
    if (!isDropdownOpen && searchInputRef.current) {
      // Fokus auf das Suchfeld setzen, wenn das Dropdown geöffnet wird
      searchInputRef.current.focus();
    }
  };

  // Handler für die Schülerauswahl
  const handleStudentToggle = (student: string) => {
    if (student === '') {
      setSelectedStudents([]);
    } else if (selectedStudents.includes(student)) {
      setSelectedStudents(selectedStudents.filter(s => s !== student));
    } else {
      // In beiden Modi Mehrfachauswahl ermöglichen
      setSelectedStudents([...selectedStudents, student]);
    }
  };
  
  // Hole alle verfügbaren Schüler - unabhängig von der aktuellen Auswahl
  const allAvailableStudents = getAvailableStudents();
  
  // Filtere die Schüler basierend auf dem Suchbegriff
  const filteredStudents = allAvailableStudents.filter(student => 
    student.toLowerCase().includes(localSearchQuery.toLowerCase())
  );
  
  // NEU: Funktion zur direkten Auswahl des nächsten/vorherigen Schülers
  const cycleToNextStudent = (direction: 'next' | 'prev') => {
    if (filteredStudents.length === 0) return;
    
    if (currentStudentIndex === -1) {
      // Wenn kein Schüler ausgewählt ist, den ersten auswählen
      const newIndex = direction === 'next' ? 0 : filteredStudents.length - 1;
      setCurrentStudentIndex(newIndex);
      
      // Direktes Anwenden der Auswahl - immer nur einen Schüler auswählen bei Pfeil-Navigation
      setSelectedStudents([filteredStudents[newIndex]]);
      
      // Aktuellen Sucheingabewert löschen für bessere Anzeige des ausgewählten Schülers
      setLocalSearchQuery('');
      setSearchQuery('');
    } else {
      // Zum nächsten/vorherigen Schüler wechseln
      let newIndex;
      if (direction === 'next') {
        newIndex = (currentStudentIndex + 1) % filteredStudents.length;
      } else {
        newIndex = (currentStudentIndex - 1 + filteredStudents.length) % filteredStudents.length;
      }
      
      setCurrentStudentIndex(newIndex);
      
      // Bei Pfeil-Navigation immer nur einen Schüler auswählen, unabhängig vom Modus
      setSelectedStudents([filteredStudents[newIndex]]);
    }
  };
  
  // NEU: Tastaturnavigation ohne Dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Dropdown nicht öffnen bei Pfeil-Tasten im Keyboard-Modus
    if (isInputFocused && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault(); // Verhindern, dass die Seite scrollt
      
      if (e.key === 'ArrowDown') {
        cycleToNextStudent('next');
      } else if (e.key === 'ArrowUp') {
        cycleToNextStudent('prev');
      }
      return;
    }
    
    // Normaler Dropdown-Modus, wenn das Dropdown bereits offen ist
    if (isDropdownOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsDropdownOpen(false);
      }
    }
  };
  
  // Focus auf das Sucheingabefeld setzen, wenn das Dropdown geöffnet wird
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  // Behandle Fokus und Blur des Eingabefelds
  const handleInputFocus = () => {
    setIsInputFocused(true);
    
    // Wenn es ausgewählte Schüler gibt, setzen wir den currentStudentIndex
    if (selectedStudents.length === 1) {
      const index = filteredStudents.findIndex(s => s === selectedStudents[0]);
      if (index !== -1) {
        setCurrentStudentIndex(index);
      }
    }
  };

  const handleInputBlur = () => {
    // Verzögertes Zurücksetzen, um unbeabsichtigtes Schließen zu vermeiden
    setTimeout(() => {
      setIsInputFocused(false);
    }, 100);
  };
  
  // Lokale Änderungen an den globalen State übergeben
  useEffect(() => {
    if (!isUpdatingFromGlobal && localSearchQuery !== searchQuery) {
      setSearchQuery(localSearchQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearchQuery, setSearchQuery, isUpdatingFromGlobal]);
  
  // Globale Änderungen lokal übernehmen
  useEffect(() => {
    if (searchQuery !== localSearchQuery) {
      setIsUpdatingFromGlobal(true);
      setLocalSearchQuery(searchQuery);
      // Zurücksetzen des currentStudentIndex bei Änderung der Suche
      setCurrentStudentIndex(-1);
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
    
    // Dropdown öffnen, wenn Text eingegeben wird
    if (newValue.trim() !== '') {
      setIsDropdownOpen(true);
    }
    
    // Zurücksetzen des currentStudentIndex bei Änderung der Suche
    setCurrentStudentIndex(-1);
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
        onClick={(e) => {
          // Verhindern, dass der Container-Click das Dropdown öffnet
          e.stopPropagation();
        }}
        title={mode === 'table' 
          ? "Schüler suchen oder mit Pfeiltasten navigieren. Dropdown für Mehrfachauswahl." 
          : "Schüler filtern - mit Pfeiltasten navigieren oder Dropdown öffnen."
        }
      >
        <div className="flex items-center flex-grow overflow-hidden">
          {/* Eingabefeld immer anzeigen, unabhängig ob Dropdown offen ist */}
          <input
            ref={searchInputRef}
            type="text"
            id={`${instanceId.current}-search`}
            name={`${instanceId.current}-search`}
            value={selectedStudents.length === 1 && !isDropdownOpen && !localSearchQuery.trim() 
              ? `${selectedStudents[0].split(',')[0]} ${selectedStudents[0].split(',')[1]}`
              : localSearchQuery
            }
            onChange={handleLocalSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={selectedStudents.length === 0 
              ? placeholder 
              : selectedStudents.length === 1 
                ? `${selectedStudents[0].split(',')[0]} ${selectedStudents[0].split(',')[1]}`
                : `${selectedStudents.length} Schüler ausgewählt`
            }
            className="bg-transparent border-none focus:outline-none w-full truncate"
            onClick={(e) => e.stopPropagation()}
            title="Mit Pfeiltasten durch Schüler navigieren oder Text eingeben zum Suchen"
            autoComplete="off"
          />
        </div>
        
        {/* Badge für Anzahl ausgewählter Schüler (in beiden Modi anzeigen) */}
        {selectedStudents.length > 0 && (
          <span className="bg-header-btn dark:bg-header-btn-dark px-1.5 py-0.5 text-xs rounded-full mr-1">
            {selectedStudents.length}
          </span>
        )}
        
        {/* Reset-Icon - nur anzeigen, wenn mindestens ein Schüler ausgewählt ist */}
        {selectedStudents.length > 0 && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStudents([]);
              setLocalSearchQuery('');
              setSearchQuery('');
              setCurrentStudentIndex(-1);
            }}
            className="cursor-pointer p-1 rounded hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark mr-0.5"
            title="Auswahl zurücksetzen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        
        {/* Dropdown-Button-Icon */}
        <div
          ref={dropdownButtonRef}
          onClick={handleDropdownToggle}
          className="cursor-pointer p-1 rounded hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark"
        >
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        </div>
      </div>
      
      {/* Dropdown für die Mehrfachauswahl - nur anzeigen, wenn explizit geöffnet */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-1 w-auto min-w-full max-w-md bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark shadow-lg rounded-md overflow-hidden border border-tableBorder-light dark:border-tableBorder-dark z-50">
          <div className="p-2 space-y-1">
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
                  className="text-sm cursor-pointer whitespace-nowrap text-chatGray-textLight dark:text-chatGray-textDark"
                >
                  Alle Schüler
                </label>
              </div>
              
              {/* Gefilterte Schülerliste */}
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => {
                  const safeStudentId = student.replace(/[,\s.]/g, '-');
                  const checkboxId = `${instanceId.current}-student-${safeStudentId}`;
                  
                  return (
                    <div
                      key={student}
                      className={`flex items-center px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded cursor-pointer ${
                        currentStudentIndex === idx 
                          ? 'bg-header-btn-dropdown-hover dark:bg-header-btn-dropdown-hover-dark' 
                          : ''
                      }`}
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
                        className="text-sm cursor-pointer whitespace-nowrap text-chatGray-textLight dark:text-chatGray-textDark"
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