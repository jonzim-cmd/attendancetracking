import React, { useRef, useState, useEffect } from 'react';
import { Upload, ChevronLeft, ChevronRight } from 'lucide-react';
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
    { value: '3', label: '3 Wochen' },
    { value: '4', label: '4 Wochen' },
    { value: '5', label: '5 Wochen' },
    { value: '6', label: '6 Wochen' },
    { value: '7', label: '7 Wochen' },
    { value: '8', label: '8 Wochen' },
  ];

  // false = Sidebar aufgeklappt, true = komplett eingeklappt (nicht im Layout enthalten)
  const [collapsed, setCollapsed] = useState(false);
  // Breite des Toggle-Buttons, die wir als minimalen Abstand nutzen, wenn die Sidebar verschwindet
  const toggleButtonWidth = 60; // px

  // Zum Messen der vollen Sidebar-Breite (nur wenn aufgeklappt)
  const exportRef = useRef<HTMLDivElement>(null);
  const [fullSidebarWidth, setFullSidebarWidth] = useState<number | null>(null);

  useEffect(() => {
    const measureWidth = () => {
      if (!collapsed) {
        if (exportRef.current) {
          const exportWidth = exportRef.current.offsetWidth;
          // p-4 entspricht ca. 16px pro Seite (insgesamt 32px)
          const totalWidth = exportWidth + 32;
          setFullSidebarWidth(totalWidth);
          document.documentElement.style.setProperty('--sidebar-width', `${totalWidth}px`);
          document.documentElement.style.setProperty('--header-padding-left', '0px');
        }
      } else {
        // Sidebar-Inhalt verschwindet – wir setzen die Breite auf 0
        setFullSidebarWidth(0);
        document.documentElement.style.setProperty('--sidebar-width', '0px');
        // Damit der Header-Inhalt nicht unter den Toggle-Button rutscht,
        // setzen wir ein padding-left in Höhe des Buttons.
        document.documentElement.style.setProperty('--header-padding-left', `${toggleButtonWidth}px`);
      }
    };

    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, [collapsed]);

  return (
    <>
      {/* Toggle-Button – immer sichtbar, fixed links, mit korrektem Icon-Farbschema */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-30 p-2 rounded-full bg-sidebar-btn dark:bg-sidebar-btn-dark hover:bg-sidebar-btn-hover dark:hover:bg-sidebar-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark transition-colors"
        title={collapsed ? "Sidebar einblenden" : "Sidebar ausblenden"}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Sidebar-Inhalt nur rendern, wenn NICHT collapsed */}
      {!collapsed && (
        <aside
          className="fixed top-0 left-0 min-h-screen bg-chatGray-sidebarLight dark:bg-chatGray-sidebarDark p-4 overflow-y-auto transition-all duration-300"
          style={fullSidebarWidth ? { width: `${fullSidebarWidth}px` } : {}}
        >
          {/* Datei hochladen */}
          <div className="mb-6 mt-10">
            <label
              htmlFor="file-upload"
              className="flex items-center gap-2 cursor-pointer bg-sidebar-btn dark:bg-sidebar-btn-dark text-chatGray-textLight dark:text-chatGray-textDark px-2 py-1 rounded-md hover:bg-sidebar-btn-hover dark:hover:bg-sidebar-btn-hover-dark transition-colors justify-center text-xs"
              title="Anwesenheitsdaten importieren - CSV oder Excel-Datei mit Schülerdaten hochladen"
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
              className="mt-1 w-full rounded px-2 py-1 bg-sidebar-btn-dropdown dark:bg-sidebar-btn-dropdown-dark hover:bg-sidebar-btn-dropdown-hover dark:hover:bg-sidebar-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm"
              title="Startdatum des Analysezeitraums auswählen"
            />
            <label className="block text-xs text-gray-600 dark:text-gray-400 mt-2">Enddatum</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="mt-1 w-full rounded px-2 py-1 bg-sidebar-btn-dropdown dark:bg-sidebar-btn-dropdown-dark hover:bg-sidebar-btn-dropdown-hover dark:hover:bg-sidebar-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm"
              title="Enddatum des Analysezeitraums auswählen"
            />
            <label className="block text-xs text-gray-600 dark:text-gray-400 mt-2">Schnellauswahl</label>
            <select
              onChange={(e) => onQuickSelect(e.target.value)}
              className="mt-1 w-full rounded px-2 py-1 bg-sidebar-btn-dropdown dark:bg-sidebar-btn-dropdown-dark hover:bg-sidebar-btn-dropdown-hover dark:hover:bg-sidebar-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm"
              title="Vordefinierte Zeiträume für schnelle Auswahl"
            >
              <option value="">Auswählen</option>
              {quickSelectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {/* Wochen zurück - Jetzt in den Zeitraum-Bereich integriert */}
            <label className="block text-xs text-gray-600 dark:text-gray-400 mt-2">Wochen zurück</label>
            <select
              value={selectedWeeks}
              onChange={(e) => onSelectedWeeksChange(e.target.value)}
              className="mt-1 w-full rounded px-2 py-1 bg-sidebar-btn-dropdown dark:bg-sidebar-btn-dropdown-dark hover:bg-sidebar-btn-dropdown-hover dark:hover:bg-sidebar-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm"
              title="Anzahl der Wochen für die wöchentliche Statistikberechnung auswählen"
            >
              {weekOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export – hier messen wir die Breite - mit mehr Abstand zum vorigen Bereich */}
          <div className="mb-6 mt-8" ref={exportRef}>
            <h3 className="text-sm font-medium text-chatGray-textLight dark:text-chatGray-textDark mb-2">Export</h3>
            <div className="flex gap-2">
              <button
                onClick={onExportExcel}
                className="bg-sidebar-btn dark:bg-sidebar-btn-dark text-chatGray-textLight dark:text-chatGray-textDark px-2 py-1 rounded-md hover:bg-sidebar-btn-hover dark:hover:bg-sidebar-btn-hover-dark transition-colors text-xs"
                title="Daten als Excel-Datei exportieren - Mit Details für ausgewählte Schüler"
              >
                XLS
              </button>
              <button
                onClick={onExportCSV}
                className="bg-sidebar-btn dark:bg-sidebar-btn-dark text-chatGray-textLight dark:text-chatGray-textDark px-2 py-1 rounded-md hover:bg-sidebar-btn-hover dark:hover:bg-sidebar-btn-hover-dark transition-colors text-xs"
                title="Daten als CSV-Datei exportieren - Mit Details für ausgewählte Schüler"
              >
                CSV
              </button>
              <button
                onClick={onExportPDF}
                className="bg-sidebar-btn dark:bg-sidebar-btn-dark text-chatGray-textLight dark:text-chatGray-textDark px-2 py-1 rounded-md hover:bg-sidebar-btn-hover dark:hover:bg-sidebar-btn-hover-dark transition-colors text-xs"
                title="Daten als PDF-Datei exportieren - Mit Details für ausgewählte Schüler"
              >
                PDF
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
};

export default Sidebar;