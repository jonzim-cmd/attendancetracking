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

// Angepasste Funktion zur Erkennung von Verspätung ausschließlich basierend auf Abwesenheitsgrund und Endzeit
export const isVerspaetungFunc = (row: any): boolean => {
  // Nutze ausschließlich Abwesenheitsgrund zur Klassifizierung
  const absenceReason = row.Abwesenheitsgrund ? row.Abwesenheitsgrund.trim() : '';
  const isTardyByReason = absenceReason === 'Verspätung';
  
  // Falls kein Abwesenheitsgrund vorliegt, dann prüfe die Endzeit
  const expectedMinutes = parseTimeToMinutes('16:50');
  const isTardyByEndzeit =
    (!absenceReason || absenceReason === '') &&
    row.Endzeit &&
    parseTimeToMinutes(row.Endzeit) < expectedMinutes;
  
  return isTardyByReason || isTardyByEndzeit;
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
  const sjStartDate = new Date(schoolYear.start + '-09-01T00:00:00');
  const sjEndDate = new Date(schoolYear.end + '-07-31T23:59:59');

  data.forEach((row) => {
    if (!row.Beginndatum || !row.Langname || !row.Vorname) return;
    if (row['Text/Grund']?.toLowerCase().includes('fehleintrag')) return;

    const [day, month, year] = row.Beginndatum.split('.');
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`);
    const studentName = `${row.Langname}, ${row.Vorname}`;

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
    const isVerspaetung = isVerspaetungFunc(row);
    const isAttest = effectiveStatus === 'Attest' || effectiveStatus === 'Attest Amtsarzt';
    const isEntschuldigt = effectiveStatus === 'entsch.' || isAttest;
    const isUnentschuldigt = effectiveStatus === 'nicht entsch.' || effectiveStatus === 'nicht akzep.';
    const deadlineDate = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    const isOverDeadline = today > deadlineDate;
    const isOffen = !effectiveStatus && !isOverDeadline;

    const entry: AbsenceEntry = {
      datum: date,
      art: isVerspaetung ? 'Verspätung' : (row.Abwesenheitsgrund || 'Fehltag'),
      beginnZeit: row.Beginnzeit,
      endZeit: row.Endzeit,
      grund: row['Text/Grund'],
      status: effectiveStatus,
    };

    if (date >= startDateTime && date <= endDateTime) {
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

    if (date >= sjStartDate && date <= sjEndDate) {
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
  });

  return { studentStats, detailedStats, schoolYearDetails, weeklyDetails };
};

export const calculateSchoolYearStats = (data: any[]): Record<string, any> => {
  const schoolYear = getCurrentSchoolYear();
  const sjStartDate = new Date(schoolYear.start + '-09-01T00:00:00');
  const sjEndDate = new Date(schoolYear.end + '-07-31T23:59:59');
  const today = new Date();

  const stats: Record<string, { verspaetungen_unentsch: number; fehlzeiten_unentsch: number; fehlzeiten_gesamt: number }> = {};

  data.forEach((row) => {
    if (!row.Beginndatum || !row.Langname || !row.Vorname) return;
    if (row['Text/Grund']?.toLowerCase().includes('fehleintrag')) return;

    const [day, month, year] = row.Beginndatum.split('.');
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`);
    const studentName = `${row.Langname}, ${row.Vorname}`;

    if (!stats[studentName]) {
      stats[studentName] = {
        verspaetungen_unentsch: 0,
        fehlzeiten_unentsch: 0,
        fehlzeiten_gesamt: 0,
      };
    }

    const effectiveStatus = row.Status ? row.Status.trim() : '';
    const isVerspaetung = isVerspaetungFunc(row);

    if (date >= sjStartDate && date <= sjEndDate) {
      if (!isVerspaetung) {
        // Fehlzeiten: immer zur Gesamtzahl hinzufügen
        stats[studentName].fehlzeiten_gesamt++;
        const isUnentschuldigt = effectiveStatus === 'nicht entsch.' || effectiveStatus === 'nicht akzep.';
        const deadlineDate = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (isUnentschuldigt || (!effectiveStatus && today > deadlineDate)) {
          stats[studentName].fehlzeiten_unentsch++;
        }
      } else {
        // Bei Verspätungen soll als Zahl nur unentschuldigt gezählt werden.
        const isUnentschuldigt = effectiveStatus === 'nicht entsch.' || effectiveStatus === 'nicht akzep.' || (!effectiveStatus && today > new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000));
        if (isUnentschuldigt) {
          stats[studentName].verspaetungen_unentsch++;
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

    const [day, month, year] = row.Beginndatum.split('.');
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`);
    const studentName = `${row.Langname}, ${row.Vorname}`;

    const weekIndex = weeks.findIndex((w) => {
      const startDate = w.startDate;
      const endDate = w.endDate;
      return date >= startDate && date <= endDate;
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
    const deadline = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
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
  });

  return stats;
};

const getCurrentSchoolYear = (): { start: string; end: string } => {
  const today = new Date();
  const year = today.getMonth() < 8 ? today.getFullYear() - 1 : today.getFullYear();
  return { start: `${year}`, end: `${year + 1}` };
};