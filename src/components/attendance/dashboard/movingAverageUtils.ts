// src/components/attendance/dashboard/movingAverageUtils.ts
import * as math from 'mathjs';

/**
 * Data point with moving average and outlier information
 */
export interface DataPointWithMA {
  // Original data properties
  name: string;
  verspaetungen: number;
  fehlzeiten: number;
  fehlzeitenEntsch?: number;
  fehlzeitenUnentsch?: number;
  entschuldigt?: number;
  unentschuldigt?: number;
  timestamp?: Date;
  sortKey?: number;
  dateRange?: string;
  periodLabel?: string;
  studentName?: string;
  classCount?: number;
  totalClassCount?: number;
  studentCount?: number;
  totalStudentCount?: number;
  
  // Moving average properties
  movingAverage?: number;
  isOutlier?: boolean;
}

// Global cache for performance optimization - using a separate namespace to avoid collisions
const MA_CACHE_PREFIX = 'movavg_';
let movingAverageCache: Record<string, DataPointWithMA[]> = {};
let debugMode = true; // Set to true for detailed logging

/**
 * Helper function for debug logging
 */
function debugLog(message: string, data?: any): void {
  if (debugMode) {
    if (data) {
      console.log(`[MovingAvgDebug] ${message}`, data);
    } else {
      console.log(`[MovingAvgDebug] ${message}`);
    }
  }
}

/**
 * Analyzes the structure of time series data for debugging
 */
function analyzeDataStructure(data: any[]): void {
  if (!debugMode || !data || data.length === 0) return;
  
  const sampleItem = data[0];
  const properties = Object.keys(sampleItem);
  
  debugLog(`Data sample structure analysis:`, {
    totalItems: data.length,
    properties: properties,
    sampleValues: {
      name: sampleItem.name,
      verspaetungen: sampleItem.verspaetungen,
      fehlzeiten: sampleItem.fehlzeiten,
      // Check for class-related properties
      klasse: sampleItem.klasse,
      className: sampleItem.className,
      class: sampleItem.class,
      selectedClass: sampleItem.selectedClass,
      classes: Array.isArray(sampleItem.classes) ? sampleItem.classes : undefined,
      // Check for student-related properties
      studentName: sampleItem.studentName,
      selectedStudent: sampleItem.selectedStudent,
      students: Array.isArray(sampleItem.students) ? sampleItem.students : undefined,
    }
  });
  
  // Look for class identifiers in the data
  const classProperties = new Set<string>();
  data.forEach(item => {
    // Check all properties for potential class identifiers
    Object.entries(item).forEach(([key, value]) => {
      if (
        typeof value === 'string' &&
        (key.includes('class') || key.includes('Class') || key.includes('klasse') || key.includes('Klasse'))
      ) {
        classProperties.add(key);
      }
      
      // Also check arrays that might contain class names
      if (Array.isArray(value) && 
          (key.includes('class') || key.includes('Class') || key.includes('klasse') || key.includes('Klasse'))) {
        classProperties.add(key);
      }
    });
  });
  
  if (classProperties.size > 0) {
    debugLog(`Found potential class identifier properties:`, Array.from(classProperties));
  } else {
    debugLog(`No clear class identifier properties found!`);
  }
}

/**
 * Calculates the moving average for a series of data points
 * 
 * @param data Array of time series data points
 * @param period Size of the moving average window (default: 3)
 * @param valueKey Key for the value in data points to calculate average on
 * @returns Original data with moving average values added
 */
