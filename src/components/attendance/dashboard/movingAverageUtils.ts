// src/components/attendance/dashboard/movingAverageUtils.ts
import * as math from 'mathjs';
import { AbsenceEntry } from '@/types';

/**
 * Berechnet den gleitenden Durchschnitt für Zeitreihendaten
 * Verwendet die mathjs-Bibliothek für die Berechnung
 * 
 * @param data Array mit Zeitreihendaten
 * @param period Größe des Zeitfensters für den gleitenden Durchschnitt
 * @param valueKey Schlüssel für den Wert in den Datenpunkten
 * @returns Ursprüngliche Daten ergänzt mit gleitendem Durchschnitt
 */
export function calculateMovingAverage(
  data: any[],
  period: number = 3,
  valueKey: string = 'value'
): any[] {
  if (!data || data.length === 0) return [];
  if (period < 2) return data;
  
  // Effektive Periode kann nicht größer als Datenmenge sein
  const effectivePeriod = Math.min(period, data.length);
  
  // Werte für die Berechnung extrahieren
  const values = data.map(item => 
    typeof item[valueKey] === 'number' ? item[valueKey] : 0
  );
  
  // Ergebnis mit MA anreichern
  return data.map((point, i) => {
    // Berechne Start-Index für das Fenster, mindestens 0
    const startIdx = Math.max(0, i - effectivePeriod + 1);
    // Extrahiere Werte im aktuellen Fenster
    const windowValues = values.slice(startIdx, i + 1);
    
    // Verwende math.mean für die Durchschnittsberechnung und konvertiere zu number
    // Manuell berechnen, um Typprobleme zu vermeiden
    const movingAverage = windowValues.length > 0 ? 
      windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length : 
      null;
    
    // Original-Datenpunkt mit MA ergänzen
    return {
      ...point,
      movingAverage
    };
  });
}

/**
 * Identifiziert Ausreißer in einem Datensatz
 * Verwendet den IQR (Interquartilsabstand) für die Erkennung
 * 
 * @param data Array mit Zeitreihendaten
 * @param valueKey Schlüssel für den Wert in den Datenpunkten
 * @param outlierThreshold Multiplikator für die Ausreißererkennung (1.5 = üblicher Wert)
 * @returns Ursprüngliche Daten mit Ausreißer-Flagge
 */
export function detectOutliers(
  data: any[],
  valueKey: string = 'value',
  outlierThreshold: number = 1.5
): any[] {
  if (!data || data.length < 4) return data.map(d => ({ ...d, isOutlier: false })); // Mindestens 4 Datenpunkte für sinnvolle Erkennung
  
  // Extrahiere die Werte
  const values = data.map(item => 
    typeof item[valueKey] === 'number' ? item[valueKey] : 0
  ).filter(val => !isNaN(val));
  
  // Sortiere die Werte für Quartilberechnung
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Berechne Q1 (25% Quartil) und Q3 (75% Quartil)
  const q1Index = Math.floor(sortedValues.length * 0.25);
  const q3Index = Math.floor(sortedValues.length * 0.75);
  
  const q1 = sortedValues[q1Index];
  const q3 = sortedValues[q3Index];
  
  // Berechne IQR (Interquartilsabstand)
  const iqr = q3 - q1;
  
  // Definiere Grenzen für Ausreißer
  const lowerBound = q1 - outlierThreshold * iqr;
  const upperBound = q3 + outlierThreshold * iqr;
  
  // Markiere Ausreißer
  return data.map(point => {
    const value = typeof point[valueKey] === 'number' ? point[valueKey] : 0;
    const isOutlier = value < lowerBound || value > upperBound;
    return {
      ...point,
      isOutlier
    };
  });
}

/**
 * Bereitet die TimeSeriesData für die MovingAverage-Visualisierung vor
 * Filtert nach ausgewähltem Schüler oder Klasse
 * 
 * @param timeSeriesData Zeitreihendaten für das gesamte Schuljahr
 * @param dataType 'verspaetungen' oder 'fehlzeiten'
 * @param period Zeitfenster für den gleitenden Durchschnitt
 * @param selectedStudents Ausgewählte Schüler
 * @param selectedClasses Ausgewählte Klassen
 * @returns Daten mit hinzugefügtem gleitenden Durchschnitt und Ausreißern
 */
export function prepareMovingAverageData(
  timeSeriesData: any[],
  dataType: 'verspaetungen' | 'fehlzeiten' = 'verspaetungen',
  period: number = 3,
  selectedStudents: string[] = [],
  selectedClasses: string[] = []
): any[] {
  if (!timeSeriesData || timeSeriesData.length === 0) return [];
  
  // Daten sortieren, falls noch nicht geschehen (nach sortKey oder name)
  const sortedData = [...timeSeriesData].sort((a, b) => {
    if (a.sortKey !== undefined && b.sortKey !== undefined) {
      return a.sortKey - b.sortKey;
    }
    return a.name.localeCompare(b.name);
  });
  
  // Gleitenden Durchschnitt berechnen
  const dataWithMA = calculateMovingAverage(sortedData, period, dataType);
  
  // Ausreißer erkennen
  const finalData = detectOutliers(dataWithMA, dataType);
  
  return finalData;
}

