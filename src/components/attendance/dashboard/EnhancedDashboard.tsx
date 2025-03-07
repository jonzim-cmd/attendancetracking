import React, { useState, useEffect, useCallback } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import TrendCharts from './TrendCharts';
import { 
  prepareWeeklyTrends, 
  prepareAbsenceTypes, 
  prepareDayOfWeekAnalysis,
  prepareAttendanceOverTime
} from './utils';
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
  weeklyDetailedData?: Record<string, any>;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
  getFilteredStudents,
  rawData,
  startDate,
  endDate,
  selectedWeeks,
  availableClasses,
  selectedClasses: propSelectedClasses,
  weeklyStats = {},
  schoolYearStats = {},
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
  const [filteredStudentStats, setFilteredStudentStats] = useState<[string, StudentStats][]>([]);
  
  // Chart visibility options
  const [trendChartVisibility, setTrendChartVisibility] = useState({
    verspaetungen: true,
    fehlzeitenEntsch: true,
    fehlzeitenUnentsch: true,
    fehlzeitenGesamt: true
  });
  
  const [weekdayChartVisibility, setWeekdayChartVisibility] = useState({
    verspaetungen: true,
    fehlzeitenEntsch: true,
    fehlzeitenUnentsch: true,
    fehlzeitenGesamt: true
  });
  
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
  
  // Effect to prepare all data when filters change
  useEffect(() => {
    if (!rawData || !startDate || !endDate) return;
    
    // Update states with memoized data
    setWeeklyTrends(memoizedWeeklyTrends());
    setAbsenceTypes(memoizedAbsenceTypes());
    setDayOfWeekData(memoizedDayOfWeekData());
    setAttendanceOverTime(memoizedAttendanceOverTime());
    
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
    memoizedAttendanceOverTime
  ]);
  
  // Bestimme den effektiven Zeitraum für die Anzeige des Datums (Dashboard-Daten oder fallback zu props)
  const effectiveStartDate = dashboardStartDate || startDate;
  const effectiveEndDate = dashboardEndDate || endDate;

  if (!rawData) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Bitte laden Sie Anwesenheitsdaten hoch, um das Dashboard anzuzeigen.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Kompakte Überschrift, jetzt mit effektiven Daten */}
      <div className="sticky top-0 z-10 bg-table-light-base dark:bg-table-dark-base pt-2 pb-0">
        <h3 className="text-base font-semibold text-chatGray-textLight dark:text-chatGray-textDark mb-2">
          Dashboard für den Zeitraum {formatDate(effectiveStartDate)} - {formatDate(effectiveEndDate)}
        </h3>
      </div>
      
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

// Helper function to format date
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default EnhancedDashboard;