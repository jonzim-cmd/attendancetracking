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