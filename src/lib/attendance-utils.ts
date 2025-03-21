interface Week {
  week?: number;
  year?: number;
  startDate: Date;
  endDate: Date;
}

interface AbsenceEntry {
  datum: Date | string;
  art: string;
  beginnZeit?: string;
  endZeit?: string;
  grund?: string;
  status: string;
}

interface DetailedStats {
  verspaetungen_entsch: AbsenceEntry[];
  verspaetungen_unentsch: AbsenceEntry[];
  verspaetungen_offen: AbsenceEntry[];
  fehlzeiten_entsch: AbsenceEntry[];
  fehlzeiten_unentsch: AbsenceEntry[];
  fehlzeiten_offen: AbsenceEntry[];
}

// Helper function to get week number from date
export const getWeekNumber = (d: Date): number => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const getLastNWeeks = (n: number): Week[] => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Find the last completed Friday
  let lastFriday = new Date(today);
  lastFriday.setHours(23, 59, 59, 999);

  // Adjustiere auf den letzten abgeschlossenen Freitag
  if (dayOfWeek === 0) { // Sonntag
    lastFriday.setDate(lastFriday.getDate() - 2);
  } else if (dayOfWeek === 6) { // Samstag
    lastFriday.setDate(lastFriday.getDate() - 1);
  } else { // Montag bis Freitag
    lastFriday.setDate(lastFriday.getDate() - (dayOfWeek - 5));
  }

  const weeks: Week[] = [];

  // Gehe n Wochen zurück
  for (let i = 0; i < n; i++) {
    // Berechne Freitag der aktuellen Woche
    const friday = new Date(lastFriday);
    friday.setDate(lastFriday.getDate() - (7 * i));
    friday.setHours(23, 59, 59, 999);

    // Berechne Montag derselben Woche (4 Tage vor Freitag)
    const monday = new Date(friday);
    monday.setDate(friday.getDate() - 4);
    monday.setHours(0, 0, 0, 0);

    weeks.unshift({
      week: getWeekNumber(monday),
      year: monday.getFullYear(),
      startDate: monday,
      endDate: friday
    });
  }

  return weeks;
};

