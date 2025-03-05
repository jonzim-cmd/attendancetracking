// Utility functions for calculating and evaluating critical patterns/alerts

import { StudentStats } from '@/types';

// Calculate the threshold for late arrivals based on the number of weeks
export const calculateLateThreshold = (weeks: number): number => {
  // Round up half weeks
  const roundedWeeks = Math.ceil(weeks);
  
  if (roundedWeeks >= 4) {
    return 5; // 5 late arrivals for 4+ weeks
  } else if (roundedWeeks >= 2) {
    return 3; // 3 late arrivals for 2-3 weeks
  } else {
    return 2; // Minimum threshold for shorter periods
  }
};

// Calculate school days in a period (simplified version without holidays)
export const calculateSchoolDays = (weeks: number): number => {
  // Assuming 5 school days per week
  return weeks * 5;
};

// Check if there's a significant trend deterioration (50% or more increase)
export const hasSignificantDeteriorationTrend = (
  currentPeriod: { verspaetungen: number; fehlzeiten: number },
  previousPeriod: { verspaetungen: number; fehlzeiten: number }
): { 
  hasVerspaetungenDeteorioration: boolean; 
  hasFehlzeitenDeteorioration: boolean;
  verspaetungenChange: number;
  fehlzeitenChange: number;
} => {
  // Calculate percentage changes
  const verspaetungenChange = previousPeriod.verspaetungen > 0
    ? ((currentPeriod.verspaetungen - previousPeriod.verspaetungen) / previousPeriod.verspaetungen) * 100
    : currentPeriod.verspaetungen > 0 ? 100 : 0;
  
  const fehlzeitenChange = previousPeriod.fehlzeiten > 0
    ? ((currentPeriod.fehlzeiten - previousPeriod.fehlzeiten) / previousPeriod.fehlzeiten) * 100
    : currentPeriod.fehlzeiten > 0 ? 100 : 0;
  
  // Check if there's a 50% or more increase
  return {
    hasVerspaetungenDeteorioration: verspaetungenChange >= 50,
    hasFehlzeitenDeteorioration: fehlzeitenChange >= 50,
    verspaetungenChange,
    fehlzeitenChange
  };
};

// Calculate class average for comparison
export const calculateClassAverage = (
  students: [string, StudentStats][],
  studentClassName: string
): { 
  averageVerspaetungen: number; 
  averageFehlzeiten: number;
} => {
  // Filter students from the same class
  const classmates = students.filter(([_, stats]) => stats.klasse === studentClassName);
  
  if (classmates.length === 0) {
    return { averageVerspaetungen: 0, averageFehlzeiten: 0 };
  }
  
  // Calculate averages
  const totalVerspaetungen = classmates.reduce(
    (sum, [_, stats]) => sum + stats.verspaetungen_unentsch + stats.verspaetungen_entsch + stats.verspaetungen_offen, 
    0
  );
  
  const totalFehlzeiten = classmates.reduce(
    (sum, [_, stats]) => sum + stats.fehlzeiten_unentsch + stats.fehlzeiten_entsch + stats.fehlzeiten_offen, 
    0
  );
  
  return {
    averageVerspaetungen: totalVerspaetungen / classmates.length,
    averageFehlzeiten: totalFehlzeiten / classmates.length
  };
};

// Check if any week exceeds the weekly threshold for late arrivals
export const hasWeekWithExcessiveLateArrivals = (
  weeklyData: number[],
  weeklyThreshold: number = 3
): boolean => {
  return weeklyData.some(weekValue => weekValue > weeklyThreshold);
};

// Get the maximum number of late arrivals in any week
export const getMaxWeeklyLateArrivals = (weeklyData: number[]): number => {
  return Math.max(...weeklyData, 0);
};

// Calculate unexcused absence rate
export const calculateUnexcusedRate = (
  unexcusedAbsences: number,
  totalAbsences: number
): number => {
  if (totalAbsences === 0) return 0;
  return (unexcusedAbsences / totalAbsences) * 100;
};