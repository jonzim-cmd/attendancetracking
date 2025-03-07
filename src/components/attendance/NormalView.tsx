import React, { useState } from 'react';
import StudentTable from '@/components/attendance/StudentTable';
import { getLastNWeeks } from '@/lib/attendance-utils';
import { AbsenceEntry, DetailedStats, StudentStats } from '@/types';

interface NormalViewProps {
  getFilteredStudents: () => [string, StudentStats][];
  detailedData: Record<string, DetailedStats>;
  schoolYearDetailedData: Record<string, any>;
  weeklyDetailedData: Record<string, DetailedStats>;
  startDate: string;
  endDate: string;
  schoolYearStats: Record<string, any>;
  weeklyStats: Record<string, any>;
  selectedWeeks: string;
  availableClasses: string[];
  selectedClasses: string[];
  onClassesChange: (classes: string[]) => void;
  expandedStudents: Set<string>;
  setExpandedStudents: (value: Set<string>) => void;
  activeFilters: Map<string, string>;
  setActiveFilters: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  visibleColumns: string[];
  enableSummaryRow?: boolean;
  summaryRowSticky?: boolean;
}

type SortField =
  | 'name'
  | 'klasse'
  | 'verspaetungen_entsch'
  | 'verspaetungen_unentsch'
  | 'verspaetungen_offen'
  | 'fehlzeiten_entsch'
  | 'fehlzeiten_unentsch'
  | 'fehlzeiten_offen'
  | 'sj_verspaetungen'
  | 'sj_fehlzeiten'
  | 'sj_fehlzeiten_ges'
  | 'sum_verspaetungen'
  | 'sum_fehlzeiten';

type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection | null;
  order: number;
}

