// src/components/attendance/dashboard/regressionUtils.ts
import * as math from 'mathjs';
import { AbsenceEntry } from '@/types';

export function resetRegressionCache(): void {
  // Reset any cached data here
  // For now this is a placeholder until we fully implement the regression cache
  console.log("Regression cache reset");
}
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

// Durchschnittliche Schultage pro Monat für indirekte Schätzung
export const SCHOOL_DAYS_PER_MONTH: Record<string, number> = {
  'Jan': 19,
  'Feb': 20,
  'Mar': 16,
  'Apr': 12,
  'Mai': 20,
  'Jun': 11,
  'Jul': 23,
  'Aug': 0,
  'Sep': 15,
  'Okt': 19,
  'Nov': 20,
  'Dez': 15
};

// Durchschnittliche Schultage pro Woche (typischweise 5)
export const SCHOOL_DAYS_PER_WEEK = 5;

/**
 * Berechnet eine lineare Regression für Zeitreihendaten
 * Verwendet mathjs für die eigentlichen Berechnungen
 * 
 * @param data Array mit Zeitreihendaten
 * @param valueKey Schlüssel für den zu analysierenden Wert (absolut oder relativ)
 * @param excludeOutliers Ob Ausreißer von der Berechnung ausgeschlossen werden sollen
 * @param useRelativeValues Ob relative Werte (pro Schultag) verwendet werden sollen
 * @returns Regressionsergebnis mit Steigung, y-Achsenabschnitt und R²
 */
export function calculateLinearRegression(
  data: any[],
  valueKey: string = 'value',
  excludeOutliers: boolean = false,
  useRelativeValues: boolean = true  // Neue Option für relative Werte
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
    // Bei relativen Werten verwenden wir den relativKey, falls verfügbar
    const yValues = analysisData.map(point => {
      // Standard-Wert abrufen
      let value = typeof point[valueKey] === 'number' ? point[valueKey] : 0;
      
      // Wenn relative Werte verwendet werden sollen und relative Werte verfügbar sind,
      // verwende diese stattdessen (relativeValue wird in prepareRegressionData berechnet)
      if (useRelativeValues && typeof point.relativeValue === 'number') {
        value = point.relativeValue;
      }
      
      return value;
    });
    
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

    // Trendinterpretation - angepasst für relative Werte, wenn verwendet
    const trendDescription = getTrendDescription(slope, rSquared, useRelativeValues);

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
  
  // Wenn zu wenig gültige Werte übrig bleiben, keine Ausreißer identifizieren
  if (values.length < 4) return [];
  
  // Sortiere die Werte für Quartilberechnung
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Berechne Q1 (25% Quartil) und Q3 (75% Quartil)
  const q1Index = Math.floor(sortedValues.length * 0.25);
  const q3Index = Math.floor(sortedValues.length * 0.75);
  
  const q1 = sortedValues[q1Index];
  const q3 = sortedValues[q3Index];
  
  // Berechne IQR (Interquartilsabstand)
  const iqr = q3 - q1;
  
  // Definiere Grenzen für Ausreißer - erweitert für sehr kleine Werte
  const lowerBound = Math.max(0, q1 - outlierThreshold * iqr); // Verhindere negative Grenzen
  const upperBound = q3 + outlierThreshold * iqr;
  
  // Identifiziere Ausreißer - nur extreme Werte
  const outliers: number[] = [];
  values.forEach((value, index) => {
    // Extremwerte als Ausreißer betrachten
    if (value < lowerBound || value > upperBound) {
      // Zusätzliche Prüfung: Ist der Wert drastisch anders als der Durchschnitt?
      // Dies verhindert, dass zu viele Datenpunkte als Ausreißer markiert werden
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const deviation = Math.abs(value - average) / Math.max(1, average);
      
      // Nur wenn die Abweichung mehr als 50% beträgt, als Ausreißer betrachten
      if (deviation > 0.5) {
        outliers.push(index);
      }
    }
  });
  
  return outliers;
}

