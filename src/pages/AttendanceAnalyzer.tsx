import React, { useState, useEffect } from 'react';
import HeaderBar from '@/components/layout/HeaderBar';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import { exportToExcel, exportToCSV, exportToPDF } from '@/components/attendance/ExportButtons';
import { processData, calculateSchoolYearStats, calculateWeeklyStats } from '@/lib/attendance-utils';
import { ProcessedData, StudentStats } from '@/types';

const AttendanceAnalyzer: React.FC = () => {
  const [rawData, setRawData] = useState<any>(null);
  const [results, setResults] = useState<Record<string, StudentStats> | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
  
  // Aktualisierte visibleColumns-Struktur für feingranularere Kontrolle
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['basic', 'verspaetungen', 'fehlzeiten', 'stats']);
  
  const [isDarkMode, setIsDarkMode] = useState(false);

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
    setStartDate('');
    setEndDate('');
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
  };

  const handleFileProcessed = (data: any) => {
    setRawData(data);
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
  }, [rawData, startDate, endDate]);

  useEffect(() => {
    if (!startDate && !endDate) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const start = new Date(currentYear + '-' + String(currentMonth + 1).padStart(2, '0') + '-01T00:00:00');
      const end = new Date(
        currentYear +
          '-' +
          String(currentMonth + 1).padStart(2, '0') +
          '-' +
          String(new Date(currentYear, currentMonth + 1, 0).getDate()).padStart(2, '0') +
          'T23:59:59'
      );
      setStartDate(start.toLocaleDateString('sv').split('T')[0]);
      setEndDate(end.toLocaleDateString('sv').split('T')[0]);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (rawData) {
      setSchoolYearStats(calculateSchoolYearStats(rawData));
      setWeeklyStats(calculateWeeklyStats(rawData, selectedWeeks));
    }
  }, [rawData, selectedWeeks]);

  useEffect(() => {
    // Es ist nicht nötig, den gesamten results-Zustand neu zu setzen
    // Das Filtern passiert bereits in getFilteredStudents()
    // Dieser Effect könnte für andere Aktionen genutzt werden, die
    // spezifisch bei Klassenänderungen notwendig sind
  }, [selectedClasses]);

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

  const handleQuickSelect = (value: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let start: Date, end: Date;
    switch (value) {
      case 'thisWeek': {
        const currentDay = now.getDay();
        const diff = currentDay === 0 ? 6 : currentDay - 1;
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - diff);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        start = new Date(
          startDate.getFullYear() +
            '-' +
            String(startDate.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(startDate.getDate()).padStart(2, '0') +
            'T00:00:00'
        );
        end = new Date(
          endDate.getFullYear() +
            '-' +
            String(endDate.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(endDate.getDate()).padStart(2, '0') +
            'T23:59:59'
        );
        break;
      }
      case 'lastWeek': {
        const currentDay = now.getDay();
        const diff = currentDay === 0 ? 6 : currentDay - 1;
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - diff - 7);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        start = new Date(
          startDate.getFullYear() +
            '-' +
            String(startDate.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(startDate.getDate()).padStart(2, '0') +
            'T00:00:00'
        );
        end = new Date(
          endDate.getFullYear() +
            '-' +
            String(endDate.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(endDate.getDate()).padStart(2, '0') +
            'T23:59:59'
        );
        break;
      }
      case 'lastTwoWeeks': {
        const currentDay = now.getDay();
        const diff = currentDay === 0 ? 6 : currentDay - 1;
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - diff - 14);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 13);
        start = new Date(
          startDate.getFullYear() +
            '-' +
            String(startDate.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(startDate.getDate()).padStart(2, '0') +
            'T00:00:00'
        );
        end = new Date(
          endDate.getFullYear() +
            '-' +
            String(endDate.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(endDate.getDate()).padStart(2, '0') +
            'T23:59:59'
        );
        break;
      }
      case 'thisMonth': {
        start = new Date(currentYear + '-' + String(currentMonth + 1).padStart(2, '0') + '-01T00:00:00');
        end = new Date(
          currentYear +
            '-' +
            String(currentMonth + 1).padStart(2, '0') +
            '-' +
            String(new Date(currentYear, currentMonth + 1, 0).getDate()).padStart(2, '0') +
            'T23:59:59'
        );
        break;
      }
      case 'lastMonth': {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
        start = new Date(yearOfLastMonth + '-' + String(lastMonth + 1).padStart(2, '0') + '-01T00:00:00');
        end = new Date(
          yearOfLastMonth +
            '-' +
            String(lastMonth + 1).padStart(2, '0') +
            '-' +
            String(new Date(yearOfLastMonth, lastMonth + 1, 0).getDate()).padStart(2, '0') +
            'T23:59:59'
        );
        break;
      }
      case 'schoolYear': {
        const schoolYear = { start: `${currentYear - 1}`, end: `${currentYear}` };
        start = new Date(schoolYear.start + '-09-01T00:00:00');
        end = new Date(schoolYear.end + '-07-31T23:59:59');
        break;
      }
      default:
        return;
    }
    setStartDate(start.toLocaleDateString('sv').split('T')[0]);
    setEndDate(end.toLocaleDateString('sv').split('T')[0]);
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

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <HeaderBar
        filterUnexcusedLate={filterUnexcusedLate}
        filterUnexcusedAbsent={filterUnexcusedAbsent}
        onFilterUnexcusedLateChange={setFilterUnexcusedLate}
        onFilterUnexcusedAbsentChange={setFilterUnexcusedAbsent}
        minUnexcusedLates={minUnexcusedLates}
        minUnexcusedAbsences={minUnexcusedAbsences}
        onMinUnexcusedLatesChange={setMinUnexcusedLates}
        onMinUnexcusedAbsencesChange={setMinUnexcusedAbsences}
        searchQuery={searchQuery}
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
      />
      <MainContent
        getFilteredStudents={getFilteredStudents}
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