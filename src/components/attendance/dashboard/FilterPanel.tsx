import React, { useState, useEffect, useRef } from 'react';
import { StudentStats } from '@/types';

interface FilterPanelProps {
  availableClasses: string[];
  selectedClasses: string[];
  onClassesChange: (classes: string[]) => void;
  getFilteredStudents: () => [string, StudentStats][];
  selectedStudents: string[];
  onStudentsChange: (students: string[]) => void;
  groupingOption: 'weekly' | 'monthly';
  onGroupingChange: (option: 'weekly' | 'monthly') => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  availableClasses,
  selectedClasses,
  onClassesChange,
  getFilteredStudents,
  selectedStudents,
  onStudentsChange,
  groupingOption,
  onGroupingChange
}) => {
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  
  // Refs for dropdowns
  const classDropdownRef = useRef<HTMLDivElement>(null);
  const studentDropdownRef = useRef<HTMLDivElement>(null);
  
  // Get available students based on class selection
  const availableStudents: string[] = React.useMemo(() => {
    const allStudents = getFilteredStudents();
    
    if (selectedClasses.length === 0) {
      return allStudents.map(([student]) => student);
    }
    
    return allStudents
      .filter(([_, stats]) => selectedClasses.includes(stats.klasse))
      .map(([student]) => student);
  }, [getFilteredStudents, selectedClasses]);
  
  // Filtered classes based on search
  const filteredClasses = availableClasses.filter(
    className => className.toLowerCase().includes(classSearchTerm.toLowerCase())
  );
  
  // Filtered students based on search
  const filteredStudents = availableStudents.filter(
    student => student.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );
  
  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target as Node)) {
        setIsClassDropdownOpen(false);
      }
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
        setIsStudentDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Reset student selection when class selection changes
  useEffect(() => {
    onStudentsChange([]);
  }, [selectedClasses, onStudentsChange]);
  
  // Class selection handlers
  const handleSelectAllClasses = () => {
    onClassesChange([]);
    onStudentsChange([]);
  };
  
  const handleClassToggle = (className: string) => {
    let newSelectedClasses: string[];
    
    if (selectedClasses.includes(className)) {
      newSelectedClasses = selectedClasses.filter(c => c !== className);
    } else {
      newSelectedClasses = [...selectedClasses, className];
    }
    
    onClassesChange(newSelectedClasses);
  };
  
  // Student selection handlers
  const handleSelectAllStudents = () => {
    onStudentsChange([]);
  };
  
  const handleStudentToggle = (student: string) => {
    let newSelectedStudents: string[];
    
    if (selectedStudents.includes(student)) {
      newSelectedStudents = selectedStudents.filter(s => s !== student);
    } else {
      newSelectedStudents = [...selectedStudents, student];
    }
    
    onStudentsChange(newSelectedStudents);
  };

  return (
    <div className="p-4 bg-table-light-base dark:bg-table-dark-base rounded-lg shadow-sm mb-4">
      <div className="flex flex-wrap items-center gap-6">
        {/* Class Filter - Fixed width and no wrapping */}
        <div className="min-w-[260px] relative" ref={classDropdownRef}>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Klassen filtern
          </label>
          <div
            onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
            className="w-full rounded px-3 py-2 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm cursor-pointer flex items-center justify-between"
            title="Klassen auswählen - mehrere Klassen können gleichzeitig ausgewählt werden"
          >
            <span className="truncate">
              {selectedClasses.length === 0 
                ? 'Alle Klassen' 
                : selectedClasses.length === 1 
                  ? selectedClasses[0] 
                  : `${selectedClasses.length} Klassen ausgewählt`}
            </span>
            <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {isClassDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-auto min-w-full bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={classSearchTerm}
                  onChange={(e) => setClassSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 mb-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-chatGray-textLight dark:text-chatGray-textDark text-sm"
                />
                
                <div className="max-h-56 overflow-y-auto">
                  {/* "All Classes" option */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAllClasses();
                      setIsClassDropdownOpen(false);
                    }}
                    className={`px-3 py-2 rounded cursor-pointer flex items-center ${
                      selectedClasses.length === 0
                        ? 'bg-gray-200 dark:bg-gray-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClasses.length === 0}
                      onChange={() => {}}
                      className="mr-2"
                    />
                    <span className="truncate">Alle Klassen</span>
                  </div>
                  
                  {filteredClasses.map(className => (
                    <div
                      key={className}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClassToggle(className);
                      }}
                      className={`px-3 py-2 rounded cursor-pointer flex items-center ${
                        selectedClasses.includes(className)
                          ? 'bg-gray-200 dark:bg-gray-600'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(className)}
                        onChange={() => {}}
                        className="mr-2"
                      />
                      <span className="truncate">{className}</span>
                    </div>
                  ))}
                  
                  {filteredClasses.length === 0 && (
                    <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                      Keine Klassen gefunden
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Student Filter - Fixed width and no wrapping */}
        <div className="min-w-[260px] relative" ref={studentDropdownRef}>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Schüler filtern
          </label>
          <div
            onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
            className="w-full rounded px-3 py-2 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm cursor-pointer flex items-center justify-between"
            title="Schüler auswählen - es werden nur Schüler der ausgewählten Klassen angezeigt"
          >
            <span className="truncate">
              {selectedStudents.length === 0 
                ? 'Alle Schüler' 
                : selectedStudents.length === 1 
                  ? selectedStudents[0].split(',')[0] + ' ' + selectedStudents[0].split(',')[1]
                  : `${selectedStudents.length} Schüler ausgewählt`}
            </span>
            <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {isStudentDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-auto min-w-full max-w-md bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 mb-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-chatGray-textLight dark:text-chatGray-textDark text-sm"
                />
                
                <div className="max-h-56 overflow-y-auto">
                  {/* "All Students" option */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAllStudents();
                      setIsStudentDropdownOpen(false);
                    }}
                    className={`px-3 py-2 rounded cursor-pointer flex items-center ${
                      selectedStudents.length === 0
                        ? 'bg-gray-200 dark:bg-gray-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === 0}
                      onChange={() => {}}
                      className="mr-2"
                    />
                    <span className="truncate">Alle Schüler</span>
                  </div>
                  
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                      <div
                        key={student}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStudentToggle(student);
                        }}
                        className={`px-3 py-2 rounded cursor-pointer flex items-center ${
                          selectedStudents.includes(student)
                            ? 'bg-gray-200 dark:bg-gray-600'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student)}
                          onChange={() => {}}
                          className="mr-2"
                        />
                        <span className="truncate">{student}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                      {availableStudents.length === 0 
                        ? 'Keine Schüler verfügbar' 
                        : 'Keine Schüler gefunden'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Grouping Option */}
        <div className="min-w-[180px]">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1" title="Gruppierung der Daten für Trendanalysen">
            Zeitliche Gruppierung
          </label>
          <select
            value={groupingOption}
            onChange={(e) => onGroupingChange(e.target.value as 'weekly' | 'monthly')}
            className="w-full rounded px-3 py-2 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm"
          >
            <option value="weekly">Wöchentlich</option>
            <option value="monthly">Monatlich</option>
          </select>
        </div>
        
        {/* Selection summary */}
        {(selectedClasses.length > 0 || selectedStudents.length > 0) && (
          <div className="flex-1 flex flex-wrap gap-2 items-center mt-2">
            {selectedClasses.length > 0 && (
              <>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Klassen:
                </span>
                {selectedClasses.map(cls => (
                  <span key={cls} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs truncate flex items-center">
                    {cls}
                    <button
                      onClick={() => handleClassToggle(cls)}
                      className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </>
            )}
            
            {selectedStudents.length > 0 && (
              <>
                <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                  Schüler:
                </span>
                {selectedStudents.slice(0, 3).map(student => (
                  <span key={student} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs truncate flex items-center">
                    {student.split(',')[0]}
                    <button
                      onClick={() => handleStudentToggle(student)}
                      className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedStudents.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{selectedStudents.length - 3} weitere
                  </span>
                )}
              </>
            )}
            
            {(selectedClasses.length > 0 || selectedStudents.length > 0) && (
              <button
                onClick={() => {
                  onClassesChange([]);
                  onStudentsChange([]);
                }}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-2"
              >
                Alle Filter zurücksetzen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;