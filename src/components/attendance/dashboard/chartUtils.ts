/**
 * Berechnet die geeignete Breite für ein Chart basierend auf den Datenpunkten
 * @param dataLength Anzahl der Datenpunkte
 * @param groupBy Optionale Gruppierungsart ('weekly' oder 'monthly')
 * @returns CSS-Breitenwert als String
 */
export const getChartWidth = (dataLength: number, groupBy?: string): string => {
    // Für wenige Daten, Container ausfüllen
    if (!dataLength || dataLength <= 8) return '100%';
    
    // Für viele Datenpunkte, scrollbar machen
    const minWidth = 800; // Minimale Breite in Pixeln
    // Mehr Breite pro Punkt für monatliche Gruppierung
    const pointWidth = groupBy === 'monthly' ? 100 : 60; 
    
    // Berechne benötigte Breite
    return `${Math.max(dataLength * pointWidth, minWidth)}px`;
  };

  /**
 * Berechnet die effektive Höhe für Charts basierend auf verfügbarem Platz
 * @param hasAdditionalContent Ob die Chart-Komponente zusätzliche Elemente hat
 * @returns CSS-Höhenwert als String
 */
  export const getEffectiveChartHeight = (chartType: 'timeSeries' | 'weekday' | 'movingAverage' | 'regression' | string = ''): string => {
    // Spezifische Höhen je nach Chart-Typ
    switch(chartType) {
      case 'weekday':
        return "h-72"; // Mehr Platz für Wochentagsanalyse (hat zusätzliche Infokacheln)
      case 'regression':
        return "h-72"; // Mehr Platz für Regression (hat zusätzliche Statistiken)
      case 'movingAverage':
        return "h-64"; // Standardhöhe
      case 'timeSeries':
        return "h-64"; // Standardhöhe
      default:
        return "h-64"; // Standardhöhe für alle anderen
    }
  };
