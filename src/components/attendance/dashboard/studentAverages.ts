// src/components/attendance/dashboard/studentAverages.ts
import { StudentStats } from '@/types';

/**
 * Interface for time series data points with student averages
 */
export interface TimeSeriesDataPointWithStudentAvg {
  name: string;
  verspaetungen: number;
  fehlzeiten: number;
  fehlzeitenEntsch: number;
  fehlzeitenUnentsch: number;
  entschuldigt: number;
  unentschuldigt: number;
  sortKey?: number;
  dateRange?: string;
  
  // Student average values
  verspaetungenStudentAvg?: number;
  fehlzeitenStudentAvg?: number;
  fehlzeitenEntschStudentAvg?: number;
  fehlzeitenUnentschStudentAvg?: number;
  
  // Metadata for calculation
  studentCount?: number;
  totalStudentCount?: number;
  studentName?: string;
  isAllStudentsData?: boolean;
}

// Cache for storing complete student data to ensure consistent averages
let cachedAllStudentsData: Record<string, number> = {};

/**
 * Calculates average values per student for each time series data point.
 * The averages are always calculated based on the total student population
 * from the selected classes, regardless of which individual student is selected.
 * 
 * @param timeSeriesData The time series data for the current selection
 * @param studentStats Statistics data for all students
 * @param selectedClasses Array of selected class names to filter students by
 * @returns Time series data with added student average values
 */
export function calculateStudentAverages(
  timeSeriesData: any[],
  studentStats: Record<string, StudentStats>,
  selectedClasses: string[] = []
): TimeSeriesDataPointWithStudentAvg[] {
  // Count number of students in the selected classes
  const studentsInSelectedClasses = Object.entries(studentStats)
    .filter(([_, stats]) => 
      // If no classes are selected, include all students
      // Otherwise, only include students from selected classes
      selectedClasses.length === 0 || selectedClasses.includes(stats.klasse)
    ).length;
  
  // Ensure we have at least 1 student to avoid division by zero
  const studentCount = Math.max(1, studentsInSelectedClasses);
  
  console.log(`Calculating student averages across ${studentCount} students in selected classes`);
  
  if (studentCount === 0) {
    console.warn("No students found for average calculation");
    return timeSeriesData;
  }

  // Check if we have cached data for all students
  const hasCachedData = Object.keys(cachedAllStudentsData).length > 0;
  
  // If we don't have cached data, check if this is all students data
  if (!hasCachedData) {
    const isAllStudentsData = timeSeriesData.length > 0 && 
                             timeSeriesData[0].isAllStudentsData;
    
    if (isAllStudentsData) {
      console.log("Caching all students data for future average calculations");
      timeSeriesData.forEach(point => {
        // Store data in cache with unique keys by time point
        cachedAllStudentsData[`verspaetungen_${point.name}`] = point.verspaetungen;
        cachedAllStudentsData[`fehlzeiten_${point.name}`] = point.fehlzeiten;
        cachedAllStudentsData[`fehlzeitenEntsch_${point.name}`] = point.fehlzeitenEntsch;
        cachedAllStudentsData[`fehlzeitenUnentsch_${point.name}`] = point.fehlzeitenUnentsch;
      });
    }
  }
  
  // Enhance time series data with student averages
  return timeSeriesData.map(point => {
    // Copy the point to avoid modifying the original
    const enrichedPoint: TimeSeriesDataPointWithStudentAvg = { ...point };
    
    // Use cached total values if available for consistent averages across all views
    if (hasCachedData) {
      enrichedPoint.verspaetungenStudentAvg = 
        (cachedAllStudentsData[`verspaetungen_${point.name}`] || 0) / studentCount;
      
      enrichedPoint.fehlzeitenStudentAvg = 
        (cachedAllStudentsData[`fehlzeiten_${point.name}`] || 0) / studentCount;
      
      enrichedPoint.fehlzeitenEntschStudentAvg = 
        (cachedAllStudentsData[`fehlzeitenEntsch_${point.name}`] || 0) / studentCount;
      
      enrichedPoint.fehlzeitenUnentschStudentAvg = 
        (cachedAllStudentsData[`fehlzeitenUnentsch_${point.name}`] || 0) / studentCount;
    } else {
      // Fallback: If cache isn't available, use current values
      // This is less accurate but provides some values
      console.warn("Using fallback calculation without complete data");
      enrichedPoint.verspaetungenStudentAvg = point.verspaetungen / studentCount;
      enrichedPoint.fehlzeitenStudentAvg = point.fehlzeiten / studentCount;
      enrichedPoint.fehlzeitenEntschStudentAvg = point.fehlzeitenEntsch / studentCount;
      enrichedPoint.fehlzeitenUnentschStudentAvg = point.fehlzeitenUnentsch / studentCount;
      
      // Mark this data for potential future cache updates
      if (!point.isAllStudentsData && 
          !timeSeriesData.some(p => p.isAllStudentsData) && 
          timeSeriesData.length > 0) {
        enrichedPoint.isAllStudentsData = true;
      }
    }
    
    // Store student count for reference
    enrichedPoint.studentCount = studentCount;
    enrichedPoint.totalStudentCount = studentCount;
    
    return enrichedPoint;
  });
}

/**
 * Updates the cache with all students data.
 * Call this when "All Students" view is displayed or when data is refreshed.
 * 
 * @param allStudentsData The data for all students
 */
export function updateAllStudentsCache(allStudentsData: any[]): void {
  // Clear existing cache and add new data
  cachedAllStudentsData = {};
  
  allStudentsData.forEach(point => {
    cachedAllStudentsData[`verspaetungen_${point.name}`] = point.verspaetungen;
    cachedAllStudentsData[`fehlzeiten_${point.name}`] = point.fehlzeiten;
    cachedAllStudentsData[`fehlzeitenEntsch_${point.name}`] = point.fehlzeitenEntsch;
    cachedAllStudentsData[`fehlzeitenUnentsch_${point.name}`] = point.fehlzeitenUnentsch;
  });
  
  console.log("Updated cache with all students data, entries:", Object.keys(cachedAllStudentsData).length);
}

/**
 * Clears the cache of all students data.
 * Call when base data changes (e.g., file upload, date range change).
 */
export function clearAllStudentsCache(): void {
  cachedAllStudentsData = {};
  console.log("Cleared all students data cache");
}

/**
 * Determines if student averages should be shown
 * 
 * @param selectedStudent The currently selected individual student, if any
 * @param showAverageComparison Force show the average comparison
 * @returns true if student averages should be shown
 */
export function shouldShowStudentAverages(
  selectedStudent?: string,
  showAverageComparison: boolean = false
): boolean {
  // Show student averages when:
  // 1. The user has specifically enabled average comparison OR
  // 2. A single student is selected (for automatic comparison)
  return showAverageComparison || !!selectedStudent;
}