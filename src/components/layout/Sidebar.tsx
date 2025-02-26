import React, { useRef, useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import FileUploadHandler from '@/components/attendance/FileUploadHandler';

interface SidebarProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onQuickSelect: (value: string) => void;
  selectedWeeks: string;
  onSelectedWeeksChange: (value: string) => void;
  onFileUpload: (data: any) => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onQuickSelect,
  selectedWeeks,
  onSelectedWeeksChange,
  onFileUpload,
  onExportExcel,
  onExportCSV,
  onExportPDF,
}) => {
  const quickSelectOptions = [
    { value: 'thisWeek', label: 'Diese Woche' },
    { value: 'lastWeek', label: 'Letzte Woche' },
    { value: 'lastTwoWeeks', label: 'Letzte 2 Wochen' },
    { value: 'thisMonth', label: 'Dieser Monat' },
    { value: 'lastMonth', label: 'Letzter Monat' },
    { value: 'schoolYear', label: 'Schuljahr' },
  ];

  const weekOptions = [
    { value: '1', label: '1 Woche' },
    { value: '2', label: '2 Wochen' },
    { value: '4', label: '4 Wochen' },
    { value: '6', label: '6 Wochen' },
    { value: '8', label: '8 Wochen' },
  ];

  // Messen der Export-Buttons, um die Sidebar-Breite dynamisch zu bestimmen
  const exportRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);

  useEffect(() => {
    const measureWidth = () => {
      if (exportRef.current) {
        const exportWidth = exportRef.current.offsetWidth;
        // Sidebar-Padding: p-4 entspricht ca. 16px pro Seite
        const totalWidth = exportWidth + 32;
        setSidebarWidth(totalWidth);
        // CSS-Variable für Header und MainContent
        document.documentElement.style.setProperty('--sidebar-width', `${totalWidth}px`);
      }
    };

    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, []);

  return (
    <aside
      className="fixed top-0 left-0 min-h-screen bg-chatGray-sidebarLight dark:bg-chatGray-sidebarDark p-4 overflow-y-auto"
      style={sidebarWidth ? { width: `${sidebarWidth}px` } : {}}
    >
      {/* Datei hochladen */}
      <div className="mb-6">
        <label
          htmlFor="file-upload"
          className="flex items-center gap-2 cursor-pointer bg-chatGray-button text-chatGray-textDark px-2 py-1 rounded-md hover:bg-chatGray-hover transition-colors justify-center text-xs"
          title="Excel-Datei hochladen"
        >
          <Upload className="w-4 h-4" />
          <span>Datei hochladen</span>
        </label>
        <FileUploadHandler
          onFileProcessed={onFileUpload}
          startDate={startDate}
          endDate={endDate}
          setError={console.error}
        />
      </div>

      {/* Zeitraum */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-chatGray-textLight dark:text-chatGray-textDark mb-2">Zeitraum</h3>
        <label className="block text-xs text-gray-600 dark:text-gray-400">Startdatum</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="mt-1 w-full dark:system-ui rounded px-2 py-1 bg-chatGray-light dark:bg-chatGray-button text-chatGray-textLight dark:text-chatGray-textDark text-sm"
        />
        <label className="block text-xs text-gray-600 dark:text-gray-400 mt-2">Enddatum</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="mt-1 w-full rounded px-2 py-1 bg-chatGray-light dark:bg-chatGray-button text-chatGray-textLight dark:text-chatGray-textDark text-sm"
        />
        <label className="block text-xs text-gray-600 dark:text-gray-400 mt-2">Schnellauswahl</label>
        <select
          onChange={(e) => onQuickSelect(e.target.value)}
          className="mt-1 w-full rounded px-2 py-1 bg-chatGray-light dark:bg-chatGray-button text-chatGray-textLight dark:text-chatGray-textDark text-sm"
        >
          <option value="">-- Auswählen --</option>
          {quickSelectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Statistik */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-chatGray-textLight dark:text-chatGray-textDark mb-2">Statistik</h3>
        <label className="block text-xs text-gray-600 dark:text-gray-400">Wochen zurück</label>
        <select
          value={selectedWeeks}
          onChange={(e) => onSelectedWeeksChange(e.target.value)}
          className="mt-1 w-full rounded px-2 py-1 bg-chatGray-light dark:bg-chatGray-button text-chatGray-textLight dark:text-chatGray-textDark text-sm"
        >
          {weekOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Export – hier messen wir die Breite */}
      <div className="mb-6" ref={exportRef}>
        <h3 className="text-sm font-medium text-chatGray-textLight dark:text-chatGray-textDark mb-2">Export</h3>
        <div className="flex gap-2">
          <button
            onClick={onExportExcel}
            className="bg-chatGray-button text-chatGray-textDark px-2 py-1 rounded-md hover:bg-chatGray-hover transition-colors text-xs"
            title="Als Excel exportieren"
          >
            XLS
          </button>
          <button
            onClick={onExportCSV}
            className="bg-chatGray-button text-chatGray-textDark px-2 py-1 rounded-md hover:bg-chatGray-hover transition-colors text-xs"
            title="Als CSV exportieren"
          >
            CSV
          </button>
          <button
            onClick={onExportPDF}
            className="bg-chatGray-button text-chatGray-textDark px-2 py-1 rounded-md hover:bg-chatGray-hover transition-colors text-xs"
            title="Als PDF exportieren"
          >
            PDF
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
