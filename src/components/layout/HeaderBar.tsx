import React from 'react';
import { Sun, Moon } from 'lucide-react';

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
      className="fixed top-0 right-0 z-10 bg-chatGray-light dark:bg-chatGray-dark p-2 flex items-center justify-between h-14 shadow-sm"
      style={{ left: 'var(--sidebar-width)' }}
    >
      <div className="flex items-center gap-2">
        {/* Namensfilter */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Nach Name suchen"
          className="w-40 rounded px-2 py-1 bg-chatGray-light dark:bg-chatGray-button text-chatGray-textLight dark:text-chatGray-textDark text-sm"
        />

        {/* Klassenfilter */}
        <select
          value={selectedClasses.length === 0 ? '' : selectedClasses[selectedClasses.length - 1]}
          onChange={handleClassChange}
          className="w-28 rounded px-2 py-1 bg-chatGray-light dark:bg-chatGray-button text-chatGray-textLight dark:text-chatGray-textDark text-sm"
        >
          <option value="">Alle Klassen</option>
          {availableClasses.map((className) => (
            <option key={className} value={className}>
              {className} {selectedClasses.includes(className) ? '✓' : ''}
            </option>
          ))}
        </select>

        {/* Filter-Buttons */}
        <div className="flex gap-1">
          <button
            onClick={() => onFilterUnexcusedLateChange(!filterUnexcusedLate)}
            className={`px-2 py-1 text-xs ${
              filterUnexcusedLate
                ? 'bg-chatGray-button text-chatGray-textDark'
                : 'bg-chatGray-light dark:bg-chatGray-button text-chatGray-textLight dark:text-chatGray-textDark'
            }`}
            title="Nur Schüler mit unentschuldigten Verspätungen"
          >
            Verspätungen
          </button>
          <button
            onClick={() => onFilterUnexcusedAbsentChange(!filterUnexcusedAbsent)}
            className={`px-2 py-1 text-xs ${
              filterUnexcusedAbsent
                ? 'bg-chatGray-button text-chatGray-textDark'
                : 'bg-chatGray-light dark:bg-chatGray-button text-chatGray-textLight dark:text-chatGray-textDark'
            }`}
            title="Nur Schüler mit unentschuldigten Fehlzeiten"
          >
            Fehltage
          </button>
        </div>

        {/* Mindestanzahl */}
        <div className="flex gap-1">
          <input
            type="number"
            min="0"
            max="99"
            value={minUnexcusedLates}
            onChange={(e) => onMinUnexcusedLatesChange(e.target.value)}
            placeholder="Min V"
            className="w-14 rounded px-2 py-1 bg-chatGray-light dark:bg-chatGray-button text-chatGray-textLight dark:text-chatGray-textDark text-sm"
          />
          <input
            type="number"
            min="0"
            max="99"
            value={minUnexcusedAbsences}
            onChange={(e) => onMinUnexcusedAbsencesChange(e.target.value)}
            placeholder="Min F"
            className="w-14 rounded px-2 py-1 bg-chatGray-light dark:bg-chatGray-button text-chatGray-textLight dark:text-chatGray-textDark text-sm"
          />
        </div>
      </div>

      {/* Dark Mode */}
      <button
        onClick={toggleDarkMode}
        className="p-1.5 rounded-full bg-chatGray-button text-chatGray-textDark hover:bg-chatGray-hover transition-colors"
        title={isDarkMode ? 'Zum Light Mode wechseln' : 'Zum Dark Mode wechseln'}
      >
        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
};

export default HeaderBar;
