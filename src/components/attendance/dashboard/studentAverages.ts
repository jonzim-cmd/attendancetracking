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
// NEUE VARIABLE: Cache für die Anzahl aller Schüler im System
let cachedTotalStudentCount: number = 0;

/**
 * Calculates average values per student for each time series data point.
 * The averages are always calculated based on the total student population
 * regardless of any selected classes or filters.
 * 
 * @param timeSeriesData The time series data for the current selection
 * @param studentStats Statistics data for all students
 * @param selectedClasses Array of selected class names (only used for metadata, not for calculations)
 * @returns Time series data with added student average values
 */
export function calculateStudentAverages(
  timeSeriesData: any[],
  studentStats: Record<string, StudentStats>,
  selectedClasses: string[] = []
): TimeSeriesDataPointWithStudentAvg[] {
  // KRITISCHE ÄNDERUNG: Immer die Gesamtanzahl der Schüler im System verwenden
  // Das ist die Anzahl aller Schülereinträge in studentStats
  const totalStudentCount = Math.max(cachedTotalStudentCount, Object.keys(studentStats).length);
  
  // Wenn die neue Anzahl größer ist als die gespeicherte, aktualisiere den Cache
  if (totalStudentCount > cachedTotalStudentCount) {
    cachedTotalStudentCount = totalStudentCount;
    console.log(`Updated cached total student count: ${cachedTotalStudentCount}`);
  }
  
  // KRITISCHE ÄNDERUNG: Immer die Gesamtzahl aller Schüler für die Durchschnittsberechnung verwenden
  // Die selectedClasses werden KOMPLETT IGNORIERT
  const studentCount = totalStudentCount; // Verwende IMMER die Gesamtzahl aller Schüler
  
  console.log(`Calculating student averages across ALL ${studentCount} students (instead of just ${
    Object.entries(studentStats).filter(([_, stats]) => 
      selectedClasses.length === 0 || selectedClasses.includes(stats.klasse)
    ).length
  } from selected classes)`);
  
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
    
    // Store student count for reference - WICHTIG: immer beide Werte setzen!
    enrichedPoint.studentCount = studentCount;
    enrichedPoint.totalStudentCount = totalStudentCount;
    
    return enrichedPoint;
  });
}

/**
 * Updates the cache with all students data.
 * Call this when "All Students" view is displayed or when data is refreshed.
 * 
 * @param allStudentsData The data for all students
 * @param totalStudents Optional parameter to set the total number of students in the system
 */
export function updateAllStudentsCache(allStudentsData: any[], totalStudents?: number): void {
  // Clear existing cache and add new data
  cachedAllStudentsData = {};
  
  allStudentsData.forEach(point => {
    cachedAllStudentsData[`verspaetungen_${point.name}`] = point.verspaetungen;
    cachedAllStudentsData[`fehlzeiten_${point.name}`] = point.fehlzeiten;
    cachedAllStudentsData[`fehlzeitenEntsch_${point.name}`] = point.fehlzeitenEntsch;
    cachedAllStudentsData[`fehlzeitenUnentsch_${point.name}`] = point.fehlzeitenUnentsch;
  });
  
  // KRITISCH: Wenn die Gesamtzahl der Schüler übergeben wurde, immer den Cache aktualisieren
  if (totalStudents && totalStudents > 0) {
    // Aber nur, wenn totalStudents größer als der aktuelle Wert ist
    if (totalStudents > cachedTotalStudentCount) {
      cachedTotalStudentCount = totalStudents;
      console.log(`Updated cached total student count to: ${cachedTotalStudentCount}`);
    } else {
      console.log(`Kept cached total student count at: ${cachedTotalStudentCount} (new value was ${totalStudents})`);
    }
  }
  
  console.log("Updated cache with all students data, entries:", Object.keys(cachedAllStudentsData).length);
}

/**
 * Completely resets the student cache.
 * This MUST be called whenever a new report is loaded to ensure calculations 
 * use the correct student count for the new report.
 */
export function resetStudentCache(): void {
  cachedTotalStudentCount = 0;
  cachedAllStudentsData = {};
  console.log("Reset student averages cache - total student count is now 0");
}

/**
 * Clears the cache of all students data.
 * Call when base data changes (e.g., file upload, date range change).
 */
export function clearAllStudentsCache(): void {
  cachedAllStudentsData = {};
  // Wir löschen NICHT cachedTotalStudentCount, damit die Gesamtzahl 
  // der Schüler über Resets hinweg erhalten bleibt
  console.log("Cleared all students data cache, but preserved total student count:", cachedTotalStudentCount);
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
  // ANGEPASST: Immer true zurückgeben, um die Anzeige von Schülerdurchschnitten zu ermöglichen
  // Die Steuerung der tatsächlichen Anzeige erfolgt über die Checkboxen in der UI
  return true;
}
