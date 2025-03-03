import React, { useRef, useState, useEffect } from 'react';
import { Upload, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
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
  uploadTrigger: number;
  hasFileUploaded: boolean; // New prop to determine initial sidebar state
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
  uploadTrigger,
  hasFileUploaded,
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
  const [collapsed, setCollapsed] = useState(hasFileUploaded);
  // Pinned state: true = sidebar is fixed open, false = auto-hide behavior
  const [isPinned, setIsPinned] = useState(!hasFileUploaded);
  // Breite des Toggle-Buttons, die wir als minimalen Abstand nutzen, wenn die Sidebar verschwindet
  const toggleButtonWidth = 45; // px

  // Refs for hover detection
  const sidebarRef = useRef<HTMLDivElement>(null);
  const edgeDetectionRef = useRef<HTMLDivElement>(null);

  // Zum Messen der vollen Sidebar-Breite (nur wenn aufgeklappt)
  const exportRef = useRef<HTMLDivElement>(null);
  const [fullSidebarWidth, setFullSidebarWidth] = useState<number | null>(null);

  // Effect for measuring sidebar width and setting CSS variables
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

  // Handle hover behavior when not pinned
  useEffect(() => {
    if (isPinned) return; // Skip hover logic when sidebar is pinned

    const handleEdgeMouseEnter = () => {
      if (collapsed) {
        setCollapsed(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPinned && !collapsed) {
        const sidebarRect = sidebarRef.current?.getBoundingClientRect();
        if (sidebarRect && e.clientX > sidebarRect.right) {
          setCollapsed(true);
        }
      }
    };

    // Add event listeners
    const edgeElement = edgeDetectionRef.current;
    if (edgeElement) {
      edgeElement.addEventListener('mouseenter', handleEdgeMouseEnter);
    }

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (edgeElement) {
        edgeElement.removeEventListener('mouseenter', handleEdgeMouseEnter);
      }
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPinned, collapsed]);

  // Toggle pin function
  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  // Custom Pin Icon Component
  const PinIcon = ({ isPinned }: { isPinned: boolean }) => (
    <div className="relative">
      {isPinned ? (
        // Pfeil nach links mit vertikalem Strich
        <div className="relative">
          <ArrowLeft className="w-3 h-3" strokeWidth={1.0} />
          <div className="absolute right-0 top-0 h-full w-px bg-current opacity-100"></div>
        </div>
      ) : (
        // Pfeil nach rechts mit vertikalem Strich
        <div className="relative">
           <ArrowRight className="w-3 h-3" strokeWidth={1.0} />
           <div className="absolute left-0 top-0 h-full w-px bg-current opacity-100"></div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Invisible edge detection area - always present */}
      <div
        ref={edgeDetectionRef}
        className="fixed top-0 left-0 w-3 h-full z-20"
        style={{ opacity: 0 }}
      />

      {/* Toggle-Button – immer sichtbar, fixed links, mit korrektem Icon-Farbschema */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-30 p-2 rounded-full bg-sidebar-btn dark:bg-sidebar-btn-dark hover:bg-sidebar-btn-hover dark:hover:bg-sidebar-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark transition-colors"
        title={collapsed ? "Sidebar einblenden" : "Sidebar ausblenden"}
        style={{ height: "0px", width: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Sidebar-Inhalt nur rendern, wenn NICHT collapsed */}
      {!collapsed && (
        <aside
          ref={sidebarRef}
          className="fixed top-0 left-0 min-h-screen bg-chatGray-sidebarLight dark:bg-chatGray-sidebarDark p-4 overflow-y-auto transition-all duration-300"
          style={fullSidebarWidth ? { width: `${fullSidebarWidth}px` } : {}}
        >
          {/* Pin Button - Neu positioniert am rechten Rand der Sidebar */}
          <button
            onClick={togglePin}
            className="absolute right-4 z-30 p-1 rounded-sm bg-sidebar-btn dark:bg-sidebar-btn-dark hover:bg-sidebar-btn-hover dark:hover:bg-sidebar-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark transition-colors opacity-60 hover:opacity-100"
            title={isPinned ? "Sidebar nicht mehr fixieren" : "Sidebar fixieren"}
            style={{ top: "15px", height: "18px", width: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <PinIcon isPinned={isPinned} />
          </button>

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
              key={uploadTrigger}
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