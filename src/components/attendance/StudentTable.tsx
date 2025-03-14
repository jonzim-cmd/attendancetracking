import React from 'react';
import StudentTableHeader from './table/StudentTableHeader';
import StudentTableRow from './table/StudentTableRow';
import StudentDetailsRow from './table/StudentDetailsRow';
import SummaryRow from './table/SummaryRow';
import { AbsenceEntry, StudentStats } from '@/types';

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

interface StudentTableProps {
  students: [string, StudentStats][];
  detailedData: Record<string, any>;
  schoolYearStats: Record<string, any>;
  weeklyStats: Record<string, any>;
  selectedWeeks: string;
  expandedStudents: Set<string>;
  activeFilters: Map<string, string>;
  checkedStudents: Set<string>;
  visibleColumns: string[];
  sortStates: Map<SortField, SortState>;
  onSort: (field: SortField) => void;
  onToggleDetails: (student: string) => void;
  onShowFilteredDetails: (student: string, type: string) => void;
  onToggleChecked: (student: string) => void;
  onResetSelection: () => void;
  getFilteredDetailData: (student: string) => AbsenceEntry[];
  enableSummaryRow?: boolean;
  summaryRowSticky?: boolean;
}

const StudentTable: React.FC<StudentTableProps> = ({
  students,
  detailedData,
  schoolYearStats,
  weeklyStats,
  selectedWeeks,
  expandedStudents,
  activeFilters,
  checkedStudents,
  visibleColumns,
  sortStates,
  onSort,
  onToggleDetails,
  onShowFilteredDetails,
  onToggleChecked,
  onResetSelection,
  getFilteredDetailData,
  enableSummaryRow = true,
  summaryRowSticky = true,
}) => {
  return (
    <table className="min-w-full border-collapse bg-table-light-base dark:bg-table-dark-base">
      <colgroup>
        <col className="w-12" />
        <col className="w-56" />
        <col className="w-20" />
        {visibleColumns.includes('verspaetungen') && (
          <>
            <col />
            <col />
            <col />
          </>
        )}
        {visibleColumns.includes('stats') && visibleColumns.includes('verspaetungen') && (
          <>
            <col />
            <col className="min-w-[80px]" />
          </>
        )}
        {visibleColumns.includes('fehlzeiten') && (
          <>
            <col />
            <col />
            <col />
          </>
        )}
        {visibleColumns.includes('stats') && visibleColumns.includes('fehlzeiten') && (
          <>
            <col />
            <col />
            <col className="min-w-[80px]" />
          </>
        )}
        <col className="w-20" />
      </colgroup>
      
      <StudentTableHeader
        onSort={onSort}
        sortStates={sortStates}
        onResetSelection={onResetSelection}
        visibleColumns={visibleColumns}
      />
      
      <tbody>
        {students.map(([student, stats], index) => {
          const baseRowColor = index % 2 === 0 ? 'bg-table-light-base dark:bg-table-dark-base' : 'bg-table-light-alternate dark:bg-table-dark-alternate';
          const finalRowClass = `${baseRowColor} transition-opacity duration-300 hover:bg-table-light-hover dark:hover:bg-table-dark-hover ${
            checkedStudents.has(student) ? 'opacity-50' : 'opacity-100'
          }`;
          const schoolYearData = schoolYearStats[student] || { verspaetungen_unentsch: 0, fehlzeiten_unentsch: 0, fehlzeiten_gesamt: 0 };
          const weeklyData = weeklyStats[student] || {
            verspaetungen: { total: 0, weekly: Array(parseInt(selectedWeeks)).fill(0) },
            fehlzeiten: { total: 0, weekly: Array(parseInt(selectedWeeks)).fill(0) },
          };

          return (
            <React.Fragment key={student}>
              <StudentTableRow
                student={student}
                index={index}
                stats={stats}
                schoolYearData={schoolYearData}
                weeklyData={weeklyData}
                selectedWeeks={selectedWeeks}
                rowColor={finalRowClass}
                onToggleDetails={() => onToggleDetails(student)}
                onShowFilteredDetails={onShowFilteredDetails}
                isChecked={checkedStudents.has(student)}
                onToggleChecked={() => onToggleChecked(student)}
                visibleColumns={visibleColumns}
              />
              {expandedStudents.has(student) && (
                <StudentDetailsRow
                  student={student}
                  detailedData={getFilteredDetailData(student)}
                  rowColor={finalRowClass}
                  isVisible={true}
                  filterType={activeFilters.get(student)}
                  selectedWeeks={selectedWeeks}
                  visibleColumns={visibleColumns}
                />
              )}
            </React.Fragment>
          );
        })}
      </tbody>
      
      {/* Summenzeile hinzufügen falls aktiviert */}
      {enableSummaryRow && students.length > 0 && (
        <tfoot>
          <SummaryRow
            students={students}
            schoolYearStats={schoolYearStats}
            weeklyStats={weeklyStats}
            selectedWeeks={selectedWeeks}
            visibleColumns={visibleColumns}
            isSticky={summaryRowSticky}
          />
        </tfoot>
      )}
    </table>
  );
};

export default StudentTable;