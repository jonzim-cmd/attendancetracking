// src/components/attendance/dashboard/utils.ts
import { parseDate, getLastNWeeks } from '@/lib/attendance-utils';

// Formatiert ein Datum als DD.MM.YYYY
export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Bereitet die Daten für die Wochentrends vor
export const prepareWeeklyTrends = (rawData: any[] | null, selectedWeeks: string) => {
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
      return entryDate >= week.startDate && entryDate <= week.endDate;
    });
    
    // Zählen der verschiedenen Arten von Fehlzeiten/Verspätungen
    const verspaetungen = weekEntries.filter(entry => 
      entry.Abwesenheitsgrund === 'Verspätung' || 
      (entry.Endzeit && new Date(`01/01/2000 ${entry.Endzeit}`) < new Date(`01/01/2000 16:50`))
    ).length;
    
    const fehlzeiten = weekEntries.filter(entry => 
      entry.Abwesenheitsgrund !== 'Verspätung' && 
      !(entry.Endzeit && new Date(`01/01/2000 ${entry.Endzeit}`) < new Date(`01/01/2000 16:50`))
    ).length;
    
    return {
      name: weekLabel,
      verspaetungen,
      fehlzeiten
    };
  });
  
  return weeklyData;
};

// Bereitet die Daten für den Klassenvergleich vor
export const prepareClassComparison = (
  rawData: any[] | null, 
  startDate: string, 
  endDate: string, 
  selectedClasses: string[]
) => {
  if (!rawData) return [];
  
  const classStats: {[key: string]: any} = {};
  
  rawData.forEach(entry => {
    if (!entry.Beginndatum || !entry.Klasse) return;
    
    const entryDate = parseDate(entry.Beginndatum);
    const startDateTime = new Date(startDate + 'T00:00:00');
    const endDateTime = new Date(endDate + 'T23:59:59');
    
    // Nur Einträge im gewählten Zeitraum berücksichtigen
    if (entryDate < startDateTime || entryDate > endDateTime) return;
    
    // Nur ausgewählte Klassen berücksichtigen oder alle, wenn keine ausgewählt sind
    if (selectedClasses.length > 0 && !selectedClasses.includes(entry.Klasse)) return;
    
    const className = entry.Klasse;
    
    if (!classStats[className]) {
      classStats[className] = {
        name: className,
        verspaetungen: 0,
        fehlzeiten: 0,
        total: 0
      };
    }
    
    const isVerspaetung = entry.Abwesenheitsgrund === 'Verspätung' || 
                          (entry.Endzeit && new Date(`01/01/2000 ${entry.Endzeit}`) < new Date(`01/01/2000 16:50`));
    
    if (isVerspaetung) {
      classStats[className].verspaetungen++;
    } else {
      classStats[className].fehlzeiten++;
    }
    
    classStats[className].total++;
  });
  
  // In Array konvertieren und nach Klasse sortieren
  const classArray = Object.values(classStats).sort((a: any, b: any) => a.name.localeCompare(b.name));
  
  return classArray;
};