/**
 * Aggregiert wöchentliche/monatliche Abwesenheitseinträge für einen bestimmten Schüler oder eine Klasse
 * 
 * @param detailedData Detaillierte Abwesenheitseinträge (schoolYearDetailedData oder weeklyDetailedData)
 * @param selectedStudent Ausgewählter Schüler (optional)
 * @param selectedClass Ausgewählte Klasse (optional)
 * @param allStudentStats Alle Schülerstatistiken für Klassenzuordnung
 * @param groupBy 'weekly' oder 'monthly' für Gruppierung (Standard: 'weekly')
 * @returns Aggregierte Zeitreihendaten für Analyse
 */
export function aggregateAttendanceData(
  detailedData: Record<string, { 
    verspaetungen_unentsch: AbsenceEntry[], 
    fehlzeiten_unentsch: AbsenceEntry[],
    verspaetungen_entsch?: AbsenceEntry[],
    fehlzeiten_entsch?: AbsenceEntry[]
  }>,
  selectedStudent?: string,
  selectedClass?: string,
  allStudentStats?: Record<string, { klasse: string }>,
  groupBy: 'weekly' | 'monthly' = 'weekly'
): any[] {
  // Wenn kein Schüler oder Klasse ausgewählt ist, leere Daten zurückgeben
  if (!selectedStudent && !selectedClass) return [];
  
  // Relevante Schüler bestimmen
  let relevantStudents: string[] = [];
  
  if (selectedStudent) {
    // Einzelner Schüler ausgewählt
    relevantStudents = [selectedStudent];
  } else if (selectedClass && allStudentStats) {
    // Schüler nach Klasse filtern
    relevantStudents = Object.entries(allStudentStats)
      .filter(([_, stats]) => stats.klasse === selectedClass)
      .map(([student]) => student);
  }
  
  if (relevantStudents.length === 0) return [];
  
  // Zeittracking für Gruppierung
  const timeGroups: Record<string, { 
    verspaetungen: number,
    fehlzeiten: number,
    timestamp: Date,
    count: number  // Anzahl der Einträge für Durchschnittsberechnung
  }> = {};
  
  // Daten aggregieren
  relevantStudents.forEach(student => {
    const studentData = detailedData[student];
    if (!studentData) return;
    
    // Verspätungen verarbeiten
    (studentData.verspaetungen_unentsch || []).forEach(entry => {
      try {
        const date = typeof entry.datum === 'string' ? new Date(entry.datum) : entry.datum;
        if (!date || isNaN(date.getTime())) return;
        
        // Gruppierungsschlüssel bestimmen
        let groupKey: string;
        
        if (groupBy === 'monthly') {
          groupKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        } else { // weekly
          // ISO-Woche verwenden (1-52)
          const weekNumber = Math.ceil((date.getDate() - (date.getDay() || 7) + 10) / 7);
          groupKey = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
        }
        
        // Gruppe initialisieren falls nötig
        if (!timeGroups[groupKey]) {
          timeGroups[groupKey] = {
            verspaetungen: 0,
            fehlzeiten: 0,
            timestamp: date,
            count: 0
          };
        }
        
        // Verspätung zählen
        timeGroups[groupKey].verspaetungen += 1;
        timeGroups[groupKey].count += 1;
      } catch (error) {
        console.error("Fehler bei der Verarbeitung von Verspätungen:", error);
      }
    });
    
    // Fehlzeiten verarbeiten
    (studentData.fehlzeiten_unentsch || []).forEach(entry => {
      try {
        const date = typeof entry.datum === 'string' ? new Date(entry.datum) : entry.datum;
        if (!date || isNaN(date.getTime())) return;
        
        // Gruppierungsschlüssel bestimmen
        let groupKey: string;
        
        if (groupBy === 'monthly') {
          groupKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        } else { // weekly
          // ISO-Woche verwenden (1-52)
          const weekNumber = Math.ceil((date.getDate() - (date.getDay() || 7) + 10) / 7);
          groupKey = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
        }
        
        // Gruppe initialisieren falls nötig
        if (!timeGroups[groupKey]) {
          timeGroups[groupKey] = {
            verspaetungen: 0,
            fehlzeiten: 0,
            timestamp: date,
            count: 0
          };
        }
        
        // Fehlzeit zählen
        timeGroups[groupKey].fehlzeiten += 1;
        timeGroups[groupKey].count += 1;
      } catch (error) {
        console.error("Fehler bei der Verarbeitung von Fehlzeiten:", error);
      }
    });
  });
  
  // In Array umwandeln und sortieren
  const sortedGroups = Object.entries(timeGroups)
    .map(([key, data]) => ({
      name: key,
      verspaetungen: data.verspaetungen,
      fehlzeiten: data.fehlzeiten,
      timestamp: data.timestamp,
      count: data.count,
      // Labels für die Anzeige
      periodLabel: groupBy === 'monthly' 
        ? new Date(data.timestamp).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })
        : `KW ${key.split('-W')[1]}`,
      dateRange: groupBy === 'monthly'
        ? `${new Date(data.timestamp.getFullYear(), data.timestamp.getMonth(), 1).toLocaleDateString('de-DE')} - ${new Date(data.timestamp.getFullYear(), data.timestamp.getMonth() + 1, 0).toLocaleDateString('de-DE')}`
        : `Woche ${key.split('-W')[1]}, ${data.timestamp.getFullYear()}`
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  return sortedGroups;
}