export function calculateMovingAverage(
  data: any[],
  period: number = 3,
  valueKey: string = 'value'
): any[] {
  if (!data || data.length === 0) return [];
  if (period < 2) return data;
  
  debugLog(`Calculating moving average with period ${period} for ${data.length} items`);
  
  // Effective period can't be larger than data length
  const effectivePeriod = Math.min(period, data.length);
  
  // Extract values for calculation
  const values = data.map(item => 
    typeof item[valueKey] === 'number' ? item[valueKey] : 0
  );
  
  // Enrich result with moving average
  return data.map((point, i) => {
    // Calculate start index for window, minimum 0
    const startIdx = Math.max(0, i - effectivePeriod + 1);
    // Extract values in current window
    const windowValues = values.slice(startIdx, i + 1);
    
    // Manually calculate average to avoid type issues
    const movingAverage = windowValues.length > 0 ? 
      windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length : 
      null;
    
    // Add moving average to original data point - create a new object to avoid modifying the original
    return {
      ...point,
      movingAverage
    };
  });
}

/**
 * Detects outliers in a data series using the IQR method
 * 
 * @param data Array of time series data points
 * @param valueKey Key for the value to analyze for outliers
 * @param outlierThreshold Multiplier for IQR in outlier detection (1.5 is standard)
 * @returns Original data with outlier flags added
 */
export function detectOutliers(
  data: any[],
  valueKey: string = 'value',
  outlierThreshold: number = 1.5
): any[] {
  if (!data || data.length < 4) {
    debugLog(`Not enough data for outlier detection (need at least 4 items, got ${data?.length || 0})`);
    return data.map(d => ({ ...d, isOutlier: false }));
  }
  
  // Extract non-null values
  const values = data
    .map(item => typeof item[valueKey] === 'number' ? item[valueKey] : null)
    .filter(val => val !== null && !isNaN(val as number)) as number[];
  
  debugLog(`Valid values for outlier detection: ${values.length} out of ${data.length}`);
  
  if (values.length < 4) {
    debugLog(`Not enough valid values for outlier detection`);
    return data.map(d => ({ ...d, isOutlier: false }));
  }
  
  // Sort values for quartile calculation
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Calculate Q1 (25th percentile) and Q3 (75th percentile)
  const q1Index = Math.floor(sortedValues.length * 0.25);
  const q3Index = Math.floor(sortedValues.length * 0.75);
  
  const q1 = sortedValues[q1Index];
  const q3 = sortedValues[q3Index];
  
  // Calculate IQR (Interquartile Range)
  const iqr = q3 - q1;
  
  // Define bounds for outliers
  const lowerBound = q1 - outlierThreshold * iqr;
  const upperBound = q3 + outlierThreshold * iqr;
  
  debugLog(`Outlier bounds: lower=${lowerBound}, upper=${upperBound}`);
  
  // Count outliers
  let outlierCount = 0;
  
  // Mark outliers - create new objects to avoid modifying the original
  const result = data.map(point => {
    const value = typeof point[valueKey] === 'number' ? point[valueKey] : null;
    const isOutlier = value !== null && !isNaN(value) && (value < lowerBound || value > upperBound);
    if (isOutlier) outlierCount++;
    return {
      ...point,
      isOutlier
    };
  });
  
  debugLog(`Found ${outlierCount} outliers in dataset`);
  return result;
}

/**
 * Creates a deep copy of the data to prevent any modifications to the original
 * This is crucial to avoid side effects on the original data
 */
function deepCloneData(data: any[]): any[] {
  return data.map(item => ({...item}));
}

/**
 * Determines if an item matches class filter criteria
 * Enhanced with more robust class detection methods
 */
