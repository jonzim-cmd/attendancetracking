import React, { useState, useEffect, useCallback } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import TrendCharts from './TrendCharts';
import { 
  prepareWeeklyTrends, 
  prepareAbsenceTypes, 
  prepareDayOfWeekAnalysis,
  prepareAttendanceOverTime
} from './utils';
import { 
  calculateClassAverages, 
  shouldShowAverages, 
  updateAllClassesCache, 
  clearAllClassesCache 
} from './classAverages';
import { StudentStats } from '@/types';

interface EnhancedDashboardProps {
  getFilteredStudents: () => [string, StudentStats][];
  rawData: any[] | null;
  startDate: string;
  endDate: string;
  selectedWeeks: string;
  availableClasses: string[];
  selectedClasses: string[];
  weeklyStats?: Record<string, any>;
  schoolYearStats?: Record<string, any>;
  weeklyDetailedData?: Record<string, any>; // Added weeklyDetailedData prop
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
  getFilteredStudents,
  rawData,
  startDate,
  endDate,
  selectedWeeks,
  weeklyStats = {},
  weeklyDetailedData = {},
}) => {
  const {
    selectedDashboardClasses,
    selectedStudents,
    groupingOption,
    // Verwende Dashboard-spezifische Datumsfilter
    dashboardStartDate,
    dashboardEndDate
  } = useFilters();
  
  // States for chart data
  const [weeklyTrends, setWeeklyTrends] = useState<any[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<any[]>([]);
  const [dayOfWeekData, setDayOfWeekData] = useState<any[]>([]);
  const [attendanceOverTime, setAttendanceOverTime] = useState<any[]>([]);
  
  // Get all student stats
  const [studentStats, setStudentStats] = useState<Record<string, StudentStats>>({});
  
  // Additional state for filtered students
  const [, setFilteredStudentStats] = useState<[string, StudentStats][]>([]);
  
  // Chart visibility options
  const [trendChartVisibility, setTrendChartVisibility] = useState({
    verspaetungen: true,
    fehlzeitenEntsch: true,
    fehlzeitenUnentsch: true,
    fehlzeitenGesamt: true,
    // Durchschnittskurven standardmäßig ausgeblendet
    verspaetungenAvg: false,
    fehlzeitenAvg: false
  });
  
  const [weekdayChartVisibility, setWeekdayChartVisibility] = useState({
    verspaetungen: true,
    fehlzeitenEntsch: true,
    fehlzeitenUnentsch: true,
    fehlzeitenGesamt: true
  });
  
  // Neue State-Variable für die Gesamtdaten aller Klassen
  const [allClassesData, setAllClassesData] = useState<any[]>([]);
  
  // Convert filtered students to a dictionary for easier access
  useEffect(() => {
    const students = getFilteredStudents();
    const statsObj: Record<string, StudentStats> = {};
    students.forEach(([student, stats]) => {
      statsObj[student] = stats;
    });
    setStudentStats(statsObj);
  }, [getFilteredStudents]);
  
  // Effect to prepare filtered students list based on current filters
  useEffect(() => {
    setFilteredStudentStats(getFilteredStudents());
  }, [getFilteredStudents]);
  
  // Memoized function for weekly trends data
  const memoizedWeeklyTrends = useCallback(() => {
    // Use the updated function signature from the new utils.ts
    return prepareWeeklyTrends(
      weeklyStats,
      studentStats,
      selectedDashboardClasses,
      selectedStudents,
      selectedWeeks
    );
  }, [weeklyStats, studentStats, selectedDashboardClasses, selectedStudents, selectedWeeks]);
  
  // Memoized function for absence types data
  const memoizedAbsenceTypes = useCallback(() => {
    // Use the updated function signature from the new utils.ts
    return prepareAbsenceTypes(
      studentStats,
      selectedDashboardClasses,
      selectedStudents
    );
  }, [studentStats, selectedDashboardClasses, selectedStudents]);
  
  // Memoized function for day of week data
  const memoizedDayOfWeekData = useCallback(() => {
    // Use the updated function signature from the new utils.ts
    return prepareDayOfWeekAnalysis(
      weeklyDetailedData,
      studentStats,
      selectedDashboardClasses,
      selectedStudents
    );
  }, [weeklyDetailedData, studentStats, selectedDashboardClasses, selectedStudents]);
  
  // Memoized function for attendance over time data - Use dashboard dates if available
  const memoizedAttendanceOverTime = useCallback(() => {
    // Use dashboard dates if available, otherwise fall back to props
    const effectiveStartDate = dashboardStartDate || startDate;
    const effectiveEndDate = dashboardEndDate || endDate;
    
    // Use the updated function signature from the new utils.ts
    return prepareAttendanceOverTime(
      effectiveStartDate,
      effectiveEndDate,
      groupingOption,
      studentStats,
      weeklyDetailedData,
      selectedDashboardClasses,
      selectedStudents
    );
  }, [dashboardStartDate, dashboardEndDate, startDate, endDate, groupingOption, studentStats, weeklyDetailedData, selectedDashboardClasses, selectedStudents]);
  
  // NEU: Memoized function für alle Klassen Daten
  const memoizedAllClassesData = useCallback(() => {
    // Spezieller Aufruf mit leeren Klassenlisten und Schülerlisten,
    // um Daten für alle Klassen zu erhalten
    return prepareAttendanceOverTime(
      dashboardStartDate || startDate,
      dashboardEndDate || endDate,
      groupingOption,
      studentStats,
      weeklyDetailedData,
      [], // Leere Klassenliste = alle Klassen
      []  // Leere Schülerliste = alle Schüler
    );
  }, [dashboardStartDate, dashboardEndDate, startDate, endDate, groupingOption, studentStats, weeklyDetailedData]);
  
  // NEU: Effect zum Aktualisieren der "alle Klassen"-Daten
  useEffect(() => {
    if (!rawData || !startDate || !endDate) return;
    
    // Berechne die Gesamtdaten aller Klassen
    const allClassesTimeSeriesData = memoizedAllClassesData();
    
    // Markiere diese Daten als "alle Klassen"-Daten
    const markedData = allClassesTimeSeriesData.map(point => ({
      ...point,
      isAllClassesData: true as boolean // Markierung für den Cache mit Type Assertion
    }));
    
    // Speichere die Daten im lokalen State
    setAllClassesData(markedData);
    
    // Aktualisiere den Cache mit den Gesamtdaten aller Klassen
    updateAllClassesCache(markedData);
    
  }, [
    rawData,
    startDate,
    endDate,
    dashboardStartDate,
    dashboardEndDate,
    groupingOption,
    memoizedAllClassesData
  ]);
  
  // Bereinige den Cache, wenn sich wesentliche Parameter ändern
  useEffect(() => {
    return () => {
      // Bereinige den Cache beim Unmount
      clearAllClassesCache();
    };
  }, []);
  
  // Effect to prepare all data when filters change
  useEffect(() => {
    if (!rawData || !startDate || !endDate) return;
    
    // Update states with memoized data
    setWeeklyTrends(memoizedWeeklyTrends());
    setAbsenceTypes(memoizedAbsenceTypes());
    setDayOfWeekData(memoizedDayOfWeekData());
    
    // Basis-Zeitreihendaten
    const baseAttendanceData = memoizedAttendanceOverTime();
    
    // Wenn Klassendurchschnitte angezeigt werden sollen, berechne sie
    if (shouldShowAverages(selectedDashboardClasses, selectedStudents)) {
      // Erweitere die Zeitreihendaten um Durchschnittswerte
      const enhancedData = calculateClassAverages(baseAttendanceData, studentStats);
      setAttendanceOverTime(enhancedData);
    } else {
      // Setze die Basisdaten ohne Durchschnitte
      setAttendanceOverTime(baseAttendanceData);
    }
  }, [
    rawData,
    startDate,
    endDate,
    dashboardStartDate,  // NEU: Reagiere auf Änderungen an den Dashboard-Datumsfiltern
    dashboardEndDate,    // NEU: Reagiere auf Änderungen an den Dashboard-Datumsfiltern
    selectedWeeks,
    selectedDashboardClasses,
    selectedStudents,
    groupingOption,
    memoizedWeeklyTrends,
    memoizedAbsenceTypes,
    memoizedDayOfWeekData,
    memoizedAttendanceOverTime,
    studentStats,  // Hinzugefügt für die Durchschnittsberechnung
    allClassesData // NEU: Reagiere auf Änderungen der Gesamtdaten
  ]);

  if (!rawData) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Bitte laden Sie Anwesenheitsdaten hoch, um das Dashboard anzuzeigen.
      </div>
    );
  }
  
  return (
    <div className="space-y-4"> 
      {/* Only render TrendCharts, removed other components */}
      <TrendCharts 
        weeklyTrends={weeklyTrends}
        attendanceOverTime={attendanceOverTime}
        dayOfWeekData={dayOfWeekData}
        absenceTypes={absenceTypes}
        groupingOption={groupingOption}
        chartVisibility={trendChartVisibility}
        setChartVisibility={setTrendChartVisibility}
        weekdayChartVisibility={weekdayChartVisibility}
        setWeekdayChartVisibility={setWeekdayChartVisibility}
      />
    </div>
  );
};

export default EnhancedDashboard;