// Bereitet die Daten für die Absenztypen vor
export const prepareAbsenceTypes = (
  rawData: any[] | null, 
  startDate: string, 
  endDate: string, 
  selectedClasses: string[]
) => {
  if (!rawData) return [];
  
  let entschuldigt = 0;
  let unentschuldigt = 0;
  let offen = 0;
  
  rawData.forEach(entry => {
    if (!entry.Beginndatum) return;
    
    const entryDate = parseDate(entry.Beginndatum);
    const startDateTime = new Date(startDate + 'T00:00:00');
    const endDateTime = new Date(endDate + 'T23:59:59');
    
    // Nur Einträge im gewählten Zeitraum berücksichtigen
    if (entryDate < startDateTime || entryDate > endDateTime) return;
    
    // Nur ausgewählte Klassen berücksichtigen oder alle, wenn keine ausgewählt sind
    if (selectedClasses.length > 0 && !selectedClasses.includes(entry.Klasse)) return;
    
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

// Bereitet die Daten für die Wochentagsanalyse vor
export const prepareDayOfWeekAnalysis = (
  rawData: any[] | null, 
  startDate: string, 
  endDate: string, 
  selectedClasses: string[]
) => {
  if (!rawData) return [];
  
  const dayStats = Array(7).fill(0).map((_, index) => ({
    name: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][index],
    fehlzeiten: 0,
    verspaetungen: 0
  }));
  
  rawData.forEach(entry => {
    if (!entry.Beginndatum) return;
    
    const entryDate = parseDate(entry.Beginndatum);
    const startDateTime = new Date(startDate + 'T00:00:00');
    const endDateTime = new Date(endDate + 'T23:59:59');
    
    // Nur Einträge im gewählten Zeitraum berücksichtigen
    if (entryDate < startDateTime || entryDate > endDateTime) return;
    
    // Nur ausgewählte Klassen berücksichtigen oder alle, wenn keine ausgewählt sind
    if (selectedClasses.length > 0 && !selectedClasses.includes(entry.Klasse)) return;
    
    const dayOfWeek = entryDate.getDay(); // 0 = Sonntag, 1 = Montag, ...
    
    const isVerspaetung = entry.Abwesenheitsgrund === 'Verspätung' || 
                        (entry.Endzeit && new Date(`01/01/2000 ${entry.Endzeit}`) < new Date(`01/01/2000 16:50`));
    
    if (isVerspaetung) {
      dayStats[dayOfWeek].verspaetungen++;
    } else {
      dayStats[dayOfWeek].fehlzeiten++;
    }
  });
  
  // Filtere Wochenenden heraus, wenn keine Daten vorhanden
  const filteredDayStats = dayStats.filter(day => 
    (day.name !== 'Samstag' && day.name !== 'Sonntag') || 
    (day.fehlzeiten > 0 || day.verspaetungen > 0)
  );
  
  return filteredDayStats;
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
    const verspaetungen = entityEntries.filter(entry => 
      entry.Abwesenheitsgrund === 'Verspätung' || 
      (entry.Endzeit && new Date(`01/01/2000 ${entry.Endzeit}`) < new Date(`01/01/2000 16:50`))
    ).length;
    
    const fehlzeiten = entityEntries.filter(entry => 
      entry.Abwesenheitsgrund !== 'Verspätung' && 
      !(entry.Endzeit && new Date(`01/01/2000 ${entry.Endzeit}`) < new Date(`01/01/2000 16:50`))
    ).length;
    
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
        const today = new Date();
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
    const trendData: { [key: string]: { verspaetungen: number, fehlzeiten: number } } = {};
    
    entityEntries.forEach(entry => {
      const entryDate = parseDate(entry.Beginndatum);
      // Zur Einfachheit verwenden wir den Wochennamen als Schlüssel
      const weekKey = entryDate.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
      
      if (!trendData[weekKey]) {
        trendData[weekKey] = { verspaetungen: 0, fehlzeiten: 0 };
      }
      
      const isVerspaetung = entry.Abwesenheitsgrund === 'Verspätung' || 
                          (entry.Endzeit && new Date(`01/01/2000 ${entry.Endzeit}`) < new Date(`01/01/2000 16:50`));
      
      if (isVerspaetung) {
        trendData[weekKey].verspaetungen++;
      } else {
        trendData[weekKey].fehlzeiten++;
      }
    });
    
    // Trends in Array umwandeln und sortieren
    const sortedTrendData = Object.entries(trendData)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, data]) => ({
        date,
        ...Object.fromEntries(entities.map(e => [e, e === entity ? data.verspaetungen + data.fehlzeiten : 0]))
      }));
      
    // Daten ins Ergebnis einfügen
    resultData.push(
      { type: 'verspaetungen', entity, verspaetungen },
      { type: 'fehlzeiten', entity, fehlzeiten },
      { type: 'entschuldigung', entity, entschuldigt, unentschuldigt, offen }
    );
    
    // Trendsdaten nur einmal als Gesamtdatensatz einfügen
    if (entity === entities[0]) {
      resultData.push({ type: 'trend', data: sortedTrendData });
    }
  });
  
  return resultData;
};

