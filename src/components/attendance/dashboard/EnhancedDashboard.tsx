import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import TrendCharts from './TrendCharts';
import { 
  prepareWeeklyTrends, 
  prepareAbsenceTypes, 
  prepareDayOfWeekAnalysis,
  prepareAttendanceOverTime
} from './utils';
import { parseDate } from '@/lib/attendance-utils'; // Korrekter Import für parseDate
import { StudentStats } from '@/types';

// Korrigierte Hilfsfunktion für Klassendurchschnitte
const calculateClassAverages = (
  timeFrameData: any[],
  studentStats: Record<string, StudentStats>,
  weeklyDetailedData: Record<string, any>
): any[] => {
  // Frühzeitige Rückgabe bei fehlenden Daten
  if (!timeFrameData?.length || !studentStats || !weeklyDetailedData) {
    return [];
  }
  
  // Extrahiere Klasseninformationen
  const classesByStudent: Record<string, string> = {};
  const uniqueClasses: Set<string> = new Set();
  
  Object.entries(studentStats).forEach(([studentId, stats]) => {
    if (stats.klasse) {
      classesByStudent[studentId] = stats.klasse;
      uniqueClasses.add(stats.klasse);
    }
  });
  
  // Wenn keine Klassen vorhanden sind, leeres Array zurückgeben
  if (uniqueClasses.size === 0) {
    return [];
  }
  
  // Erstelle tiefe Kopie der Zeitreihen-Daten
  const referenceData = JSON.parse(JSON.stringify(timeFrameData));
  
  // Für jeden Zeitpunkt, berechne Durchschnittswerte pro Klasse
  referenceData.forEach((dataPoint: any) => {
    // Sammle Summen pro Klasse
    const classValues: Record<string, {
      verspaetungen: number,
      fehlzeiten: number
    }> = {};
    
    // Initialisiere für jede Klasse
    uniqueClasses.forEach(className => {
      classValues[className] = {
        verspaetungen: 0,
        fehlzeiten: 0
      };
    });
    
    // WICHTIG: Extrahiere den genauen Zeitbereich für diesen Datenpunkt
    const timeKey = dataPoint.name;
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    // Versuche den Zeitraum aus dateRange zu extrahieren
    if (dataPoint.dateRange) {
      const dateParts = dataPoint.dateRange.split(' - ');
      if (dateParts.length === 2) {
        // Format: dd.mm.yyyy
        const datePart1 = dateParts[0].trim();
        const datePart2 = dateParts[1].trim();
        
        // Prüfen, ob die Datumsformate gültig sind
        if (datePart1.match(/\d{2}\.\d{2}\.\d{4}/) && datePart2.match(/\d{2}\.\d{2}\.\d{4}/)) {
          startDate = parseDate(datePart1);
          endDate = parseDate(datePart2);
        }
      }
    }
    
    // Fallback-Logik für verschiedene Zeitformate
    if (!startDate || !endDate) {
      if (timeKey.startsWith('KW ')) {
        // Kalenderwochenformat: "KW XX"
        const weekMatch = timeKey.match(/KW (\d+)/);
        if (weekMatch) {
          const weekNum = parseInt(weekMatch[1]);
          // Aus dem ersten Datenpunkt könnten wir das Jahr ableiten
          // Vereinfachung: Nutze das aktuelle Jahr
          const currentYear = new Date().getFullYear();
          
          // TODO: Bessere KW-zu-Datum Logik implementieren
          
          // Stark vereinfachte Berechnung - nur für Demonstration
          startDate = new Date(currentYear, 0, 1 + (weekNum - 1) * 7);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
        }
      } else if (timeKey.match(/[A-Za-z]{3} \d{4}/)) {
        // Monatsformat: "MMM YYYY" (z.B. "Jan 2023")
        const monthYear = timeKey.split(' ');
        const monthStr = monthYear[0];
        const year = parseInt(monthYear[1]);
        
        const monthIdx = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                         .findIndex(m => m === monthStr);
        
        if (monthIdx >= 0) {
          startDate = new Date(year, monthIdx, 1);
          endDate = new Date(year, monthIdx + 1, 0); // Letzter Tag des Monats
        }
      }
    }
    
    // Wenn wir keinen gültigen Zeitraum haben, überspringen
    if (!startDate || !endDate) {
      console.warn(`Konnte keinen Zeitraum für Datenpunkt ${timeKey} ermitteln`);
      // Standardwerte für diesen Datenpunkt setzen, damit die Linie trotzdem angezeigt wird
      dataPoint.ref_verspaetungen = 0;
      dataPoint.ref_fehlzeiten = 0;
      return;
    }
    
    // Sichere Referenzen zu den Datumsobjekten
    const validStartDate = startDate;
    const validEndDate = endDate;
    
    // Suche nach Einträgen für diesen Zeitpunkt
    Object.entries(weeklyDetailedData).forEach(([studentId, details]) => {
      if (!details) return;
      
      const className = classesByStudent[studentId];
      if (!className) return;
      
      // WICHTIG: Hier zählen wir tatsächlich die Einträge für diesen Zeitraum
      
      // Zähle Verspätungen für diesen Zeitraum
      const verspaetungenEntries = details.verspaetungen_unentsch || [];
      const matchingVerspaetungen = verspaetungenEntries.filter((entry: any) => {
        if (!entry.datum) return false;
        const entryDate = typeof entry.datum === 'string' ? parseDate(entry.datum) : entry.datum;
        return entryDate >= validStartDate && entryDate <= validEndDate;
      }).length;
      
      // Zähle unentschuldigte Fehlzeiten für diesen Zeitraum
      const fehlzeitenUnentschEntries = details.fehlzeiten_unentsch || [];
      const matchingFehlzeitenUnentsch = fehlzeitenUnentschEntries.filter((entry: any) => {
        if (!entry.datum) return false;
        const entryDate = typeof entry.datum === 'string' ? parseDate(entry.datum) : entry.datum;
        return entryDate >= validStartDate && entryDate <= validEndDate;
      }).length;
      
      // Zähle entschuldigte Fehlzeiten für diesen Zeitraum
      const fehlzeitenEntschEntries = details.fehlzeiten_entsch || [];
      const matchingFehlzeitenEntsch = fehlzeitenEntschEntries.filter((entry: any) => {
        if (!entry.datum) return false;
        const entryDate = typeof entry.datum === 'string' ? parseDate(entry.datum) : entry.datum;
        return entryDate >= validStartDate && entryDate <= validEndDate;
      }).length;
      
      // Summiere für diese Klasse
      classValues[className].verspaetungen += matchingVerspaetungen;
      classValues[className].fehlzeiten += (matchingFehlzeitenUnentsch + matchingFehlzeitenEntsch);
    });
    
    // Berechne Durchschnitt über alle Klassen für diesen spezifischen Zeitpunkt
    const classCount = uniqueClasses.size;
    let totalVerspaetungen = 0;
    let totalFehlzeiten = 0;
    
    Object.values(classValues).forEach(sums => {
      totalVerspaetungen += sums.verspaetungen;
      totalFehlzeiten += sums.fehlzeiten;
    });
    
    // Füge Referenzfelder hinzu (keine bestehenden Felder überschreiben)
    dataPoint.ref_verspaetungen = totalVerspaetungen / classCount;
    dataPoint.ref_fehlzeiten = totalFehlzeiten / classCount;
  });
  
  return referenceData;
};

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
  selectedClasses,
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
  const [, setFilteredStudentStats] = useState<[string, StudentStats][]>([]);
  
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
  
  // NEU: Berechne Referenzlinien für Klassendurchschnitte
  const classAverageReferenceLines = useMemo(() => {
    // Use dashboard dates if available, otherwise fall back to props
    const effectiveStartDate = dashboardStartDate || startDate;
    const effectiveEndDate = dashboardEndDate || endDate;
    
    // Zuerst die Basisdaten abrufen (unverändert)
    const baseData = prepareAttendanceOverTime(
      effectiveStartDate,
      effectiveEndDate,
      groupingOption,
      studentStats,
      weeklyDetailedData,
      [], // Keine Klassenfilterung für die Referenzlinien
      []  // Keine Schülerfilterung für die Referenzlinien
    );
    
    // Dann die Durchschnitte berechnen
    return calculateClassAverages(
      baseData,
      studentStats,
      weeklyDetailedData
    );
  }, [dashboardStartDate, dashboardEndDate, startDate, endDate, groupingOption, studentStats, weeklyDetailedData]);
  
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
        referenceLines={classAverageReferenceLines} // NEU: Übergebe die Referenzlinien
      />
    </div>
  );
};

export default EnhancedDashboard;