export const parseDate = (dateStr: string | Date): Date => {
  if (dateStr instanceof Date) return dateStr;
  const [day, month, year] = dateStr.split('.');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

// Hilfsfunktion: Wandelt eine Zeitangabe (z. B. "16:50") in Minuten um
export const parseTimeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Verbesserte Funktion zur Erkennung von Verspätung mit präziserer Logik
export const isVerspaetungFunc = (row: any): boolean => {
  // 1. Wenn Abwesenheitsgrund explizit "Verspätung" ist -> Verspätung
  const absenceReason = row.Abwesenheitsgrund ? row.Abwesenheitsgrund.trim() : '';
  if (absenceReason === 'Verspätung') return true;
  
  // 2. Wenn irgendein anderer Abwesenheitsgrund angegeben ist -> kein Verspätung (= Fehltag)
  if (absenceReason !== '') return false;
  
  // 3. Wenn KEIN Abwesenheitsgrund vorliegt, dann nach Endzeit entscheiden
  if (row.Endzeit) {
    // Die kritischen Zeitpunkte, die standardmäßig Fehltage sind (Unterrichtsende)
    const stdEndTimes = ['14:05', '15:20', '16:05', '16:50'];
    if (stdEndTimes.includes(row.Endzeit)) return false; // Diese Zeiten deuten auf Fehltage hin
    
    // Alle anderen Zeiten -> eher Verspätung 
    return true;
  }
  
  // Fallback: Wenn keine Zeit angegeben ist -> als Fehltag behandeln
  return false;
};

export const processData = (
  data: any[],
  startDateTime: Date,
  endDateTime: Date
): {
  studentStats: Record<string, any>;
  detailedStats: Record<string, DetailedStats>;
  schoolYearDetails: Record<string, any>;
  weeklyDetails: Record<string, DetailedStats>;
} => {
  const today = new Date();
  const studentStats: Record<string, any> = {};
  const detailedStats: Record<string, DetailedStats> = {};
  const schoolYearDetails: Record<string, any> = {};
  const weeklyDetails: Record<string, DetailedStats> = {};
  const schoolYear = getCurrentSchoolYear();
  const sjStartDate = schoolYear.startDate;
  const sjEndDate = schoolYear.endDate;

  data.forEach((row) => {
    if (!row.Beginndatum || !row.Langname || !row.Vorname) return;
    if (row['Text/Grund']?.toLowerCase().includes('fehleintrag')) return;

    const [startDay, startMonth, startYear] = row.Beginndatum.split('.');
    const startDate = new Date(`${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}T12:00:00`);
    const studentName = `${row.Langname}, ${row.Vorname}`;

    // Prüfe auf mehrtägigen Eintrag
    let endDate = startDate;
    let isMultiDayEntry = false;
    
    if (row.Enddatum && row.Beginndatum !== row.Enddatum) {
      const [endDay, endMonth, endYear] = row.Enddatum.split('.');
      endDate = new Date(`${endYear}-${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}T12:00:00`);
      isMultiDayEntry = true;
    }

    if (!studentStats[studentName]) {
      studentStats[studentName] = {
        verspaetungen_entsch: 0,
        verspaetungen_unentsch: 0,
        verspaetungen_offen: 0,
        fehlzeiten_entsch: 0,
        fehlzeiten_unentsch: 0,
        fehlzeiten_offen: 0,
        klasse: row.Klasse,
      };
    }

    if (!detailedStats[studentName]) {
      detailedStats[studentName] = {
        verspaetungen_entsch: [],
        verspaetungen_unentsch: [],
        verspaetungen_offen: [],
        fehlzeiten_entsch: [],
        fehlzeiten_unentsch: [],
        fehlzeiten_offen: [],
      };
    }

    if (!schoolYearDetails[studentName]) {
      schoolYearDetails[studentName] = {
        verspaetungen_entsch: [],
        verspaetungen_unentsch: [],
        verspaetungen_offen: [],
        fehlzeiten_entsch: [],
        fehlzeiten_unentsch: [],
        fehlzeiten_offen: [],
        fehlzeiten_gesamt: [],
      };
    }

    if (!weeklyDetails[studentName]) {
      weeklyDetails[studentName] = {
        verspaetungen_entsch: [],
        verspaetungen_unentsch: [],
        verspaetungen_offen: [],
        fehlzeiten_entsch: [],
        fehlzeiten_unentsch: [],
        fehlzeiten_offen: [],
      };
    }

    const effectiveStatus = row.Status ? row.Status.trim() : '';
    const isVerspaetung = !isMultiDayEntry && isVerspaetungFunc(row); // Mehrtägige Einträge sind nie Verspätungen
    const isAttest = effectiveStatus === 'Attest' || effectiveStatus === 'Attest Amtsarzt';
    const isEntschuldigt = effectiveStatus === 'entsch.' || isAttest;
    const isUnentschuldigt = effectiveStatus === 'nicht entsch.' || effectiveStatus === 'nicht akzep.';
    
    // Bei mehrtägigen Einträgen jeden Tag einzeln verarbeiten
    if (isMultiDayEntry) {
      // Menge der Tage durchgehen von Beginn- bis Enddatum
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Deadline für den aktuellen Tag berechnen
        const dayDeadlineDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const isDayOverDeadline = today > dayDeadlineDate;
        const isDayOffen = !effectiveStatus && !isDayOverDeadline;
        
        // Eintrag für den aktuellen Tag
        const dailyEntry: AbsenceEntry = {
          datum: new Date(currentDate), // Kopie des aktuellen Datums
          art: row.Abwesenheitsgrund || 'Fehltag', // Mehrtätige Einträge sind immer Fehltage
          beginnZeit: row.Beginnzeit,
          endZeit: row.Endzeit,
          grund: row['Text/Grund'],
          status: effectiveStatus,
        };
        
        // Verarbeitung für den Datumsfilter
        if (currentDate >= startDateTime && currentDate <= endDateTime) {
          // Bei mehrtägigen Einträgen - immer als Fehltag behandeln
          if (isEntschuldigt) {
            studentStats[studentName].fehlzeiten_entsch++;
            detailedStats[studentName].fehlzeiten_entsch.push(dailyEntry);
          } else if (isUnentschuldigt || (!effectiveStatus && isDayOverDeadline)) {
            studentStats[studentName].fehlzeiten_unentsch++;
            detailedStats[studentName].fehlzeiten_unentsch.push(dailyEntry);
          } else if (isDayOffen) {
            studentStats[studentName].fehlzeiten_offen++;
            detailedStats[studentName].fehlzeiten_offen.push(dailyEntry);
          }
        }
        
        // Verarbeitung für Schuljahresstatistiken
        if (currentDate >= sjStartDate && currentDate <= sjEndDate) {
          // Für Fehltage: immer in fehlzeiten_gesamt aufnehmen
          schoolYearDetails[studentName].fehlzeiten_gesamt.push(dailyEntry);
          if (isUnentschuldigt || (!effectiveStatus && isDayOverDeadline)) {
            schoolYearDetails[studentName].fehlzeiten_unentsch.push(dailyEntry);
          }
          if (isEntschuldigt) {
            schoolYearDetails[studentName].fehlzeiten_entsch.push(dailyEntry);
          }
        }
        
        // Verarbeitung für wöchentliche Statistiken
        if (isEntschuldigt) {
          weeklyDetails[studentName].fehlzeiten_entsch.push(dailyEntry);
        } else if (isUnentschuldigt || (!effectiveStatus && isDayOverDeadline)) {
          weeklyDetails[studentName].fehlzeiten_unentsch.push(dailyEntry);
        } else if (isDayOffen) {
          weeklyDetails[studentName].fehlzeiten_offen.push(dailyEntry);
        }
        
        // Zum nächsten Tag gehen
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // Für eintägige Einträge: ursprüngliche Logik beibehalten
      const deadlineDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const isOverDeadline = today > deadlineDate;
      const isOffen = !effectiveStatus && !isOverDeadline;

      const entry: AbsenceEntry = {
        datum: startDate,
        art: isVerspaetung ? 'Verspätung' : (row.Abwesenheitsgrund || 'Fehltag'),
        beginnZeit: row.Beginnzeit,
        endZeit: row.Endzeit,
        grund: row['Text/Grund'],
        status: effectiveStatus,
      };

      if (startDate >= startDateTime && startDate <= endDateTime) {
        if (isVerspaetung) {
          if (isEntschuldigt) {
            studentStats[studentName].verspaetungen_entsch++;
            detailedStats[studentName].verspaetungen_entsch.push(entry);
          } else if (isUnentschuldigt || (!effectiveStatus && isOverDeadline)) {
            studentStats[studentName].verspaetungen_unentsch++;
            detailedStats[studentName].verspaetungen_unentsch.push(entry);
          } else if (isOffen) {
            studentStats[studentName].verspaetungen_offen++;
            detailedStats[studentName].verspaetungen_offen.push(entry);
          }
        } else {
          if (isEntschuldigt) {
            studentStats[studentName].fehlzeiten_entsch++;
            detailedStats[studentName].fehlzeiten_entsch.push(entry);
          } else if (isUnentschuldigt || (!effectiveStatus && isOverDeadline)) {
            studentStats[studentName].fehlzeiten_unentsch++;
            detailedStats[studentName].fehlzeiten_unentsch.push(entry);
          } else if (isOffen) {
            studentStats[studentName].fehlzeiten_offen++;
            detailedStats[studentName].fehlzeiten_offen.push(entry);
          }
        }
      }

      if (startDate >= sjStartDate && startDate <= sjEndDate) {
        if (isVerspaetung) {
          // Für die Details: alle Verspätungen (entschuldigt, unentschuldigt, offen) sollen in den Detaildaten erscheinen.
          schoolYearDetails[studentName].verspaetungen_unentsch.push(entry);
        } else {
          // Für Fehlzeiten: immer in fehlzeiten_gesamt aufnehmen
          schoolYearDetails[studentName].fehlzeiten_gesamt.push(entry);
          if (isUnentschuldigt || (!effectiveStatus && isOverDeadline)) {
            schoolYearDetails[studentName].fehlzeiten_unentsch.push(entry);
          }
          if (isEntschuldigt) {
            schoolYearDetails[studentName].fehlzeiten_entsch.push(entry);
          }
        }
      }

      if (isVerspaetung) {
        if (isEntschuldigt) {
          weeklyDetails[studentName].verspaetungen_entsch.push(entry);
        } else if (isUnentschuldigt || (!effectiveStatus && isOverDeadline)) {
          weeklyDetails[studentName].verspaetungen_unentsch.push(entry);
        } else if (isOffen) {
          weeklyDetails[studentName].verspaetungen_offen.push(entry);
        }
      } else {
        if (isEntschuldigt) {
          weeklyDetails[studentName].fehlzeiten_entsch.push(entry);
        } else if (isUnentschuldigt || (!effectiveStatus && isOverDeadline)) {
          weeklyDetails[studentName].fehlzeiten_unentsch.push(entry);
        } else if (isOffen) {
          weeklyDetails[studentName].fehlzeiten_offen.push(entry);
        }
      }
    }
  });

  return { studentStats, detailedStats, schoolYearDetails, weeklyDetails };
};

export const calculateSchoolYearStats = (data: any[]): Record<string, any> => {
  const schoolYear = getCurrentSchoolYear();
  const sjStartDate = schoolYear.startDate;
  const sjEndDate = schoolYear.endDate;
  const today = new Date();

  const stats: Record<string, { verspaetungen_unentsch: number; fehlzeiten_unentsch: number; fehlzeiten_gesamt: number }> = {};

  data.forEach((row) => {
    if (!row.Beginndatum || !row.Langname || !row.Vorname) return;
    if (row['Text/Grund']?.toLowerCase().includes('fehleintrag')) return;

    const [startDay, startMonth, startYear] = row.Beginndatum.split('.');
    const startDate = new Date(`${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}T12:00:00`);
    const studentName = `${row.Langname}, ${row.Vorname}`;

    // Prüfe auf mehrtägigen Eintrag
    let endDate = startDate;
    let isMultiDayEntry = false;
    
    if (row.Enddatum && row.Beginndatum !== row.Enddatum) {
      const [endDay, endMonth, endYear] = row.Enddatum.split('.');
      endDate = new Date(`${endYear}-${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}T12:00:00`);
      isMultiDayEntry = true;
    }

    if (!stats[studentName]) {
      stats[studentName] = {
        verspaetungen_unentsch: 0,
        fehlzeiten_unentsch: 0,
        fehlzeiten_gesamt: 0,
      };
    }

    const effectiveStatus = row.Status ? row.Status.trim() : '';
    const isVerspaetung = !isMultiDayEntry && isVerspaetungFunc(row); // Mehrtägige Einträge sind nie Verspätungen

    // Bei mehrtägigen Einträgen jeden Tag einzeln verarbeiten
    if (isMultiDayEntry) {
      // Menge der Tage durchgehen von Beginn- bis Enddatum
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Prüfen, ob der aktuelle Tag im Schuljahr liegt
        if (currentDate >= sjStartDate && currentDate <= sjEndDate) {
          // Mehrtägige Einträge sind immer Fehltage
          stats[studentName].fehlzeiten_gesamt++;
          
          // Entscheidung, ob unentschuldigt
          const isUnentschuldigt = effectiveStatus === 'nicht entsch.' || effectiveStatus === 'nicht akzep.';
          const dayDeadlineDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          if (isUnentschuldigt || (!effectiveStatus && today > dayDeadlineDate)) {
            stats[studentName].fehlzeiten_unentsch++;
          }
        }
        
        // Zum nächsten Tag gehen
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // Ursprüngliche Logik für eintägige Einträge
      if (startDate >= sjStartDate && startDate <= sjEndDate) {
        if (!isVerspaetung) {
          // Fehlzeiten: immer zur Gesamtzahl hinzufügen
          stats[studentName].fehlzeiten_gesamt++;
          const isUnentschuldigt = effectiveStatus === 'nicht entsch.' || effectiveStatus === 'nicht akzep.';
          const deadlineDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (isUnentschuldigt || (!effectiveStatus && today > deadlineDate)) {
            stats[studentName].fehlzeiten_unentsch++;
          }
        } else {
          // Bei Verspätungen soll als Zahl nur unentschuldigt gezählt werden.
          const isUnentschuldigt = effectiveStatus === 'nicht entsch.' || effectiveStatus === 'nicht akzep.' || (!effectiveStatus && today > new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000));
          if (isUnentschuldigt) {
            stats[studentName].verspaetungen_unentsch++;
          }
        }
      }
    }
  });

  return stats;
};

