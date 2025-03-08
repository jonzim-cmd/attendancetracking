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
import {
  calculateStudentAverages,
  shouldShowStudentAverages,
  updateAllStudentsCache,
  clearAllStudentsCache
} from './studentAverages';
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
    dashboardStartDate,
    dashboardEndDate
  } = useFilters();
  
  // States for chart data
  const [weeklyTrends, setWeeklyTrends] = useState<any[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<any[]>([]);
  const [dayOfWeekData, setDayOfWeekData] = useState<any[]>([]);
  const [attendanceOverTime, setAttendanceOverTime] = useState<any[]>([]);
  
  // State for specifically handling data for a single selected student
  const [singleStudentData, setSingleStudentData] = useState<any[]>([]);
  
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
    verspaetungenAvg: false,
    fehlzeitenAvg: false,
    // New student average visibility options - initialize to false
    verspaetungenStudentAvg: false,
    fehlzeitenStudentAvg: false
  });
  
  const [weekdayChartVisibility, setWeekdayChartVisibility] = useState({
    verspaetungen: true,
    fehlzeitenEntsch: true,
    fehlzeitenUnentsch: true,
    fehlzeitenGesamt: true
  });
  
  // State for all classes and all students data
  const [allClassesData, setAllClassesData] = useState<any[]>([]);
  const [allStudentsData, setAllStudentsData] = useState<any[]>([]);
  
  // State to control if student comparison is enabled
  const [showStudentAverageComparison, setShowStudentAverageComparison] = useState<boolean>(false);
  
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
    return prepareAbsenceTypes(
      studentStats,
      selectedDashboardClasses,
      selectedStudents
    );
  }, [studentStats, selectedDashboardClasses, selectedStudents]);
  
  // Memoized function for day of week data
  const memoizedDayOfWeekData = useCallback(() => {
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
  
  // Memoized function for individual student data
  const memoizedSingleStudentData = useCallback(() => {
    // Only process if exactly one student is selected
    if (selectedStudents.length !== 1) return [];
    
    const selectedStudent = selectedStudents[0];
    const effectiveStartDate = dashboardStartDate || startDate;
    const effectiveEndDate = dashboardEndDate || endDate;
    
    // Prepare time series data for just this student
    return prepareAttendanceOverTime(
      effectiveStartDate,
      effectiveEndDate,
      groupingOption,
      studentStats,
      weeklyDetailedData,
      selectedDashboardClasses,
      [selectedStudent] // Just the selected student
    ).map(point => ({
      ...point,
      studentName: selectedStudent // Add student name to the data point
    }));
  }, [dashboardStartDate, dashboardEndDate, startDate, endDate, groupingOption, studentStats, weeklyDetailedData, selectedDashboardClasses, selectedStudents]);
  
  // Memoized function for all classes data
  const memoizedAllClassesData = useCallback(() => {
    // Special call with empty class and student lists to get data for all classes
    return prepareAttendanceOverTime(
      dashboardStartDate || startDate,
      dashboardEndDate || endDate,
      groupingOption,
      studentStats,
      weeklyDetailedData,
      [], // Empty class list = all classes
      []  // Empty student list = all students
    );
  }, [dashboardStartDate, dashboardEndDate, startDate, endDate, groupingOption, studentStats, weeklyDetailedData]);
  
  // Memoized function for all students data (regardless of class filter)
  const memoizedAllStudentsData = useCallback(() => {
    // Special call to get data for all students (regardless of class selection)
    return prepareAttendanceOverTime(
      dashboardStartDate || startDate,
      dashboardEndDate || endDate,
      groupingOption,
      studentStats,
      weeklyDetailedData,
      selectedDashboardClasses, // WICHTIG: Hier die ausgewählten Klassen übergeben!
      []  // Kein Schülerfilter
    );
  }, [
    dashboardStartDate, 
    dashboardEndDate, 
    startDate, 
    endDate, 
    groupingOption, 
    studentStats, 
    weeklyDetailedData,
    selectedDashboardClasses // Auch hier als Abhängigkeit hinzufügen
  ]);
  
  // Effect to update "all classes" cache
  useEffect(() => {
    if (!rawData || !startDate || !endDate) return;
    
    // Calculate data for all classes
    const allClassesTimeSeriesData = memoizedAllClassesData();
    
    // Mark the data as "all classes" data
    const markedData = allClassesTimeSeriesData.map(point => ({
      ...point,
      isAllClassesData: true 
    }));
    
    // Store the data locally
    setAllClassesData(markedData);
    
    // Update caches for future calculations
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
  
  // Effect to update "all students" cache
  useEffect(() => {
    if (!rawData || !startDate || !endDate) return;
    
    // Calculate data for all students without class filtering
    const allStudentsTimeSeriesData = memoizedAllStudentsData();
    
    // Mark the data as "all students" data
    const markedData = allStudentsTimeSeriesData.map(point => ({
      ...point,
      isAllStudentsData: true
    }));
    
    // Store the data locally
    setAllStudentsData(markedData);
    
    // Update student cache for future calculations
    updateAllStudentsCache(markedData);
    
    console.log("Updated all students data for student averages", {
      dataPoints: markedData.length,
      firstPoint: markedData[0]
    });
    
  }, [
    rawData,
    startDate,
    endDate,
    dashboardStartDate,
    dashboardEndDate,
    groupingOption,
    memoizedAllStudentsData
  ]);
  
  // Effect to prepare single student data when needed
  useEffect(() => {
    if (selectedStudents.length === 1) {
      setSingleStudentData(memoizedSingleStudentData());
    } else {
      setSingleStudentData([]);
    }
  }, [selectedStudents, memoizedSingleStudentData]);
  
  // Clean up caches on unmount
  useEffect(() => {
    return () => {
      clearAllClassesCache();
      clearAllStudentsCache();
    };
  }, []);
  
  // Effect to prepare all data when filters change
  useEffect(() => {
    if (!rawData || !startDate || !endDate) return;
    
    // Update states with memoized data
    setWeeklyTrends(memoizedWeeklyTrends());
    setAbsenceTypes(memoizedAbsenceTypes());
    setDayOfWeekData(memoizedDayOfWeekData());
    
    // Base time series data
    const baseAttendanceData = memoizedAttendanceOverTime();
    
    // Check if we should show student averages (single student selected or forced comparison)
    const shouldShowStudentAvgs = shouldShowStudentAverages(
      selectedStudents.length === 1 ? selectedStudents[0] : undefined, 
      showStudentAverageComparison
    );
    
    // Check if we should show standard class averages
    const shouldShowClassAvgs = shouldShowAverages(selectedDashboardClasses, selectedStudents);
    

    // Finde den Aufruf von calculateStudentAverages innerhalb des useEffect:
    if (selectedStudents.length === 1 && shouldShowStudentAvgs) {
      // Wenn ein einzelner Schüler ausgewählt ist und student averages angezeigt werden sollen
      
      // Das Basis-Dataset für diesen Schüler holen
      const studentData = singleStudentData.length > 0 ? singleStudentData : baseAttendanceData;
      
      // Hier die Änderung durchführen: selectedDashboardClasses übergeben
      const enhancedData = calculateStudentAverages(
        studentData, 
        studentStats,
        selectedDashboardClasses // WICHTIG: Ausgewählte Klassen als Parameter übergeben
      );
      
      // Set the enhanced data with student averages
      setAttendanceOverTime(enhancedData);
    }
    else if (shouldShowClassAvgs) {
      // Standard class average calculation - unchanged from original
      const enhancedData = calculateClassAverages(baseAttendanceData, studentStats);
      setAttendanceOverTime(enhancedData);
    }
    else {
      // No averages, just use base data - unchanged from original
      setAttendanceOverTime(baseAttendanceData);
    }
  }, [
    rawData,
    startDate,
    endDate,
    dashboardStartDate,
    dashboardEndDate,
    selectedWeeks,
    selectedDashboardClasses,
    selectedStudents,
    groupingOption,
    memoizedWeeklyTrends,
    memoizedAbsenceTypes,
    memoizedDayOfWeekData,
    memoizedAttendanceOverTime,
    studentStats,
    allClassesData,
    allStudentsData,
    singleStudentData,
    showStudentAverageComparison
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
        // Pass student-specific props
        selectedStudent={selectedStudents.length === 1 ? selectedStudents[0] : undefined}
        showStudentAverageComparison={showStudentAverageComparison}
        setShowStudentAverageComparison={setShowStudentAverageComparison}
      />
    </div>
  );
};

export default EnhancedDashboard;