/**
 * Erzeugt eine textuelle Beschreibung des Trends
 * Berücksichtigt auch, ob relative Werte verwendet werden
 */
function getTrendDescription(slope: number, rSquared: number, isRelative: boolean = false): string {
  // Bei sehr geringem R² ist die Trendaussage unzuverlässig
  if (rSquared < 0.1) {
    return 'Kein eindeutiger Trend erkennbar (geringe Korrelation)';
  }
  
  // Bei fast keiner Veränderung - konstanter Trend
  if (Math.abs(slope) < 0.01) {
    return 'Stabil (keine signifikante Veränderung)';
  }
  
  // Die Richtung des Trends - bei Abwesenheiten ist ein Rückgang positiv
  // Bei relativen Werten ist die Interpretation präziser
  const directionText = slope > 0 ? 'Ansteigend' : 'Abnehmend';
  
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
  
  // Zusätzliche Information für relative Werte
  const relativeInfo = isRelative ? ' pro Schultag' : '';
  
  return `${directionText} ${strength}${relativeInfo}${reliability}`;
}

/**
 * Bereitet Zeitreihendaten für die Regressionsanalyse vor
 * und fügt Regressionslinienpunkte hinzu
 * 
 * @param timeSeriesData Zeitreihendaten aus dem Dashboard
 * @param dataType 'verspaetungen' oder 'fehlzeiten'
 * @param excludeOutliers Ob Ausreißer von der Berechnung ausgeschlossen werden sollen
 * @param useRelativeValues Ob relative Werte (pro Schultag) verwendet werden sollen
 * @returns Daten mit Regressionslinie und Ergebnissen
 */
