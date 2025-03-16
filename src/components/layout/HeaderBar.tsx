// src/components/layout/HeaderBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, ChevronDown } from 'lucide-react';
import ResetButton from '@/components/attendance/ResetButton';
import { useFilters } from '@/contexts/FilterContext';
import StudentSearchSelect from '@/components/ui/StudentSearchSelect';
import DateRangeButton from '@/components/ui/DateRangeButton';
import TileVisibilityDropdown from '@/components/ui/TileVisibilityDropdown';

interface HeaderBarProps {
  filterUnexcusedLate: boolean;
  filterUnexcusedAbsent: boolean;
  onFilterUnexcusedLateChange: (value: boolean) => void;
  onFilterUnexcusedAbsentChange: (value: boolean) => void;
  minUnexcusedLates: string;
  minUnexcusedAbsences: string;
  onMinUnexcusedLatesChange: (value: string) => void;
  onMinUnexcusedAbsencesChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  availableClasses: string[];
  selectedClasses: string[];
  onClassesChange: (classes: string[]) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onReset: () => void;
  visibleColumns: string[];
  onToggleColumnGroup: (group: string) => void;
  expandedStudents: Set<string>;
  onCloseAllDetails: () => void;
  
  viewMode?: 'table' | 'dashboard';
  onViewModeChange?: (mode: 'table' | 'dashboard') => void;
  
  // Dashboard-spezifische Datumsfilter
  dashboardStartDate?: string;
  dashboardEndDate?: string;
  onDashboardStartDateChange?: (value: string) => void;
  onDashboardEndDateChange?: (value: string) => void;
  