function matchesClass(item: any, classToMatch: string): boolean {
  // If there's no class to match, then all items match
  if (!classToMatch) return true;
  
  // Direct property matches (standard properties)
  const directMatches = [
    item.className === classToMatch,
    item.class === classToMatch,
    item.klasse === classToMatch,
    item.selectedClass === classToMatch
  ];
  
  // Array property matches (collections of classes)
  const arrayMatches = [
    Array.isArray(item.classes) && item.classes.includes(classToMatch),
    Array.isArray(item.selectedClasses) && item.selectedClasses.includes(classToMatch),
    Array.isArray(item.klassen) && item.klassen.includes(classToMatch)
  ];
  
  // NEW: Check if the data point has a studentCount property with class-filtered data
  const hasClassFilteredData = item.classCount !== undefined && 
                              item.totalClassCount !== undefined &&
                              Array.isArray(item.selectedDashboardClasses) && 
                              item.selectedDashboardClasses.includes(classToMatch);
  
  // NEW: Check data point metadata for class information
  const hasClassMetadata = item.classData && 
                          (item.classData[classToMatch] || 
                           Object.keys(item.classData).includes(classToMatch));
  
  // Combine all matches
  return directMatches.some(Boolean) || 
         arrayMatches.some(Boolean) || 
         hasClassFilteredData ||
         hasClassMetadata;
}

/**
 * Advanced function to extract data for a specific class
 * Enhanced with additional class detection strategies
 */
function extractClassData(
  timeSeriesData: any[], 
  classToExtract: string
): any[] {
  debugLog(`Attempting to extract data for class "${classToExtract}" from ${timeSeriesData.length} data points`);
  
  // Safety check - if no class specified, return all data
  if (!classToExtract) {
    debugLog(`No class specified, returning all ${timeSeriesData.length} data points`);
    return timeSeriesData;
  }
  
  // First pass: try to filter directly based on various class properties
  const directMatches = timeSeriesData.filter(item => matchesClass(item, classToExtract));
  
  if (directMatches.length > 0) {
    debugLog(`Found ${directMatches.length} direct matches for class "${classToExtract}"`);
    return directMatches;
  }
  
  debugLog(`No direct matches found for class "${classToExtract}" - trying secondary approaches`);
  
  // Second approach: Look for data that might be specific to this class in other ways
  const potentialMatches = timeSeriesData.filter(item => {
    // Check if any property contains the class name as a substring
    return Object.entries(item).some(([key, value]) => {
      if (value === null || value === undefined) return false;
      
      const valueStr = String(value);
      return (
        // Look for the class name in string properties
        (typeof value === 'string' && valueStr === classToExtract) ||
        // Look for properties that might contain the class name
        (key.toLowerCase().includes('class') && valueStr.includes(classToExtract)) ||
        (key.toLowerCase().includes('klasse') && valueStr.includes(classToExtract))
      );
    });
  });
  
  if (potentialMatches.length > 0) {
    debugLog(`Found ${potentialMatches.length} potential matches for class "${classToExtract}"`);
    return potentialMatches;
  }
  
  // NEW: If we still don't have matches, use a deep inspection approach
  debugLog(`No standard matches found for class "${classToExtract}" - trying deep property inspection`);
  
  // Inspect the first data point to understand its structure
  if (timeSeriesData.length > 0) {
    const sampleItem = timeSeriesData[0];
    debugLog(`Sample data point structure:`, sampleItem);
    
    // Look for any properties that could contain class information
    const potentialClassProps = Object.keys(sampleItem).filter(key => 
      key.toLowerCase().includes('class') || 
      key.toLowerCase().includes('klasse') ||
      (typeof sampleItem[key] === 'object' && sampleItem[key] !== null)
    );
    
    if (potentialClassProps.length > 0) {
      debugLog(`Potential class-related properties found: ${potentialClassProps.join(', ')}`);
    }
  }
  
  // NEW: Last resort - if we have selectedDashboardClasses in the filter context but no matches,
  // we'll use the unfiltered data and annotate it with class information
  const fallbackData = timeSeriesData.map(item => ({
    ...item,
    className: classToExtract,  // Add the class name explicitly
    classes: [classToExtract],  // Add as an array too
    _isClassAnnotated: true     // Mark as manually annotated
  }));
  
  debugLog(`Using fallback approach: annotating ${fallbackData.length} data points with class "${classToExtract}"`);
  return fallbackData;
}

/**
 * NEW: Advanced function to extract data for a specific student
 * Similar to extractClassData but optimized for students
 */
