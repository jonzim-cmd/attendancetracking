// src/components/ui/DateRangeButton.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { getCurrentSchoolYear } from '@/lib/attendance-utils';


interface Month {
  key: string;
  label: string;
  index: number; // 0-basierter Monat (0 für Januar, 11 für Dezember)
  schoolYearIndex: number; // 0-basierter Monat im Schuljahr (0 für September, 10 für Juli)
}

interface DateRangeButtonProps {
  dashboardStartDate: string;
  dashboardEndDate: string;
  onDashboardStartDateChange: (date: string) => void;
  onDashboardEndDateChange: (date: string) => void;
  handleQuickSelect: (value: string) => void;
  quickSelectValue: string;
  className?: string;
}

const DateRangeButton: React.FC<DateRangeButtonProps> = ({
  dashboardStartDate,
  dashboardEndDate,
  onDashboardStartDateChange,
  onDashboardEndDateChange,
  handleQuickSelect,
  className = ''
}) => {
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Alle Monate des Schuljahrs (September bis Juli)
  const schoolYearMonths: Month[] = useMemo(() => [
    { key: 'sep', label: 'Sep', index: 8, schoolYearIndex: 0 },
    { key: 'oct', label: 'Okt', index: 9, schoolYearIndex: 1 },
    { key: 'nov', label: 'Nov', index: 10, schoolYearIndex: 2 },
    { key: 'dec', label: 'Dez', index: 11, schoolYearIndex: 3 },
    { key: 'jan', label: 'Jan', index: 0, schoolYearIndex: 4 },
    { key: 'feb', label: 'Feb', index: 1, schoolYearIndex: 5 },
    { key: 'mar', label: 'Mär', index: 2, schoolYearIndex: 6 },
    { key: 'apr', label: 'Apr', index: 3, schoolYearIndex: 7 },
    { key: 'may', label: 'Mai', index: 4, schoolYearIndex: 8 },
    { key: 'jun', label: 'Jun', index: 5, schoolYearIndex: 9 },
    { key: 'jul', label: 'Jul', index: 6, schoolYearIndex: 10 },
  ], []);
  
  // Funktion, um den zweiten Montag im September zu bekommen
  const getSecondMondayOfMonth = (year: number, month: number): Date => {
    // Erstelle ein Datum für den ersten Tag des Monats
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    
    // Ermittle den Wochentag des ersten Tags (0 = Sonntag, 1 = Montag, usw.)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Berechne die Tage bis zum ersten Montag
    // Wenn der 1. ein Montag ist, dann 0 Tage, sonst (8 - Wochentag) % 7
    const daysUntilFirstMonday = firstDayOfWeek === 1 ? 0 : (8 - firstDayOfWeek) % 7;
    
    // Berechne das Datum des ersten Montags
    const firstMonday = 1 + daysUntilFirstMonday;
    
    // Berechne das Datum des zweiten Montags (7 Tage nach dem ersten)
    const secondMonday = firstMonday + 7;
    
    return new Date(Date.UTC(year, month, secondMonday));
  };
  
  // Format date for display
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };
  
  // Handle click outside to close dropdown - mit höherer Priorität
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
        setIsInputFocused(false); // Sicherstellen, dass der Fokus-Status zurückgesetzt wird
      }
    };
    
    // Capture-Phase für höhere Priorität verwenden
    document.addEventListener('mousedown', handleClickOutside, { capture: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, { capture: true });
    };
  }, []);
  
  // Funktion zur Umrechnung von Monaten in Datumsbereich
  const applyMonthSelection = () => {
    if (selectedMonths.length === 0) return;
    
    const now = new Date();
    let currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Bestimme das aktuelle Schuljahr
    let schoolStartYear = currentYear;
    if (currentMonth < 8) { // Wenn aktueller Monat vor September
      schoolStartYear = currentYear - 1;
    }
    
    // Sortiere die ausgewählten Monate nach ihrer Position im Schuljahr
    const sortedMonths = [...selectedMonths]
      .map(key => schoolYearMonths.find(m => m.key === key)!)
      .sort((a, b) => a.schoolYearIndex - b.schoolYearIndex);
    
    if (sortedMonths.length === 0) return;
    
    // Bestimme den ersten und letzten ausgewählten Monat
    const firstMonth = sortedMonths[0];
    const lastMonth = sortedMonths[sortedMonths.length - 1];
    
    // Berechne Start- und Enddatum
    // Korrekte Jahresberechnung für Start- und Enddatum
    const startYear = firstMonth.index < 8 ? schoolStartYear + 1 : schoolStartYear;
    const endYear = lastMonth.index < 8 ? schoolStartYear + 1 : schoolStartYear;
    
    let startDate;
    
    // Spezialbehandlung für September: Starte mit dem zweiten Montag
    if (firstMonth.key === 'sep') {
      startDate = getSecondMondayOfMonth(startYear, firstMonth.index);
    } else {
      // Für andere Monate: Erster Tag des Monats
      startDate = new Date(Date.UTC(startYear, firstMonth.index, 1, 0, 0, 0));
    }
    
    // Letzter Tag des letzten ausgewählten Monats
    // Trick: Tag 0 des nächsten Monats ist der letzte Tag des aktuellen Monats
    const endDate = new Date(Date.UTC(endYear, lastMonth.index + 1, 0, 23, 59, 59));
    
    // Debug-Ausgaben für besseres Verständnis
    console.log('Monatsauswahl:', {
      firstMonth: firstMonth.label,
      lastMonth: lastMonth.label,
      startYear,
      endYear,
      startDate: startDate.toLocaleDateString('de-DE'),
      endDate: endDate.toLocaleDateString('de-DE')
    });
    
    // Aktualisiere die Datumsangaben NUR für die Dashboard-Elemente
    // ISO-Format für die interne Speicherung (YYYY-MM-DD)
    onDashboardStartDateChange(startDate.toISOString().split('T')[0]);
    onDashboardEndDateChange(endDate.toISOString().split('T')[0]);
    
    // Schließe das Dropdown
    setIsDateDropdownOpen(false);
  };
  
  // Funktion zur Umrechnung eines einzelnen Monats in Datumsbereich
  // Ohne das Dropdown zu schließen für Mehrfachauswahl
  const selectSingleMonth = (monthKey: string) => {
    // Toggle-Logik: Monat hinzufügen oder entfernen
    setSelectedMonths(prev => {
      if (prev.includes(monthKey)) {
        return prev.filter(m => m !== monthKey);
      } else {
        return [...prev, monthKey];
      }
    });
  };
  
  // Korrigierte toggleAllMonths-Funktion
  const toggleAllMonths = () => {
    // Hole das aktuelle Schuljahr
    const schoolYear = getCurrentSchoolYear();
    
    if (selectedMonths.length === schoolYearMonths.length) {
      // Wenn alle ausgewählt sind, alle abwählen
      setSelectedMonths([]);
    } else {
      // Alle Monate auswählen
      setSelectedMonths(schoolYearMonths.map(m => m.key));
      
      // KORREKTUR: Verwende die bereits berechneten Start- und Enddaten direkt
      // statt neue Daten mit festen Werten zu erstellen
      const startDate = schoolYear.startDate;
      const endDate = schoolYear.endDate;
      
      // Format JJJJ-MM-TT für Eingabefelder (ISO-Format ohne Zeitanteil)
      const startFormatted = startDate.toISOString().split('T')[0];
      const endFormatted = endDate.toISOString().split('T')[0];
      
      // Debug-Ausgaben für besseres Verständnis
      console.log('Schuljahr-Auswahl:', {
        start: startDate.toLocaleDateString('de-DE'),
        end: endDate.toLocaleDateString('de-DE'),
        startISO: startDate.toISOString(),
        endISO: endDate.toISOString(),
        startFormatted,
        endFormatted
      });
      
      // Direkt das Schuljahr als Datumsbereich setzen
      onDashboardStartDateChange(startFormatted);
      onDashboardEndDateChange(endFormatted);
      
      // Dropdown schließen
      setIsDateDropdownOpen(false);
    }
  };
  
  // Timer für verzögertes Schließen bei Hover - mit stärkerer Persistenz
  const dropdownHoverTimer = useRef<NodeJS.Timeout | null>(null);
  const isMouseOverDropdown = useRef<boolean>(false);

  // Verbesserte Hilfsfunktionen für Hover-Effekt
  const handleMouseEnter = () => {
    isMouseOverDropdown.current = true;
    if (dropdownHoverTimer.current) {
      clearTimeout(dropdownHoverTimer.current);
      dropdownHoverTimer.current = null;
    }
    setIsDateDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    isMouseOverDropdown.current = false;
    if (!isInputFocused) {
      if (dropdownHoverTimer.current) {
        clearTimeout(dropdownHoverTimer.current);
      }
      dropdownHoverTimer.current = setTimeout(() => {
        // Nur schließen, wenn die Maus nicht wieder über dem Element ist
        if (!isMouseOverDropdown.current && !isInputFocused) {
          setIsDateDropdownOpen(false);
        }
      }, 400); // Leicht erhöhte Verzögerung für bessere Zuverlässigkeit
    }
  };
  
  // Neu: Handler für Fokus und Verlassen der Eingabefelder
  const handleInputFocus = () => {
    setIsInputFocused(true);
    // Bei Fokus eventuelle Timer löschen
    if (dropdownHoverTimer.current) {
      clearTimeout(dropdownHoverTimer.current);
      dropdownHoverTimer.current = null;
    }
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    // Wenn man das Eingabefeld verlässt und nicht über dem Dropdown ist, beginne zu schließen
    if (!isMouseOverDropdown.current) {
      dropdownHoverTimer.current = setTimeout(() => {
        setIsDateDropdownOpen(false);
      }, 300);
    }
  };

  // Sicherheitsmechanismus, um sicherzustellen, dass das Dropdown immer geschlossen wird
  useEffect(() => {
    const cleanupDropdown = () => {
      if (!isMouseOverDropdown.current && !isInputFocused) {
        setIsDateDropdownOpen(false);
      }
    };
    
    // Nach 500ms prüfen, ob das Dropdown geschlossen werden sollte
    const safetyTimer = setTimeout(cleanupDropdown, 500);
    
    return () => {
      clearTimeout(safetyTimer);
    };
  }, [isInputFocused]);

  return (
    <div 
      className={`relative ${className}`} 
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsDateDropdownOpen(!isDateDropdownOpen);
        }}
        className="flex items-center gap-1 px-3 py-1.5 bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark rounded text-chatGray-textLight dark:text-chatGray-textDark text-sm"
        title="Zeitraum auswählen"
      >
        <Calendar className="w-4 h-4 mr-1" />
        <span className="whitespace-nowrap">
          {formatDate(dashboardStartDate)} - {formatDate(dashboardEndDate)}
        </span>
        <ChevronDown className="w-4 h-4 ml-1" />
      </button>
      
      {isDateDropdownOpen && (
        <div 
          className="absolute top-full left-0 mt-1 z-50 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark border border-gray-200 dark:border-gray-600 rounded-md shadow-lg w-72 max-w-[300px]"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="p-3 space-y-3">
            {/* Schuljahr-Monate */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Schnellauswahl Monate</div>
              
              {/* Alle-Button */}
              <div className="mb-2">
                <button
                  className={`px-2 py-1 text-xs rounded w-full text-left ${
                    selectedMonths.length === schoolYearMonths.length
                      ? 'bg-header-btn-selected dark:bg-header-btn-selected-dark'
                      : 'bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark'
                  } text-chatGray-textLight dark:text-chatGray-textDark`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAllMonths();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  Alle
                </button>
              </div>
              
              {/* Monats-Grid - 4 Spalten für optimale Größe */}
              <div className="grid grid-cols-4 gap-1">
                {schoolYearMonths.map((month) => (
                  <button
                    key={month.key}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedMonths.includes(month.key)
                        ? 'bg-header-btn-selected dark:bg-header-btn-selected-dark'
                        : 'bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark'
                    } text-chatGray-textLight dark:text-chatGray-textDark`}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectSingleMonth(month.key);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {month.label}
                  </button>
                ))}
              </div>
              
              {/* Anwenden-Button für Monate */}
              <div className="pt-2">
                <button
                  className="w-full mt-1 px-2 py-1 bg-header-btn-selected dark:bg-header-btn-selected-dark text-chatGray-textLight dark:text-chatGray-textDark rounded text-xs hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark"
                  onClick={(e) => {
                    e.stopPropagation();
                    applyMonthSelection();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  disabled={selectedMonths.length === 0}
                >
                  Monate anwenden
                </button>
              </div>
            </div>
                      
            {/* Custom Date Range - mit korrigiertem Layout */}
            <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Benutzerdefiniert</div>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400">Startdatum</label>
                  <input
                    type="date"
                    value={dashboardStartDate}
                    onChange={(e) => onDashboardStartDateChange(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400">Enddatum</label>
                  <input
                    type="date"
                    value={dashboardEndDate}
                    onChange={(e) => onDashboardEndDateChange(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <button
                className="w-full mt-2 px-2 py-1 bg-header-btn-selected dark:bg-header-btn-selected-dark text-chatGray-textLight dark:text-chatGray-textDark rounded text-xs hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDateDropdownOpen(false);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                Anwenden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeButton;