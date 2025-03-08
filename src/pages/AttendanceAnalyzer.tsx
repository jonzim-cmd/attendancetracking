import React, { useState, useEffect } from 'react';
import HeaderBar from '@/components/layout/HeaderBar';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import { exportToExcel, exportToCSV, exportToPDF } from '@/components/attendance/ExportButtons';
import { processData, calculateSchoolYearStats, calculateWeeklyStats } from '@/lib/attendance-utils';
import { ProcessedData, StudentStats } from '@/types';
import { FilterProvider, useFilters } from '@/contexts/FilterContext';
import { getCurrentSchoolYear } from '@/lib/attendance-utils';


const AttendanceAnalyzer: React.FC = () => {
  const [rawData, setRawData] = useState<any>(null);
  const [results, setResults] = useState<Record<string, StudentStats> | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // Dashboard-spezifische Datumsfilter hinzufügen
  const [dashboardStartDate, setDashboardStartDate] = useState('');
  const [dashboardEndDate, setDashboardEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [detailedData, setDetailedData] = useState<Record<string, any>>({});
  const [schoolYearDetailedData, setSchoolYearDetailedData] = useState<Record<string, any>>({});
  const [filterUnexcusedLate, setFilterUnexcusedLate] = useState(false);
  const [filterUnexcusedAbsent, setFilterUnexcusedAbsent] = useState(false);
  const [minUnexcusedLates, setMinUnexcusedLates] = useState('');
  const [minUnexcusedAbsences, setMinUnexcusedAbsences] = useState('');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedWeeks, setSelectedWeeks] = useState('4');
  const [schoolYearStats, setSchoolYearStats] = useState<Record<string, any>>({});
  const [weeklyStats, setWeeklyStats] = useState<Record<string, any>>({});
  const [weeklyDetailedData, setWeeklyDetailedData] = useState<Record<string, any>>({});
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Map<string, string>>(new Map());
  // State zum Verfolgen von Datei-Uploads
  const [uploadTrigger, setUploadTrigger] = useState<number>(0);
  // Neue State-Variable für Datei-Upload-Status
  const [hasFileUploaded, setHasFileUploaded] = useState(false);
  // Neuer State für Schnellauswahl
  const [quickSelectValue, setQuickSelectValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const schoolYear = getCurrentSchoolYear();
  
  // Aktualisierte visibleColumns-Struktur für feingranularere Kontrolle
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['basic', 'verspaetungen', 'fehlzeiten', 'stats']);
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Neuer State für Dashboard-Ansicht
  const [viewMode, setViewMode] = useState<'table' | 'dashboard'>('table');
  const [resetTriggerId, setResetTriggerId] = useState(0);

  // Neue State-Variablen für Summenzeile
  const [enableSummaryRow, setEnableSummaryRow] = useState(true);
  const [summaryRowSticky, setSummaryRowSticky] = useState(true);

  // Neuer useEffect für document-level dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-chatGray-dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-chatGray-dark');
      document.body.classList.add('bg-chatGray-light');
    }
    return () => {
      document.body.classList.remove('bg-chatGray-light', 'bg-chatGray-dark');
    };
  }, [isDarkMode]);

  // Initialisiere Dashboard-Datumsfilter mit Schuljahr, wenn zur Dashboard-Ansicht gewechselt wird
  useEffect(() => {
    if (viewMode === 'dashboard' && (!dashboardStartDate || !dashboardEndDate)) {
      setDashboardStartDate(schoolYear.startDate.toISOString().split('T')[0]);
      setDashboardEndDate(schoolYear.endDate.toISOString().split('T')[0]);
    }
  }, [viewMode, dashboardStartDate, dashboardEndDate, schoolYear]);

  // Neue Funktion zum Umschalten der Spaltengruppen
  const toggleColumnGroup = (columnGroup: string) => {
    setVisibleColumns(prev => {
      if (prev.includes(columnGroup)) {
        return prev.filter(col => col !== columnGroup);
      } else {
        return [...prev, columnGroup];
      }
    });
  };
  
  // Funktion zum Schließen aller Details
  const closeAllDetails = () => {
    setExpandedStudents(new Set());
    setActiveFilters(new Map());
  };

  const resetAll = () => {
    setRawData(null);
    setResults(null);
    setHasFileUploaded(false); // Reset file upload status
    
    setSearchQuery('');
    setError('');
    setDetailedData({});
    setSchoolYearDetailedData({});
    setFilterUnexcusedLate(false);
    setFilterUnexcusedAbsent(false);
    setMinUnexcusedLates('');
    setMinUnexcusedAbsences('');
    setAvailableClasses([]);
    setSelectedClasses([]);
    setSelectedWeeks('4');
    setSchoolYearStats({});
    setWeeklyStats({});
    setWeeklyDetailedData({});
    setExpandedStudents(new Set());
    setActiveFilters(new Map());
    setVisibleColumns(['basic', 'verspaetungen', 'fehlzeiten', 'stats']);
    setViewMode('table'); // Zurück zur Tabellenansicht
    
    // Set default QuickSelect to "thisMonth" (instead of empty string)
    setQuickSelectValue('thisMonth');
    // Call handleQuickSelect to properly set dates based on the current month
    handleQuickSelect('thisMonth');
    
    // Reset dashboard date filters directly as they're independent
    setDashboardStartDate('');
    setDashboardEndDate('');
    
    // Trigger reset in the FilterContext
    setResetTriggerId(prev => prev + 1);
    
    // Trigger hochzählen um einen neuen Upload-Zyklus zu starten
    setUploadTrigger(prev => prev + 1);
  };

  const handleFileProcessed = (data: any) => {
    setRawData(data);
    setHasFileUploaded(true); // Set file upload status
    // Trigger erhöhen, um sicherzustellen, dass die Effekte neu ausgeführt werden
    setUploadTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (rawData && startDate && endDate) {
      const startDateTime = new Date(startDate + 'T00:00:00');
      const endDateTime = new Date(endDate + 'T23:59:59');
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        setError('Ungültiges Datum');
        return;
      }
      if (startDateTime > endDateTime) {
        setError('Das Startdatum muss vor dem Enddatum liegen');
        return;
      }
      const processed: ProcessedData = processData(rawData, startDateTime, endDateTime);
      setResults(processed.studentStats);
      setDetailedData(processed.detailedStats);
      setSchoolYearDetailedData(processed.schoolYearDetails);
      setWeeklyDetailedData(processed.weeklyDetails);
      const classes = new Set<string>();
      rawData.forEach((row: any) => {
        if (row.Klasse) classes.add(row.Klasse);
      });
      setAvailableClasses(Array.from(classes).sort());
      setError('');
    }
  }, [rawData, startDate, endDate, uploadTrigger]); // uploadTrigger als Abhängigkeit hinzugefügt

  useEffect(() => {
    // Nur ausführen, wenn die Datumsfelder leer sind und die Initialisierung noch nicht erfolgt ist
    if ((!startDate || !endDate) && !isInitialized) {
      // Als initialisiert markieren
      setIsInitialized(true);
      
      // Einfach die Schnellauswahl "Diesen Monat" verwenden
      handleQuickSelect('thisMonth');
      setQuickSelectValue('thisMonth');
    }
  }, [startDate, endDate, isInitialized]);

  useEffect(() => {
    if (rawData) {
      setSchoolYearStats(calculateSchoolYearStats(rawData));
      setWeeklyStats(calculateWeeklyStats(rawData, selectedWeeks));
    }
  }, [rawData, selectedWeeks, uploadTrigger]); // uploadTrigger als Abhängigkeit hinzugefügt

  useEffect(() => {
    // Es ist nicht nötig, den gesamten results-Zustand neu zu setzen
    // Das Filtern passiert bereits in getFilteredStudents()
    // Dieser Effect könnte für andere Aktionen genutzt werden, die
    // spezifisch bei Klassenänderungen notwendig sind
  }, [selectedClasses]);

  // Diese Funktion sollte für die Integration mit dem neuen AttendanceAnalyzerContent als Wrapper dienen
  const getFilteredStudents = (): [string, StudentStats][] => {
    if (!results) return [];
    return Object.entries(results)
      .filter(([student, stats]: [string, StudentStats]) => {
        const matchesSearch = student.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesClass = selectedClasses.length === 0 || selectedClasses.includes(stats.klasse);
        let meetsUnexcusedCriteria = true;
        if (filterUnexcusedLate || filterUnexcusedAbsent) {
          meetsUnexcusedCriteria = false;
          if (filterUnexcusedLate && stats.verspaetungen_unentsch > 0) meetsUnexcusedCriteria = true;
          if (filterUnexcusedAbsent && stats.fehlzeiten_unentsch > 0) meetsUnexcusedCriteria = true;
        }
        const meetsMinUnexcusedLates =
          minUnexcusedLates === '' || stats.verspaetungen_unentsch >= parseInt(minUnexcusedLates);
        const meetsMinUnexcusedAbsences =
          minUnexcusedAbsences === '' || stats.fehlzeiten_unentsch >= parseInt(minUnexcusedAbsences);
        return (
          matchesSearch &&
          matchesClass &&
          meetsUnexcusedCriteria &&
          meetsMinUnexcusedLates &&
          meetsMinUnexcusedAbsences
        );
      })
      .sort(([a], [b]) => a.localeCompare(b));
  };

  // Neue Version der handleQuickSelect-Funktion:
   // Korrigierte handleQuickSelect-Funktion für die Sidebar
   const handleQuickSelect = (value: string) => {
    // Update des quickSelectValue
    setQuickSelectValue(value);
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let startDate: Date, endDate: Date;
    
    switch (value) {
      case 'thisWeek': {
        // Berechne den aktuellen Montag (Wochenanfang)
        const currentDay = now.getDay(); // 0 = Sonntag, 1 = Montag, ...
        const diff = currentDay === 0 ? 6 : currentDay - 1; // Wie viele Tage bis zum letzten Montag
        
        // Erzeuge UTC-Datum für Montag 00:00:00
        startDate = new Date(Date.UTC(
          now.getFullYear(), 
          now.getMonth(), 
          now.getDate() - diff, 
          0, 0, 0
        ));
        
        // Erzeuge UTC-Datum für Sonntag 23:59:59 (6 Tage später)
        endDate = new Date(Date.UTC(
          startDate.getUTCFullYear(), 
          startDate.getUTCMonth(), 
          startDate.getUTCDate() + 6, 
          23, 59, 59
        ));
        break;
      }
      case 'lastWeek': {
        // Montag der letzten Woche = (aktueller Montag - 7 Tage)
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const diffToLastMonday = diffToMonday + 7;
        
        // Erzeuge UTC-Datum für Montag der letzten Woche 00:00:00
        startDate = new Date(Date.UTC(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - diffToLastMonday,
          0, 0, 0
        ));
        
        // Erzeuge UTC-Datum für Sonntag der letzten Woche 23:59:59
        endDate = new Date(Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth(),
          startDate.getUTCDate() + 6,
          23, 59, 59
        ));
        break;
      }
      case 'lastTwoWeeks': {
        // Montag der vorletzten Woche = (aktueller Montag - 14 Tage)
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const diffToTwoWeeksAgoMonday = diffToMonday + 14;
        
        // Erzeuge UTC-Datum für Montag vor zwei Wochen 00:00:00
        startDate = new Date(Date.UTC(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - diffToTwoWeeksAgoMonday,
          0, 0, 0
        ));
        
        // Erzeuge UTC-Datum für Sonntag letzte Woche 23:59:59 (13 Tage später)
        endDate = new Date(Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth(),
          startDate.getUTCDate() + 13,
          23, 59, 59
        ));
        break;
      }
      case 'thisMonth': {
        // Erster Tag des aktuellen Monats mit UTC-Zeit 00:00:00
        startDate = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0));
        
        // Letzter Tag des aktuellen Monats mit UTC-Zeit 23:59:59
        endDate = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59));
        break;
      }
      case 'lastMonth': {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        // Erster Tag des letzten Monats mit UTC-Zeit 00:00:00
        startDate = new Date(Date.UTC(yearOfLastMonth, lastMonth, 1, 0, 0, 0));
        
        // Letzter Tag des letzten Monats mit UTC-Zeit 23:59:59
        endDate = new Date(Date.UTC(yearOfLastMonth, lastMonth + 1, 0, 23, 59, 59));
        break;
      }
      case 'schoolYear': {    
        // Das Schuljahr holen
        const schoolYear = getCurrentSchoolYear();
        
        // Korrektes UTC-Datum für den Schuljahres-Start
        startDate = new Date(Date.UTC(
          parseInt(schoolYear.start),
          8, // September (0-basiert: 8)
          1, // Erster Tag
          0, 0, 0 // 00:00:00 Uhr
        ));
        
        // Korrektes UTC-Datum für das Schuljahres-Ende
        endDate = new Date(Date.UTC(
          parseInt(schoolYear.end), 
          6, // Juli (0-basiert: 6) 
          31, // Letzter Tag im Juli
          23, 59, 59 // 23:59:59 Uhr
        ));
        break;
      }
      default:
        return;
    }
    
    // ISO-Strings für die Datumseingabefelder (YYYY-MM-DD)
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    
    console.log(`Sidebar Quick Select (${value}):`, {
      start: startDate.toLocaleDateString('de-DE'),
      end: endDate.toLocaleDateString('de-DE'),
      startISO: startDateString,
      endISO: endDateString
    });
    
    // WICHTIG: IMMER nur das Sidebar-Datum ändern!
    setStartDate(startDateString);
    setEndDate(endDateString);
  };

  // Korrigierte handleDashboardQuickSelect-Funktion für das Dashboard
  const handleDashboardQuickSelect = (value: string) => {
    // Diese Funktion ändert NUR die Dashboard-Datumsfilter!
    setQuickSelectValue(value);
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let startDate: Date, endDate: Date;
    
    switch (value) {
      case 'thisWeek': {
        // Berechne den aktuellen Montag (Wochenanfang)
        const currentDay = now.getDay(); // 0 = Sonntag, 1 = Montag, ...
        const diff = currentDay === 0 ? 6 : currentDay - 1; // Wie viele Tage bis zum letzten Montag
        
        // Erzeuge UTC-Datum für Montag 00:00:00
        startDate = new Date(Date.UTC(
          now.getFullYear(), 
          now.getMonth(), 
          now.getDate() - diff, 
          0, 0, 0
        ));
        
        // Erzeuge UTC-Datum für Sonntag 23:59:59 (6 Tage später)
        endDate = new Date(Date.UTC(
          startDate.getUTCFullYear(), 
          startDate.getUTCMonth(), 
          startDate.getUTCDate() + 6, 
          23, 59, 59
        ));
        break;
      }
      case 'lastWeek': {
        // Montag der letzten Woche = (aktueller Montag - 7 Tage)
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const diffToLastMonday = diffToMonday + 7;
        
        // Erzeuge UTC-Datum für Montag der letzten Woche 00:00:00
        startDate = new Date(Date.UTC(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - diffToLastMonday,
          0, 0, 0
        ));
        
        // Erzeuge UTC-Datum für Sonntag der letzten Woche 23:59:59
        endDate = new Date(Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth(),
          startDate.getUTCDate() + 6,
          23, 59, 59
        ));
        break;
      }
      case 'lastTwoWeeks': {
        // Montag der vorletzten Woche = (aktueller Montag - 14 Tage)
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const diffToTwoWeeksAgoMonday = diffToMonday + 14;
        
        // Erzeuge UTC-Datum für Montag vor zwei Wochen 00:00:00
        startDate = new Date(Date.UTC(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - diffToTwoWeeksAgoMonday,
          0, 0, 0
        ));
        
        // Erzeuge UTC-Datum für Sonntag letzte Woche 23:59:59 (13 Tage später)
        endDate = new Date(Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth(),
          startDate.getUTCDate() + 13,
          23, 59, 59
        ));
        break;
      }
      case 'thisMonth': {
        // Erster Tag des aktuellen Monats mit UTC-Zeit 00:00:00
        startDate = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0));
        
        // Letzter Tag des aktuellen Monats mit UTC-Zeit 23:59:59
        endDate = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59));
        break;
      }
      case 'lastMonth': {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        // Erster Tag des letzten Monats mit UTC-Zeit 00:00:00
        startDate = new Date(Date.UTC(yearOfLastMonth, lastMonth, 1, 0, 0, 0));
        
        // Letzter Tag des letzten Monats mit UTC-Zeit 23:59:59
        endDate = new Date(Date.UTC(yearOfLastMonth, lastMonth + 1, 0, 23, 59, 59));
        break;
      }
      case 'schoolYear': {    
        // Das Schuljahr holen
        const schoolYear = getCurrentSchoolYear();
        
        // Korrektes UTC-Datum für den Schuljahres-Start
        startDate = new Date(Date.UTC(
          parseInt(schoolYear.start),
          8, // September (0-basiert: 8)
          1, // Erster Tag
          0, 0, 0 // 00:00:00 Uhr
        ));
        
        // Korrektes UTC-Datum für das Schuljahres-Ende
        endDate = new Date(Date.UTC(
          parseInt(schoolYear.end), 
          6, // Juli (0-basiert: 6) 
          31, // Letzter Tag im Juli
          23, 59, 59 // 23:59:59 Uhr
        ));
        break;
      }
      default:
        return;
    }
    
    // ISO-Strings für die Datumseingabefelder (YYYY-MM-DD)
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    
    console.log(`Dashboard Quick Select (${value}):`, {
      start: startDate.toLocaleDateString('de-DE'),
      end: endDate.toLocaleDateString('de-DE'),
      startISO: startDateString,
      endISO: endDateString
    });
    
    // Nur die Dashboard-Daten setzen
    setDashboardStartDate(startDateString);
    setDashboardEndDate(endDateString);
  };

  const handleExportExcel = () => {
    exportToExcel({
      getFilteredStudents,
      startDate,
      endDate,
      schoolYearStats,
      weeklyStats,
      selectedWeeks,
      detailedData,
      schoolYearDetailedData,
      weeklyDetailedData,
      expandedStudents,
      activeFilters,
    });
  };

  const handleExportCSV = () => {
    exportToCSV({
      getFilteredStudents,
      startDate,
      endDate,
      schoolYearStats,
      weeklyStats,
      selectedWeeks,
      detailedData,
      schoolYearDetailedData,
      weeklyDetailedData,
      expandedStudents,
      activeFilters,
    });
  };

  const handleExportPDF = () => {
    exportToPDF({
      getFilteredStudents,
      startDate,
      endDate,
      schoolYearStats,
      weeklyStats,
      selectedWeeks,
      detailedData,
      schoolYearDetailedData,
      weeklyDetailedData,
      expandedStudents,
      activeFilters,
    });
  };

  // Die ursprüngliche AttendanceAnalyzer-Komponente bleibt als Container-Komponente
  return (
    <FilterProvider 
      propSelectedClasses={selectedClasses} 
      propViewMode={viewMode}
      onViewModeChange={setViewMode}
      getFilteredStudents={getFilteredStudents}
      propSearchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      dashboardStartDate={dashboardStartDate}
      dashboardEndDate={dashboardEndDate}
      onDashboardStartDateChange={setDashboardStartDate}
      onDashboardEndDateChange={setDashboardEndDate}
      resetTriggerId={resetTriggerId}
      quickSelectValue={quickSelectValue}
      // WICHTIG: Hier verwenden wir die korrekte Funktion je nach Kontext
      handleQuickSelect={handleDashboardQuickSelect} // Nur für Dashboard-Kontext
    >
      <AttendanceAnalyzerContent
        rawData={rawData}
        results={results}
        startDate={startDate}
        endDate={endDate}
        dashboardStartDate={dashboardStartDate}
        dashboardEndDate={dashboardEndDate}
        searchQuery={searchQuery}
        error={error}
        detailedData={detailedData}
        schoolYearDetailedData={schoolYearDetailedData}
        filterUnexcusedLate={filterUnexcusedLate}
        filterUnexcusedAbsent={filterUnexcusedAbsent}
        minUnexcusedLates={minUnexcusedLates}
        minUnexcusedAbsences={minUnexcusedAbsences}
        availableClasses={availableClasses}
        selectedClasses={selectedClasses}
        selectedWeeks={selectedWeeks}
        schoolYearStats={schoolYearStats}
        weeklyStats={weeklyStats}
        weeklyDetailedData={weeklyDetailedData}
        expandedStudents={expandedStudents}
        setExpandedStudents={setExpandedStudents}
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
        uploadTrigger={uploadTrigger}
        hasFileUploaded={hasFileUploaded}
        quickSelectValue={quickSelectValue}
        visibleColumns={visibleColumns}
        isDarkMode={isDarkMode}
        viewMode={viewMode}
        setSearchQuery={setSearchQuery}
        setFilterUnexcusedLate={setFilterUnexcusedLate}
        setFilterUnexcusedAbsent={setFilterUnexcusedAbsent}
        setMinUnexcusedLates={setMinUnexcusedLates}
        setMinUnexcusedAbsences={setMinUnexcusedAbsences}
        setSelectedClasses={setSelectedClasses}
        setIsDarkMode={setIsDarkMode}
        resetAll={resetAll}
        toggleColumnGroup={toggleColumnGroup}
        closeAllDetails={closeAllDetails}
        setViewMode={setViewMode}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        setDashboardStartDate={setDashboardStartDate}
        setDashboardEndDate={setDashboardEndDate}
        handleQuickSelect={handleQuickSelect} // Für Sidebar weiterhin die alte Funktion
        setSelectedWeeks={setSelectedWeeks}
        handleFileProcessed={handleFileProcessed}
        handleExportExcel={handleExportExcel}
        handleExportCSV={handleExportCSV}
        handleExportPDF={handleExportPDF}
        enableSummaryRow={enableSummaryRow}
        setEnableSummaryRow={setEnableSummaryRow}
        summaryRowSticky={summaryRowSticky}
        setSummaryRowSticky={setSummaryRowSticky}
      />
    </FilterProvider>
  );
};

// Neue Komponente, die den Hook useFilters verwenden kann, 
// da sie innerhalb des FilterProvider-Kontexts verwendet wird
const AttendanceAnalyzerContent: React.FC<{
  rawData: any;
  results: Record<string, StudentStats> | null;
  startDate: string;
  endDate: string;
  dashboardStartDate: string;
  dashboardEndDate: string;
  searchQuery: string;
  error: string;
  detailedData: Record<string, any>;
  schoolYearDetailedData: Record<string, any>;
  filterUnexcusedLate: boolean;
  filterUnexcusedAbsent: boolean;
  minUnexcusedLates: string;
  minUnexcusedAbsences: string;
  availableClasses: string[];
  selectedClasses: string[];
  selectedWeeks: string;
  schoolYearStats: Record<string, any>;
  weeklyStats: Record<string, any>;
  weeklyDetailedData: Record<string, any>;
  expandedStudents: Set<string>;
  setExpandedStudents: (value: Set<string>) => void;
  activeFilters: Map<string, string>;
  setActiveFilters: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  uploadTrigger: number;
  hasFileUploaded: boolean;
  quickSelectValue: string;
  visibleColumns: string[];
  isDarkMode: boolean;
  viewMode: 'table' | 'dashboard';
  
  // Neue Props für die Summenzeile
  enableSummaryRow?: boolean;
  setEnableSummaryRow?: (value: boolean) => void;
  summaryRowSticky?: boolean;
  setSummaryRowSticky?: (value: boolean) => void;
  
  // Setter und Handler Funktionen
  setSearchQuery: (value: string) => void;
  setFilterUnexcusedLate: (value: boolean) => void;
  setFilterUnexcusedAbsent: (value: boolean) => void;
  setMinUnexcusedLates: (value: string) => void;
  setMinUnexcusedAbsences: (value: string) => void;
  setSelectedClasses: (classes: string[]) => void;
  setIsDarkMode: (value: boolean) => void;
  resetAll: () => void;
  toggleColumnGroup: (columnGroup: string) => void;
  closeAllDetails: () => void;
  setViewMode: (mode: 'table' | 'dashboard') => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  setDashboardStartDate: (value: string) => void;
  setDashboardEndDate: (value: string) => void;
  handleQuickSelect: (value: string) => void;
  setSelectedWeeks: (value: string) => void;
  handleFileProcessed: (data: any) => void;
  handleExportExcel: () => void;
  handleExportCSV: () => void;
  handleExportPDF: () => void;
}> = (props) => {
  const {
    rawData, results, startDate, endDate, dashboardStartDate, dashboardEndDate, error, detailedData, schoolYearDetailedData,
    filterUnexcusedLate, filterUnexcusedAbsent, minUnexcusedLates, minUnexcusedAbsences,
    availableClasses, selectedClasses, selectedWeeks, schoolYearStats, weeklyStats,
    weeklyDetailedData, expandedStudents, setExpandedStudents, activeFilters, setActiveFilters,
    uploadTrigger, hasFileUploaded, quickSelectValue, visibleColumns, isDarkMode, viewMode,
    setSearchQuery, setFilterUnexcusedLate, setFilterUnexcusedAbsent, setMinUnexcusedLates,
    setMinUnexcusedAbsences, setSelectedClasses, setIsDarkMode, resetAll, toggleColumnGroup,
    closeAllDetails, setViewMode, setStartDate, setEndDate, setDashboardStartDate, setDashboardEndDate,
    handleQuickSelect, setSelectedWeeks,
    handleFileProcessed, handleExportExcel, handleExportCSV, handleExportPDF,
    // Neue Props für die Summenzeile mit Default-Werten
    enableSummaryRow = true,
    setEnableSummaryRow = () => {},
    summaryRowSticky = true,
    setSummaryRowSticky = () => {},
  } = props;

  // Hier können wir nun den FilterContext verwenden
  const { selectedStudents } = useFilters();

  // Diese neue Version von getFilteredStudents berücksichtigt auch die ausgewählten Schüler
  const getFilteredStudentsWithSelectedStudents = (): [string, StudentStats][] => {
    if (!results) return [];
    
    // Funktion für bessere Lesbarkeit: Prüft, ob ein Schüler den allgemeinen Filterkriterien entspricht
    const matchesBaseFilters = (student: string, stats: StudentStats): boolean => {
      const matchesClass = selectedClasses.length === 0 || selectedClasses.includes(stats.klasse);
      let meetsUnexcusedCriteria = true;
      if (filterUnexcusedLate || filterUnexcusedAbsent) {
        meetsUnexcusedCriteria = false;
        if (filterUnexcusedLate && stats.verspaetungen_unentsch > 0) meetsUnexcusedCriteria = true;
        if (filterUnexcusedAbsent && stats.fehlzeiten_unentsch > 0) meetsUnexcusedCriteria = true;
      }
      const meetsMinUnexcusedLates =
        minUnexcusedLates === '' || stats.verspaetungen_unentsch >= parseInt(minUnexcusedLates);
      const meetsMinUnexcusedAbsences =
        minUnexcusedAbsences === '' || stats.fehlzeiten_unentsch >= parseInt(minUnexcusedAbsences);
      
      return (
        matchesClass &&
        meetsUnexcusedCriteria &&
        meetsMinUnexcusedLates &&
        meetsMinUnexcusedAbsences
      );
    };
    
    return Object.entries(results)
      .filter(([student, stats]: [string, StudentStats]) => {
        // ODER-Logik für die Gesamtanzeige:
        
        // 1. Wenn der Schüler über Dropdown ausgewählt wurde: immer anzeigen
        const isSelected = selectedStudents.length > 0 && selectedStudents.includes(student);
        
        // 2. Wenn eine Suche aktiv ist und der Schüler dem Suchtext entspricht
        const matchesSearch = props.searchQuery.length > 0 && 
                             student.toLowerCase().includes(props.searchQuery.toLowerCase());
        
        // 3. Immer noch die anderen Filter berücksichtigen
        const matchesOtherFilters = matchesBaseFilters(student, stats);
        
        // Wenn keine spezifische Filterung aktiv ist, zeige alle Schüler, die grundsätzlichen Filtern entsprechen
        if (selectedStudents.length === 0 && props.searchQuery.length === 0) {
          return matchesOtherFilters;
        }
        
        // Sonst: ODER-Logik zwischen Auswahl und Suche
        return (isSelected || (matchesSearch && matchesOtherFilters));
      })
      .sort(([a], [b]) => a.localeCompare(b));
  };

  return (
    <div className={`min-h-screen bg-chatGray-light dark:bg-chatGray-dark ${isDarkMode ? 'dark' : ''}`}>
      <HeaderBar
        filterUnexcusedLate={filterUnexcusedLate}
        filterUnexcusedAbsent={filterUnexcusedAbsent}
        onFilterUnexcusedLateChange={setFilterUnexcusedLate}
        onFilterUnexcusedAbsentChange={setFilterUnexcusedAbsent}
        minUnexcusedLates={minUnexcusedLates}
        minUnexcusedAbsences={minUnexcusedAbsences}
        onMinUnexcusedLatesChange={setMinUnexcusedLates}
        onMinUnexcusedAbsencesChange={setMinUnexcusedAbsences}
        searchQuery={props.searchQuery}
        onSearchChange={setSearchQuery}
        availableClasses={availableClasses}
        selectedClasses={selectedClasses}
        onClassesChange={setSelectedClasses}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onReset={resetAll}
        visibleColumns={visibleColumns}
        onToggleColumnGroup={toggleColumnGroup}
        expandedStudents={expandedStudents}
        onCloseAllDetails={closeAllDetails}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        dashboardStartDate={dashboardStartDate}
        dashboardEndDate={dashboardEndDate}
        onDashboardStartDateChange={setDashboardStartDate}
        onDashboardEndDateChange={setDashboardEndDate}
        quickSelectValue={quickSelectValue}
        handleQuickSelect={handleQuickSelect}
      />
      <Sidebar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onQuickSelect={handleQuickSelect}
        selectedWeeks={selectedWeeks}
        onSelectedWeeksChange={setSelectedWeeks}
        onFileUpload={handleFileProcessed}
        onExportExcel={handleExportExcel}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        uploadTrigger={uploadTrigger}
        hasFileUploaded={hasFileUploaded}
        quickSelectValue={quickSelectValue}
      />
      <MainContent
        getFilteredStudents={getFilteredStudentsWithSelectedStudents}
        detailedData={detailedData}
        schoolYearDetailedData={schoolYearDetailedData}
        weeklyDetailedData={weeklyDetailedData}
        startDate={startDate}
        endDate={endDate}
        schoolYearStats={schoolYearStats}
        weeklyStats={weeklyStats}
        selectedWeeks={selectedWeeks}
        availableClasses={availableClasses}
        selectedClasses={selectedClasses}
        onClassesChange={setSelectedClasses}
        expandedStudents={expandedStudents}
        setExpandedStudents={setExpandedStudents}
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
        visibleColumns={visibleColumns}
        viewMode={viewMode}
        rawData={rawData}
        enableSummaryRow={enableSummaryRow}
        summaryRowSticky={summaryRowSticky}
      />
      
      {error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default AttendanceAnalyzer;