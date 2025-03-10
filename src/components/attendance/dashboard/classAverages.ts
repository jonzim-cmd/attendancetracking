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
// NEUE VARIABLE: Cache für die Anzahl aller Klassen im System
let cachedTotalClassCount: number = 0;

/**
 * Berechnet Durchschnittswerte pro Klasse für jeden Zeitreihen-Datenpunkt
 * Die Durchschnittswerte werden immer über alle Klassen berechnet,
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
  
  // Verwende die aktuelle Anzahl der Klassen nur für Logging-Zwecke
  const currentClassCount = allClasses.size;
  console.log(`Durchschnittsberechnung: ${currentClassCount} Klassen gefunden`);
  
  // KORREKTUR: Verwende die gecachte Gesamtanzahl, wenn verfügbar
  let totalClassCount = cachedTotalClassCount;
  
  // Wenn keine gecachte Anzahl oder weniger als 2 Klassen, aktualisiere den Cache
  if (totalClassCount < 2 && currentClassCount > totalClassCount) {
    cachedTotalClassCount = currentClassCount;
    totalClassCount = currentClassCount;
    console.log(`Aktualisiere gecachte Gesamtklassenzahl auf ${totalClassCount}`);
  }
  
  // Wenn immer noch keine gute Schätzung, setze auf die aktuelle Anzahl oder 13 (Beispielwert)
  if (totalClassCount < 2) {
    totalClassCount = Math.max(currentClassCount, 13); // Mindestwert 13 (kann angepasst werden)
    cachedTotalClassCount = totalClassCount;
    console.log(`Verwende Standardwert für Gesamtklassenzahl: ${totalClassCount}`);
  }

  // WICHTIG: Wir verwenden immer die Gesamtzahl aller Klassen für die Berechnung 
  const classCount = Math.max(1, totalClassCount);

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
    enrichedPoint.classCount = currentClassCount; // Aktuelle Anzahl für UI
    enrichedPoint.totalClassCount = classCount;   // Gesamtzahl für Berechnungen
    
    return enrichedPoint;
  });
}

/**
 * Aktualisiert den Cache mit den Gesamtdaten aller Klassen
 * Diese Funktion muss aufgerufen werden, wenn die "Alle Klassen" Ansicht angezeigt wird
 * 
 * @param allClassesData Die Daten aller Klassen
 * @param totalClasses Optionale Gesamtanzahl aller Klassen im System
 */
export function updateAllClassesCache(allClassesData: any[], totalClasses?: number): void {
  cachedAllClassesData = {};
  
  allClassesData.forEach(point => {
    cachedAllClassesData[`verspaetungen_${point.name}`] = point.verspaetungen;
    cachedAllClassesData[`fehlzeiten_${point.name}`] = point.fehlzeiten;
    cachedAllClassesData[`fehlzeitenEntsch_${point.name}`] = point.fehlzeitenEntsch;
    cachedAllClassesData[`fehlzeitenUnentsch_${point.name}`] = point.fehlzeitenUnentsch;
  });
  
  // Wenn die Gesamtanzahl der Klassen übergeben wurde, aktualisiere den Cache
  if (totalClasses && totalClasses > 0) {
    cachedTotalClassCount = totalClasses;
    console.log(`Updated cached total class count: ${cachedTotalClassCount}`);
  }
  
  console.log("Updated cache with all classes data");
}



/**
 * Completely resets the class cache.
 * This MUST be called whenever a new report is loaded to ensure calculations 
 * use the correct class count for the new report.
 */
export function resetClassCache(): void {
  cachedTotalClassCount = 0;
  cachedAllClassesData = {};
  console.log("Reset class averages cache - total class count is now 0");
}

/**
 * Löscht den Cache mit den Gesamtdaten aller Klassen
 * Sollte aufgerufen werden, wenn sich die Basisdaten ändern
 */
export function clearAllClassesCache(): void {
  cachedAllClassesData = {};
  // Wir löschen NICHT cachedTotalClassCount, damit die Gesamtzahl 
  // der Klassen über Resets hinweg erhalten bleibt
  console.log("Cleared all classes data cache, but preserved total class count:", cachedTotalClassCount);
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
  return selectedStudents.length === 0; // Zeige Durchschnitte an, wenn "alle Schüler" aktiv ist
}