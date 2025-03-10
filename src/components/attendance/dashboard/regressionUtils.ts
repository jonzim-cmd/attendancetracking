// src/components/attendance/dashboard/regressionUtils.ts
import * as math from 'mathjs';
import { AbsenceEntry } from '@/types';

/**
 * Ergebnis der Regressionsberechnung
 */
export interface RegressionResult {
  slope: number;        // Steigung der Regressionslinie
  intercept: number;    // Y-Achsenabschnitt der Regressionslinie
  rSquared: number;     // Bestimmtheitsmaß R² (0-1)
  trendDescription: string; // Textuelle Beschreibung des Trends
  prediction?: number;  // Optional: Vorhersage für den nächsten Zeitpunkt
  outliers: number[];   // Indizes der identifizierten Ausreißer
}

/**
 * Berechnet eine lineare Regression für Zeitreihendaten
 * Verwendet mathjs für die eigentlichen Berechnungen
 * 
 * @param data Array mit Zeitreihendaten
 * @param valueKey Schlüssel für den zu analysierenden Wert
 * @param excludeOutliers Ob Ausreißer von der Berechnung ausgeschlossen werden sollen
 * @returns Regressionsergebnis mit Steigung, y-Achsenabschnitt und R²
 */
export function calculateLinearRegression(
  data: any[],
  valueKey: string = 'value',
  excludeOutliers: boolean = false
): RegressionResult {
  if (!data || data.length < 2) {
    return { 
      slope: 0, 
      intercept: 0, 
      rSquared: 0,
      trendDescription: 'Unbekannt (zu wenig Daten)',
      outliers: []
    };
  }
  
  try {
    // Identifiziere zunächst Ausreißer
    const outlierIndices = findOutliers(data, valueKey);
    
    // Filtere Ausreißer, wenn gewünscht
    const analysisData = excludeOutliers 
      ? data.filter((_, index) => !outlierIndices.includes(index))
      : data;
    
    // Falls nach dem Filtern zu wenig Daten übrig sind
    if (analysisData.length < 2) {
      return { 
        slope: 0, 
        intercept: 0, 
        rSquared: 0,
        trendDescription: 'Unbekannt (zu wenig Daten nach Ausreißerfilterung)',
        outliers: outlierIndices
      };
    }
    
    // Wir verwenden Indizes als x-Werte für gleichmäßige Abstände
    const xValues = analysisData.map((_, i) => i);
    
    // y-Werte extrahieren und sicherstellen, dass es Zahlen sind
    const yValues = analysisData.map(point => 
      typeof point[valueKey] === 'number' ? point[valueKey] : 0
    );
    
    // Prüfen, ob alle Werte identisch sind (keine Varianz)
    const allSameValue = yValues.every(y => y === yValues[0]);
    if (allSameValue) {
      return { 
        slope: 0, 
        intercept: yValues[0], 
        rSquared: 1,
        trendDescription: 'Konstant (keine Veränderung)',
        outliers: outlierIndices
      };
    }
    
    // Vorbereitung der Matrizen für math.js
    const X = math.matrix(xValues.map(x => [1, x])); // Design-Matrix [1, x]
    const y = math.matrix(yValues.map(y => [y]));    // Zielvektor als Spaltenvektor

    // Berechnung mit der Normalgleichung: β = (X^T * X)^(-1) * X^T * y
    const Xt = math.transpose(X);             // X^T
    const XtX = math.multiply(Xt, X);         // X^T * X
    const XtX_inv = math.inv(XtX);            // (X^T * X)^(-1)
    const XtY = math.multiply(Xt, y);         // X^T * y
    const beta = math.multiply(XtX_inv, XtY); // (X^T * X)^(-1) * X^T * y

    // Koeffizienten extrahieren
    const intercept = math.number(beta.get([0, 0]));
    const slope = math.number(beta.get([1, 0]));

    // R² berechnen
    const yMean = math.number(math.mean(yValues));

    // Totale Summe der Quadrate (TSS)
    const tssValues = yValues.map(y => {
      const diff = y - yMean;
      return diff * diff;
    });
    const tss = tssValues.reduce((sum, val) => sum + val, 0);

    // Residualsumme der Quadrate (RSS)
    const predictions = xValues.map(x => intercept + slope * x);
    const rssValues = yValues.map((y, i) => {
      const diff = y - predictions[i];
      return diff * diff;
    });
    const rss = rssValues.reduce((sum, val) => sum + val, 0);

    // R² = 1 - (RSS / TSS)
    const rSquared = 1 - (rss / tss);

    // Vorhersage für den nächsten Zeitpunkt
    const prediction = intercept + slope * xValues.length;

    // Trendinterpretation
    const trendDescription = getTrendDescription(slope, rSquared);

    return { 
      slope, 
      intercept, 
      rSquared, 
      trendDescription,
      prediction,
      outliers: outlierIndices
    };
  } catch (error) {
    console.error('Fehler bei der Regressionsberechnung:', error);
    return { 
      slope: 0, 
      intercept: 0, 
      rSquared: 0,
      trendDescription: 'Fehler bei der Berechnung',
      outliers: []
    };
  }
}

