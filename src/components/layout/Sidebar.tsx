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
  hasFileUploaded: boolean;
  quickSelectValue: string;
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
  quickSelectValue,
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

  // Zustandsverwaltung für die Sidebar
  const [collapsed, setCollapsed] = useState(hasFileUploaded);
  const [isPinned, setIsPinned] = useState(!hasFileUploaded);
  const [userPinned, setUserPinned] = useState(false);
  const toggleButtonWidth = 45; // px

  // Refs für DOM-Elemente
  const sidebarRef = useRef<HTMLDivElement>(null);
  const edgeDetectionRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [fullSidebarWidth, setFullSidebarWidth] = useState<number | null>(null);
  
  // Verarbeite den eigentlichen Datei-Upload mit direkter Reaktion
  const handleFileUpload = (data: any) => {
    // Rufe die übergebene onFileUpload-Funktion auf
    onFileUpload(data);
    
    // Reagiere sofort auf den Datei-Upload, wenn der Benutzer nicht manuell gepinnt hat
    if (!userPinned) {
      setIsPinned(false);
    }
  };

  // Ein einzelner kombinierter useEffect für die hasFileUploaded-Änderungen
  useEffect(() => {
    // Wenn der Benutzer nicht manuell gepinnt hat, aktualisiere den Pin-Status
    if (!userPinned) {
      setIsPinned(!hasFileUploaded);
    }
    
    // Wenn die Datei zurückgesetzt wurde, stellen wir sicher, dass die Sidebar sichtbar ist
    if (!hasFileUploaded) {
      setUserPinned(false);
      setCollapsed(false);
    }
  }, [hasFileUploaded, userPinned]);

  // Sidebar-Breite messen und CSS-Variablen setzen - Optimiert
  useEffect(() => {
    const measureWidth = () => {
      // Immer die Breite messen, unabhängig vom Collapsed-Status
      if (exportRef.current) {
        const exportWidth = exportRef.current.offsetWidth;
        const totalWidth = exportWidth + 32;
        setFullSidebarWidth(totalWidth);
        
        // CSS-Variablen nur einmal pro Collapsed-Status-Änderung aktualisieren
        requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--sidebar-width', collapsed ? '0px' : `${totalWidth}px`);
          document.documentElement.style.setProperty('--header-padding-left', collapsed ? `${toggleButtonWidth}px` : '0px');
        });
      }
    };

    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, [collapsed, toggleButtonWidth]);

  // Hover-Verhalten nur verwalten, wenn die Sidebar nicht gepinnt ist
  useEffect(() => {
    if (isPinned) return;

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

  // Toggle-Funktionen
  const togglePin = () => {
    setIsPinned(!isPinned);
    setUserPinned(true);
  };

  // Custom Pin Icon Component
  const PinIcon = ({ isPinned }: { isPinned: boolean }) => (
    <div className="relative">
      {isPinned ? (
        <div className="relative">
          <ArrowLeft className="w-3 h-3" strokeWidth={1.0} />
          <div className="absolute right-0 top-0 h-full w-px bg-current opacity-100"></div>
        </div>
      ) : (
        <div className="relative">
           <ArrowRight className="w-3 h-3" strokeWidth={1.0} />
           <div className="absolute left-0 top-0 h-full w-px bg-current opacity-100"></div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Unsichtbarer Randbereich für Hover-Erkennung */}
      <div
        ref={edgeDetectionRef}
        className="fixed top-0 left-0 w-3 h-full z-20"
        style={{ opacity: 0 }}
      />

      {/* Toggle-Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-30 p-2 rounded-full bg-sidebar-btn dark:bg-sidebar-btn-dark hover:bg-sidebar-btn-hover dark:hover:bg-sidebar-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark transition-colors"
        title={collapsed ? "Sidebar einblenden" : "Sidebar ausblenden"}
        style={{ height: "0px", width: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Sidebar-Inhalt - immer im DOM, aber mit animierter Transformation */}
      <aside
        ref={sidebarRef}
        className="fixed top-0 left-0 min-h-screen bg-chatGray-sidebarLight dark:bg-chatGray-sidebarDark p-4 overflow-y-auto transition-all duration-300 z-20"
        style={{
          transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
          width: fullSidebarWidth ? `${fullSidebarWidth}px` : 'auto',
          opacity: collapsed ? 0 : 1,
          pointerEvents: collapsed ? 'none' : 'auto',
          visibility: collapsed ? 'hidden' : 'visible',
          transitionProperty: 'transform, opacity, visibility'
        }}
      >
        {/* Pin-Button */}
        <button
          onClick={togglePin}
          className="absolute right-4 z-30 p-1 rounded-sm bg-sidebar-btn dark:bg-sidebar-btn-dark hover:bg-sidebar-btn-hover dark:hover:bg-sidebar-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark transition-colors opacity-60 hover:opacity-100"
          title={isPinned ? "Sidebar nicht mehr fixieren" : "Sidebar fixieren"}
          style={{ top: "15px", height: "18px", width: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <PinIcon isPinned={isPinned} />
        </button>

        {/* Upload-Bereich */}
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
            onFileProcessed={handleFileUpload} // Verwende die eigene Wrapper-Funktion
            startDate={startDate}
            endDate={endDate}
            setError={console.error}
          />
        </div>

        {/* Zeitraum-Bereich */}
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
            value={quickSelectValue}
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
          
          {/* Wochen-Zurück-Bereich */}
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

        {/* Export-Bereich */}
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
    </>
  );
};

export default Sidebar;