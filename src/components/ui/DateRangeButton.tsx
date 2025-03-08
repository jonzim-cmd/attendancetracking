// src/components/ui/DateRangeButton.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface QuickSelectOption {
  value: string;
  label: string;
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
  
  // Quick select options
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
  
  // Apply quick select
  const applyQuickSelect = (value: string) => {
    handleQuickSelect(value);
    setIsDateDropdownOpen(false);
  };
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
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
        <div className="absolute top-full left-0 mt-1 z-50 bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark border border-gray-200 dark:border-gray-600 rounded-md shadow-lg w-64">
          <div className="p-3 space-y-3">
            {/* Quick Selection Options */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Schnellauswahl</div>
              <div className="grid grid-cols-2 gap-1">
                {quickSelectOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`px-2 py-1 text-xs rounded ${
                      quickSelectValue === option.value 
                        ? 'bg-header-btn-selected dark:bg-header-btn-selected-dark' 
                        : 'bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark'
                    } text-chatGray-textLight dark:text-chatGray-textDark`}
                    onClick={() => applyQuickSelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Custom Date Range */}
            <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Benutzerdefiniert</div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="date"
                  value={dashboardStartDate}
                  onChange={(e) => onDashboardStartDateChange(e.target.value)}
                  className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs"
                />
                <span className="mx-1 text-chatGray-textLight dark:text-chatGray-textDark">-</span>
                <input
                  type="date"
                  value={dashboardEndDate}
                  onChange={(e) => onDashboardEndDateChange(e.target.value)}
                  className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs"
                />
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