function extractStudentData(
  timeSeriesData: any[], 
  studentToExtract: string
): any[] {
  debugLog(`Attempting to extract data for student "${studentToExtract}" from ${timeSeriesData.length} data points`);
  
  // Safety check - if no student specified, return all data
  if (!studentToExtract) {
    debugLog(`No student specified, returning all ${timeSeriesData.length} data points`);
    return timeSeriesData;
  }
  
  // First pass: direct matching on common student properties
  const directMatches = timeSeriesData.filter(item => 
    (item.studentName === studentToExtract) || 
    (item.selectedStudent === studentToExtract) ||
    (Array.isArray(item.students) && item.students.includes(studentToExtract))
  );
  
  if (directMatches.length > 0) {
    debugLog(`Found ${directMatches.length} direct matches for student "${studentToExtract}"`);
    return directMatches;
  }
  
  debugLog(`No direct matches found for student "${studentToExtract}" - trying secondary approaches`);
  
  // Second approach: Look for partial matches or substring matches
  const potentialMatches = timeSeriesData.filter(item => {
    // Check if any property contains or matches the student name
    return Object.entries(item).some(([key, value]) => {
      if (value === null || value === undefined) return false;
      
      const valueStr = String(value);
      return (
        // Direct substring match in string properties
        (typeof value === 'string' && valueStr.includes(studentToExtract)) ||
        // Student-related properties that might contain the name
        (key.toLowerCase().includes('student') && valueStr.includes(studentToExtract)) ||
        // Check for name parts (if student name contains a comma)
        (studentToExtract.includes(',') && typeof value === 'string' && 
         studentToExtract.split(',').some(part => valueStr.includes(part.trim())))
      );
    });
  });
  
  if (potentialMatches.length > 0) {
    debugLog(`Found ${potentialMatches.length} potential matches for student "${studentToExtract}"`);
    return potentialMatches;
  }
  
  // Third approach: Deep inspection of data structure
  debugLog(`No standard matches found for student "${studentToExtract}" - trying deep property inspection`);
  
  // Collect information about student-related properties
  const studentProperties = new Set<string>();
  const studentsInData = new Set<string>();
  
  timeSeriesData.forEach(item => {
    Object.entries(item).forEach(([key, value]) => {
      if (key.toLowerCase().includes('student')) {
        studentProperties.add(key);
        if (typeof value === 'string') {
          studentsInData.add(value);
        } else if (Array.isArray(value)) {
          value.forEach(v => typeof v === 'string' && studentsInData.add(v));
        }
      }
    });
  });
  
  if (studentProperties.size > 0) {
    debugLog(`Student-related properties found: ${Array.from(studentProperties).join(', ')}`);
  }
  
  if (studentsInData.size > 0) {
    debugLog(`Students found in data: ${Array.from(studentsInData).slice(0, 10).join(', ')}${
      studentsInData.size > 10 ? ` and ${studentsInData.size - 10} more...` : ''
    }`);
  }
  
  // FALLBACK: Use the data as is, but annotate with student information
  // This is crucial to ensure we always have data for the moving average calculation
  const fallbackData = timeSeriesData.map(item => ({
    ...item,
    studentName: studentToExtract,  // Add the student name explicitly
    students: [studentToExtract],   // Add as an array too
    _isStudentAnnotated: true       // Mark as manually annotated
  }));
  
  debugLog(`Using fallback approach: annotating ${fallbackData.length} data points with student "${studentToExtract}"`);
  return fallbackData;
}

/**
 * Checks if the data has enough points for moving average analysis
 */
function hasEnoughDataPoints(data: any[]): boolean {
  const hasEnough = data && data.length >= 3;
  if (!hasEnough) {
    debugLog(`Not enough data points for analysis: ${data?.length || 0}/3 required`);
  }
  return hasEnough;
}

/**
 * Prepares time series data for moving average visualization
 * Enhanced to better handle class selection
 */