export const calculateWeeklyStats = (data: any[], selectedWeeks: string): Record<string, any> => {
  const weeks = getLastNWeeks(parseInt(selectedWeeks));
  const stats: Record<string, any> = {};

  data.forEach((row) => {
    if (!row.Beginndatum || !row.Langname || !row.Vorname) return;
    if (row['Text/Grund']?.toLowerCase().includes('fehleintrag')) return;

    const [startDay, startMonth, startYear] = row.Beginndatum.split('.');
    const startDate = new Date(`${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}T12:00:00`);
    const studentName = `${row.Langname}, ${row.Vorname}`;

    // Prüfen auf mehrtägigen Eintrag
    let endDate = startDate;
    let isMultiDayEntry = false;
    
    if (row.Enddatum && row.Beginndatum !== row.Enddatum) {
      const [endDay, endMonth, endYear] = row.Enddatum.split('.');
      endDate = new Date(`${endYear}-${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}T12:00:00`);
      isMultiDayEntry = true;
    }
    
    // Bei mehrtägigen Einträgen andere Verarbeitung
    if (isMultiDayEntry) {
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Für jeden Tag die Woche finden
        const weekIndex = weeks.findIndex((w) => {
          return currentDate >= w.startDate && currentDate <= w.endDate;
        });
        
        // Wenn Tag nicht in einer der Wochen liegt, zum nächsten Tag
        if (weekIndex === -1) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }
        
        // Sicherstellen, dass der Student im stats-Objekt existiert
        if (!stats[studentName]) {
          stats[studentName] = {
            verspaetungen: { total: 0, weekly: Array(weeks.length).fill(0) },
            fehlzeiten: { total: 0, weekly: Array(weeks.length).fill(0) },
          };
        }
        
        // Status überprüfen
        const effectiveStatus = row.Status ? row.Status.trim() : '';
        const today = new Date();
        const deadline = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const isUnentschuldigt =
          effectiveStatus === 'nicht entsch.' ||
          effectiveStatus === 'nicht akzep.' ||
          (!effectiveStatus && today > deadline);
        
        // Mehrtägige Einträge sind immer Fehltage (keine Verspätungen)
        if (isUnentschuldigt) {
          stats[studentName].fehlzeiten.weekly[weekIndex]++;
          stats[studentName].fehlzeiten.total++;
        }
        
        // Zum nächsten Tag
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // Ursprüngliche Logik für eintägige Einträge
      const weekIndex = weeks.findIndex((w) => {
        return startDate >= w.startDate && startDate <= w.endDate;
      });

      if (weekIndex === -1) return;

      if (!stats[studentName]) {
        stats[studentName] = {
          verspaetungen: { total: 0, weekly: Array(weeks.length).fill(0) },
          fehlzeiten: { total: 0, weekly: Array(weeks.length).fill(0) },
        };
      }

      const effectiveStatus = row.Status ? row.Status.trim() : '';
      const isVerspaetung = isVerspaetungFunc(row);

      const today = new Date();
      const deadline = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const isUnentschuldigt =
        effectiveStatus === 'nicht entsch.' ||
        effectiveStatus === 'nicht akzep.' ||
        (!effectiveStatus && today > deadline);

      if (isUnentschuldigt) {
        if (isVerspaetung) {
          stats[studentName].verspaetungen.weekly[weekIndex]++;
          stats[studentName].verspaetungen.total++;
        } else {
          stats[studentName].fehlzeiten.weekly[weekIndex]++;
          stats[studentName].fehlzeiten.total++;
        }
      }
    }
  });

  return stats;
};

