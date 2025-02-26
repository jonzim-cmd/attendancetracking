export interface AbsenceEntry {
  datum: Date | string;
  art: string;
  beginnZeit?: string;
  endZeit?: string;
  grund?: string;
  status: string;
}

export interface DetailedStats {
  verspaetungen_entsch: AbsenceEntry[];
  verspaetungen_unentsch: AbsenceEntry[];
  verspaetungen_offen: AbsenceEntry[];
  fehlzeiten_entsch: AbsenceEntry[];
  fehlzeiten_unentsch: AbsenceEntry[];
  fehlzeiten_offen: AbsenceEntry[];
}

export interface StudentStats {
  verspaetungen_entsch: number;
  verspaetungen_unentsch: number;
  verspaetungen_offen: number;
  fehlzeiten_entsch: number;
  fehlzeiten_unentsch: number;
  fehlzeiten_offen: number;
  klasse: string;
}

export interface SchoolYearStats {
  verspaetungen_unentsch: number;
  fehlzeiten_unentsch: number;
  fehlzeiten_gesamt: number;
}

export interface WeeklyStats {
  verspaetungen: { total: number; weekly: number[] };
  fehlzeiten: { total: number; weekly: number[] };
}

export interface Week {
  startDate: Date;
  endDate: Date;
}

export interface ProcessedData {
  studentStats: Record<string, StudentStats>;
  detailedStats: Record<string, DetailedStats>;
  schoolYearDetails: Record<string, any>;
  weeklyDetails: Record<string, DetailedStats>;
}