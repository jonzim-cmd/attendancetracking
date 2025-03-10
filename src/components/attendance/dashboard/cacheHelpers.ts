// src/components/attendance/dashboard/cacheHelpers.ts
import { resetStudentCache } from './studentAverages';
import { resetClassCache } from './classAverages';

/**
 * Resets all caches when a new report is loaded.
 * This ensures calculations use the correct student/class counts from the new report.
 */
export function resetAllCaches() {
  resetStudentCache();
  resetClassCache();
  console.log("Reset all dashboard caches for new report data");
}