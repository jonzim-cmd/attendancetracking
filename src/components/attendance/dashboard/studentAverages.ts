// src/components/attendance/dashboard/studentAverages.ts
import { StudentStats } from '@/types';

/**
 * Interface for the time series data points with student averages
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
  isAllStudentsData?: boolean;

  // For individual student data
  studentName?: string;
}

// Cache for all students data
let cachedAllStudentsData: Record<string, number> = {};

/**
 * Calculates average values per student for each time series data point
 * 
 * @param timeSeriesData The time series data for the current selection
 * @param studentStats Statistics data for all students
 * @returns Time series data with added student average values
 */
export function calculateStudentAverages(
  timeSeriesData: any[],
  studentStats: Record<string, StudentStats>
): TimeSeriesDataPointWithStudentAvg[] {
  // Count total number of students in the system
  const studentCount = Object.keys(studentStats).length;
  
  if (studentCount === 0) {
    return timeSeriesData;
  }

  // Check if we have cached data for all students
  if (Object.keys(cachedAllStudentsData).length === 0) {
    // Cache data if this is all students data
    const isAllStudentsData = timeSeriesData.length > 0 && timeSeriesData[0].isAllStudentsData;
    
    if (isAllStudentsData) {
      timeSeriesData.forEach(point => {
        // Store data in cache with unique keys
        cachedAllStudentsData[`verspaetungen_${point.name}`] = point.verspaetungen;
        cachedAllStudentsData[`fehlzeiten_${point.name}`] = point.fehlzeiten;
        cachedAllStudentsData[`fehlzeitenEntsch_${point.name}`] = point.fehlzeitenEntsch;
        cachedAllStudentsData[`fehlzeitenUnentsch_${point.name}`] = point.fehlzeitenUnentsch;
      });
      
      console.log("Cached all students data for future average calculations");
    }
  }
  
  // Enhance time series data with student averages
  return timeSeriesData.map(point => {
    // Copy the point
    const enrichedPoint: TimeSeriesDataPointWithStudentAvg = { ...point };
    
    // Use cached total values if available
    if (Object.keys(cachedAllStudentsData).length > 0) {
      enrichedPoint.verspaetungenStudentAvg = 
        (cachedAllStudentsData[`verspaetungen_${point.name}`] || 0) / studentCount;
      
      enrichedPoint.fehlzeitenStudentAvg = 
        (cachedAllStudentsData[`fehlzeiten_${point.name}`] || 0) / studentCount;
      
      enrichedPoint.fehlzeitenEntschStudentAvg = 
        (cachedAllStudentsData[`fehlzeitenEntsch_${point.name}`] || 0) / studentCount;
      
      enrichedPoint.fehlzeitenUnentschStudentAvg = 
        (cachedAllStudentsData[`fehlzeitenUnentsch_${point.name}`] || 0) / studentCount;
    } else {
      // Fallback: use current values if cache is not available
      enrichedPoint.verspaetungenStudentAvg = point.verspaetungen / studentCount;
      enrichedPoint.fehlzeitenStudentAvg = point.fehlzeiten / studentCount;
      enrichedPoint.fehlzeitenEntschStudentAvg = point.fehlzeitenEntsch / studentCount;
      enrichedPoint.fehlzeitenUnentschStudentAvg = point.fehlzeitenUnentsch / studentCount;
      
      // Mark for future cache updates
      if (!point.isAllStudentsData && 
          !timeSeriesData.some(p => p.isAllStudentsData) && 
          timeSeriesData.length > 0) {
        enrichedPoint.isAllStudentsData = true;
      }
    }
    
    // Store student count
    enrichedPoint.studentCount = studentCount;
    enrichedPoint.totalStudentCount = studentCount;
    
    return enrichedPoint;
  });
}

/**
 * Updates the cache with all students data
 * Call this when "All Students" view is displayed
 * 
 * @param allStudentsData The data for all students
 */
export function updateAllStudentsCache(allStudentsData: any[]): void {
  cachedAllStudentsData = {};
  
  allStudentsData.forEach(point => {
    cachedAllStudentsData[`verspaetungen_${point.name}`] = point.verspaetungen;
    cachedAllStudentsData[`fehlzeiten_${point.name}`] = point.fehlzeiten;
    cachedAllStudentsData[`fehlzeitenEntsch_${point.name}`] = point.fehlzeitenEntsch;
    cachedAllStudentsData[`fehlzeitenUnentsch_${point.name}`] = point.fehlzeitenUnentsch;
  });
  
  console.log("Updated cache with all students data");
}

/**
 * Clears the cache of all students data
 * Call when base data changes
 */
export function clearAllStudentsCache(): void {
  cachedAllStudentsData = {};
  console.log("Cleared all students data cache");
}

/**
 * Determines if student averages should be shown
 * 
 * @param selectedStudent The currently selected student, if any
 * @param showAverageComparison Force show the average comparison
 * @returns true if student averages should be shown
 */
export function shouldShowStudentAverages(
  selectedStudent?: string,
  showAverageComparison: boolean = false
): boolean {
  // Show student averages when forced or when an individual student is selected
  return showAverageComparison || !!selectedStudent;
}