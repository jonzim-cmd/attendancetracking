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
    { name: 'Entschuldigt', value: entschuldigt, color: '#10B981' },
    { name: 'Unentschuldigt', value: unentschuldigt, color: '#EF4444' },
    { name: 'Offen', value: offen, color: '#F59E0B' }
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