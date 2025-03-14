// src/components/attendance/dashboard/regressionUtils.ts
import * as math from 'mathjs';
import { AbsenceEntry } from '@/types';

export function resetRegressionCache(): void {
  // Reset any cached data here
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

// Durchschnittliche Schultage pro Woche, aufgeschlüsselt nach Monaten
// Basierend auf den monatlichen Schultagen und 4,33 Wochen pro Monat
export const WEEKLY_SCHOOL_DAYS_BY_MONTH: Record<string, number> = {
  'Sep': 3.46, 
  'Okt': 4.39, 
  'Nov': 4.62, 
  'Dez': 3.46,
  'Jan': 4.39, // Beispielwerte basierend auf monatlichen Daten
  'Feb': 4.62, 
  'Mar': 3.70, // Weniger Schultage wegen Osterferien möglich
  'Apr': 2.77, // Osterferien fallen oft komplett hier rein
  'Mai': 4.62, // Pfingstferien können Einfluss haben
  'Jun': 2.54, // Pfingstferien oft hier
  'Jul': 5.31, 
  'Aug': 0.00  // Ferienmonat
};

// Fallback für den Fall, dass kein Monat zugeordnet werden kann
export const DEFAULT_SCHOOL_DAYS_PER_WEEK = 5;

/**
 * Berechnet eine lineare Regression für Zeitreihendaten
 * Verwendet mathjs für die eigentlichen Berechnungen
 */
export function calculateLinearRegression(
  data: any[],
  valueKey: string = 'value',
  excludeOutliers: boolean = false,
  useRelativeValues: boolean = true
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
    const yValues = analysisData.map(point => {
      // Standard-Wert abrufen
      let value = typeof point[valueKey] === 'number' ? point[valueKey] : 0;
      
      // Wenn relative Werte verwendet werden sollen und relative Werte verfügbar sind,
      // verwende diese stattdessen
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
 * Gibt die durchschnittliche Anzahl von Schultagen pro Woche für einen bestimmten Monat zurück
 * 
 * @param month Der Monatsname (z.B. 'Jan', 'Feb', etc.)
 * @returns Die durchschnittliche Anzahl von Schultagen pro Woche für diesen Monat
 */
function getWeeklySchoolDaysForMonth(month: string | null): number {
  if (!month) return DEFAULT_SCHOOL_DAYS_PER_WEEK;
  
  // Normalisierter Monatsname
  const normalizedMonth = month.substring(0, 3);
  
  // Rückgabe des entsprechenden Werts oder des Standardwerts
  return WEEKLY_SCHOOL_DAYS_BY_MONTH[normalizedMonth] || DEFAULT_SCHOOL_DAYS_PER_WEEK;
}

/**
 * Extrahiert den Monat aus einer Wochenbezeichnung (z.B. "KW 12") oder einem Zeitstempel
 * 
 * @param weekLabel Die Wochenbezeichnung (z.B. "KW 12")
 * @param timestamp Optionaler Zeitstempel für genauere Zuordnung
 * @returns Der abgeleitete Monatsname oder null
 */
function extractMonthFromWeekDate(weekLabel: string, timestamp?: Date): string | null {
  // Wenn ein Zeitstempel vorhanden ist, verwende diesen zur Bestimmung des Monats
  if (timestamp && timestamp instanceof Date) {
    return getMonthName(timestamp.getMonth());
  }
  
  // Versuche, den Monat aus dem Wochenlabel zu extrahieren, falls es Datumsbestandteile enthält
  const monthPattern = /(Jan|Feb|Mar|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)/;
  const match = String(weekLabel).match(monthPattern);
  if (match) return match[1];
  
  // Versuch, die KW-Nummer zu extrahieren und daraus einen ungefähren Monat abzuleiten
  const weekMatch = weekLabel.match(/KW\s*(\d+)/i);
  if (weekMatch) {
    const weekNum = parseInt(weekMatch[1]);
    
    // Grobe Zuordnung von Kalenderwoche zu Monat
    // Dies ist nur eine Annäherung - die genaue Zuordnung hängt vom Jahr ab
    if (weekNum >= 1 && weekNum <= 4) return 'Jan';
    if (weekNum >= 5 && weekNum <= 8) return 'Feb';
    if (weekNum >= 9 && weekNum <= 13) return 'Mar';
    if (weekNum >= 14 && weekNum <= 17) return 'Apr';
    if (weekNum >= 18 && weekNum <= 22) return 'Mai';
    if (weekNum >= 23 && weekNum <= 26) return 'Jun';
    if (weekNum >= 27 && weekNum <= 30) return 'Jul';
    if (weekNum >= 31 && weekNum <= 35) return 'Aug';
    if (weekNum >= 36 && weekNum <= 39) return 'Sep';
    if (weekNum >= 40 && weekNum <= 44) return 'Okt';
    if (weekNum >= 45 && weekNum <= 48) return 'Nov';
    if (weekNum >= 49 && weekNum <= 53) return 'Dez';
  }
  
  // Standardwert, wenn keine Zuordnung möglich ist
  return null;
}

/**
 * Bereitet Zeitreihendaten für die Regressionsanalyse vor
 * und fügt Regressionslinienpunkte hinzu
 */
export function prepareRegressionData(
  timeSeriesData: any[],
  dataType: 'verspaetungen' | 'fehlzeiten' = 'verspaetungen',
  excludeOutliers: boolean = false,
  useRelativeValues: boolean = true
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
  
  // Wenn wir bereits genügend Datenpunkte haben, überspringen wir das Vervollständigen
  let completedData = timeSeriesData;
  if (timeSeriesData.length < 3) {
    // Nur wenn wir weniger als 3 Datenpunkte haben, vervollständigen wir die Daten
    completedData = ensureCompleteTimeSeriesData(timeSeriesData, dataType);
  }
  
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
  
  // Daten konsistent sortieren - verwende die gleiche Sortierlogik wie in der Visualisierung
  const sortedData = sortDataConsistently(completedData);
  
  // Relative Werte berechnen (Ereignisse pro Schultag)
  const dataWithRelativeValues = sortedData.map(point => {
    const month = extractMonthFromName(point.name);
    const week = extractWeekFromName(point.name);
    
    let schoolDays;
    
    if (month) {
      // Für monatliche Daten
      schoolDays = SCHOOL_DAYS_PER_MONTH[month] || 20; // Default 20 Tage, falls nicht gefunden
    } else if (week) {
      // Für wöchentliche Daten: Monatsbasierte durchschnittliche Schultage pro Woche verwenden
      // Versuche, den Monat aus den Metadaten zu extrahieren, falls vorhanden
      const dateStr = point.dateRange || '';
      const dateMonth = extractMonthFromName(dateStr);
      
      // Wenn ein Monat aus dem Datumsbereich gefunden wurde, verwende diesen
      if (dateMonth) {
        schoolDays = getWeeklySchoolDaysForMonth(dateMonth);
      } else {
        // Versuche, den Monat aus dem Zeitstempel abzuleiten
        const monthFromWeekLabel = extractMonthFromWeekDate(point.name, point.timestamp);
        schoolDays = getWeeklySchoolDaysForMonth(monthFromWeekLabel);
      }
    } else {
      // Fallback
      schoolDays = DEFAULT_SCHOOL_DAYS_PER_WEEK;
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
    
    // Neue Eigenschaft für die Anzeige:
    // Wenn useRelativeValues aktiviert ist, zeigen wir auch die ursprünglichen 
    // Datenpunkte relativ zu Schultagen an (für konsistente Skalierung)
    const displayValue = useRelativeValues 
      ? point.relativeValue || 0  // Wenn relativ aktiviert, verwende relativeValue
      : point[dataType];          // Sonst die ursprünglichen absoluten Werte
    
    return {
      ...point,
      displayValue,               // Neues Feld für die einheitliche Anzeige
      regressionLine: regressionValue,
      isOutlier,
      isRelativeMode: useRelativeValues // Marker für die Anzeige
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
  
  // Erweitere den Monatspattern um beide Formate zu erkennen (z.B. "Sep" und "Sept.")
  const monthPattern = /(Jan|Feb|Mar|Apr|Mai|Jun|Jul|Aug|Sep|Sept\.|Okt|Okt\.|Nov|Nov\.|Dez|Dez\.)(?:\s+\d{4})?/;
  const match = String(name).match(monthPattern);
  
  if (!match) return null;
  
  // Normalisieren des Monatsnamens
  const monthName = match[1];
  
  // Umwandeln in das kurze Format
  if (monthName === 'Sept.') return 'Sep';
  if (monthName === 'Okt.') return 'Okt';
  if (monthName === 'Nov.') return 'Nov';
  if (monthName === 'Dez.') return 'Dez';
  
  return monthName;
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
  
  // Wenn wir bereits mehr als 5 Datenpunkte haben, keine Ergänzung mehr notwendig
  if (data.length >= 5) {
    return data;
  }
  
  // Bestimme den Typ der Daten (wöchentlich oder monatlich)
  const isWeeklyData = data.some(item => item.name && String(item.name).includes('KW'));
  
  // Ermittle alle vorhandenen Perioden - mit Normalisierung für Monate
  const existingPeriods = new Set<string>();
  data.forEach(item => {
    if (item.name) {
      // Für Monate, normalisiere den Namen
      const monthName = extractMonthFromName(item.name);
      const yearMatch = String(item.name).match(/\d{4}/);
      
      if (monthName && yearMatch) {
        // Speichere in normalisiertem Format
        existingPeriods.add(`${monthName} ${yearMatch[0]}`);
      } else {
        // Für andere Formate (z.B. KW)
        existingPeriods.add(item.name);
      }
    }
  });
  const result = [...data];
  
  // Jahre aus den vorhandenen Daten extrahieren
  let dataYears = new Set<number>();
  data.forEach(item => {
    if (item.name) {
      const yearMatch = String(item.name).match(/\d{4}/);
      if (yearMatch) {
        dataYears.add(parseInt(yearMatch[0]));
      }
    }
  });
  
  // Jahre aus dem Datensatz sortieren und verwenden
  const sortedYears = Array.from(dataYears).sort();
  const startYear = sortedYears[0] || new Date().getFullYear();
  const endYear = sortedYears[sortedYears.length - 1] || startYear;
  
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
    
  // Wenn Wochennummern im Schuljahr-Pattern überspannt werden (KW40 im Vorjahr, KW3 in diesem Jahr)
  // Die erste Woche des Schuljahres ist typischerweise KW37 (September)
  const spansNewYear = weekNumbers.some(week => week < 10) && 
                     weekNumbers.some(week => week > 35);
    
    if (spansNewYear) {
      // Schuljahr: KW37 bis KW36
      const startWeek = weekNumbers.find(week => week > 35) || 37;
      const endWeek = weekNumbers.find(week => week < 10) || 5;
      
      for (let week = startWeek; week <= 52; week++) {
        if (!existingPeriods.has(`KW ${week}`)) {
          result.push({
            name: `KW ${week}`,
            [dataType]: 0,
            sortKey: week + 100, // Wochen im ersten Halbjahr (KW37-KW52)
            // Zusätzliche Metadaten für bessere Anzeige
            periodLabel: `KW ${week}`
          });
        }
      }
      
      for (let week = 1; week <= endWeek; week++) {
        if (!existingPeriods.has(`KW ${week}`)) {
          result.push({
            name: `KW ${week}`,
            [dataType]: 0,
            sortKey: week + 200, // Wochen im zweiten Halbjahr (KW1-KW36)
            // Zusätzliche Metadaten für bessere Anzeige
            periodLabel: `KW ${week}`
          });
        }
      }
    } else {
      // Normaler sequentieller Bereich
      for (let week = minWeek; week <= maxWeek; week++) {
        if (!existingPeriods.has(`KW ${week}`)) {
          // Berechnen des korrekten sortKey basierend auf Schuljahr-Pattern
          // Wochen 37-52 gehören zum ersten Teil des Schuljahres
          // Wochen 1-36 gehören zum zweiten Teil des Schuljahres
          const sortKey = week >= 37 ? week + 100 : week + 200;
          
          result.push({
            name: `KW ${week}`,
            [dataType]: 0,
            sortKey: sortKey,
            // Zusätzliche Metadaten für bessere Anzeige
            periodLabel: `KW ${week}`
          });
        }
      }
    }
  } else {
    // Monatliche Daten
    // Schuljahr-Monate in der richtigen Reihenfolge
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
    
    // Basierend auf den vorhandenen Daten Jahre bestimmen
    let firstHalfYear = startYear;
    let secondHalfYear = firstHalfYear;
    
    // Wenn Jan-Jul vorkommt und höheres Jahr hat, ist es das zweite Halbjahr
    if (minMonthIndex >= 4 && maxMonthIndex >= 4 && endYear > startYear) {
      secondHalfYear = endYear;
    }
    
    // Füge fehlende Monate hinzu - nur für den Zeitraum, der Daten enthält
    for (let i = minMonthIndex; i <= maxMonthIndex; i++) {
      const month = months[i];
      
      // Das Jahr hängt von der Position im Schuljahr ab
      // Sep-Dez = erstes Halbjahr, Jan-Aug = zweites Halbjahr
      const year = i < 4 ? firstHalfYear : secondHalfYear;
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
  // Deduplizierung: Entferne alle Null-Datenpunkte, wenn es bereits einen nicht-Null-Datenpunkt gibt
  const nameToIndexMap = new Map<string, number[]>();

  // Gruppiere Indizes nach normalisierten Namen
  result.forEach((item, index) => {
    const monthName = extractMonthFromName(item.name);
    const yearMatch = String(item.name).match(/\d{4}/);
    
    if (monthName && yearMatch) {
      const normalizedName = `${monthName} ${yearMatch[0]}`;
      if (!nameToIndexMap.has(normalizedName)) {
        nameToIndexMap.set(normalizedName, []);
      }
      nameToIndexMap.get(normalizedName)!.push(index);
    } else {
      // Für nicht-monatliche Daten
      if (!nameToIndexMap.has(item.name)) {
        nameToIndexMap.set(item.name, []);
      }
      nameToIndexMap.get(item.name)!.push(index);
    }
  });
  
  // Behalte nur die Daten-reichsten Einträge
  const indicesToKeep = new Set<number>();
  nameToIndexMap.forEach((indices) => {
    if (indices.length > 1) {
      // Finde den Eintrag mit den meisten Daten
      let bestIndex = indices[0];
      let bestValue = result[bestIndex][dataType] || 0;
      
      for (let i = 1; i < indices.length; i++) {
        const index = indices[i];
        const value = result[index][dataType] || 0;
        if (value > bestValue) {
          bestIndex = index;
          bestValue = value;
        }
      }
      
      indicesToKeep.add(bestIndex);
    } else {
      // Wenn es nur einen Eintrag gibt, behalte ihn
      indicesToKeep.add(indices[0]);
    }
  });
  
  // Filtere das Ergebnis
  const dedupedResult = result.filter((_, index) => indicesToKeep.has(index));
  
  // Sortiere das deduplizierte Ergebnis nach sortKey oder Name
  return dedupedResult.sort((a, b) => {
    if (a.sortKey !== undefined && b.sortKey !== undefined) {
      return a.sortKey - b.sortKey;
    }
    return String(a.name).localeCompare(String(b.name));
  });
}

/**
 * Aggregiert wöchentliche/monatliche Abwesenheitseinträge für einen bestimmten Schüler oder eine Klasse
 * für die Regressionsanalyse.
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
  if (!selectedStudent && !selectedClass) {
    return [];
  }
  
  // Relevante Schüler bestimmen
  let relevantStudents: string[] = [];
  
  if (selectedStudent) {
    // Einzelner Schüler ausgewählt
    relevantStudents = [selectedStudent];
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
    
    // Wenn keine Schüler gefunden wurden, versuche eine flexiblere Zuordnung
    if (relevantStudents.length === 0) {
      // Flexiblere Zuordnung versuchen
      relevantStudents = Object.entries(allStudentStats)
        .filter(([_, stats]) => {
          if (!stats.klasse) return false;
          
          // Case-insensitive Teil-Übereinstimmung
          return stats.klasse.toUpperCase().includes(selectedClass.toUpperCase()) ||
                 selectedClass.toUpperCase().includes(stats.klasse.toUpperCase());
        })
        .map(([student]) => student);
    }
  }
  
  if (relevantStudents.length === 0) {
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
  
  // WICHTIG: Prüfe, ob die relevanten Schüler überhaupt im detailedData vorhanden sind
  const availableStudents = relevantStudents.filter(student => !!detailedData[student]);
  
  if (availableStudents.length === 0) {
    return [];
  }
  
  // Versuche, mit den verfügbaren Daten zu arbeiten
  availableStudents.forEach(student => {
    const studentData = detailedData[student];
    if (!studentData) return;
    
    // Verspätungen verarbeiten
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
          
          // Studentenzähler initialisieren, wenn er noch nicht gesetzt ist
          if (!timeGroups[groupKey].studentCount) {
            timeGroups[groupKey].studentCount = relevantStudents.length;
          }
        } catch (error) {
          console.error("Fehler bei der Verarbeitung von Fehlzeiten für Regression:", error);
        }
      });
    }
  });
  
  // Wenn keine Daten vorhanden sind, leere Liste zurückgeben
  if (Object.keys(timeGroups).length === 0) {
    return [];
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

  // Sortkey für Wochennummern unter Berücksichtigung des Schuljahrs
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
  
  // In Array umwandeln und sortieren
  const sortedGroups = Object.entries(timeGroups)
    .map(([key, data]) => {
      // Bei Klassenauswahl Durchschnitt pro Schüler berechnen
      const isClassData = selectedClass && !selectedStudent;
      
      // Divisor nur anwenden, wenn es eine Klassenauswahl ist UND studentCount > 1
      const divisor = isClassData ? Math.max(data.studentCount, 1) : 1;
      
      // Schultagszahl pro Zeiteinheit ermitteln
      let schoolDays;
      
      // Für monatliche Gruppierung spezifische Tage aus der Konfiguration holen
      if (groupBy === 'monthly') {
        const month = key.split(' ')[0]; // Extrahiere den Monatsnamen
        schoolDays = SCHOOL_DAYS_PER_MONTH[month] || 20; // Default 20 Tage, falls nicht konfiguriert
      } else {
        // Für wöchentliche Gruppierung: Monatsbasierte durchschnittliche Schultage verwenden
        // Versuche, den Monat aus dem Zeitstempel abzuleiten
        const monthFromDate = data.timestamp ? getMonthName(data.timestamp.getMonth()) : null;
        
        // Alternativer Versuch: Monat aus der Wochenbezeichnung ableiten
        const monthFromWeekLabel = extractMonthFromWeekDate(key, data.timestamp);
        
        // Verwende den ersten verfügbaren Monat oder den Standardwert
        const month = monthFromDate || monthFromWeekLabel;
        schoolDays = getWeeklySchoolDaysForMonth(month);
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
        periodLabel,
        dateRange,
        sortKey,
        verspaetungenProTag,
        fehlzeitenProTag,
        schoolDays,
        rawEntries: data.rawEntries
      };
    })
    .sort((a, b) => a.sortKey - b.sortKey);
  
  // Sorge für ausreichend Datenpunkte durch Lückenfüllung
  const finalResult = ensureCompleteTimeSeriesData(sortedGroups, groupBy === 'weekly' ? 'verspaetungen' : 'fehlzeiten');
  
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

/**
 * Sorts data consistently for both regression calculation and visualization
 * to ensure the regression line appears correctly without kinks
 */
export function sortDataConsistently(data: any[]): any[] {
  if (!data || data.length === 0) return [];
  
  return [...data].sort((a, b) => {
    // Prüfe zuerst, ob einer der Punkte ein Vorhersagepunkt ist
    if (a.isPrediction && !b.isPrediction) return 1;
    if (!a.isPrediction && b.isPrediction) return -1;
    
    // Versuche, Wochennummern zu extrahieren
    const weekA = a.name?.match(/KW\s*(\d+)/i)?.[1];
    const weekB = b.name?.match(/KW\s*(\d+)/i)?.[1];
    
    if (weekA && weekB) {
      const weekNumA = parseInt(weekA);
      const weekNumB = parseInt(weekB);
      
      // Schuljahr-Sortierlogik:
      // KW35-KW36 kommen ZUERST (35-36)
      // KW37-KW52 kommen als ZWEITES (137-152)
      // KW1-KW34 kommen als DRITTES (201-234)
      let sortKeyA, sortKeyB;
      
      if (weekNumA >= 35 && weekNumA <= 36) sortKeyA = weekNumA;
      else if (weekNumA >= 37) sortKeyA = weekNumA + 100;
      else sortKeyA = weekNumA + 200;
      
      if (weekNumB >= 35 && weekNumB <= 36) sortKeyB = weekNumB;
      else if (weekNumB >= 37) sortKeyB = weekNumB + 100;
      else sortKeyB = weekNumB + 200;
      
      return sortKeyA - sortKeyB;
    }
    
    // Falls es sich um Monate handelt, sortiere basierend auf dem Schuljahr (Sep-Aug)
    const monthA = a.name?.match(/^(Jan|Feb|Mar|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)/)?.[1];
    const monthB = b.name?.match(/^(Jan|Feb|Mar|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)/)?.[1];
    
    if (monthA && monthB) {
      const monthOrder: Record<string, number> = {
        'Sep': 1, 'Okt': 2, 'Nov': 3, 'Dez': 4,
        'Jan': 5, 'Feb': 6, 'Mar': 7, 'Apr': 8,
        'Mai': 9, 'Jun': 10, 'Jul': 11, 'Aug': 12
      };
      
      return (monthOrder[monthA] || 0) - (monthOrder[monthB] || 0);
    }
    
    // Wenn weder Wochen noch Monate, verwende sortKey falls vorhanden
    if (a.sortKey !== undefined && b.sortKey !== undefined) {
      return a.sortKey - b.sortKey;
    }
    
    // Fallback: verwende Timestamps, falls vorhanden
    if (a.timestamp && b.timestamp) {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
    
    // Letzte Möglichkeit: nach Namen sortieren
    return String(a.name).localeCompare(String(b.name));
  });
}