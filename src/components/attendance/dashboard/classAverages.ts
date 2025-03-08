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
  totalClassCount?: number;
  // Markierung für Cache-Management
  isAllClassesData?: boolean;
}

// Map zum Caching der Durchschnittswerte aller Klassen
let cachedAllClassesData: Record<string, number> = {};

/**
 * Berechnet Durchschnittswerte pro Klasse für jeden Zeitreihen-Datenpunkt
 * 
 * KORRIGIERTE IMPLEMENTIERUNG:
 * Die Durchschnittswerte werden immer aus allen Klassen berechnet,
 * unabhängig von der aktuellen Filterung oder Auswahl.
 * 
 * @param timeSeriesData Die Zeitreihen-Daten für die aktuell ausgewählten Klassen
 * @param studentStats Statistikdaten aller Schüler
 * @returns Zeitreihen-Daten mit korrekten Durchschnittswerten pro Klasse
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

  // WICHTIG: Wir benötigen Zugriff auf die Gesamtdaten aller Klassen!
  // Wenn wir im Cache bereits Werte haben, verwenden wir diese
  if (Object.keys(cachedAllClassesData).length === 0) {
    // Bei leerem Cache speichern wir die Daten, wenn "Alle Klassen" ausgewählt sind
    // Dies erkennen wir daran, dass die übergebenen Daten die Gesamtdaten aller Klassen enthalten
    const isAllClassesData = timeSeriesData.length > 0 && timeSeriesData[0].isAllClassesData;
    
    if (isAllClassesData) {
      timeSeriesData.forEach(point => {
        // Speichere die Daten im Cache mit eindeutigen Schlüsseln
        cachedAllClassesData[`verspaetungen_${point.name}`] = point.verspaetungen;
        cachedAllClassesData[`fehlzeiten_${point.name}`] = point.fehlzeiten;
        cachedAllClassesData[`fehlzeitenEntsch_${point.name}`] = point.fehlzeitenEntsch;
        cachedAllClassesData[`fehlzeitenUnentsch_${point.name}`] = point.fehlzeitenUnentsch;
      });
      
      console.log("Cached all classes data for future average calculations");
    }
  }
  
  // Kopiere die Daten und füge Durchschnittswerte hinzu
  return timeSeriesData.map(point => {
    // Kopiere den Punkt
    const enrichedPoint: TimeSeriesDataPointWithAvg = { ...point };
    
    // KORREKTUR: Verwende die Gesamtsummen aller Klassen für die Durchschnittsberechnung
    // Dabei prüfen wir, ob wir Daten aus dem Cache verwenden können
    
    if (Object.keys(cachedAllClassesData).length > 0) {
      // Verwende die gespeicherten Gesamtwerte
      enrichedPoint.verspaetungenAvg = 
        (cachedAllClassesData[`verspaetungen_${point.name}`] || 0) / classCount;
      
      enrichedPoint.fehlzeitenAvg = 
        (cachedAllClassesData[`fehlzeiten_${point.name}`] || 0) / classCount;
      
      enrichedPoint.fehlzeitenEntschAvg = 
        (cachedAllClassesData[`fehlzeitenEntsch_${point.name}`] || 0) / classCount;
      
      enrichedPoint.fehlzeitenUnentschAvg = 
        (cachedAllClassesData[`fehlzeitenUnentsch_${point.name}`] || 0) / classCount;
    } else {
      // Fallback: Wenn keine gespeicherten Daten verfügbar sind, 
      // nehmen wir die aktuellen Werte
      enrichedPoint.verspaetungenAvg = point.verspaetungen / classCount;
      enrichedPoint.fehlzeitenAvg = point.fehlzeiten / classCount;
      enrichedPoint.fehlzeitenEntschAvg = point.fehlzeitenEntsch / classCount;
      enrichedPoint.fehlzeitenUnentschAvg = point.fehlzeitenUnentsch / classCount;
      
      // Markieren diesen Punkt für zukünftige Cache-Updates, wenn alle Klassen ausgewählt sind
      if (!point.isAllClassesData && 
          !timeSeriesData.some(p => p.isAllClassesData) && 
          timeSeriesData.length > 0) {
        enrichedPoint.isAllClassesData = true;
      }
    }
    
    // Speichere die Anzahl der Klassen
    enrichedPoint.classCount = classCount;
    enrichedPoint.totalClassCount = classCount; // Gesamtzahl der Klassen
    
    return enrichedPoint;
  });
}

/**
 * Aktualisiert den Cache mit den Gesamtdaten aller Klassen
 * Diese Funktion muss aufgerufen werden, wenn die "Alle Klassen" Ansicht angezeigt wird
 * 
 * @param allClassesData Die Daten aller Klassen
 */
export function updateAllClassesCache(allClassesData: any[]): void {
  cachedAllClassesData = {};
  
  allClassesData.forEach(point => {
    cachedAllClassesData[`verspaetungen_${point.name}`] = point.verspaetungen;
    cachedAllClassesData[`fehlzeiten_${point.name}`] = point.fehlzeiten;
    cachedAllClassesData[`fehlzeitenEntsch_${point.name}`] = point.fehlzeitenEntsch;
    cachedAllClassesData[`fehlzeitenUnentsch_${point.name}`] = point.fehlzeitenUnentsch;
  });
  
  console.log("Updated cache with all classes data");
}

/**
 * Löscht den Cache mit den Gesamtdaten aller Klassen
 * Sollte aufgerufen werden, wenn sich die Basisdaten ändern
 */
export function clearAllClassesCache(): void {
  cachedAllClassesData = {};
  console.log("Cleared all classes data cache");
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