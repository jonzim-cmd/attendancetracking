// src/components/layout/HeaderBar.tsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import ResetButton from '@/components/attendance/ResetButton';

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
  // Neue Props für die Spaltenanzeige
  visibleColumns: string[];
  onToggleColumnGroup: (group: string) => void;
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
  searchQuery,
  onSearchChange,
  availableClasses,
  selectedClasses,
  onClassesChange,
  isDarkMode,
  toggleDarkMode,
  onReset,
  visibleColumns,
  onToggleColumnGroup,
}) => {
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '') {
      onClassesChange([]);
    } else if (selectedClasses.includes(value)) {
      onClassesChange(selectedClasses.filter((c) => c !== value));
    } else {
      onClassesChange([...selectedClasses, value]);
    }
  };

  return (
    <header
      className="fixed top-0 z-10 bg-chatGray-light dark:bg-chatGray-dark p-2 flex items-center justify-between h-14 transition-all duration-300"
      style={{
        left: 'var(--sidebar-width)',
        right: '0',
        paddingLeft: 'var(--header-padding-left)'
      }}
    >
      <div className="flex items-center gap-3">
        {/* Klassenfilter - mit Abstand zur Sidebar */}
        <select
          value={selectedClasses.length === 0 ? '' : selectedClasses[selectedClasses.length - 1]}
          onChange={handleClassChange}
          className="ml-2 min-w-[120px] w-auto rounded px-2 py-1 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm"
          title="Klassen filtern - mehrere Klassen können ausgewählt werden"
        >
          <option value="">Alle Klassen</option>
          {availableClasses.map((className) => (
            <option key={className} value={className}>
              {className} {selectedClasses.includes(className) ? '✓' : ''}
            </option>
          ))}
        </select>
        
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
        
        {/* Suchfeld */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Nach Name suchen"
          className="w-40 rounded px-2 py-1 bg-header-btn-input dark:bg-header-btn-input-dark hover:bg-header-btn-input-hover dark:hover:bg-header-btn-input-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm"
          title="Suche nach Schülernamen - Eingabe filtert die Ergebnisse"
        />

        {/* NEUE SPALTENTOGGLE-BUTTONS */}
        <div className="ml-3 flex gap-1">
          <button
            onClick={() => onToggleColumnGroup('verspaetungen')}
            className={`px-2 py-1 text-sm ${
              visibleColumns.includes('verspaetungen')
                ? 'bg-header-btn-selected dark:bg-header-btn-selected-dark text-chatGray-textLight dark:text-chatGray-textDark'
                : 'bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark'
            }`}
            title="Verspätungsspalten ein-/ausblenden"
          >
            Verspät.
          </button>
          <button
            onClick={() => onToggleColumnGroup('fehlzeiten')}
            className={`px-2 py-1 text-sm ${
              visibleColumns.includes('fehlzeiten')
                ? 'bg-header-btn-selected dark:bg-header-btn-selected-dark text-chatGray-textLight dark:text-chatGray-textDark'
                : 'bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark'
            }`}
            title="Fehltagesspalten ein-/ausblenden"
          >
            Fehltage
          </button>
          <button
            onClick={() => onToggleColumnGroup('stats')}
            className={`px-2 py-1 text-sm ${
              visibleColumns.includes('stats')
                ? 'bg-header-btn-selected dark:bg-header-btn-selected-dark text-chatGray-textLight dark:text-chatGray-textDark'
                : 'bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark'
            }`}
            title="Wochenspalten ein-/ausblenden"
          >
            Wochen
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mr-2">
        <ResetButton onReset={onReset} />
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