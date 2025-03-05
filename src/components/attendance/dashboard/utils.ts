// src/components/attendance/dashboard/utils.ts
import { parseDate, getLastNWeeks, isVerspaetungFunc } from '@/lib/attendance-utils';

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

// Bereitet die Daten für die Wochentrends vor
export const prepareWeeklyTrends = (
  rawData: any[] | null, 
  selectedWeeks: string,
  selectedClasses: string[] = [],
  selectedEntities: string[] = [],
  entityType: 'classes' | 'students' = 'classes'
) => {
  if (!rawData) return [];
  
  const weeks = getLastNWeeks(parseInt(selectedWeeks));
  const weeklyData = weeks.map(week => {
    // Startdatum der Woche im Format "DD.MM." formatieren
    const startDay = week.startDate.getDate().toString().padStart(2, '0');
    const startMonth = (week.startDate.getMonth() + 1).toString().padStart(2, '0');
    const weekLabel = `${startDay}.${startMonth}.`;
    
    // Filtern der Daten für diese Woche
    const weekEntries = rawData.filter(entry => {
      if (!entry.Beginndatum) return false;
      
      const entryDate = parseDate(entry.Beginndatum);
      
      // Zeitfilter
      if (!(entryDate >= week.startDate && entryDate <= week.endDate)) return false;
      
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
    
    // Zählen der verschiedenen Arten von Fehlzeiten/Verspätungen
    const verspaetungen = weekEntries.filter(entry => isVerspaetungFunc(entry)).length;
    
    const fehlzeitenTotal = weekEntries.filter(entry => !isVerspaetungFunc(entry)).length;
    
    // Entschuldigte vs. unentschuldigte Fehltage
    const today = new Date();
    
    const fehlzeitenEntsch = weekEntries.filter(entry => {
      if (isVerspaetungFunc(entry)) return false;
      const status = entry.Status ? entry.Status.trim() : '';
      return status === 'entsch.' || status === 'Attest' || status === 'Attest Amtsarzt';
    }).length;
    
    const fehlzeitenUnentsch = weekEntries.filter(entry => {
      if (isVerspaetungFunc(entry)) return false;
      const status = entry.Status ? entry.Status.trim() : '';
      const isUnentschuldigt = status === 'nicht entsch.' || status === 'nicht akzep.';
      
      if (isUnentschuldigt) return true;
      
      if (!status || status.trim() === '') {
        const entryDate = parseDate(entry.Beginndatum);
        const deadlineDate = new Date(entryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (today > deadlineDate) return true;
      }
      
      return false;
    }).length;
    
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

// Bereitet die Daten für die Absenztypen vor
export const prepareAbsenceTypes = (
  rawData: any[] | null, 
  startDate: string, 
  endDate: string, 
  selectedClasses: string[] = [],
  selectedEntities: string[] = [],
  entityType: 'classes' | 'students' = 'classes'
) => {
  if (!rawData) return [];
  
  let entschuldigt = 0;
  let unentschuldigt = 0;
  let offen = 0;
  
  const startDateTime = new Date(startDate + 'T00:00:00');
  const endDateTime = new Date(endDate + 'T23:59:59');
  
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
    { name: 'Entschuldigt', value: entschuldigt, color: '#22c55e' }, // Grün, nicht bläulich
    { name: 'Unentschuldigt', value: unentschuldigt, color: '#dc2626' }, // Rot
    { name: 'Offen', value: offen, color: '#f59e0b' } // Gelb/Orange
  ];
};

// Bereitet die Daten für die Wochentagsanalyse vor - nur Montag bis Freitag
export const prepareDayOfWeekAnalysis = (
  rawData: any[] | null, 
  startDate: string, 
  endDate: string, 
  selectedClasses: string[] = [],
  selectedEntities: string[] = [],
  entityType: 'classes' | 'students' = 'classes'
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

// Bereitet Daten für den Schüler-/Klassenvergleich vor
export const prepareStudentComparisonData = (
  rawData: any[] | null,
  startDate: string,
  endDate: string,
  entities: string[],
  entityType: 'classes' | 'students'
) => {
  if (!rawData || entities.length === 0) return [];
  
  const startDateTime = new Date(startDate + 'T00:00:00');
  const endDateTime = new Date(endDate + 'T23:59:59');
  const resultData: any[] = [];
  const today = new Date();
  
  // Verarbeitungsfunktion abhängig vom Entity-Typ
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
    
    entityEntries.forEach(entry => {
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
    
    // Trendsdaten vorbereiten
    // Wir gruppieren die Daten nach Woche
    const trendData: { [key: string]: { 
      verspaetungen: number, 
      fehlzeitenGesamt: number,
      fehlzeitenEntsch: number,
      fehlzeitenUnentsch: number
    } } = {};
    
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
        ...Object.fromEntries(entities.map(e => [e, e === entity ? data.fehlzeitenGesamt + data.verspaetungen : 0]))
      }));
      
    // Daten ins Ergebnis einfügen
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
    
    // Trendsdaten nur einmal als Gesamtdatensatz einfügen
    if (entity === entities[0]) {
      resultData.push({ type: 'trend', data: sortedTrendData });
    }
  });
  
  return resultData;
};

// Helper function to get German calendar week (ISO 8601) with year context
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

// Bereitet Daten für die zeitliche Analyse vor
export const prepareAttendanceOverTime = (
  rawData: any[] | null,
  startDate: string,
  endDate: string,
  groupingOption: 'daily' | 'weekly' | 'monthly',
  selectedClasses: string[] = [],
  selectedEntities: string[] = [],
  entityType: 'classes' | 'students' = 'classes'
) => {
  if (!rawData) return [];
  
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

// Hilfsfunktion zur Berechnung der Kalenderwoche
const getWeekNumber = (date: Date): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Bereitet Daten für das Entschuldigungsverhalten vor
export const prepareEntschuldigungsverhalten = (
  rawData: any[] | null,
  startDate: string,
  endDate: string,
  selectedClasses: string[] = [],
  selectedEntities: string[] = [],
  groupingOption: 'daily' | 'weekly' | 'monthly' = 'monthly',
  entityType: 'classes' | 'students' = 'classes'
) => {
  if (!rawData) return [];
  
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
    
    relevantEntries.forEach(entry => {
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
    
    entries.forEach(entry => {
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