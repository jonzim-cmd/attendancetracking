// src/components/attendance/dashboard/classAverageUtils.ts
import { StudentStats } from '@/types';

// Globale Variable, um die tatsächliche Anzahl der Klassen im Dataset zu speichern
// Diese wird nur einmal beim initialen Laden der Daten gesetzt
let actualClassCount = 0;

/**
 * Setzt die Anzahl der Klassen im gesamten Dataset basierend auf den Rohdaten
 * Diese Funktion sollte einmal direkt nach dem Laden des Reports aufgerufen werden
 * 
 * @param rawData Unverarbeitete, ungefilterte Rohdaten aus dem Excel-Upload
 */
export function setTotalClassCount(rawData: any[] | null): void {
  if (!rawData || rawData.length === 0) {
    actualClassCount = 0;
    return;
  }

  // Extrahiere alle eindeutigen Klassennamen aus den Rohdaten
  const uniqueClasses = new Set<string>();
  
  // Abhängig von der tatsächlichen Struktur der rawData müssen wir hier die Klassen extrahieren
  // Da wir die genaue Struktur nicht kennen, verwenden wir einen generischen Ansatz
  rawData.forEach(entry => {
    // Versuche, das Klassenfeld zu finden, unabhängig von der Groß-/Kleinschreibung
    const classField = Object.keys(entry).find(key => 
      key.toLowerCase() === 'klasse' || 
      key.toLowerCase() === 'class' || 
      key.toLowerCase() === 'gruppe'
    );
    
    if (classField && entry[classField]) {
      uniqueClasses.add(String(entry[classField]));
    }
  });
  
  // Setze die globale Variable
  actualClassCount = uniqueClasses.size;
  
  console.log(`ClassAverageUtils: ${actualClassCount} Klassen in den Rohdaten gefunden (unabhängig von Filtern)`);
}

/**
 * Prüft, ob die Klassenvergleichsfunktion verfügbar sein sollte, basierend auf
 * der Anzahl der Klassen im gesamten ungefilterten Dataset
 * 
 * @returns Ein Objekt mit Informationen zur Verfügbarkeit der Klassenvergleichsfunktion
 */
export function getClassAverageAvailability(): { 
  isAvailable: boolean, 
  tooltip: string, 
  classCount: number 
} {
  // Verwende die gespeicherte Anzahl der Klassen
  const isAvailable = actualClassCount > 1;
  
  const tooltip = isAvailable 
    ? "Durchschnittliche Werte pro Klasse" 
    : "Diese Funktion ist nur verfügbar, wenn ein Excel-Upload mit mehr als einer Klasse hochgeladen wurde.";
  
  return { isAvailable, tooltip, classCount: actualClassCount };
}