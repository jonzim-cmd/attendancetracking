// src/components/attendance/dashboard/classAverages.ts
import { StudentStats } from '@/types';

/**
 * Interface für die erweiterten Zeitreihen-Datenpunkte mit Durchschnittswerten
 */
export interface TimeSeriesDataPointWithAvg {
  name: string;
  verspaetungen: number;
  fehlzeiten: number;
  fehlzeitenEntsch: number;
  fehlzeitenUnentsch: number;
  entschuldigt: number;
  unentschuldigt: number;
  sortKey?: number;
  dateRange?: string;
  // Durchschnittswerte
  verspaetungenAvg?: number;
  fehlzeitenAvg?: number;
  fehlzeitenEntschAvg?: number;
  fehlzeitenUnentschAvg?: number;
  // Metadaten zur Berechnung
  classCount?: number;
}

/**
 * Berechnet Durchschnittswerte pro Klasse für jeden Zeitreihen-Datenpunkt
 * 
 * @param timeSeriesData Die ursprünglichen Zeitreihen-Daten
 * @param studentStats Statistikdaten aller Schüler
 * @returns Zeitreihen-Daten mit Durchschnittswerten
 */
export function calculateClassAverages(
  timeSeriesData: any[],
  studentStats: Record<string, StudentStats>
): TimeSeriesDataPointWithAvg[] {
  // Bestimme die Gesamtzahl der Klassen im System
  const allClasses = new Set<string>();
  Object.values(studentStats).forEach(stats => {
    if (stats.klasse) {
      allClasses.add(stats.klasse);
    }
  });
  
  const classCount = allClasses.size;
  console.log(`Durchschnittsberechnung: ${classCount} Klassen gefunden`);
  
  // Wenn keine Klassen gefunden wurden, gib die ursprünglichen Daten zurück
  if (classCount === 0) {
    return timeSeriesData;
  }
  
  // Kopiere die Daten und füge Durchschnittswerte hinzu
  return timeSeriesData.map(point => {
    // Kopiere den Punkt
    const enrichedPoint: TimeSeriesDataPointWithAvg = { ...point };
    
    // Berechne Durchschnitte pro Klasse für jeden einzelnen Zeitpunkt
    enrichedPoint.verspaetungenAvg = point.verspaetungen / classCount;
    enrichedPoint.fehlzeitenAvg = point.fehlzeiten / classCount;
    enrichedPoint.fehlzeitenEntschAvg = point.fehlzeitenEntsch / classCount;
    enrichedPoint.fehlzeitenUnentschAvg = point.fehlzeitenUnentsch / classCount;
    
    // Speichere die Anzahl der Klassen
    enrichedPoint.classCount = classCount;
    
    return enrichedPoint;
  });
}

/**
 * Überprüft, ob Durchschnittskurven angezeigt werden sollen
 * 
 * @param selectedClasses Die ausgewählten Klassen
 * @param selectedStudents Die ausgewählten Schüler
 * @returns true, wenn Durchschnittskurven angezeigt werden sollen
 */
export function shouldShowAverages(
  selectedClasses: string[],
  selectedStudents: string[]
): boolean {
  // Zeige Durchschnitte, wenn eine oder mehrere Klassen ausgewählt sind
  // und keine spezifischen Schüler ausgewählt sind ("alle Schüler")
  return selectedClasses.length > 0 && selectedStudents.length === 0;
}