  // Add new props for QuickSelect
  quickSelectValue?: string;
  handleQuickSelect?: (value: string) => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  filterUnexcusedLate,
  filterUnexcusedAbsent,
  onFilterUnexcusedLateChange,
  onFilterUnexcusedAbsentChange,
  minUnexcusedLates,
  minUnexcusedAbsences,
  onMinUnexcusedLatesChange,
  onMinUnexcusedAbsencesChange,
  availableClasses,
  selectedClasses,
  onClassesChange,
  isDarkMode,
  toggleDarkMode,
  onReset,
  visibleColumns,
  onToggleColumnGroup,
  expandedStudents,
  onCloseAllDetails,
  viewMode = 'table',
  onViewModeChange = () => {},
  dashboardStartDate = '',
  dashboardEndDate = '',
  onDashboardStartDateChange = () => {},
  onDashboardEndDateChange = () => {},
  quickSelectValue = '',
  handleQuickSelect = () => {},
}) => {
  // State für geöffnetes Spalten-Dropdown
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  // State für Klassen-Dropdown
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  
  // NEU: State für Dashboard-Date-Dropdown
  const [, setIsDateDropdownOpen] = useState(false);
  
  // NEU: Dashboard-Filter aus dem Context holen
  const {
    selectedDashboardClasses,
    setSelectedDashboardClasses,
    groupingOption,
    setGroupingOption,
    getAllStudents // <-- Neue Funktion verwenden
  } = useFilters();
  
  // NEU: State für Dashboard-Filter Dropdowns
  const [isDashboardClassDropdownOpen, setIsDashboardClassDropdownOpen] = useState(false);
  
  // Refs für die Dropdown-Elemente
  const columnDropdownRef = useRef<HTMLDivElement>(null);
  const classDropdownRef = useRef<HTMLDivElement>(null);
  
  // NEU: Refs für Dashboard-Filter Dropdowns
  const dashboardClassDropdownRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  
  // Timer für verzögertes Schließen bei Hover
  const columnDropdownTimer = useRef<NodeJS.Timeout | null>(null);
  const classDropdownTimer = useRef<NodeJS.Timeout | null>(null);
  
  // NEU: Timer für Dashboard-Filter Dropdowns
  const dashboardClassDropdownTimer = useRef<NodeJS.Timeout | null>(null);

  const [isGroupingDropdownOpen, setIsGroupingDropdownOpen] = useState(false);
 
  const groupingDropdownRef = useRef<HTMLDivElement>(null);
  
  const groupingDropdownTimer = useRef<NodeJS.Timeout | null>(null);

  // Click-Outside Handler für die Dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Prüfe, ob außerhalb des Spalten-Dropdowns geklickt wurde
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
        setIsColumnDropdownOpen(false);
      }
      
      // Prüfe, ob außerhalb des Klassen-Dropdowns geklickt wurde
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target as Node)) {
        setIsClassDropdownOpen(false);
      }
      
      // NEU: Dashboard-Filter Dropdowns überprüfen
      if (dashboardClassDropdownRef.current && !dashboardClassDropdownRef.current.contains(event.target as Node)) {
        setIsDashboardClassDropdownOpen(false);
      }
      
      // NEU: Datumsfilter Dropdown überprüfen
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
      if (groupingDropdownRef.current && !groupingDropdownRef.current.contains(event.target as Node)) {
        setIsGroupingDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [columnDropdownRef, classDropdownRef, dashboardClassDropdownRef, dateDropdownRef]);

  const handleMouseEnterGroupingDropdown = () => {
    if (groupingDropdownTimer.current) {
      clearTimeout(groupingDropdownTimer.current);
      groupingDropdownTimer.current = null;
    }
    setIsGroupingDropdownOpen(true);
  };

  const handleMouseLeaveGroupingDropdown = () => {
    groupingDropdownTimer.current = setTimeout(() => {
      setIsGroupingDropdownOpen(false);
    }, 300); // Verzögerung zum Schließen
  };

  // Hilfsfunktionen für Dropdowns
  const handleMouseEnterColumnDropdown = () => {
    if (columnDropdownTimer.current) {
      clearTimeout(columnDropdownTimer.current);
      columnDropdownTimer.current = null;
    }
    setIsColumnDropdownOpen(true);
  };

  const handleMouseLeaveColumnDropdown = () => {
    columnDropdownTimer.current = setTimeout(() => {
      setIsColumnDropdownOpen(false);
    }, 300); // Verzögerung zum Schließen
  };

  const handleMouseEnterClassDropdown = () => {
    if (classDropdownTimer.current) {
      clearTimeout(classDropdownTimer.current);
      classDropdownTimer.current = null;
    }
    setIsClassDropdownOpen(true);
  };

  const handleMouseLeaveClassDropdown = () => {
    classDropdownTimer.current = setTimeout(() => {
      setIsClassDropdownOpen(false);
    }, 300); // Verzögerung zum Schließen
  };
  
  // NEU: Hilfsfunktionen für Dashboard-Filter Dropdowns
  const handleMouseEnterDashboardClassDropdown = () => {
    if (dashboardClassDropdownTimer.current) {
      clearTimeout(dashboardClassDropdownTimer.current);
      dashboardClassDropdownTimer.current = null;
    }
    setIsDashboardClassDropdownOpen(true);
  };
  
  const handleMouseLeaveDashboardClassDropdown = () => {
    dashboardClassDropdownTimer.current = setTimeout(() => {
      setIsDashboardClassDropdownOpen(false);
    }, 300);
  };

  // Handler für Klassen-Auswahl
  const handleClassToggle = (className: string) => {
    if (className === '') {
      onClassesChange([]);
    } else if (selectedClasses.includes(className)) {
      onClassesChange(selectedClasses.filter((c) => c !== className));
    } else {
      onClassesChange([...selectedClasses, className]);
    }
  };
  
  // NEU: Handler für Dashboard-Klassen-Auswahl
  const handleDashboardClassToggle = (className: string) => {
    if (className === '') {
      setSelectedDashboardClasses([]);
    } else if (selectedDashboardClasses.includes(className)) {
      setSelectedDashboardClasses(selectedDashboardClasses.filter(c => c !== className));
    } else {
      setSelectedDashboardClasses([...selectedDashboardClasses, className]);
    }
  };
  
  // WICHTIG: Verwende getAllStudents statt getContextFilteredStudents
  const getAvailableStudents = (): string[] => {
    // Alle Schülerdaten abrufen, ohne nach selectedStudents zu filtern
    const allStudentsWithStats = getAllStudents();
    
    // Nur nach Klassen filtern
    const classFilteredStudents = (viewMode === 'dashboard' && selectedDashboardClasses.length > 0)
      ? allStudentsWithStats.filter(([_, stats]) => 
          selectedDashboardClasses.includes(stats.klasse))
      : viewMode === 'table' && selectedClasses.length > 0
        ? allStudentsWithStats.filter(([_, stats]) => 
            selectedClasses.includes(stats.klasse))
        : allStudentsWithStats;
    
    // Nur die Namen zurückgeben
    return classFilteredStudents.map(([name]) => name);
  };

  return (
    <header
      className="fixed top-0 z-30 bg-chatGray-light dark:bg-chatGray-dark p-2 flex items-center justify-between h-14 transition-all duration-150"
      style={{
        left: 'var(--sidebar-width)',
        right: '0',
        paddingLeft: 'var(--header-padding-left)',
        transitionProperty: 'left, padding-left'
      }}
    >
      <div className="flex items-center gap-3">
        {/* NEU: Bedingte Anzeige basierend auf viewMode */}
        {viewMode === 'table' ? (
          <>
            {/* ORIGINALER CODE FÜR TABELLENFILTER */}
            {/* Klassenfilter - mit benutzerdefiniertem Dropdown für Hover-Effekt */}
            <div 
              className="relative ml-2"
              ref={classDropdownRef}
              onMouseEnter={handleMouseEnterClassDropdown}
              onMouseLeave={handleMouseLeaveClassDropdown}
            >
              <div
                className="min-w-[120px] w-auto rounded px-2 py-1 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm flex items-center justify-between cursor-pointer"
                onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                title="Klassen filtern - mehrere Klassen können ausgewählt werden"
              >
                <span className="truncate whitespace-nowrap mr-1">
                  {selectedClasses.length === 0 
                    ? 'Alle Klassen' 
                    : selectedClasses.length === 1 
                      ? selectedClasses[0] 
                      : `${selectedClasses.length} Klassen`}
                </span>
                <ChevronDown className="w-4 h-4 ml-1 flex-shrink-0" />
              </div>
              
              {isClassDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark shadow-lg rounded-md overflow-hidden border border-tableBorder-light dark:border-tableBorder-dark z-50 max-h-60 overflow-y-auto min-w-[160px]">
                  <div className="p-2 space-y-1">
                    <div 
                      className="flex items-center px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded cursor-pointer"
                      onClick={() => handleClassToggle('')}
                    >
                      <input
                        type="checkbox"
                        id="class-all"
                        checked={selectedClasses.length === 0}
                        onChange={() => {}}
                        className="mr-2 text-chatGray-textLight dark:text-chatGray-textDark"
                      />
                      <label htmlFor="class-all" className="text-sm cursor-pointer whitespace-nowrap text-chatGray-textLight dark:text-chatGray-textDark">
                        Alle Klassen
                      </label>
                    </div>
                    
                    {availableClasses.map((className) => (
                      <div 
                        key={className} 
                        className="flex items-center px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded cursor-pointer"
                        onClick={() => handleClassToggle(className)}
                      >
                        <input
                          type="checkbox"
                          id={`class-${className}`}
                          checked={selectedClasses.includes(className)}
                          onChange={() => {}}
                          className="mr-2 text-chatGray-textLight dark:text-chatGray-textDark"
                        />
                        <label htmlFor={`class-${className}`} className="text-sm cursor-pointer whitespace-nowrap text-chatGray-textLight dark:text-chatGray-textDark">
                          {className}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* NEU: StudentSearchSelect anstelle des einfachen Suchfelds */}
            <StudentSearchSelect
              placeholder="Nach Name suchen"
              className="w-56"
              getAvailableStudents={getAvailableStudents}
              mode="table"
            />
            
            {/* Verspätungen und Fehltage Filter-Buttons */}
            <div className="flex gap-1">
              <button
                onClick={() => onFilterUnexcusedLateChange(!filterUnexcusedLate)}
                className={`px-2 py-1 text-sm ${
                  filterUnexcusedLate
                    ? 'bg-header-btn-selected dark:bg-header-btn-selected-dark text-chatGray-textLight dark:text-chatGray-textDark'
                    : 'bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark'
                }`}
                title="Nur Schüler mit unentschuldigten Verspätungen anzeigen - betrifft gewählten Zeitraum"
              >
                Nur Verspät.
              </button>
              <button
                onClick={() => onFilterUnexcusedAbsentChange(!filterUnexcusedAbsent)}
                className={`px-2 py-1 text-sm ${
                  filterUnexcusedAbsent
                    ? 'bg-header-btn-selected dark:bg-header-btn-selected-dark text-chatGray-textLight dark:text-chatGray-textDark'
                    : 'bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark'
                }`}
                title="Nur Schüler mit unentschuldigten Fehlzeiten anzeigen - betrifft gewählten Zeitraum"
              >
                Nur Fehltage
              </button>
            </div>
            
            {/* Min. Verspätungen und Min. Fehltage Eingabefelder - Gleichegroße Felder mit Placeholder */}
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="99"
                value={minUnexcusedLates}
                placeholder="Min. Verspät."
                onChange={(e) => onMinUnexcusedLatesChange(e.target.value)}
                className="w-32 rounded px-2 py-1 bg-header-btn-input dark:bg-header-btn-input-dark hover:bg-header-btn-input-hover dark:hover:bg-header-btn-input-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm"
                title="Mindestanzahl an unentschuldigten Verspätungen für die Anzeige eingeben"
              />
              <input
                type="number"
                min="0"
                max="99"
                value={minUnexcusedAbsences}
                placeholder="Min. Fehltage"
                onChange={(e) => onMinUnexcusedAbsencesChange(e.target.value)}
                className="w-32 rounded px-2 py-1 bg-header-btn-input dark:bg-header-btn-input-dark hover:bg-header-btn-input-hover dark:hover:bg-header-btn-input-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm"
                title="Mindestanzahl an unentschuldigten Fehltagen für die Anzeige eingeben"
              />
            </div>
        

            {/* Verbessertes Dropdown für Spaltenauswahl mit Hover-Effekt */}
            <div 
              className="relative ml-3" 
              ref={columnDropdownRef}
              onMouseEnter={handleMouseEnterColumnDropdown}
              onMouseLeave={handleMouseLeaveColumnDropdown}
            >
              <button
                onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                className="px-2 py-1 text-sm bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark flex items-center"
                title="Spalten ein-/ausblenden"
              >
                Spalten
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              
              {isColumnDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark shadow-lg rounded-md overflow-hidden z-[100] border border-tableBorder-light dark:border-tableBorder-dark">
                  <div className="p-2 space-y-1">
                    <div className="flex items-center px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded">
                      <input
                        type="checkbox"
                        id="spalte-verspaetungen"
                        checked={visibleColumns.includes('verspaetungen')}
                        onChange={() => onToggleColumnGroup('verspaetungen')}
                        className="mr-2 text-chatGray-textLight dark:text-chatGray-textDark"
                      />
                      <label htmlFor="spalte-verspaetungen" className="text-sm cursor-pointer whitespace-nowrap text-chatGray-textLight dark:text-chatGray-textDark">
                        Verspätungen
                      </label>
                    </div>
                    <div className="flex items-center px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded">
                      <input
                        type="checkbox"
                        id="spalte-fehlzeiten"
                        checked={visibleColumns.includes('fehlzeiten')}
                        onChange={() => onToggleColumnGroup('fehlzeiten')}
                        className="mr-2 text-chatGray-textLight dark:text-chatGray-textDark"
                      />
                      <label htmlFor="spalte-fehlzeiten" className="text-sm cursor-pointer whitespace-nowrap text-chatGray-textLight dark:text-chatGray-textDark">
                        Fehltage
                      </label>
                    </div>
                    <div className="flex items-center px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded">
                      <input
                        type="checkbox"
                        id="spalte-stats"
                        checked={visibleColumns.includes('stats')}
                        onChange={() => onToggleColumnGroup('stats')}
                        className="mr-2 text-chatGray-textLight dark:text-chatGray-textDark"
                      />
                      <label htmlFor="spalte-stats" className="text-sm cursor-pointer whitespace-nowrap text-chatGray-textLight dark:text-chatGray-textDark">
                        Wochen
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Dashboard-Klassenfilter */}
            <div 
              className="relative ml-2"
              ref={dashboardClassDropdownRef}
              onMouseEnter={handleMouseEnterDashboardClassDropdown}
              onMouseLeave={handleMouseLeaveDashboardClassDropdown}
            >
              <div
                className="min-w-[120px] w-auto rounded px-2 py-1 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm flex items-center justify-between cursor-pointer"
                onClick={() => setIsDashboardClassDropdownOpen(!isDashboardClassDropdownOpen)}
                title="Klassen filtern - mehrere Klassen können ausgewählt werden"
              >
                <span className="truncate whitespace-nowrap mr-1">
                  {selectedDashboardClasses.length === 0 
                    ? 'Alle Klassen' 
                    : selectedDashboardClasses.length === 1 
                      ? selectedDashboardClasses[0] 
                      : `${selectedDashboardClasses.length} Klassen`}
                </span>
                <ChevronDown className="w-4 h-4 ml-1 flex-shrink-0" />
              </div>
              
              {isDashboardClassDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark shadow-lg rounded-md overflow-hidden border border-tableBorder-light dark:border-tableBorder-dark z-50 max-h-60 overflow-y-auto min-w-[160px]">
                  <div className="p-2 space-y-1">
                    <div 
                      className="flex items-center px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded cursor-pointer"
                      onClick={() => handleDashboardClassToggle('')}
                    >
                      <input
                        type="checkbox"
                        id="dashboard-class-all"
                        checked={selectedDashboardClasses.length === 0}
                        onChange={() => {}}
                        className="mr-2 text-chatGray-textLight dark:text-chatGray-textDark"
                      />
                      <label htmlFor="dashboard-class-all" className="text-sm cursor-pointer whitespace-nowrap text-chatGray-textLight dark:text-chatGray-textDark">
                        Alle Klassen
                      </label>
                    </div>
                    
                    {availableClasses.map((className) => (
                      <div 
                        key={className} 
                        className="flex items-center px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded cursor-pointer"
                        onClick={() => handleDashboardClassToggle(className)}
                      >
                        <input
                          type="checkbox"
                          id={`dashboard-class-${className}`}
                          checked={selectedDashboardClasses.includes(className)}
                          onChange={() => {}}
                          className="mr-2 text-chatGray-textLight dark:text-chatGray-textDark"
                        />
                        <label htmlFor={`dashboard-class-${className}`} className="text-sm cursor-pointer whitespace-nowrap text-chatGray-textLight dark:text-chatGray-textDark">
                          {className}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* NEU: StudentSearchSelect anstelle des bestehenden Schüler-Dropdowns */}
            <StudentSearchSelect
              placeholder="Schüler auswählen"
              className="min-w-[120px]"
              getAvailableStudents={getAvailableStudents}
              mode="dashboard"
            />
            
            {/* 🔴 NEU: Gruppierungsoption für Dashboard mit Hover (ersetzt das alte <select>) */}
            <div
              className="relative min-w-[120px]"
              ref={groupingDropdownRef}
              onMouseEnter={handleMouseEnterGroupingDropdown}
              onMouseLeave={handleMouseLeaveGroupingDropdown}
            >
              {/* 🔴 NEU: Dropdown-Trigger */}
              <div
                className="w-full rounded px-2 py-1 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm flex items-center justify-between cursor-pointer"
                title="Gruppierung der Daten für Trendanalysen"
              >
                <span className="truncate whitespace-nowrap mr-1">
                  {groupingOption === 'weekly' ? 'Wöchentlich' : 'Monatlich'}
                </span>
                <ChevronDown className="w-4 h-4 ml-1 flex-shrink-0" />
              </div>

              {/* 🔴 NEU: Dropdown-Inhalt */}
              {isGroupingDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark shadow-lg rounded-md overflow-hidden border border-tableBorder-light dark:border-tableBorder-dark z-50 min-w-[120px]">
                  <div className="p-2 space-y-1">
                    <div
                      className="px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded cursor-pointer text-sm text-chatGray-textLight dark:text-chatGray-textDark"
                      onClick={() => setGroupingOption('weekly')}
                    >
                      Wöchentlich
                    </div>
                    <div
                      className="px-2 py-1 hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark rounded cursor-pointer text-sm text-chatGray-textLight dark:text-chatGray-textDark"
                      onClick={() => setGroupingOption('monthly')}
                    >
                      Monatlich
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* NEU: Verwenden der verbesserten DateRangeButton-Komponente */}
            <DateRangeButton
              dashboardStartDate={dashboardStartDate}
              dashboardEndDate={dashboardEndDate}
              onDashboardStartDateChange={onDashboardStartDateChange}
              onDashboardEndDateChange={onDashboardEndDateChange}
              handleQuickSelect={handleQuickSelect}
              quickSelectValue={quickSelectValue}
              className="ml-3"
            />
          </>
        )}
        
        {/* Dashboard-Toggle Button - immer sichtbar */}
        <div className="ml-3">
          <button
            onClick={() => onViewModeChange(viewMode === 'table' ? 'dashboard' : 'table')}
            className={`px-2 py-1 text-sm ${
              viewMode === 'dashboard'
                ? 'bg-header-btn-selected dark:bg-header-btn-selected-dark text-chatGray-textLight dark:text-chatGray-textDark'
                : 'bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark'
            }`}
            title={viewMode === 'table' ? 'Zur Dashboard-Ansicht wechseln' : 'Zur Tabellenansicht wechseln'}
          >
            {viewMode === 'table' ? 'Dashboard' : 'Tabelle'}
          </button>
        </div>
        
        {/* "Details einklappen" Button - nur angezeigt, wenn expandedStudents nicht leer ist */}
        {expandedStudents.size > 0 && (
          <button
            onClick={onCloseAllDetails}
            className="px-2 py-1 text-sm bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark"
            title="Alle geöffneten Details einklappen"
          >
            Details einklappen
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mr-2">
        <ResetButton onReset={onReset} />
        
        {/* NEU: Kachel-Visibility Dropdown - nur im Dashboard-Modus anzeigen */}
        {viewMode === 'dashboard' && (
          <TileVisibilityDropdown className="mr-1" />
        )}

        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-full bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark transition-colors"
          title={isDarkMode ? 'Zum Light Mode wechseln' : 'Zum Dark Mode wechseln'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

export default HeaderBar;