/**
 * Identifiziert Ausreißer in einem Datensatz mit dem IQR-Verfahren
 * 
 * @param data Die zu analysierenden Daten
 * @param valueKey Schlüssel für den zu analysierenden Wert
 * @param outlierThreshold Multiplikator für die IQR-Grenze (üblich: 1.5)
 * @returns Indizes der identifizierten Ausreißer
 */
function findOutliers(
  data: any[],
  valueKey: string = 'value',
  outlierThreshold: number = 1.5
): number[] {
  if (!data || data.length < 4) return []; // Mindestens 4 Datenpunkte für sinnvolle Erkennung
  
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
  
  // Identifiziere Ausreißer
  const outliers: number[] = [];
  values.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      outliers.push(index);
    }
  });
  
  return outliers;
}

/**
 * Erzeugt eine textuelle Beschreibung des Trends
 */
function getTrendDescription(slope: number, rSquared: number): string {
  // Wenn R² zu niedrig ist, ist die Trendaussage unzuverlässig
  if (rSquared < 0.1) {
    return 'Kein erkennbarer Trend (niedrige Korrelation)';
  }
  
  if (Math.abs(slope) < 0.05) {
    return 'Stabil (keine signifikante Veränderung)';
  }
  
  // Richtung des Trends - bei Abwesenheiten ist ein Rückgang positiv
  const direction = slope > 0 ? 'Ansteigend' : 'Abnehmend';
  
  // Stärke des Trends
  let strength = 'leicht';
  if (Math.abs(slope) > 1) {
    strength = 'sehr stark';
  } else if (Math.abs(slope) > 0.5) {
    strength = 'stark';
  } else if (Math.abs(slope) > 0.2) {
    strength = 'moderat';
  }
  
  // Zuverlässigkeit basierend auf R²
  let reliability = '';
  if (rSquared > 0.7) {
    reliability = ' (sehr zuverlässiger Trend)';
  } else if (rSquared > 0.5) {
    reliability = ' (zuverlässiger Trend)';
  } else if (rSquared > 0.3) {
    reliability = ' (erkennbarer Trend)';
  } else {
    reliability = ' (schwacher Trend)';
  }
  
  return `${direction} ${strength}${reliability}`;
}

/**
 * Bereitet Zeitreihendaten für die Regressionsanalyse vor
 * und fügt Regressionslinienpunkte hinzu
 * 
 * @param timeSeriesData Zeitreihendaten aus dem Dashboard
 * @param dataType 'verspaetungen' oder 'fehlzeiten'
 * @param excludeOutliers Ob Ausreißer von der Berechnung ausgeschlossen werden sollen
 * @returns Daten mit Regressionslinie und Ergebnissen
 */
