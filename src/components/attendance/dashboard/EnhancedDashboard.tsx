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

  // Hier die calculateClassAverages-Funktion einbinden
  // Diese Funktion ist nun im Scope der Komponente und hat Zugriff auf alle nötigen Variablen
  const calculateClassAverages = (
    timeFrameData: any[],
    studentStats: Record<string, StudentStats>,
    weeklyDetailedData: Record<string, any>
  ): any[] => {
    // Frühzeitige Rückgabe bei fehlenden Daten
    if (!timeFrameData?.length || !studentStats || !weeklyDetailedData) {
      return [];
    }
    
    // Erstelle tiefe Kopie der Zeitreihen-Daten für die Ergebnisse
    const referenceData = JSON.parse(JSON.stringify(timeFrameData));
    
    // Extrahiere Klasseninformationen
    const classesByStudent: Record<string, string> = {};
    const uniqueClasses: Set<string> = new Set();
    
    // Sammle Informationen über Klassen und Schüler
    Object.entries(studentStats).forEach(([studentId, stats]) => {
      if (stats.klasse) {
        classesByStudent[studentId] = stats.klasse;
        uniqueClasses.add(stats.klasse);
      }
    });
    
    // Wenn keine Klassen vorhanden sind, leeres Array zurückgeben
    if (uniqueClasses.size === 0) {
      return referenceData;
    }
    
    console.log(`Durchschnitt wird für ${uniqueClasses.size} Klassen berechnet`);
    
    // Für jeden Zeitpunkt (KW oder Monat) die Daten auswerten
    for (let i = 0; i < timeFrameData.length; i++) {
      const dataPoint = timeFrameData[i];
      const refDataPoint = referenceData[i]; // Entsprechender Datenpunkt im Ergebnis-Array
      
      // Initialisiere Summen für diesen Zeitpunkt
      let totalVerspaetungenKW = 0;
      let totalFehlzeitenKW = 0;
      
      // Zeitbereich für diesen Datenpunkt bestimmen (z.B. "KW 37" oder "Sep 2023")
      const timeKey = dataPoint.name;
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      // Exakten Datumsbereich aus dateRange extrahieren (falls vorhanden)
      if (dataPoint.dateRange) {
        const dateParts = dataPoint.dateRange.split(' - ');
        if (dateParts.length === 2) {
          const datePart1 = dateParts[0].trim();
          const datePart2 = dateParts[1].trim();
          
          if (datePart1.match(/\d{2}\.\d{2}\.\d{4}/) && datePart2.match(/\d{2}\.\d{2}\.\d{4}/)) {
            startDate = parseDate(datePart1);
            endDate = parseDate(datePart2);
          }
        }
      }
      
      // Sicherstellen, dass wir einen gültigen Zeitbereich haben
      if (!startDate || !endDate) {
        console.warn(`Kein gültiger Zeitbereich für ${timeKey} gefunden, verwende Standardwerte.`);
        refDataPoint.ref_verspaetungen = 0;
        refDataPoint.ref_fehlzeiten = 0;
        continue;
      }
      
      // Jetzt haben wir einen gültigen Zeitbereich, zähle die Ereignisse pro Klasse
      
      // Klassenzähler für diesen Zeitraum initialisieren
      const classCounters: Record<string, { verspaetungen: number, fehlzeiten: number }> = {};
      uniqueClasses.forEach(className => {
        classCounters[className] = { verspaetungen: 0, fehlzeiten: 0 };
      });
      
      // Studenten nach Klasse gruppieren für effiziente Datenverarbeitung
      const studentsByClass: Record<string, string[]> = {};
      Object.entries(classesByStudent).forEach(([studentId, className]) => {
        if (!studentsByClass[className]) {
          studentsByClass[className] = [];
        }
        studentsByClass[className].push(studentId);
      });
      
      // Für jede Klasse die Ereignisse pro Schüler zählen
      uniqueClasses.forEach(className => {
        const studentsInClass = studentsByClass[className] || [];
        
        // Für jeden Schüler dieser Klasse
        studentsInClass.forEach(studentId => {
          const details = weeklyDetailedData[studentId];
          if (!details) return;
          
          // Verspätungen zählen
          if (details.verspaetungen_unentsch && Array.isArray(details.verspaetungen_unentsch)) {
            // Verwenden einer sicheren Vergleichsfunktion für den Datumsbereich
            const verspaetungenInRange = details.verspaetungen_unentsch.filter((entry: any) => {
              if (!entry || !entry.datum) return false;
              // Bei diesem Punkt wissen wir, dass startDate und endDate nicht null sind
              const entryDate = typeof entry.datum === 'string' ? parseDate(entry.datum) : entry.datum;
              // Sichere Vergleiche mit nicht-null Assertion (!)
              return startDate! <= entryDate && entryDate <= endDate!;
            });
            
            // Anzahl zu Klassensumme hinzufügen
            classCounters[className].verspaetungen += verspaetungenInRange.length;
            totalVerspaetungenKW += verspaetungenInRange.length;
          }
          
          // Fehlzeiten zählen (unentschuldigt + entschuldigt)
          if (details.fehlzeiten_unentsch && Array.isArray(details.fehlzeiten_unentsch)) {
            const fehlzeitenUnentschInRange = details.fehlzeiten_unentsch.filter((entry: any) => {
              if (!entry || !entry.datum) return false;
              const entryDate = typeof entry.datum === 'string' ? parseDate(entry.datum) : entry.datum;
              // Sichere Vergleiche mit nicht-null Assertion (!)
              return startDate! <= entryDate && entryDate <= endDate!;
            });
            
            classCounters[className].fehlzeiten += fehlzeitenUnentschInRange.length;
            totalFehlzeitenKW += fehlzeitenUnentschInRange.length;
          }
          
          if (details.fehlzeiten_entsch && Array.isArray(details.fehlzeiten_entsch)) {
            const fehlzeitenEntschInRange = details.fehlzeiten_entsch.filter((entry: any) => {
              if (!entry || !entry.datum) return false;
              const entryDate = typeof entry.datum === 'string' ? parseDate(entry.datum) : entry.datum;
              // Sichere Vergleiche mit nicht-null Assertion (!)
              return startDate! <= entryDate && entryDate <= endDate!;
            });
            
            classCounters[className].fehlzeiten += fehlzeitenEntschInRange.length;
            totalFehlzeitenKW += fehlzeitenEntschInRange.length;
          }
        });
      });
      
      // Durchschnitt pro Klasse berechnen
      const classCount = uniqueClasses.size;
      const verspaetungenAvg = classCount > 0 ? totalVerspaetungenKW / classCount : 0;
      const fehlzeitenAvg = classCount > 0 ? totalFehlzeitenKW / classCount : 0;
      
      // Zur Debug-Ausgabe einzelne Klassenwerte ausgeben
      console.log(`${timeKey}: Gesamt V=${totalVerspaetungenKW}, F=${totalFehlzeitenKW}, Ø V=${verspaetungenAvg.toFixed(1)}, Ø F=${fehlzeitenAvg.toFixed(1)}`);

      // Durchschnittswerte dem Datenpunkt hinzufügen
      refDataPoint.ref_verspaetungen = verspaetungenAvg;
      refDataPoint.ref_fehlzeiten = fehlzeitenAvg;
    }
    
    return referenceData;
  };
  
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