// Bereitet Daten für die zeitliche Analyse vor
export const prepareAttendanceOverTime = (
  rawData: any[] | null,
  startDate: string,
  endDate: string,
  groupingOption: 'daily' | 'weekly' | 'monthly',
  selectedClasses: string[]
) => {
  if (!rawData) return [];
  
  const startDateTime = new Date(startDate + 'T00:00:00');
  const endDateTime = new Date(endDate + 'T23:59:59');
  
  // Filtere relevante Einträge
  const relevantEntries = rawData.filter(entry => {
    if (!entry.Beginndatum) return false;
    
    const entryDate = parseDate(entry.Beginndatum);
    
    // Zeitraumfilter anwenden
    if (entryDate < startDateTime || entryDate > endDateTime) return false;
    
    // Klassenfilter anwenden
    if (selectedClasses.length > 0 && !selectedClasses.includes(entry.Klasse)) return false;
    
    return true;
  });
  
  // Gruppieren nach gewählter Option
  const groupedData: { [key: string]: { 
    verspaetungen: number, 
    fehlzeiten: number,
    entschuldigt: number,
    unentschuldigt: number 
  } } = {};
  
  relevantEntries.forEach(entry => {
    const entryDate = parseDate(entry.Beginndatum);
    let groupKey: string;
    
    // Zeitschlüssel basierend auf Gruppierungsoption generieren
    if (groupingOption === 'daily') {
      // Tägliche Gruppierung im Format "DD.MM."
      groupKey = entryDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    } else if (groupingOption === 'weekly') {
      // Wöchentliche Gruppierung als Kalenderwoche
      const week = getWeekNumber(entryDate);
      groupKey = `${week}`;
    } else { // monthly
      // Monatliche Gruppierung im Format "MMM YYYY"
      groupKey = entryDate.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
    }
    
    // Initialisiere Gruppe, falls noch nicht vorhanden
    if (!groupedData[groupKey]) {
      groupedData[groupKey] = { 
        verspaetungen: 0, 
        fehlzeiten: 0,
        entschuldigt: 0,
        unentschuldigt: 0 
      };
    }
    
    // Zähle Verspätungen/Fehlzeiten
    const isVerspaetung = entry.Abwesenheitsgrund === 'Verspätung' || 
                        (entry.Endzeit && new Date(`01/01/2000 ${entry.Endzeit}`) < new Date(`01/01/2000 16:50`));
    
    if (isVerspaetung) {
      groupedData[groupKey].verspaetungen++;
    } else {
      groupedData[groupKey].fehlzeiten++;
    }
    
    // Zähle entschuldigte/unentschuldigte Einträge
    const status = entry.Status ? entry.Status.trim() : '';
    const today = new Date();
    const deadlineDate = new Date(entryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    if (status === 'entsch.' || status === 'Attest' || status === 'Attest Amtsarzt') {
      groupedData[groupKey].entschuldigt++;
    } else if (status === 'nicht entsch.' || status === 'nicht akzep.' || (!status && today > deadlineDate)) {
      groupedData[groupKey].unentschuldigt++;
    }
  });
  
  // Umwandeln in Array und sortieren
  return Object.entries(groupedData)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => {
      // Sortierung hängt vom Gruppierungstyp ab
      if (groupingOption === 'daily') {
        // Wir verwenden hier einen Trick: Wir ergänzen das Jahr, um korrekt zu sortieren
        const currentYear = new Date().getFullYear();
        const [dayA, monthA] = a.name.split('.');
        const [dayB, monthB] = b.name.split('.');
        const dateA = new Date(`${currentYear}-${monthA}-${dayA}`);
        const dateB = new Date(`${currentYear}-${monthB}-${dayB}`);
        return dateA.getTime() - dateB.getTime();
      } else if (groupingOption === 'weekly') {
        // Einfache numerische Sortierung für Kalenderwochen
        return parseInt(a.name) - parseInt(b.name);
      } else {
        // Für monatliche Daten versuchen wir eine sinnvolle Sortierung
        const getMonthValue = (monthStr: string) => {
          const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
          return months.findIndex(m => monthStr.includes(m));
        };
        const [monthA, yearA] = a.name.split(' ');
        const [monthB, yearB] = b.name.split(' ');
        const yearDiff = parseInt(yearA) - parseInt(yearB);
        if (yearDiff !== 0) return yearDiff;
        return getMonthValue(monthA) - getMonthValue(monthB);
      }
    });
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
// Hilfsfunktion zum Testen und Debuggen von Daten
export const test = (
  data: any[] | null,
  startDate: string,
  endDate: string
) => {
  if (!data) return [];
  // Diese Funktion kann für Debug-Zwecke und Tests verwendet werden
  // z.B. um Datenstrukturen zu inspizieren
  
  const startDateTime = new Date(startDate + 'T00:00:00');
  const endDateTime = new Date(endDate + 'T23:59:59');
  
  // Filtere relevante Einträge
  const relevantEntries = data.filter(entry => {
    if (!entry.Beginndatum) return false;
    
    const entryDate = parseDate(entry.Beginndatum);
    // Zeitraumfilter anwenden
    if (entryDate < startDateTime || entryDate > endDateTime) return false;
    
    return true;
  });
  
  return relevantEntries;
};

export const prepareEntschuldigungsverhalten = (
  rawData: any[] | null,
  startDate: string,
  endDate: string,
  selectedClasses: string[]
) => {
  if (!rawData) return [];
  
  const startDateTime = new Date(startDate + 'T00:00:00');
  const endDateTime = new Date(endDate + 'T23:59:59');
  
  // Filtere relevante Einträge
  const relevantEntries = rawData.filter(entry => {
    if (!entry.Beginndatum) return false;
    
    const entryDate = parseDate(entry.Beginndatum);
    
    // Zeitraumfilter anwenden
    if (entryDate < startDateTime || entryDate > endDateTime) return false;
    
    // Klassenfilter anwenden
    if (selectedClasses.length > 0 && !selectedClasses.includes(entry.Klasse)) return false;
    
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
  
  // Berechne das Entschuldigungsverhalten je Klasse
  return Object.entries(dataByClass).map(([className, entries]) => {
    let entschuldigt = 0;
    let unentschuldigt = 0;
    let offen = 0;
    let gesamtEntschuldigungstage = 0;
    let anzahlEntschuldigungen = 0;
    
    entries.forEach(entry => {
      const entryDate = parseDate(entry.Beginndatum);
      const status = entry.Status ? entry.Status.trim() : '';
      
      if (status === 'entsch.' || status === 'Attest' || status === 'Attest Amtsarzt') {
        entschuldigt++;
        
        // Berechne die Dauer bis zur Entschuldigung, falls Datum vorhanden
        if (entry.EntschuldigungsDatum) {
          const entschuldigungsDatum = parseDate(entry.EntschuldigungsDatum);
          const daysDiff = Math.round((entschuldigungsDatum.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
          
          gesamtEntschuldigungstage += daysDiff;
          anzahlEntschuldigungen++;
        }
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
    
    const total = entschuldigt + unentschuldigt + offen;
    const entschuldigtRate = total > 0 ? (entschuldigt / total) * 100 : 0;
    const unentschuldigtRate = total > 0 ? (unentschuldigt / total) * 100 : 0;
    const durchschnittlicheEntschuldigungstage = anzahlEntschuldigungen > 0 
      ? gesamtEntschuldigungstage / anzahlEntschuldigungen 
      : null;
    
    return {
      klasse: className,
      entschuldigt,
      unentschuldigt,
      offen,
      total,
      entschuldigtRate,
      unentschuldigtRate,
      durchschnittlicheEntschuldigungstage
    };
  }).sort((a, b) => a.klasse.localeCompare(b.klasse));
};