export function prepareRegressionData(
  timeSeriesData: any[],
  dataType: 'verspaetungen' | 'fehlzeiten' = 'verspaetungen',
  excludeOutliers: boolean = false
): {
  dataWithRegression: any[];
  regressionResult: RegressionResult;
} {
  if (!timeSeriesData || timeSeriesData.length === 0) {
    return {
      dataWithRegression: [],
      regressionResult: {
        slope: 0,
        intercept: 0,
        rSquared: 0,
        trendDescription: 'Keine Daten verfügbar',
        outliers: []
      }
    };
  }
  
  // Daten sortieren, falls noch nicht geschehen
  const sortedData = [...timeSeriesData].sort((a, b) => {
    if (a.sortKey !== undefined && b.sortKey !== undefined) {
      return a.sortKey - b.sortKey;
    }
    if (a.timestamp && b.timestamp) {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
    return a.name.localeCompare(b.name);
  });
  
  // Regression berechnen
  const regressionResult = calculateLinearRegression(sortedData, dataType, excludeOutliers);
  
  // Regressionslinie zu den Daten hinzufügen
  const dataWithRegression = sortedData.map((point, index) => {
    const regressionValue = regressionResult.intercept + (regressionResult.slope * index);
    const isOutlier = regressionResult.outliers.includes(index);
    
    return {
      ...point,
      regressionLine: regressionValue,
      isOutlier
    };
  });
  
  // Füge Vorhersagepunkt hinzu, wenn die Regression sinnvolle Ergebnisse liefert
  if (regressionResult.rSquared > 0.3 && sortedData.length > 0) {
    // Kopiere Attribute vom letzten Datenpunkt für Konsistenz
    const lastPoint = sortedData[sortedData.length - 1];
    const nextPointDate = new Date(lastPoint.timestamp || new Date());
    
    // Erhöhe Datum je nach Gruppierung
    if (lastPoint.name?.includes('KW')) {
      // Wöchentliche Gruppierung - Eine Woche hinzufügen
      nextPointDate.setDate(nextPointDate.getDate() + 7);
    } else {
      // Monatliche Gruppierung - Einen Monat hinzufügen
      nextPointDate.setMonth(nextPointDate.getMonth() + 1);
    }
    
    // Erstelle Vorhersagepunkt
    const predictionPoint = {
      ...lastPoint,
      name: 'Prognose',
      timestamp: nextPointDate,
      [dataType]: null, // Keine tatsächlichen Daten
      regressionLine: regressionResult.prediction,
      isPrediction: true
    };
    
    // Füge Vorhersagepunkt hinzu
    dataWithRegression.push(predictionPoint);
  }
  
  return {
    dataWithRegression,
    regressionResult
  };
}

/**
 * Aggregiert wöchentliche/monatliche Abwesenheitseinträge für einen bestimmten Schüler oder eine Klasse
 * für die Regressionsanalyse
 * 
 * @param detailedData Detaillierte Abwesenheitseinträge für das gesamte Schuljahr
 * @param selectedStudent Ausgewählter Schüler (optional)
 * @param selectedClass Ausgewählte Klasse (optional)
 * @param allStudentStats Alle Schülerstatistiken für Klassenzuordnung
 * @param groupBy 'weekly' oder 'monthly' für Gruppierung (Standard: 'weekly')
 * @returns Aggregierte Zeitreihendaten für Regressionsanalyse
 */
export function aggregateAttendanceDataForRegression(
  detailedData: Record<string, { 
    verspaetungen_unentsch: AbsenceEntry[], 
    fehlzeiten_unentsch: AbsenceEntry[]
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
    studentCount: number  // Anzahl der Schüler für Klassendurchschnitte
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
            studentCount: 0
          };
        }
        
        // Verspätung zählen
        timeGroups[groupKey].verspaetungen += 1;
        
        // Studentenzähler erhöhen, wenn es ein neuer Schüler ist
        if (!timeGroups[groupKey].studentCount) {
          timeGroups[groupKey].studentCount = 1;
        }
      } catch (error) {
        console.error("Fehler bei der Verarbeitung von Verspätungen für Regression:", error);
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
            studentCount: 0
          };
        }
        
        // Fehlzeit zählen
        timeGroups[groupKey].fehlzeiten += 1;
        
        // Studentenzähler erhöhen, wenn es ein neuer Schüler ist
        if (!timeGroups[groupKey].studentCount) {
          timeGroups[groupKey].studentCount = 1;
        }
      } catch (error) {
        console.error("Fehler bei der Verarbeitung von Fehlzeiten für Regression:", error);
      }
    });
  });
  
  // In Array umwandeln und sortieren
  const sortedGroups = Object.entries(timeGroups)
    .map(([key, data]) => {
      // Bei Klassenauswahl Durchschnitt pro Schüler berechnen
      const isClassData = selectedClass && !selectedStudent;
      const divisor = isClassData ? Math.max(data.studentCount, 1) : 1;
      
      return {
        name: key,
        verspaetungen: data.verspaetungen / divisor,
        fehlzeiten: data.fehlzeiten / divisor,
        timestamp: data.timestamp,
        studentCount: data.studentCount,
        // Labels für die Anzeige
        periodLabel: groupBy === 'monthly' 
          ? new Date(data.timestamp).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })
          : `KW ${key.split('-W')[1]}`,
        dateRange: groupBy === 'monthly'
          ? `${new Date(data.timestamp.getFullYear(), data.timestamp.getMonth(), 1).toLocaleDateString('de-DE')} - ${new Date(data.timestamp.getFullYear(), data.timestamp.getMonth() + 1, 0).toLocaleDateString('de-DE')}`
          : `Woche ${key.split('-W')[1]}, ${data.timestamp.getFullYear()}`
      };
    })
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  return sortedGroups;
}