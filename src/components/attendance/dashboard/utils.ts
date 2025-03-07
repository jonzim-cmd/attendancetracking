// src/components/attendance/dashboard/utils.ts
import { parseDate, getLastNWeeks, isVerspaetungFunc } from '@/lib/attendance-utils';

// Interface for trend data points to fix TypeScript error
interface TrendDataPoint {
  date: string;
  [key: string]: string | number; // Allow additional properties with any string key
}

// Formatiert ein Datum als DD.MM.YYYY
export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Helper function to get students in a specific class
export const getStudentsInClass = (rawData: any[] | null, selectedClasses: string[]): string[] => {
  if (!rawData || selectedClasses.length === 0) return [];
  
  const studentsSet = new Set<string>();
  
  rawData.forEach(row => {
    if (row.Langname && row.Vorname && row.Klasse && selectedClasses.includes(row.Klasse)) {
      studentsSet.add(`${row.Langname}, ${row.Vorname}`);
    }
  });
  
  return Array.from(studentsSet).sort();
};

// MODIFIZIERT: Stärkere Nutzung von weeklyStats und schoolYearStats
export const prepareWeeklyTrends = (
  rawData: any[] | null, 
  selectedWeeks: string,
  selectedClasses: string[] = [],
  selectedEntities: string[] = [],
  entityType: 'classes' | 'students' = 'classes',
  weeklyStats: Record<string, any> = {},
  schoolYearStats: Record<string, any> = {}
) => {
  if (!rawData) return [];
  
  const weeks = getLastNWeeks(parseInt(selectedWeeks));
  const weeklyData = weeks.map((week, weekIndex) => {
    // Startdatum der Woche im Format "DD.MM." formatieren
    const startDay = week.startDate.getDate().toString().padStart(2, '0');
    const startMonth = (week.startDate.getMonth() + 1).toString().padStart(2, '0');
    const weekLabel = `${startDay}.${startMonth}.`;
    
    // Verwende weeklyStats direkt statt Neuberechnung
    // Zähler für diese Woche initialisieren
    let verspaetungen = 0;
    let fehlzeitenTotal = 0;
    let fehlzeitenEntsch = 0;
    let fehlzeitenUnentsch = 0;
    
    // Bestimme die zu zählenden Entitäten basierend auf den Filtern
    const entitiesToCount = selectedEntities.length > 0 ? 
      selectedEntities : 
      Object.keys(weeklyStats);
    
    // Filtere Entitäten basierend auf Klassenfilter bei Bedarf
    const filteredEntities = entitiesToCount.filter(entity => {
      // Wenn es ein Klassensfilter ist, prüfe direkt den Klassennamen
      if (entityType === 'classes') {
        return selectedClasses.length === 0 || selectedClasses.includes(entity);
      }
      
      // Andernfalls (für Schüler), prüfe die Klasse des Schülers aus den Rohdaten
      if (selectedClasses.length > 0) {
        // Suche nach Einträgen für diesen Schüler, um die Klasse zu ermitteln
        const studentEntries = rawData.filter(row => 
          `${row.Langname}, ${row.Vorname}` === entity
        );
        
        if (studentEntries.length > 0) {
          return selectedClasses.includes(studentEntries[0].Klasse);
        }
        return false;
      }
      
      return true;
    });
    
    // Für jede gefilterte Entität, füge ihre wöchentlichen Stats hinzu
    filteredEntities.forEach(entity => {
      const entityStats = weeklyStats[entity];
      if (entityStats && entityStats.verspaetungen && entityStats.fehlzeiten) {
        // Prüfe, ob diese Woche innerhalb der gespeicherten weekly-Array-Daten liegt
        if (weekIndex >= 0 && weekIndex < entityStats.verspaetungen.weekly.length) {
          verspaetungen += entityStats.verspaetungen.weekly[weekIndex] || 0;
          fehlzeitenUnentsch += entityStats.fehlzeiten.weekly[weekIndex] || 0;
        }
      }
    });
    
    // Da weekly Stats nur unentschuldigte Fehltage verfolgen, müssen wir für entschuldigte Fehltage 
    // weiterhin die Rohdaten durchsuchen, aber deutlich vereinfacht
    if (filteredEntities.length > 0) {
      fehlzeitenEntsch = countExcusedAbsencesForWeek(
        rawData, 
        week, 
        filteredEntities, 
        entityType, 
        selectedClasses
      );
    }
    
    // Gesamtsumme
    fehlzeitenTotal = fehlzeitenEntsch + fehlzeitenUnentsch;
    
    return {
      name: weekLabel,
      verspaetungen,
      fehlzeitenTotal,
      fehlzeitenEntsch,
      fehlzeitenUnentsch
    };
  });
  
  return weeklyData;
};