export function prepareRegressionData(
  timeSeriesData: any[],
  dataType: 'verspaetungen' | 'fehlzeiten' = 'verspaetungen',
  excludeOutliers: boolean = false,
  useRelativeValues: boolean = true  // Neue Option für relative Werte
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
  
  // Stellen Sie sicher, dass die Daten vollständig sind (alle Zeiträume)
  const completedData = ensureCompleteTimeSeriesData(timeSeriesData, dataType);
  
  // Bei zu wenig Datenpunkten (<3) entsprechende Fehlermeldung zurückgeben
  if (completedData.length < 3) {
    return {
      dataWithRegression: completedData,
      regressionResult: {
        slope: 0,
        intercept: 0,
        rSquared: 0,
        trendDescription: `Zu wenig Datenpunkte für Regression (${completedData.length})`,
        outliers: []
      }
    };
  }
  
  // Daten sortieren, falls noch nicht geschehen
  const sortedData = [...completedData].sort((a, b) => {
    if (a.sortKey !== undefined && b.sortKey !== undefined) {
      return a.sortKey - b.sortKey;
    }
    if (a.timestamp && b.timestamp) {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
    return String(a.name).localeCompare(String(b.name));
  });
  
  // Relative Werte berechnen (Ereignisse pro Schultag)
  const dataWithRelativeValues = sortedData.map(point => {
    const month = extractMonthFromName(point.name);
    const week = extractWeekFromName(point.name);
    
    let schoolDays = SCHOOL_DAYS_PER_WEEK; // Default für wöchentliche Daten
    
    if (month) {
      // Für monatliche Daten
      schoolDays = SCHOOL_DAYS_PER_MONTH[month] || 20; // Default 20 Tage, falls nicht gefunden
    } else if (week) {
      // Für wöchentliche Daten bleiben wir bei SCHOOL_DAYS_PER_WEEK
    }
    
    // Berechnung des relativen Wertes (pro Schultag)
    const relativeValue = schoolDays > 0 ? point[dataType] / schoolDays : 0;
    
    return {
      ...point,
      relativeValue, // Speichere den relativen Wert
      schoolDays    // Speichere die Anzahl der Schultage
    };
  });
  
  // Regression berechnen - entweder mit absoluten oder relativen Werten
  const regressionResult = calculateLinearRegression(
    dataWithRelativeValues, 
    useRelativeValues ? 'relativeValue' : dataType, 
    excludeOutliers,
    useRelativeValues
  );
  
  // Regressionslinie zu den Daten hinzufügen
  const dataWithRegression = dataWithRelativeValues.map((point, index) => {
    const regressionValue = regressionResult.intercept + (regressionResult.slope * index);
    const isOutlier = regressionResult.outliers.includes(index);
    
    return {
      ...point,
      regressionLine: regressionValue,
      isOutlier
    };
  });
  
  // Füge Vorhersagepunkt hinzu, wenn die Regression sinnvolle Ergebnisse liefert
  if (regressionResult.rSquared > 0.2 && sortedData.length > 0) {
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
    
    // Erstelle Vorhersagepunkt - sowohl mit absoluten als auch mit relativen Werten
    const predictionPoint = {
      ...lastPoint,
      name: 'Prognose',
      timestamp: nextPointDate,
      [dataType]: null, // Keine tatsächlichen Daten
      regressionLine: regressionResult.prediction,
      isPrediction: true,
      // Auch relative Werte für die Vorhersage
      relativeValue: null,
      // Erklärungstext für die Vorhersage
      predictionExplanation: useRelativeValues
        ? `Vorhersage: ${(regressionResult.prediction ?? 0).toFixed(3)} pro Schultag`
        : `Vorhersage: ${(regressionResult.prediction ?? 0).toFixed(1)}`
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
 * Extrahiert den Monatsnamen aus einem Datenpunktnamen
 */
function extractMonthFromName(name: string): string | null {
  if (!name) return null;
  
  // Versuche, einen Monatsnamen zu extrahieren
  const monthPattern = /(Jan|Feb|Mar|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)(?:\s+\d{4})?/;
  const match = String(name).match(monthPattern);
  
  return match ? match[1] : null;
}

/**
 * Extrahiert die Wochennummer aus einem Datenpunktnamen
 */
function extractWeekFromName(name: string): number | null {
  if (!name) return null;
  
  // Versuche, eine Wochennummer zu extrahieren (Format: KW XX)
  const weekPattern = /KW\s*(\d+)/i;
  const match = String(name).match(weekPattern);
  
  return match ? parseInt(match[1]) : null;
}

/**
 * Stellt sicher, dass alle Zeitperioden im Datensatz enthalten sind,
 * auch wenn keine Ereignisse stattfanden.
 */
function ensureCompleteTimeSeriesData(
  data: any[],
  dataType: 'verspaetungen' | 'fehlzeiten' = 'verspaetungen'
): any[] {
  if (!data || data.length === 0) return [];
  
  // Bestimme den Typ der Daten (wöchentlich oder monatlich)
  const isWeeklyData = data.some(item => item.name && String(item.name).includes('KW'));
  
  // Ermittle alle vorhandenen Perioden
  const existingPeriods = new Set(data.map(item => item.name));
  const result = [...data];
  
  if (isWeeklyData) {
    // Wöchentliche Daten - finde min/max Wochennummern
    const weekNumbers = Array.from(existingPeriods)
      .map(name => {
        const match = String(name).match(/KW\s*(\d+)/i);
        return match ? parseInt(match[1]) : null;
      })
      .filter(num => num !== null) as number[];
    
    if (weekNumbers.length === 0) return data;
    
    // Min/Max Wochen bestimmen
    const minWeek = Math.min(...weekNumbers);
    const maxWeek = Math.max(...weekNumbers);
    
    // Prüfen, ob der Datensatz über den Jahreswechsel geht
    const spansNewYear = weekNumbers.some(week => week < 10) && 
                       weekNumbers.some(week => week > 40);
    
    if (spansNewYear) {
      // Schuljahr: KW37 bis KW36
      const startWeek = weekNumbers.find(week => week > 35) || 37;
      const endWeek = weekNumbers.find(week => week < 10) || 5;
      
      // Fülle Lücken: startWeek bis 52, dann 1 bis endWeek
      for (let week = startWeek; week <= 52; week++) {
        if (!existingPeriods.has(`KW ${week}`)) {
          result.push({
            name: `KW ${week}`,
            [dataType]: 0,
            sortKey: week + 100 // Wochen im ersten Halbjahr (KW37-KW52)
          });
        }
      }
      
      for (let week = 1; week <= endWeek; week++) {
        if (!existingPeriods.has(`KW ${week}`)) {
          result.push({
            name: `KW ${week}`,
            [dataType]: 0,
            sortKey: week + 200 // Wochen im zweiten Halbjahr (KW1-KW36)
          });
        }
      }
    } else {
      // Normaler sequentieller Bereich
      for (let week = minWeek; week <= maxWeek; week++) {
        if (!existingPeriods.has(`KW ${week}`)) {
          result.push({
            name: `KW ${week}`,
            [dataType]: 0,
            sortKey: week
          });
        }
      }
    }
  } else {
    // Monatliche Daten
    const currentYear = new Date().getFullYear();
    const months = [
      { key: 'Sep', index: 0 },
      { key: 'Okt', index: 1 },
      { key: 'Nov', index: 2 },
      { key: 'Dez', index: 3 },
      { key: 'Jan', index: 4 },
      { key: 'Feb', index: 5 },
      { key: 'Mar', index: 6 },
      { key: 'Apr', index: 7 },
      { key: 'Mai', index: 8 },
      { key: 'Jun', index: 9 },
      { key: 'Jul', index: 10 },
      { key: 'Aug', index: 11 }
    ];
    
    // Finde min/max Monate im Datensatz
    let minMonthIndex = 12;
    let maxMonthIndex = -1;
    
    existingPeriods.forEach(period => {
      const periodStr = String(period);
      months.forEach(month => {
        if (periodStr.includes(month.key)) {
          minMonthIndex = Math.min(minMonthIndex, month.index);
          maxMonthIndex = Math.max(maxMonthIndex, month.index);
        }
      });
    });
    
    // Wenn keine Monate gefunden wurden, Original-Daten zurückgeben
    if (minMonthIndex > maxMonthIndex) return data;
    
    // Füge fehlende Monate hinzu
    for (let i = minMonthIndex; i <= maxMonthIndex; i++) {
      const month = months[i];
      // Das Jahr hängt von der Position im Schuljahr ab
      const year = i < 4 ? currentYear : currentYear + 1;
      const monthWithYear = `${month.key} ${year}`;
      
      if (!existingPeriods.has(monthWithYear)) {
        result.push({
          name: monthWithYear,
          [dataType]: 0,
          sortKey: i + 1, // sortKey basierend auf der Position im Schuljahr
          // Zusätzliche Metadaten für bessere Anzeige
          dateRange: `${month.key} ${year}`
        });
      }
    }
  }
  
  // Sortiere das Ergebnis nach sortKey oder Name
  return result.sort((a, b) => {
    if (a.sortKey !== undefined && b.sortKey !== undefined) {
      return a.sortKey - b.sortKey;
    }
    return String(a.name).localeCompare(String(b.name));
  });
}

/**
 * Aggregiert wöchentliche/monatliche Abwesenheitseinträge für einen bestimmten Schüler oder eine Klasse
 * für die Regressionsanalyse. Berücksichtigt nun auch die indirekten Schätzungen (Schultagsbasis).
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
  console.log(`Regression: Starting aggregation for ${selectedStudent ? 'student' : 'class'} "${selectedStudent || selectedClass}"`);
  
  // Wenn kein Schüler oder Klasse ausgewählt ist, leere Daten zurückgeben
  if (!selectedStudent && !selectedClass) {
    console.log("Regression: No student or class selected, returning empty data");
    return [];
  }
  
  // Relevante Schüler bestimmen
  let relevantStudents: string[] = [];
  
  if (selectedStudent) {
    // Einzelner Schüler ausgewählt
    relevantStudents = [selectedStudent];
    console.log(`Regression: Analyzing data for student "${selectedStudent}"`);
  } else if (selectedClass && allStudentStats) {
    // Schüler nach Klasse filtern - verbesserte Klassennamenzuordnung
    relevantStudents = Object.entries(allStudentStats)
      .filter(([_, stats]) => {
        // Normalisiere Klassennamen für besseren Vergleich
        const normalizedSelectedClass = selectedClass.trim().toUpperCase();
        const normalizedStudentClass = stats.klasse?.trim().toUpperCase() || '';
        return normalizedStudentClass === normalizedSelectedClass;
      })
      .map(([student]) => student);
    
    console.log(`Regression: ${relevantStudents.length} students found for class "${selectedClass}"`);
    
    // Wenn keine Schüler gefunden wurden, versuche eine flexiblere Zuordnung
    if (relevantStudents.length === 0) {
      // Alle verfügbaren Klassen auflisten
      const availableClasses = new Set<string>();
      Object.values(allStudentStats).forEach(stats => {
        if (stats.klasse) {
          availableClasses.add(stats.klasse);
        }
      });
      
      console.log(`Regression: No students for class "${selectedClass}" found. Available classes: ${Array.from(availableClasses).join(', ')}`);
      
      // Flexiblere Zuordnung versuchen
      relevantStudents = Object.entries(allStudentStats)
        .filter(([_, stats]) => {
          if (!stats.klasse) return false;
          
          // Case-insensitive Teil-Übereinstimmung
          return stats.klasse.toUpperCase().includes(selectedClass.toUpperCase()) ||
                 selectedClass.toUpperCase().includes(stats.klasse.toUpperCase());
        })
        .map(([student]) => student);
      
      console.log(`Regression: After flexible matching, ${relevantStudents.length} students found for class "${selectedClass}"`);
    }
  }
  
  if (relevantStudents.length === 0) {
    console.log(`Regression: No relevant students found, returning empty data`);
    return [];
  }
  
  // Zeittracking für Gruppierung
  type TimeGroupData = { 
    verspaetungen: number,
    fehlzeiten: number,
    timestamp: Date,
    studentCount: number,
    rawEntries: {
      verspaetungen: AbsenceEntry[],
      fehlzeiten: AbsenceEntry[]
    }
  };

  const timeGroups: Record<string, TimeGroupData> = {};
  
  // Aktuelles Datum für Jahr/Woche-Bestimmung
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Daten aggregieren
  let totalDataPoints = 0;
  
  // WICHTIG: Prüfe, ob die relevanten Schüler überhaupt im detailedData vorhanden sind
  const availableStudents = relevantStudents.filter(student => !!detailedData[student]);
  console.log(`Regression: ${availableStudents.length} of ${relevantStudents.length} students have data in detailedData`);
  
  if (availableStudents.length === 0) {
    console.log("Regression: None of the selected students have data in detailedData!");
    
    // Fallback: Erzeugen von Dummy-Daten für Debugging/Entwicklung
    if (process.env.NODE_ENV !== 'production') {
      console.log("Regression: Creating mock data points for development");
      
      // Zeiträume für Schuljahr Sep-Feb
      const months = ['Sep', 'Okt', 'Nov', 'Dez', 'Jan', 'Feb'];
      
      months.forEach((month, index) => {
        const year = index < 4 ? currentYear : currentYear + 1;
        const groupKey = `${month} ${year}`;
        
        // Erzeuge Dummy-Daten
        timeGroups[groupKey] = {
          verspaetungen: Math.floor(Math.random() * 10) * relevantStudents.length,
          fehlzeiten: Math.floor(Math.random() * 5) * relevantStudents.length,
          timestamp: new Date(`${year}-${index < 4 ? index + 9 : index - 3}-15`),
          studentCount: relevantStudents.length,
          rawEntries: {
            verspaetungen: [],
            fehlzeiten: []
          }
        };
        totalDataPoints += 2; // 1 für Verspätungen, 1 für Fehlzeiten
      });
    }
  }
  
  // Versuche, mit den verfügbaren Daten zu arbeiten
  availableStudents.forEach(student => {
    const studentData = detailedData[student];
    if (!studentData) {
      console.log(`Regression: No data for student "${student}"`);
      return;
    }
    
    // Prüfe und logge Datenstruktur für den ersten Schüler
    if (student === availableStudents[0]) {
      console.log(`Regression: Data structure for first student:`, {
        hasVerspaetungen: Array.isArray(studentData.verspaetungen_unentsch),
        verspaetungenCount: studentData.verspaetungen_unentsch?.length || 0,
        hasFehlzeiten: Array.isArray(studentData.fehlzeiten_unentsch),
        fehlzeitenCount: studentData.fehlzeiten_unentsch?.length || 0
      });
    }
    
    // Verspätungen verarbeiten
    let verspaetungenProcessed = 0;
    
    if (Array.isArray(studentData.verspaetungen_unentsch) && studentData.verspaetungen_unentsch.length > 0) {
      studentData.verspaetungen_unentsch.forEach(entry => {
        try {
          const date = typeof entry.datum === 'string' ? new Date(entry.datum) : entry.datum;
          if (!date || isNaN(date.getTime())) return;
          
          // Gruppierungsschlüssel bestimmen
          let groupKey: string;
          
          if (groupBy === 'monthly') {
            // Monatliche Gruppierung
            const month = getMonthName(date.getMonth());
            const year = date.getFullYear();
            groupKey = `${month} ${year}`;
          } else { // weekly
            // Wöchentliche Gruppierung
            const weekNumber = getISOWeek(date);
            groupKey = `KW ${weekNumber}`;
          }
          
          // Gruppe initialisieren falls nötig
          if (!timeGroups[groupKey]) {
            timeGroups[groupKey] = {
              verspaetungen: 0,
              fehlzeiten: 0,
              timestamp: date,
              studentCount: 0,
              rawEntries: {
                verspaetungen: [],
                fehlzeiten: []
              }
            };
          }
          
          // Verspätung zählen
          timeGroups[groupKey].verspaetungen += 1;
          timeGroups[groupKey].rawEntries.verspaetungen.push(entry);
          verspaetungenProcessed++;
          totalDataPoints++;
          
          // Studentenzähler initialisieren, wenn er noch nicht gesetzt ist
          if (!timeGroups[groupKey].studentCount) {
            timeGroups[groupKey].studentCount = relevantStudents.length;
          }
        } catch (error) {
          console.error("Fehler bei der Verarbeitung von Verspätungen für Regression:", error);
        }
      });
    }
    
    // Fehlzeiten verarbeiten
    let fehlzeitenProcessed = 0;
    
    if (Array.isArray(studentData.fehlzeiten_unentsch) && studentData.fehlzeiten_unentsch.length > 0) {
      studentData.fehlzeiten_unentsch.forEach(entry => {
        try {
          const date = typeof entry.datum === 'string' ? new Date(entry.datum) : entry.datum;
          if (!date || isNaN(date.getTime())) return;
          
          // Gruppierungsschlüssel bestimmen
          let groupKey: string;
          
          if (groupBy === 'monthly') {
            // Monatliche Gruppierung
            const month = getMonthName(date.getMonth());
            const year = date.getFullYear();
            groupKey = `${month} ${year}`;
          } else { // weekly
            // Wöchentliche Gruppierung
            const weekNumber = getISOWeek(date);
            groupKey = `KW ${weekNumber}`;
          }
          
          // Gruppe initialisieren falls nötig
          if (!timeGroups[groupKey]) {
            timeGroups[groupKey] = {
              verspaetungen: 0,
              fehlzeiten: 0,
              timestamp: date,
              studentCount: 0,
              rawEntries: {
                verspaetungen: [],
                fehlzeiten: []
              }
            };
          }
          
          // Fehlzeit zählen
          timeGroups[groupKey].fehlzeiten += 1;
          timeGroups[groupKey].rawEntries.fehlzeiten.push(entry);
          fehlzeitenProcessed++;
          totalDataPoints++;
          
          // Studentenzähler initialisieren, wenn er noch nicht gesetzt ist
          if (!timeGroups[groupKey].studentCount) {
            timeGroups[groupKey].studentCount = relevantStudents.length;
          }
        } catch (error) {
          console.error("Fehler bei der Verarbeitung von Fehlzeiten für Regression:", error);
        }
      });
    }
    
    // Log details für den ersten Schüler
    if (student === availableStudents[0]) {
      console.log(`Regression: Processed ${verspaetungenProcessed} tardiness and ${fehlzeitenProcessed} absence entries for first student`);
    }
  });
  
  // Wenn keine Daten vorhanden sind, leere Liste zurückgeben
  if (Object.keys(timeGroups).length === 0) {
    console.log("Regression: No data after aggregation, returning empty array");
    return [];
  }
  
  console.log(`Regression: Aggregated ${totalDataPoints} data points into ${Object.keys(timeGroups).length} time periods`);
  
  // Neue Funktion: Sortkey für Wochennummern unter Berücksichtigung des Schuljahrs
  function getSchoolYearWeekSortKey(weekNum: number, date: Date): number {
    // Bestimme das Schuljahr basierend auf dem Monat
    // Schuljahr beginnt im September (Monat 8)
    const month = date.getMonth();
    
    // Für Wochennummern im ersten Teil des Schuljahrs (Sept-Dez): 100-152
    if (month >= 8) { // September-Dezember
      return weekNum + 100;
    }
    // Für Wochennummern im zweiten Teil des Schuljahrs (Jan-Aug): 200-236
    else {
      return weekNum + 200;
    }
  }
  
  // Sortierlogik für Wochennummern oder Monatsnamen mit Jahr
  function getSortKeyForGroupKey(groupKey: string, date: Date): number {
    // Prüfe, ob es sich um eine Wochennummer handelt
    const weekMatch = groupKey.match(/KW\s*(\d+)/i);
    if (weekMatch) {
      const weekNum = parseInt(weekMatch[1]);
      return getSchoolYearWeekSortKey(weekNum, date);
    }
    
    // Monatsnamen mit gewichtetem Index für Schuljahr
    const monthMap: Record<string, number> = {
      'Sep': 1, 'Okt': 2, 'Nov': 3, 'Dez': 4,
      'Jan': 5, 'Feb': 6, 'Mar': 7, 'Apr': 8,
      'Mai': 9, 'Jun': 10, 'Jul': 11, 'Aug': 12
    };
    
    // Prüfe, ob der Gruppenname einen Monat enthält
    const monthMatch = groupKey.match(/^(Jan|Feb|Mar|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)/);
    if (monthMatch) {
      return monthMap[monthMatch[1]] || 0;
    }
    
    // Fallback: Einfach 0
    return 0;
  }
  
  // In Array umwandeln und sortieren
  const sortedGroups = Object.entries(timeGroups)
    .map(([key, data]) => {
      // Bei Klassenauswahl Durchschnitt pro Schüler berechnen
      const isClassData = selectedClass && !selectedStudent;
      
      // KRITISCHE ÄNDERUNG: Divisor nur anwenden, wenn es eine Klassenauswahl ist
      // UND die studentCount tatsächlich > 1 ist
      // Für single-student oder bei studentCount = 0 nicht dividieren (divisor = 1)
      const divisor = isClassData ? Math.max(data.studentCount, 1) : 1;
      
      // Debug-Log für die ersten paar Datenpunkte
      if (Object.keys(timeGroups).indexOf(key) < 5) {
        console.log(`Regression: Time period ${key}: verspaetungen=${data.verspaetungen}, divisor=${divisor}, result=${data.verspaetungen/divisor}`);
      }
      
      // Schultagszahl pro Zeiteinheit ermitteln
      let schoolDays = SCHOOL_DAYS_PER_WEEK; // Standard für wöchentliche Gruppierung
      
      // Für monatliche Gruppierung spezifische Tage aus der Konfiguration holen
      if (groupBy === 'monthly') {
        const month = key.split(' ')[0]; // Extrahiere den Monatsnamen
        schoolDays = SCHOOL_DAYS_PER_MONTH[month] || 20; // Default 20 Tage, falls nicht konfiguriert
      }
      
      // Relative Werte pro Schultag berechnen
      const verspaetungenProTag = data.verspaetungen / schoolDays / divisor;
      const fehlzeitenProTag = data.fehlzeiten / schoolDays / divisor;
      
      // Sortkey für korrekte chronologische Sortierung
      const sortKey = getSortKeyForGroupKey(key, data.timestamp);
      
      // Datumsbereich für die Anzeige formatieren
      let dateRange = '';
      if (groupBy === 'monthly') {
        // Für monatliche Daten: Monatsname und Jahr
        dateRange = key;
      } else {
        // Für wöchentliche Daten: Kalenderwoche
        const weekNum = key.match(/KW\s*(\d+)/i)?.[1] || '';
        const year = data.timestamp.getFullYear();
        dateRange = `KW${weekNum}/${year}`;
      }
      
      // Ermittle Anzeigebezeichnung für die Periode
      const periodLabel = groupBy === 'monthly' 
        ? key // Für Monate: "Jan 2024"
        : key; // Für Wochen: "KW 37"
      
      return {
        name: key,
        verspaetungen: data.verspaetungen / divisor,
        fehlzeiten: data.fehlzeiten / divisor,
        timestamp: data.timestamp,
        studentCount: data.studentCount,
        // Labels für die Anzeige
        periodLabel,
        dateRange,
        // Sortkey für korrekte Sortierung
        sortKey,
        // Relative Werte (pro Schultag)
        verspaetungenProTag,
        fehlzeitenProTag,
        // Anzahl der Schultage
        schoolDays,
        // Rohdaten für eventuelle weitere Analysen
        rawEntries: data.rawEntries
      };
    })
    .sort((a, b) => a.sortKey - b.sortKey);
  
  // Log nach der Sortierung
  console.log(`Regression: Processed ${sortedGroups.length} data points after sorting`);
  
  // Sorge für ausreichend Datenpunkte durch Lückenfüllung
  const finalResult = ensureCompleteTimeSeriesData(sortedGroups, groupBy === 'weekly' ? 'verspaetungen' : 'fehlzeiten');
  
  // Final logging
  console.log(`Regression: Final result has ${finalResult.length} data points`);
  if (finalResult.length > 0) {
    console.log("Regression: First data point:", {
      name: finalResult[0].name,
      verspaetungen: finalResult[0].verspaetungen,
      fehlzeiten: finalResult[0].fehlzeiten
    });
  }
  
  return finalResult;
}

/**
 * Hilfsfunktion: ISO-Wochennummer für ein Datum bestimmen
 */
function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Donnerstag in der aktuellen Woche
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  // 1. Januar des Jahres
  const yearStart = new Date(d.getFullYear(), 0, 1);
  // Berechnung der Wochennummer: Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Hilfsfunktion: Deutschsprachiger Monatsnamen für Monatszahl (0-11)
 */
function getMonthName(monthIndex: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return months[monthIndex] || '';
}