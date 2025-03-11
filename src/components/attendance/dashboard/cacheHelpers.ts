// src/components/attendance/dashboard/cacheHelpers.ts
import { resetStudentCache } from './studentAverages';
import { resetClassCache } from './classAverages';
import { resetMovingAverageCache } from './movingAverageUtils';
import { resetRegressionCache } from './regressionUtils';

/**
 * Resets all caches when a new report is loaded.
 * This ensures calculations use the correct student/class counts from the new report.
 */
export function resetAllCaches() {
  resetStudentCache();
  resetClassCache();
  resetMovingAverageCache();
  resetRegressionCache();
  console.log("Reset all dashboard caches for new report data");
}