const NormalView: React.FC<NormalViewProps> = ({
  getFilteredStudents,
  detailedData,
  schoolYearDetailedData,
  weeklyDetailedData,
  startDate,
  endDate,
  schoolYearStats,
  weeklyStats,
  selectedWeeks,
  availableClasses,
  selectedClasses,
  onClassesChange,
  expandedStudents,
  setExpandedStudents,
  activeFilters,
  setActiveFilters,
  visibleColumns,
  enableSummaryRow = true,
  summaryRowSticky = true,
}) => {
  const [sortStates, setSortStates] = useState<Map<SortField, SortState>>(new Map());
  const [checkedStudents, setCheckedStudents] = useState<Set<string>>(new Set());

  const parseDate = (dateStr: string | Date): Date => {
    if (dateStr instanceof Date) return dateStr;
    if (typeof dateStr === 'string') {
      const [day, month, year] = dateStr.split('.');
      if (day && month && year) {
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }
    return new Date();
  };

  const getFilteredDetailData = (student: string): AbsenceEntry[] => {
    if (!expandedStudents.has(student) || !activeFilters.has(student)) return [];

    const studentData = detailedData[student];
    const studentSchoolYearData = schoolYearDetailedData[student];
    const studentWeeklyData = weeklyDetailedData[student];
    if (!studentData || !studentSchoolYearData || !studentWeeklyData) return [];

    const filterType = activeFilters.get(student);

    switch (filterType) {
      case 'details': {
        const unexcusedEntries = [
          ...studentData.verspaetungen_unentsch,
          ...studentData.fehlzeiten_unentsch
        ];

        const today = new Date();
        const addOverdueEntries = (entries: AbsenceEntry[]) => {
          return entries.filter((entry) => {
            const entryDate = parseDate(entry.datum);
            const deadlineDate = new Date(entryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            return today > deadlineDate;
          });
        };

        const overdueEntries = [
          ...addOverdueEntries(studentData.verspaetungen_offen),
          ...addOverdueEntries(studentData.fehlzeiten_offen)
        ];

        return [...unexcusedEntries, ...overdueEntries].sort(
          (a: AbsenceEntry, b: AbsenceEntry) =>
            parseDate(b.datum).getTime() - parseDate(a.datum).getTime()
        );
      }

      case 'sj_verspaetungen':
      case 'sj_fehlzeiten': {
        const entries =
          filterType === 'sj_verspaetungen'
            ? studentSchoolYearData.verspaetungen_unentsch
            : studentSchoolYearData.fehlzeiten_unentsch;
        return entries.sort(
          (a: AbsenceEntry, b: AbsenceEntry) =>
            parseDate(b.datum).getTime() - parseDate(a.datum).getTime()
        );
      }

      case 'sj_fehlzeiten_ges': {
        return studentSchoolYearData.fehlzeiten_gesamt.sort(
          (a: AbsenceEntry, b: AbsenceEntry) =>
            parseDate(b.datum).getTime() - parseDate(a.datum).getTime()
        );
      }

      case 'sum_verspaetungen': {
        const weeks = getLastNWeeks(parseInt(selectedWeeks));
        const entries = studentWeeklyData.verspaetungen_unentsch.filter((entry: AbsenceEntry) => {
          const date = parseDate(entry.datum);
          return weeks.some((week) => date >= week.startDate && date <= week.endDate);
        });

        return entries.sort(
          (a: AbsenceEntry, b: AbsenceEntry) =>
            parseDate(b.datum).getTime() - parseDate(a.datum).getTime()
        );
      }

      case 'sum_fehlzeiten': {
        const weeks = getLastNWeeks(parseInt(selectedWeeks));
        const entries = studentWeeklyData.fehlzeiten_unentsch.filter((entry: AbsenceEntry) => {
          const date = parseDate(entry.datum);
          return weeks.some((week) => date >= week.startDate && date <= week.endDate);
        });

        return entries.sort(
          (a: AbsenceEntry, b: AbsenceEntry) =>
            parseDate(b.datum).getTime() - parseDate(a.datum).getTime()
        );
      }

      default: {
        const selectedType = filterType as keyof DetailedStats;
        return studentData[selectedType] || [];
      }
    }
  };

  const toggleDetails = (student: string) => {
    const newSet = new Set(expandedStudents);
    if (newSet.has(student)) {
      newSet.delete(student);
      setActiveFilters((prevFilters: Map<string, string>) => {
        const newFilters = new Map(prevFilters);
        newFilters.delete(student);
        return newFilters;
      });
    } else {
      newSet.add(student);
      setActiveFilters((prevFilters: Map<string, string>) => {
        const newFilters = new Map(prevFilters);
        newFilters.set(student, 'details');
        return newFilters;
      });
    }
    setExpandedStudents(newSet);
  };

  const showFilteredDetails = (student: string, type: string) => {
    const newSet = new Set(expandedStudents);
    if (newSet.has(student) && activeFilters.get(student) === type) {
      newSet.delete(student);
      setActiveFilters((prevFilters: Map<string, string>) => {
        const newFilters = new Map(prevFilters);
        newFilters.delete(student);
        return newFilters;
      });
    } else {
      newSet.add(student);
      setActiveFilters((prevFilters: Map<string, string>) => {
        const newFilters = new Map(prevFilters);
        newFilters.set(student, type);
        return newFilters;
      });
    }
    setExpandedStudents(newSet);
  };

  const handleSort = (field: SortField) => {
    setSortStates((prevStates) => {
      const newStates = new Map(prevStates);
      const currentState = newStates.get(field);

      if (!currentState) {
        newStates.set(field, {
          field,
          direction: 'asc',
          order: newStates.size,
        });
      } else if (currentState.direction === 'asc') {
        newStates.set(field, {
          ...currentState,
          direction: 'desc',
        });
      } else {
        newStates.delete(field);
        let order = 0;
        newStates.forEach((state) => {
          state.order = order++;
        });
      }

      return newStates;
    });
  };

  const compareValues = (
    a: [string, StudentStats],
    b: [string, StudentStats],
    field: SortField,
    direction: SortDirection
  ): number => {
    const [studentA, statsA] = a;
    const [studentB, statsB] = b;
    const multiplier = direction === 'asc' ? 1 : -1;

    switch (field) {
      case 'name':
        return multiplier * studentA.localeCompare(studentB);
      case 'klasse':
        return multiplier * statsA.klasse.localeCompare(statsB.klasse);
      case 'verspaetungen_entsch':
        return multiplier * (statsA.verspaetungen_entsch - statsB.verspaetungen_entsch);
      case 'verspaetungen_unentsch':
        return multiplier * (statsA.verspaetungen_unentsch - statsB.verspaetungen_unentsch);
      case 'verspaetungen_offen':
        return multiplier * (statsA.verspaetungen_offen - statsB.verspaetungen_offen);
      case 'fehlzeiten_entsch':
        return multiplier * (statsA.fehlzeiten_entsch - statsB.fehlzeiten_entsch);
      case 'fehlzeiten_unentsch':
        return multiplier * (statsA.fehlzeiten_unentsch - statsB.fehlzeiten_unentsch);
      case 'fehlzeiten_offen':
        return multiplier * (statsA.fehlzeiten_offen - statsB.fehlzeiten_offen);
      case 'sj_verspaetungen':
        return multiplier * ((schoolYearStats[studentA]?.verspaetungen_unentsch || 0) - (schoolYearStats[studentB]?.verspaetungen_unentsch || 0));
      case 'sj_fehlzeiten':
        return multiplier * ((schoolYearStats[studentA]?.fehlzeiten_unentsch || 0) - (schoolYearStats[studentB]?.fehlzeiten_unentsch || 0));
      case 'sj_fehlzeiten_ges':
        return multiplier * ((schoolYearStats[studentA]?.fehlzeiten_gesamt || 0) - (schoolYearStats[studentB]?.fehlzeiten_gesamt || 0));
      case 'sum_verspaetungen':
        return multiplier * ((weeklyStats[studentA]?.verspaetungen.total || 0) - (weeklyStats[studentB]?.verspaetungen.total || 0));
      case 'sum_fehlzeiten':
        return multiplier * ((weeklyStats[studentA]?.fehlzeiten.total || 0) - (weeklyStats[studentB]?.fehlzeiten.total || 0));
      default:
        return 0;
    }
  };

  const getSortedStudents = (): [string, StudentStats][] => {
    return [...getFilteredStudents()].sort((a, b) => {
      const sortEntries = Array.from(sortStates.values()).sort((x, y) => x.order - y.order);

      for (const sortState of sortEntries) {
        if (sortState.direction) {
          const comparison = compareValues(a, b, sortState.field, sortState.direction);
          if (comparison !== 0) return comparison;
        }
      }

      const [studentA, statsA] = a;
      const [studentB, statsB] = b;
      const classComparison = statsA.klasse.localeCompare(statsB.klasse);
      if (classComparison !== 0) return classComparison;
      return studentA.localeCompare(studentB);
    });
  };

  const toggleCheckedStudent = (student: string) => {
    setCheckedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(student)) {
        newSet.delete(student);
      } else {
        newSet.add(student);
      }
      return newSet;
    });
  };

  const resetCheckedStudents = () => {
    setCheckedStudents(new Set());
  };

  // Funktion zum Formatieren des Datums in dd.mm.yyyy
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-2">
      {/* Kompakte Überschrift */}
      <h3 className="text-base font-semibold text-chatGray-textLight dark:text-chatGray-textDark mb-1">
        Ergebnisse für den Zeitraum {formatDate(startDate)} - {formatDate(endDate)}
      </h3>

      {/* Optimierter Container für die Tabelle mit Sticky Header */}
      <div 
        className="relative border border-tableBorder-light dark:border-tableBorder-dark rounded-md overflow-auto bg-table-light-base dark:bg-table-dark-base"
        style={{ height: 'calc(100vh - 115px)' }}
      >
        <StudentTable
          students={getSortedStudents()}
          detailedData={detailedData}
          schoolYearStats={schoolYearStats}
          weeklyStats={weeklyStats}
          selectedWeeks={selectedWeeks}
          expandedStudents={expandedStudents}
          activeFilters={activeFilters}
          checkedStudents={checkedStudents}
          visibleColumns={visibleColumns}
          sortStates={sortStates}
          onSort={handleSort}
          onToggleDetails={toggleDetails}
          onShowFilteredDetails={showFilteredDetails}
          onToggleChecked={toggleCheckedStudent}
          onResetSelection={resetCheckedStudents}
          getFilteredDetailData={getFilteredDetailData}
          enableSummaryRow={enableSummaryRow}
          summaryRowSticky={summaryRowSticky}
        />
      </div>
    </div>
  );
};

export default NormalView;