// Hilfsfunktion, um entschuldigte Fehltage für eine Woche zu zählen
function countExcusedAbsencesForWeek(
  rawData: any[], 
  week: {startDate: Date, endDate: Date}, 
  entities: string[], 
  entityType: 'classes' | 'students',
  selectedClasses: string[]
): number {
  let excusedCount = 0;
  
  rawData.forEach(entry => {
    if (!entry.Beginndatum) return;
    
    const entryDate = parseDate(entry.Beginndatum);
    
    // Prüfe Zeitfilter
    if (entryDate < week.startDate || entryDate > week.endDate) return;
    
    // Prüfe, ob die Entität ausgewählt ist
    const matchesEntity = entityType === 'classes' 
      ? entities.includes(entry.Klasse)
      : entities.includes(`${entry.Langname}, ${entry.Vorname}`);
      
    if (!matchesEntity) return;
    
    // Klassenfilter
    if (selectedClasses.length > 0 && !selectedClasses.includes(entry.Klasse)) return;
    
    // Nur Fehltage, keine Verspätungen
    if (isVerspaetungFunc(entry)) return;
    
    // Prüfe Status für "entschuldigt"
    const status = entry.Status ? entry.Status.trim() : '';
    if (status === 'entsch.' || status === 'Attest' || status === 'Attest Amtsarzt') {
      excusedCount++;
    }
  });
  
  return excusedCount;
}