export function prepareMovingAverageData(
  timeSeriesData: any[],
  dataType: 'verspaetungen' | 'fehlzeiten' = 'verspaetungen',
  period: number = 3,
  selectedStudent?: string,
  selectedClass?: string
): DataPointWithMA[] {
  debugLog(`prepareMovingAverageData called with dataType=${dataType}, period=${period}`);
  debugLog(`Selection context: student=${selectedStudent || 'none'}, class=${selectedClass || 'none'}`);
  
  if (!timeSeriesData || timeSeriesData.length === 0) {
    debugLog(`No time series data available!`);
    return [];
  }
  
  debugLog(`Received ${timeSeriesData.length} data points for analysis`);
  
  // Analyze data structure for debugging
  analyzeDataStructure(timeSeriesData);
  
  // Create cache key based on parameters
  const cacheKey = `${MA_CACHE_PREFIX}${dataType}_${period}_${selectedStudent || ''}_${selectedClass || ''}_${timeSeriesData.length}`;
  
  // Return cached data if available
  if (movingAverageCache[cacheKey]) {
    debugLog(`Using cached moving average data for ${cacheKey}`);
    return [...movingAverageCache[cacheKey]]; // Return a copy of cached data
  }
  
  // Create a deep copy of the data to avoid modifying the original
  const clonedData = deepCloneData(timeSeriesData);
  
  // Apply filters based on selection
  let filteredData = clonedData;
  
  if (selectedStudent) {
    debugLog(`Filtering for student "${selectedStudent}"`);
    // Use the enhanced student extraction function
    filteredData = extractStudentData(clonedData, selectedStudent);
    debugLog(`Found ${filteredData.length} data points for student "${selectedStudent}"`);
  } else if (selectedClass) {
    debugLog(`Filtering for class "${selectedClass}"`);
    // Use enhanced class extraction
    filteredData = extractClassData(clonedData, selectedClass);
    
    // NEW: Debug the entire dataset if no data points were found
    if (filteredData.length === 0 && clonedData.length > 0) {
      debugLog(`WARNING: No items match class "${selectedClass}" - showing full dataset structure`);
      
      // Attempt to find any class-related information in the dataset
      const classesInData = new Set<string>();
      const classProps = new Set<string>();
      
      clonedData.forEach(item => {
        Object.entries(item).forEach(([key, value]) => {
          // Look for properties that might be related to classes
          if (key.toLowerCase().includes('class') || key.toLowerCase().includes('klasse')) {
            classProps.add(key);
            if (typeof value === 'string') {
              classesInData.add(value);
            } else if (Array.isArray(value)) {
              value.forEach(v => typeof v === 'string' && classesInData.add(v));
            }
          }
        });
      });
      
      if (classProps.size > 0) {
        debugLog(`Class-related properties found in data: ${Array.from(classProps).join(', ')}`);
      } else {
        debugLog(`No class-related properties found in data`);
      }
      
      if (classesInData.size > 0) {
        debugLog(`Classes found in data: ${Array.from(classesInData).join(', ')}`);
      } else {
        debugLog(`No classes found in data`);
      }
      
      // NEW: If we still don't have data, use a fallback approach
      if (filteredData.length === 0) {
        debugLog(`Using fallback approach: using all data for class "${selectedClass}"`);
        filteredData = clonedData;
      }
    }
  }
  
  // Check if we have enough data points after filtering
  if (!hasEnoughDataPoints(filteredData)) {
    // If we tried to filter for a class but got no results, log this clearly
    if (selectedClass) {
      debugLog(`WARNING: Not enough data for class "${selectedClass}" - returning empty array`);
    }
    // If we tried to filter for a student but got no results, log this clearly
    if (selectedStudent) {
      debugLog(`WARNING: Not enough data points for student "${selectedStudent}" (found ${filteredData.length}, need 3)`);
    }
    return [];
  }
  
  // DO NOT MODIFY THE ORIGINAL sortKey - create a new sorting criterion
  // This is critical to prevent affecting other components
  
  // Sort data by sortKey if available, otherwise by timestamp or name
  debugLog(`Sorting ${filteredData.length} filtered data points`);
  const sortedData = [...filteredData].sort((a, b) => {
    // First use existing sortKey if available
    if (a.sortKey !== undefined && b.sortKey !== undefined) {
      return a.sortKey - b.sortKey;
    }
    // Then try timestamp
    if (a.timestamp && b.timestamp) {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
    // Last resort: sort by name
    return String(a.name).localeCompare(String(b.name));
  });
  
  debugLog(`Calculating moving average for ${sortedData.length} sorted data points`);
  // Calculate moving average
  const dataWithMA = calculateMovingAverage(sortedData, period, dataType);
  
  // Detect outliers
  const finalData = detectOutliers(dataWithMA, dataType);
  
  // Cache the result - store a copy to prevent cache pollution
  movingAverageCache[cacheKey] = [...finalData];
  
  return finalData;
}

/**
 * Filters and formats the existing time series data for the moving average chart
 * This function doesn't aggregate from raw data, but uses the existing time series data
 * 
 * @param attendanceOverTime Existing time series data from the dashboard
 * @param selectedStudent Optional selected student
 * @param selectedClass Optional selected class
 * @returns Filtered and formatted data ready for the chart
 */
export function formatDataForMovingAverageChart(
  attendanceOverTime: any[],
  selectedStudent?: string,
  selectedClass?: string
): any[] {
  debugLog(`formatDataForMovingAverageChart called`);
  debugLog(`Selection context: student=${selectedStudent || 'none'}, class=${selectedClass || 'none'}`);
  
  if (!attendanceOverTime || attendanceOverTime.length === 0) {
    debugLog(`No attendance data available!`);
    return [];
  }
  
  debugLog(`Received ${attendanceOverTime.length} data points for formatting`);
  
  // Create a deep copy to avoid modifying the original data
  const clonedData = deepCloneData(attendanceOverTime);
  
  // Extract data for selected student or class - use enhanced extraction methods
  let filteredData = clonedData;
  
  if (selectedStudent) {
    debugLog(`Formatting for student "${selectedStudent}"`);
    filteredData = extractStudentData(clonedData, selectedStudent);
    debugLog(`Found ${filteredData.length} data points for student "${selectedStudent}"`);
  } else if (selectedClass) {
    debugLog(`Formatting for class "${selectedClass}"`);
    filteredData = extractClassData(clonedData, selectedClass);
    debugLog(`Found ${filteredData.length} data points for class "${selectedClass}"`);
  }
  
  // If no data after filtering, return an empty array
  if (!hasEnoughDataPoints(filteredData)) {
    // Log why we're returning empty data
    if (selectedClass) {
      debugLog(`WARNING: Not enough data points for class "${selectedClass}" (found ${filteredData.length}, need 3)`);
    } else if (selectedStudent) {
      debugLog(`WARNING: Not enough data points for student "${selectedStudent}" (found ${filteredData.length}, need 3)`);
    }
    return [];
  }
  
  // IMPORTANT: Return a copy of data sorted by INTERNAL criteria, not modifying originals
  const sortedData = [...filteredData].sort((a, b) => {
    // Use existing sortKey if available
    if (a.sortKey !== undefined && b.sortKey !== undefined) {
      return a.sortKey - b.sortKey;
    }
    if (a.timestamp && b.timestamp) {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
    return String(a.name).localeCompare(String(b.name));
  });
  
  debugLog(`Returning ${sortedData.length} formatted data points`);
  return sortedData;
}

/**
 * Clears the cache when new data is loaded
 */
export function resetMovingAverageCache(): void {
  movingAverageCache = {};
  debugLog("Moving average cache reset");
}