// Neues Interface für das erweiterte SchoolYear-Objekt
interface SchoolYear {
  start: string;       // Startjahr als String (für Kompatibilität)
  end: string;         // Endjahr als String (für Kompatibilität)
  startDate: Date;     // Tatsächliches Startdatum (2. Montag im September)
  endDate: Date;       // Tatsächliches Enddatum (letzter Freitag im Juli)
}

// Korrektur in src/lib/attendance-utils.ts für die getCurrentSchoolYear-Funktion

export const getCurrentSchoolYear = (): SchoolYear => {
  const today = new Date();
  // Bestimme das relevante Startjahr basierend auf aktuellem Monat
  const year = today.getMonth() < 8 ? today.getFullYear() - 1 : today.getFullYear();
  
  // Berechne den zweiten Montag im September
  let septemberFirst = new Date(year, 8, 1); // September (0-basierter Index)
  let dayOfWeek = septemberFirst.getDay(); // 0 = Sonntag, 1 = Montag, ...
  let daysToFirstMonday = dayOfWeek === 1 ? 0 : (dayOfWeek === 0 ? 1 : 8 - dayOfWeek);
  let secondMonday = new Date(year, 8, 1 + daysToFirstMonday + 7);
  
  // Berechne den letzten Tag im Juli des Folgejahres
  let julyLastDay = new Date(year + 1, 6, 31); // Juli (0-basierter Index)
  let lastDayOfWeek = julyLastDay.getDay(); // 0 = Sonntag, 1 = Montag, ...
  
  let endDate;
  
  // Prüfe, ob der letzte Tag im Juli ein Freitag ist (5 = Freitag)
  if (lastDayOfWeek === 5) {
    // Wenn ja, verwende den letzten Freitag im Juli (also den letzten Tag im Juli)
    endDate = julyLastDay;
  } else {
    // Wenn nein, berechne den ersten Freitag im August
    // Bestimme, wie viele Tage vom 1. August bis zum ersten Freitag
    let augustFirst = new Date(year + 1, 7, 1); // August (0-basierter Index)
    let augustFirstDayOfWeek = augustFirst.getDay();
    let daysToFriday = augustFirstDayOfWeek <= 5 ? 
                        5 - augustFirstDayOfWeek : // Wenn August 1 vor Freitag liegt
                        5 + (7 - augustFirstDayOfWeek); // Wenn August 1 nach Freitag liegt
    
    endDate = new Date(year + 1, 7, 1 + daysToFriday);
  }
  
  // WICHTIG: Korrekte Zeiteinstellungen für 12:00 Uhr mittags setzen
  // Dies verhindert Probleme mit Zeitzonen, wenn das Datum in einen ISO-String umgewandelt wird
  secondMonday.setHours(12, 0, 0, 0);
  endDate.setHours(12, 0, 0, 0);
  
  return {
    start: `${year}`,
    end: `${year + 1}`,
    startDate: secondMonday,
    endDate: endDate
  };
};