// MODIFIZIERT: Verwendet schoolYearStats für Schuljahrdaten
export const prepareAbsenceTypes = (
  rawData: any[] | null, 
  startDate: string, 
  endDate: string, 
  selectedClasses: string[] = [],
  selectedEntities: string[] = [],
  entityType: 'classes' | 'students' = 'classes',
  schoolYearStats: Record<string, any> = {}
) => {
  if (!rawData) return [];
  
  let entschuldigt = 0;
  let unentschuldigt = 0;
  let offen = 0;
  
  const startDateTime = new Date(startDate + 'T00:00:00');
  const endDateTime = new Date(endDate + 'T23:59:59');
  
  // Prüfe, ob wir Schuljahreszahlen verwenden sollen
  const isSchoolYear = checkIfSchoolYearPeriod(startDateTime, endDateTime);
  
  if (isSchoolYear && Object.keys(schoolYearStats).length > 0) {
    // Bestimme die zu zählenden Entitäten basierend auf den Filtern
    const entitiesToCount = selectedEntities.length > 0 ? 
      selectedEntities : 
      Object.keys(schoolYearStats);
    
    // Filtere Entitäten basierend auf Klassenfilter bei Bedarf
    const filteredEntities = entitiesToCount.filter(entity => {
      // Wenn es ein Klassenfilter ist, prüfe direkt den Klassennamen
      if (entityType === 'classes') {
        return selectedClasses.length === 0 || selectedClasses.includes(entity);
      }
      
      // Für Schüler, prüfe die Klasse des Schülers aus den Rohdaten
      if (selectedClasses.length > 0) {
        // Suche nach Einträgen für diesen Schüler, um die Klasse zu ermitteln
        const studentEntries = rawData.filter(row => 
          `${row.Langname}, ${row.Vorname}` === entity
        );
        
        if (studentEntries.length > 0) {
          return selectedClasses.includes(studentEntries[0].Klasse);
        }
        return false;
      }
      
      return true;
    });
    
    // Zähle entschuldigte und unentschuldigte von schoolYearStats
    filteredEntities.forEach(entity => {
      const stats = schoolYearStats[entity];
      if (stats) {
        // Verwende die Werte direkt aus schoolYearStats
        unentschuldigt += stats.fehlzeiten_unentsch || 0;
        
        // Berechne entschuldigt korrekt, anstatt Annäherung
        // gesamte Fehltage - unentschuldigte Fehltage = entschuldigte Fehltage
        const total = stats.fehlzeiten_gesamt || 0;
        const unentschuldigteFehltage = stats.fehlzeiten_unentsch || 0;
        
        // Das ist besser als die vorherige Annäherung, da es direkt die Daten aus schoolYearStats verwendet
        entschuldigt += (total - unentschuldigteFehltage);
      }
    });
    
    // Füge offene Fehltage aus dem Rohdaten für den Schuljahrzeitraum hinzu
    // (da schoolYearStats diese nicht separat zählt)
    offen = countOpenAbsences(
      rawData, 
      startDateTime, 
      endDateTime, 
      filteredEntities, 
      entityType, 
      selectedClasses
    );
    
    return [
      { name: 'Entschuldigt', value: entschuldigt, color: '#22c55e' },
      { name: 'Unentschuldigt', value: unentschuldigt, color: '#dc2626' },
      { name: 'Offen', value: offen, color: '#f59e0b' }
    ];
  }
  
  // Fallback zu Original-Logik für nicht-Schuljahr-Perioden oder wenn schoolYearStats nicht verfügbar
  rawData.forEach(entry => {
    if (!entry.Beginndatum) return;
    
    const entryDate = parseDate(entry.Beginndatum);
    
    // Zeitfilter
    if (entryDate < startDateTime || entryDate > endDateTime) return;
    
    // Klassenfilter
    if (selectedClasses.length > 0 && !selectedClasses.includes(entry.Klasse)) return;
    
    // Entitätsfilter
    if (selectedEntities.length > 0) {
      if (entityType === 'classes') {
        if (!selectedEntities.includes(entry.Klasse)) return;
      } else { // students
        const studentName = `${entry.Langname}, ${entry.Vorname}`;
        if (!selectedEntities.includes(studentName)) return;
      }
    }
    
    // Ignoriere Verspätungen für diese Zählung
    if (isVerspaetungFunc(entry)) return;
    
    const status = entry.Status ? entry.Status.trim() : '';
    
    if (status === 'entsch.' || status === 'Attest' || status === 'Attest Amtsarzt') {
      entschuldigt++;
    } else if (status === 'nicht entsch.' || status === 'nicht akzep.') {
      unentschuldigt++;
    } else {
      // Prüfen, ob die Entschuldigungsfrist abgelaufen ist
      const today = new Date();
      const deadlineDate = new Date(entryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      if (today > deadlineDate) {
        unentschuldigt++;
      } else {
        offen++;
      }
    }
  });
  
  return [
    { name: 'Entschuldigt', value: entschuldigt, color: '#22c55e' },
    { name: 'Unentschuldigt', value: unentschuldigt, color: '#dc2626' },
    { name: 'Offen', value: offen, color: '#f59e0b' }
  ];
};

// Hilfsfunktion, um offene Abwesenheiten zu zählen
function countOpenAbsences(
  rawData: any[],
  startDateTime: Date,
  endDateTime: Date,
  entities: string[],
  entityType: 'classes' | 'students',
  selectedClasses: string[]
): number {
  let openCount = 0;
  const today = new Date();
  
  rawData.forEach(entry => {
    if (!entry.Beginndatum) return;
    
    const entryDate = parseDate(entry.Beginndatum);
    
    // Zeitfilter
    if (entryDate < startDateTime || entryDate > endDateTime) return;
    
    // Prüfe, ob die Entität ausgewählt ist
    const matchesEntity = entityType === 'classes' 
      ? entities.includes(entry.Klasse)
      : entities.includes(`${entry.Langname}, ${entry.Vorname}`);
      
    if (!matchesEntity) return;
    
    // Klassenfilter
    if (selectedClasses.length > 0 && !selectedClasses.includes(entry.Klasse)) return;
    
    // Nur Fehltage, keine Verspätungen
    if (isVerspaetungFunc(entry)) return;
    
    // Prüfe auf "offenen" Status
    const status = entry.Status ? entry.Status.trim() : '';
    
    if (!status || status.trim() === '') {
      const deadlineDate = new Date(entryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (today <= deadlineDate) {
        openCount++;
      }
    }
  });
  
  return openCount;
}

// MODIFIZIERT: Bessere Unterstützung für schoolYearStats
export const prepareDayOfWeekAnalysis = (
  rawData: any[] | null, 
  startDate: string, 
  endDate: string, 
  selectedClasses: string[] = [],
  selectedEntities: string[] = [],
  entityType: 'classes' | 'students' = 'classes',
  schoolYearStats: Record<string, any> = {}
) => {
  if (!rawData) return [];
  
  // Nur Montag bis Freitag (1-5)
  const dayStats = Array(5).fill(0).map((_, index) => ({
    name: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'][index],
    fehlzeitenGesamt: 0,
    fehlzeitenEntsch: 0,
    fehlzeitenUnentsch: 0,
    verspaetungen: 0,
    dayIndex: index + 1 // 1 = Montag, 5 = Freitag
  }));
  
  const startDateTime = new Date(startDate + 'T00:00:00');
  const endDateTime = new Date(endDate + 'T23:59:59');
  const today = new Date();
  
  // Filtere relevante Einträge
  const relevantEntries = rawData.filter(entry => {
    if (!entry.Beginndatum) return false;
    
    const entryDate = parseDate(entry.Beginndatum);
    
    // Zeitfilter
    if (entryDate < startDateTime || entryDate > endDateTime) return false;
    
    // Klassenfilter
    if (selectedClasses.length > 0 && !selectedClasses.includes(entry.Klasse)) return false;
    
    // Entitätsfilter
    if (selectedEntities.length > 0) {
      if (entityType === 'classes') {
        if (!selectedEntities.includes(entry.Klasse)) return false;
      } else { // students
        const studentName = `${entry.Langname}, ${entry.Vorname}`;
        if (!selectedEntities.includes(studentName)) return false;
      }
    }
    
    return true;
  });
  
  // Zähle Verspätungen und Fehltage nach Wochentag
  relevantEntries.forEach(entry => {
    const entryDate = parseDate(entry.Beginndatum);
    const dayOfWeek = entryDate.getDay(); // 0 = Sonntag, 1 = Montag, ..., 6 = Samstag
    
    // Überspringen des Wochenendes
    if (dayOfWeek === 0 || dayOfWeek === 6) return;
    
    const dayIndex = dayOfWeek - 1; // 0 = Montag, 4 = Freitag
    const isVerspaetung = isVerspaetungFunc(entry);
    const status = entry.Status ? entry.Status.trim() : '';
    const isEntschuldigt = status === 'entsch.' || status === 'Attest' || status === 'Attest Amtsarzt';
    const isUnentschuldigt = status === 'nicht entsch.' || status === 'nicht akzep.';
    const deadlineDate = new Date(entryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const isOverDeadline = today > deadlineDate;
    
    if (isVerspaetung) {
      dayStats[dayIndex].verspaetungen++;
    } else {
      dayStats[dayIndex].fehlzeitenGesamt++;
      
      if (isEntschuldigt) {
        dayStats[dayIndex].fehlzeitenEntsch++;
      } else if (isUnentschuldigt || (!status && isOverDeadline)) {
        dayStats[dayIndex].fehlzeitenUnentsch++;
      }
    }
  });
  
  return dayStats;
};

// MODIFIZIERT: Optimierte Verwendung von schoolYearStats
export const prepareStudentComparisonData = (
  rawData: any[] | null,
  startDate: string,
  endDate: string,
  entities: string[],
  entityType: 'classes' | 'students',
  schoolYearStats: Record<string, any> = {}
) => {
  if (!rawData || entities.length === 0) return [];
  
  const startDateTime = new Date(startDate + 'T00:00:00');
  const endDateTime = new Date(endDate + 'T23:59:59');
  const resultData: any[] = [];
  
  // Prüfe, ob wir Schuljahrdaten vergleichen
  const isSchoolYear = checkIfSchoolYearPeriod(startDateTime, endDateTime);
  
  if (isSchoolYear && Object.keys(schoolYearStats).length > 0) {
    // Verwende schoolYearStats für genauere Schuljahrdaten
    entities.forEach(entity => {
      const stats = schoolYearStats[entity];
      if (!stats) return;
      
      // Holen der totalEntschuldigt-Werte: gesamte_fehlzeiten - unentschuldigte_fehlzeiten
      const totalFehlzeiten = stats.fehlzeiten_gesamt || 0;
      const unentschuldigteFehlzeiten = stats.fehlzeiten_unentsch || 0;
      const entschuldigteFehlzeiten = totalFehlzeiten - unentschuldigteFehlzeiten;
      
      // Füge Vergleichsdaten basierend auf schoolYearStats hinzu
      resultData.push(
        { 
          type: 'verspaetungen', 
          entity, 
          verspaetungen: stats.verspaetungen_unentsch || 0
        },
        { 
          type: 'fehlzeiten', 
          entity, 
          fehlzeiten: stats.fehlzeiten_gesamt || 0,
          fehlzeitenEntsch: entschuldigteFehlzeiten,
          fehlzeitenUnentsch: stats.fehlzeiten_unentsch || 0
        },
        { 
          type: 'entschuldigung', 
          entity, 
          entschuldigt: entschuldigteFehlzeiten, 
          unentschuldigt: stats.fehlzeiten_unentsch || 0, 
          offen: 0 // Diese Werte werden in schoolYearStats nicht separat gespeichert
        }
      );
    });
    
    // Verarbeite Trend-Daten separat
    prepareTrendData(rawData, startDateTime, endDateTime, entities, entityType, resultData);
    
    return resultData;
  }
  
  // Fallback zur ursprünglichen Implementierung für nicht-Schuljahrzeitraum
  // Processing functions for each entity - this is the original implementation
  entities.forEach(entity => {
    // Filtern der Daten nach Entity
    const entityEntries = rawData.filter(entry => {
      if (!entry.Beginndatum) return false;
      
      const entryDate = parseDate(entry.Beginndatum);
      
      // Prüfe, ob innerhalb des Zeitraums
      if (entryDate < startDateTime || entryDate > endDateTime) return false;
      
      // Prüfe, ob zur ausgewählten Entität gehörig
      if (entityType === 'classes') {
        return entry.Klasse === entity;
      } else { // students
        return `${entry.Langname}, ${entry.Vorname}` === entity;
      }
    });
    
    if (entityEntries.length === 0) return;
    
    // Verspätungen und Fehlzeiten zählen
    const verspaetungen = entityEntries.filter(entry => isVerspaetungFunc(entry)).length;
    
    const fehlzeitenGesamt = entityEntries.filter(entry => !isVerspaetungFunc(entry)).length;
    
    // Entschuldigungsdaten aufbereiten
    let entschuldigt = 0;
    let unentschuldigt = 0;
    let offen = 0;
    
    const today = new Date();
    
    entityEntries.forEach(entry => {
      // Überspringe Verspätungen für diese Zählung
      if (isVerspaetungFunc(entry)) return;
      
      const status = entry.Status ? entry.Status.trim() : '';
      
      if (status === 'entsch.' || status === 'Attest' || status === 'Attest Amtsarzt') {
        entschuldigt++;
      } else if (status === 'nicht entsch.' || status === 'nicht akzep.') {
        unentschuldigt++;
      } else {
        // Prüfen, ob die Entschuldigungsfrist abgelaufen ist
        const entryDate = parseDate(entry.Beginndatum);
        const deadlineDate = new Date(entryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        if (today > deadlineDate) {
          unentschuldigt++;
        } else {
          offen++;
        }
      }
    });
    
    // Add results to resultData
    resultData.push(
      { 
        type: 'verspaetungen', 
        entity, 
        verspaetungen 
      },
      { 
        type: 'fehlzeiten', 
        entity, 
        fehlzeiten: fehlzeitenGesamt,
        fehlzeitenEntsch: entschuldigt,
        fehlzeitenUnentsch: unentschuldigt
      },
      { 
        type: 'entschuldigung', 
        entity, 
        entschuldigt, 
        unentschuldigt, 
        offen 
      }
    );
    
    // Process trend data
    prepareTrendData(rawData, startDateTime, endDateTime, entities, entityType, resultData, entity, entityEntries);
  });
  
  return resultData;
};

// Helper function to add trend data to resultData
function prepareTrendData(
  rawData: any[], 
  startDateTime: Date, 
  endDateTime: Date, 
  entities: string[], 
  entityType: 'classes' | 'students',
  resultData: any[],
  currentEntity?: string,
  entityEntries?: any[]
) {
  // Skip if trend data already added
  if (resultData.some(item => item.type === 'trend')) return;
  
  // Trendsdaten vorbereiten
  // Wir gruppieren die Daten nach Woche
  const trendData: { [key: string]: { 
    verspaetungen: number, 
    fehlzeitenGesamt: number,
    fehlzeitenEntsch: number,
    fehlzeitenUnentsch: number
  } } = {};
  
  const today = new Date();
  
  // If we have entity entries already filtered for the current entity, use them
  if (currentEntity && entityEntries && entityEntries.length > 0) {
    entityEntries.forEach(entry => {
      const entryDate = parseDate(entry.Beginndatum);
      // Zur Einfachheit verwenden wir das Datum als Schlüssel
      const weekKey = entryDate.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
      
      if (!trendData[weekKey]) {
        trendData[weekKey] = { 
          verspaetungen: 0, 
          fehlzeitenGesamt: 0,
          fehlzeitenEntsch: 0,
          fehlzeitenUnentsch: 0
        };
      }
      
      const isVerspaetung = isVerspaetungFunc(entry);
      const status = entry.Status ? entry.Status.trim() : '';
      const isEntschuldigt = status === 'entsch.' || status === 'Attest' || status === 'Attest Amtsarzt';
      const isUnentschuldigt = status === 'nicht entsch.' || status === 'nicht akzep.';
      const deadlineDate = new Date(entryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const isOverDeadline = today > deadlineDate;
      
      if (isVerspaetung) {
        trendData[weekKey].verspaetungen++;
      } else {
        trendData[weekKey].fehlzeitenGesamt++;
        
        if (isEntschuldigt) {
          trendData[weekKey].fehlzeitenEntsch++;
        } else if (isUnentschuldigt || (!status && isOverDeadline)) {
          trendData[weekKey].fehlzeitenUnentsch++;
        }
      }
    });
    
    // Trends in Array umwandeln und sortieren
    const sortedTrendData = Object.entries(trendData)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, data]) => ({
        date,
        ...Object.fromEntries(entities.map(e => [e, e === currentEntity ? data.fehlzeitenGesamt + data.verspaetungen : 0]))
      }));
      
    // Add trend data to resultData if we have some
    if (sortedTrendData.length > 0) {
      resultData.push({ type: 'trend', data: sortedTrendData });
    }
  } else {
    // Calculate trend data for all entities - this is a simplified approach
    const uniqueDates = new Set<string>();
    
    // First, collect all dates where there's data
    rawData.forEach(entry => {
      if (!entry.Beginndatum) return;
      
      const entryDate = parseDate(entry.Beginndatum);
      if (entryDate < startDateTime || entryDate > endDateTime) return;
      
      // Filter by entity
      const entityMatch = entityType === 'classes' 
        ? entities.includes(entry.Klasse)
        : entities.includes(`${entry.Langname}, ${entry.Vorname}`);
        
      if (!entityMatch) return;
      
      // Add date to unique dates
      uniqueDates.add(entryDate.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' }));
    });
    
    // Create a sorted array of dates
    const sortedDates = Array.from(uniqueDates).sort((a, b) => 
      new Date(a.split('.').reverse().join('-')).getTime() - 
      new Date(b.split('.').reverse().join('-')).getTime()
    );
    
    // Create simplified trend data
    const simpleTrendData = sortedDates.map(date => ({
      date,
      ...Object.fromEntries(entities.map(e => [e, 0]))
    }) as TrendDataPoint);
    
    // Add count for each entity on each date
    simpleTrendData.forEach(dataPoint => {
      entities.forEach(entity => {
        const count = rawData.filter(entry => {
          if (!entry.Beginndatum) return false;
          
          const entryDate = parseDate(entry.Beginndatum);
          const entryDateStr = entryDate.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
          
          if (entryDateStr !== dataPoint.date) return false;
          
          // Check if entry belongs to this entity
          if (entityType === 'classes') {
            return entry.Klasse === entity;
          } else { // students
            return `${entry.Langname}, ${entry.Vorname}` === entity;
          }
        }).length;
        
        dataPoint[entity] = count;
      });
    });
    
    // Add trend data to resultData
    if (simpleTrendData.length > 0) {
      resultData.push({ type: 'trend', data: simpleTrendData });
    }
  }
}

// MODIFIZIERT: Keine größeren Änderungen notwendig, da diese Funktion bereits zeitbasiert ist
export const prepareAttendanceOverTime = (
  rawData: any[] | null,
  startDate: string,
  endDate: string,
  groupingOption: 'daily' | 'weekly' | 'monthly',
  selectedClasses: string[] = [],
  selectedEntities: string[] = [],
  entityType: 'classes' | 'students' = 'classes',
  schoolYearStats: Record<string, any> = {}
) => {
  if (!rawData) return [];
  
  // For this function, continue using the raw data approach as it provides time-series data
  // that isn't available in the pre-calculated statistics.
  
  const startDateTime = new Date(startDate + 'T00:00:00');
  const endDateTime = new Date(endDate + 'T23:59:59');
  const today = new Date();
  
  // Filtere relevante Einträge
  const relevantEntries = rawData.filter(entry => {
    if (!entry.Beginndatum) return false;
    
    const entryDate = parseDate(entry.Beginndatum);
    
    // Zeitraumfilter anwenden
    if (entryDate < startDateTime || entryDate > endDateTime) return false;
    
    // Klassenfilter anwenden
    if (selectedClasses.length > 0 && !selectedClasses.includes(entry.Klasse)) return false;
    
    // Entitätsfilter
    if (selectedEntities.length > 0) {
      if (entityType === 'classes') {
        if (!selectedEntities.includes(entry.Klasse)) return false;
      } else { // students
        const studentName = `${entry.Langname}, ${entry.Vorname}`;
        if (!selectedEntities.includes(studentName)) return false;
      }
    }
    
    return true;
  });
  
  // Gruppieren nach gewählter Option
  const groupedData: { [key: string]: { 
    verspaetungen: number, 
    fehlzeiten: number,
    fehlzeitenEntsch: number,
    fehlzeitenUnentsch: number,
    entschuldigt: number,
    unentschuldigt: number,
    sortKey?: number, // Added for proper sorting
    dateRange?: string // Added for tooltip display
  } } = {};
  
  relevantEntries.forEach(entry => {
    const entryDate = parseDate(entry.Beginndatum);
    let groupKey: string;
    let sortKey: number = 0;
    let dateRange: string = '';
    
    // Zeitschlüssel basierend auf Gruppierungsoption generieren
    if (groupingOption === 'daily') {
      // Tägliche Gruppierung im Format "DD.MM."
      groupKey = entryDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      sortKey = entryDate.getTime();
      dateRange = entryDate.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric' 
      });
    } else if (groupingOption === 'weekly') {
      // Wöchentliche Gruppierung als Kalenderwoche mit Jahreskontext
      const { week, year } = getGermanCalendarWeekWithYear(entryDate);
      groupKey = `KW ${week}`;
      sortKey = generateWeekSortKey(week, year);
      
      // Calculate the start and end dates of the week for display in tooltip
      const weekStart = new Date(entryDate);
      const dayOfWeek = entryDate.getDay() || 7; // Convert Sunday (0) to 7
      weekStart.setDate(entryDate.getDate() - dayOfWeek + 1); // Monday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Sunday
      
      dateRange = `${weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - ${
        weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      }`;
    } else { // monthly
      // Monatliche Gruppierung im Format "MMM YYYY"
      groupKey = entryDate.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
      sortKey = entryDate.getFullYear() * 100 + entryDate.getMonth() + 1;
      
      // Calculate the start and end dates of the month for display
      const monthStart = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
      const monthEnd = new Date(entryDate.getFullYear(), entryDate.getMonth() + 1, 0);
      
      dateRange = `${monthStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - ${
        monthEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      }`;
    }
    
    // Initialisiere Gruppe, falls noch nicht vorhanden
    if (!groupedData[groupKey]) {
      groupedData[groupKey] = { 
        verspaetungen: 0, 
        fehlzeiten: 0,
        fehlzeitenEntsch: 0,
        fehlzeitenUnentsch: 0,
        entschuldigt: 0,
        unentschuldigt: 0,
        sortKey: sortKey,
        dateRange: dateRange
      };
    }
    
    // Verarbeite Eintrag
    const isVerspaetung = isVerspaetungFunc(entry);
    const status = entry.Status ? entry.Status.trim() : '';
    const isEntschuldigt = status === 'entsch.' || status === 'Attest' || status === 'Attest Amtsarzt';
    const isUnentschuldigt = status === 'nicht entsch.' || status === 'nicht akzep.';
    const deadlineDate = new Date(entryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const isOverDeadline = today > deadlineDate;
    
    if (isVerspaetung) {
      groupedData[groupKey].verspaetungen++;
    } else {
      groupedData[groupKey].fehlzeiten++;
      
      if (isEntschuldigt) {
        groupedData[groupKey].fehlzeitenEntsch++;
      } else if (isUnentschuldigt || (!status && isOverDeadline)) {
        groupedData[groupKey].fehlzeitenUnentsch++;
      }
    }
    
    if (isEntschuldigt) {
      groupedData[groupKey].entschuldigt++;
    } else if (isUnentschuldigt || (!status && isOverDeadline)) {
      groupedData[groupKey].unentschuldigt++;
    }
  });
  
  // Umwandeln in Array und sortieren mit dem sortKey
  return Object.entries(groupedData)
    .map(([name, data]) => ({ 
      name, 
      ...data,
      sortKey: data.sortKey 
    }))
    .sort((a, b) => (a.sortKey || 0) - (b.sortKey || 0));
};

// MODIFIZIERT: Verbesserte Verwendung von schoolYearStats
export const prepareEntschuldigungsverhalten = (
  rawData: any[] | null,
  startDate: string,
  endDate: string,
  selectedClasses: string[] = [],
  selectedEntities: string[] = [],
  groupingOption: 'daily' | 'weekly' | 'monthly' = 'monthly',
  entityType: 'classes' | 'students' = 'classes',
  schoolYearStats: Record<string, any> = {}
) => {
  if (!rawData) return [];
  
  // Zeiträume vorbereiten
  const startDateTime = new Date(startDate + 'T00:00:00');
  const endDateTime = new Date(endDate + 'T23:59:59');
  const today = new Date();
  
  // Prüfe, ob wir mit Schuljahrdaten arbeiten
  const isSchoolYear = checkIfSchoolYearPeriod(startDateTime, endDateTime);
  
  // Filtere relevante Einträge
  const relevantEntries = rawData.filter(entry => {
    if (!entry.Beginndatum) return false;
    
    const entryDate = parseDate(entry.Beginndatum);
    
    // Zeitraumfilter anwenden
    if (entryDate < startDateTime || entryDate > endDateTime) return false;
    
    // Klassenfilter anwenden
    if (selectedClasses.length > 0 && !selectedClasses.includes(entry.Klasse)) return false;
    
    // Entitätsfilter
    if (selectedEntities.length > 0) {
      if (entityType === 'classes') {
        if (!selectedEntities.includes(entry.Klasse)) return false;
      } else { // students
        const studentName = `${entry.Langname}, ${entry.Vorname}`;
        if (!selectedEntities.includes(studentName)) return false;
      }
    }
    
    return true;
  });
  
  // Gruppiere nach Klassen für die Analyse
  const dataByClass: {[key: string]: any[]} = {};
  
  relevantEntries.forEach(entry => {
    const className = entry.Klasse || 'Unbekannt';
    
    if (!dataByClass[className]) {
      dataByClass[className] = [];
    }
    
    dataByClass[className].push(entry);
  });
  
  const entschuldigungsQuotenOverall: { 
    datum: string; 
    entschuldigtRate: number; 
    unentschuldigtRate: number; 
    total: number; 
  }[] = [];
  
  // Entschuldigungsquoten über Zeit berechnen
  if (groupingOption === 'monthly') {
    const monthlyData: { [key: string]: { entschuldigt: number, unentschuldigt: number, total: number } } = {};
    
    // Nur Fehltage berücksichtigen (keine Verspätungen)
    relevantEntries.filter(entry => !isVerspaetungFunc(entry)).forEach(entry => {
      const entryDate = parseDate(entry.Beginndatum);
      const monthKey = entryDate.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { entschuldigt: 0, unentschuldigt: 0, total: 0 };
      }
      
      const status = entry.Status ? entry.Status.trim() : '';
      const isEntschuldigt = status === 'entsch.' || status === 'Attest' || status === 'Attest Amtsarzt';
      const isUnentschuldigt = status === 'nicht entsch.' || status === 'nicht akzep.';
      const deadlineDate = new Date(entryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const isOverDeadline = today > deadlineDate;
      
      monthlyData[monthKey].total++;
      
      if (isEntschuldigt) {
        monthlyData[monthKey].entschuldigt++;
      } else if (isUnentschuldigt || (!status && isOverDeadline)) {
        monthlyData[monthKey].unentschuldigt++;
      }
    });
    
    Object.entries(monthlyData).forEach(([month, data]) => {
      if (data.total > 0) {
        entschuldigungsQuotenOverall.push({
          datum: month,
          entschuldigtRate: (data.entschuldigt / data.total) * 100,
          unentschuldigtRate: (data.unentschuldigt / data.total) * 100,
          total: data.total
        });
      }
    });
  }
  
  // Sortiere nach Datum
  entschuldigungsQuotenOverall.sort((a, b) => {
    const [monthA, yearA] = a.datum.split(' ');
    const [monthB, yearB] = b.datum.split(' ');
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const monthIdxA = months.indexOf(monthA);
    const monthIdxB = months.indexOf(monthB);
    const yearDiff = parseInt(yearA) - parseInt(yearB);
    if (yearDiff !== 0) return yearDiff;
    return monthIdxA - monthIdxB;
  });
  
  // Berechne das Entschuldigungsverhalten je Klasse
  return Object.entries(dataByClass).map(([className, entries]) => {
    let entschuldigt = 0;
    let unentschuldigt = 0;
    let offen = 0;
    
    // Falls wir mit Schuljahrdaten arbeiten und eine Klasse betrachten, nutze schoolYearStats
    if (isSchoolYear && entityType === 'classes' && Object.keys(schoolYearStats).length > 0) {
      if (schoolYearStats[className]) {
        const stats = schoolYearStats[className];
        
        // Bestimme unentschuldigte direkt
        unentschuldigt = stats.fehlzeiten_unentsch || 0;
        
        // Entschuldigte = Gesamt - Unentschuldigte
        const gesamt = stats.fehlzeiten_gesamt || 0;
        entschuldigt = gesamt - unentschuldigt;
        
        // Offene Fehltage müssen noch aus den Rohdaten berechnet werden
        offen = countOpenAbsences(
          rawData,
          startDateTime,
          endDateTime,
          [className],
          'classes',
          []
        );
      }
    } else {
      // Fallback zur ursprünglichen Berechnung aus den gefilterten Einträgen
      // Nur Fehltage berücksichtigen (keine Verspätungen)
      entries.filter(entry => !isVerspaetungFunc(entry)).forEach(entry => {
        const status = entry.Status ? entry.Status.trim() : '';
        
        if (status === 'entsch.' || status === 'Attest' || status === 'Attest Amtsarzt') {
          entschuldigt++;
        } else if (status === 'nicht entsch.' || status === 'nicht akzep.') {
          unentschuldigt++;
        } else {
          // Prüfen, ob die Entschuldigungsfrist abgelaufen ist
          const entryDate = parseDate(entry.Beginndatum);
          const deadlineDate = new Date(entryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          if (today > deadlineDate) {
            unentschuldigt++;
          } else {
            offen++;
          }
        }
      });
    }
    
    const total = entschuldigt + unentschuldigt + offen;
    const entschuldigtRate = total > 0 ? (entschuldigt / total) * 100 : 0;
    const unentschuldigtRate = total > 0 ? (unentschuldigt / total) * 100 : 0;
    
    return {
      klasse: className,
      entschuldigt,
      unentschuldigt,
      offen,
      total,
      entschuldigtRate,
      unentschuldigtRate,
      quotenEntwicklung: entschuldigungsQuotenOverall
    };
  }).sort((a, b) => a.klasse.localeCompare(b.klasse));
};

// Helper to get German calendar week (ISO 8601) with year context
const getGermanCalendarWeekWithYear = (date: Date): { week: number; year: number } => {
  // Copy the date to avoid modifying the original
  const targetDate = new Date(date);
  
  // ISO 8601 week starts on Monday and ends on Sunday
  // Find Thursday in the current week for proper ISO week number determination
  targetDate.setDate(targetDate.getDate() + (4 - (targetDate.getDay() || 7)));
  
  // January 1st of the current year
  const yearStart = new Date(targetDate.getFullYear(), 0, 1);
  
  // Calculate week number
  const weekNum = Math.ceil((((targetDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  // Use the year of the Thursday in the target week for proper year context
  const weekYear = targetDate.getFullYear();
  
  return { week: weekNum, year: weekYear };
};

// Generate a unique sort key for week+year combination
const generateWeekSortKey = (week: number, year: number): number => {
  // Return a value that can be sorted numerically (year*100 + week)
  return year * 100 + week;
};

// MODIFIZIERT: Verbesserte und exaktere Prüfung auf Schuljahrzeitraum
function checkIfSchoolYearPeriod(startDate: Date, endDate: Date): boolean {
  // Bestimme das aktuelle Schuljahr
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  
  // Schuljahr beginnt im September und endet im Juli des nächsten Jahres
  const schoolYearStartYear = currentMonth < 8 ? currentYear - 1 : currentYear;
  const schoolYearEndYear = schoolYearStartYear + 1;
  
  // Schuljahresgrenzen
  const schoolYearStart = new Date(schoolYearStartYear, 8, 1); // 1. September
  const schoolYearEnd = new Date(schoolYearEndYear, 6, 31);    // 31. Juli
  
  // Prüfe, ob das Startdatum innerhalb von 14 Tagen vom Schuljahresstart liegt
  const startClose = Math.abs(startDate.getTime() - schoolYearStart.getTime()) < 14 * 24 * 60 * 60 * 1000;
  
  // Prüfe, ob das Enddatum innerhalb von 14 Tagen vom Schuljahresende liegt
  const endClose = Math.abs(endDate.getTime() - schoolYearEnd.getTime()) < 14 * 24 * 60 * 60 * 1000;
  
  // Alternative Prüfung: Daten umfassen das komplette oder nahezu komplette Schuljahr
  const coversFullYear = startDate <= new Date(schoolYearStartYear, 8, 15) && // bis 15. September
                         endDate >= new Date(schoolYearEndYear, 6, 15);      // ab 15. Juli
  
  return (startClose && endClose) || coversFullYear;
}