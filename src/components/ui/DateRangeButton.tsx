// src/components/ui/DateRangeButton.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { getCurrentSchoolYear } from '@/lib/attendance-utils';

interface QuickSelectOption {
  value: string;
  label: string;
}

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
  quickSelectValue,
  className = ''
}) => {
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // State für ausgewählte Monate
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  
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
  
  // Die originalen Quick-Select-Optionen behalten wir für Kompatibilität
  const quickSelectOptions: QuickSelectOption[] = [
    { value: 'thisWeek', label: 'Diese Woche' },
    { value: 'lastWeek', label: 'Letzte Woche' },
    { value: 'lastTwoWeeks', label: 'Letzte 2 Wochen' },
    { value: 'thisMonth', label: 'Dieser Monat' },
    { value: 'lastMonth', label: 'Letzter Monat' },
    { value: 'schoolYear', label: 'Schuljahr' },
  ];
  
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
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
    
    // Erstelle die Datum-Objekte (WICHTIG: Zur besseren Lesbarkeit getrennt)
    // Erster Tag des ersten ausgewählten Monats
    const startDate = new Date(startYear, firstMonth.index, 1);
    
    // Letzter Tag des letzten ausgewählten Monats
    // Trick: Tag 0 des nächsten Monats ist der letzte Tag des aktuellen Monats
    const endDate = new Date(endYear, lastMonth.index + 1, 0);
    
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
  const selectSingleMonth = (monthKey: string) => {
    const month = schoolYearMonths.find(m => m.key === monthKey);
    if (!month) return;
    
    const now = new Date();
    let currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Bestimme das aktuelle Schuljahr
    let schoolStartYear = currentYear;
    if (currentMonth < 8) { // Wenn aktueller Monat vor September
      schoolStartYear = currentYear - 1;
    }
    
    // Berechne Start- und Enddatum für einen einzelnen Monat
    const monthYear = month.index < 8 ? schoolStartYear + 1 : schoolStartYear;
    
    // Erstelle die Datum-Objekte mit korrekten Stunden/Minuten/Sekunden
    const startDate = new Date(monthYear, month.index, 1);
    startDate.setHours(0, 0, 0, 0); // Anfang des Tages
    
    const endDate = new Date(monthYear, month.index + 1, 0);
    endDate.setHours(23, 59, 59, 999); // Ende des Tages
    
    // Debug-Ausgabe
    console.log(`Einzelmonat ${month.label}:`, {
      startDate: startDate.toLocaleDateString('de-DE'),
      endDate: endDate.toLocaleDateString('de-DE'),
      startISO: startDate.toISOString(),
      endISO: endDate.toISOString()
    });
    
    // Wähle nur diesen einen Monat aus
    setSelectedMonths([monthKey]);
    
    // Format JJJJ-MM-TT für Eingabefelder (ISO-Format ohne Zeitanteil)
    const startFormatted = startDate.toISOString().split('T')[0];
    const endFormatted = endDate.toISOString().split('T')[0];
    
    // Aktualisiere die Datumsangaben
    onDashboardStartDateChange(startFormatted);
    onDashboardEndDateChange(endFormatted);
    
    // Schließe das Dropdown
    setIsDateDropdownOpen(false);
  };
  
  // Toggle für alle Monate - setzt direkt das Schuljahr als Datum
  const toggleAllMonths = () => {
    // Hole das aktuelle Schuljahr
    const schoolYear = getCurrentSchoolYear();
    
    if (selectedMonths.length === schoolYearMonths.length) {
      // Wenn alle ausgewählt sind, alle abwählen
      setSelectedMonths([]);
    } else {
      // Alle Monate auswählen
      setSelectedMonths(schoolYearMonths.map(m => m.key));
      
      // Explizite Zeitangaben hinzufügen für korrekte Datumsberechnung
      const startDate = new Date(schoolYear.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(schoolYear.endDate);
      endDate.setHours(23, 59, 59, 999);
      
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
  
  // Original quick select handler - behalten wir für Kompatibilität
  const applyQuickSelect = (value: string) => {
    handleQuickSelect(value);
    setIsDateDropdownOpen(false);
  };
  
  // Timer für verzögertes Schließen bei Hover
  const dropdownHoverTimer = useRef<NodeJS.Timeout | null>(null);

  // Hilfsfunktionen für Hover-Effekt
  const handleMouseEnter = () => {
    if (dropdownHoverTimer.current) {
      clearTimeout(dropdownHoverTimer.current);
      dropdownHoverTimer.current = null;
    }
    setIsDateDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownHoverTimer.current = setTimeout(() => {
      setIsDateDropdownOpen(false);
    }, 300); // Verzögerung zum Schließen
  };
  
  return (
    <div 
      className={`relative ${className}`} 
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
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
        <div className="absolute top-full left-0 mt-1 z-50 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark border border-gray-200 dark:border-gray-600 rounded-md shadow-lg w-72 max-w-[300px]">
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
                  onClick={toggleAllMonths}
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
                    onClick={() => selectSingleMonth(month.key)}
                  >
                    {month.label}
                  </button>
                ))}
              </div>
              
              {/* Anwenden-Button für Monate */}
              <div className="pt-2">
                <button
                  className="w-full mt-1 px-2 py-1 bg-header-btn-selected dark:bg-header-btn-selected-dark text-chatGray-textLight dark:text-chatGray-textDark rounded text-xs hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark"
                  onClick={applyMonthSelection}
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
                    className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400">Enddatum</label>
                  <input
                    type="date"
                    value={dashboardEndDate}
                    onChange={(e) => onDashboardEndDateChange(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs"
                  />
                </div>
              </div>
              <button
                className="w-full mt-2 px-2 py-1 bg-header-btn-selected dark:bg-header-btn-selected-dark text-chatGray-textLight dark:text-chatGray-textDark rounded text-xs hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark"
                onClick={() => setIsDateDropdownOpen(false)}
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