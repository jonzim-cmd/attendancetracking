import React from 'react';
import NormalView from '@/components/attendance/NormalView';
import { StudentStats } from '@/types';

interface MainContentProps {
  getFilteredStudents: () => [string, StudentStats][];
  detailedData: Record<string, any>;
  schoolYearDetailedData: Record<string, any>;
  weeklyDetailedData: Record<string, any>;
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
}

const MainContent: React.FC<MainContentProps> = ({
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
}) => {
  return (
    <main
      className="pt-14 p-6 bg-chatGray-light dark:bg-chatGray-dark min-h-screen"
      style={{ marginLeft: 'var(--sidebar-width)' }}
    >
      <NormalView
        getFilteredStudents={getFilteredStudents}
        detailedData={detailedData}
        schoolYearDetailedData={schoolYearDetailedData}
        weeklyDetailedData={weeklyDetailedData}
        startDate={startDate}
        endDate={endDate}
        schoolYearStats={schoolYearStats}
        weeklyStats={weeklyStats}
        selectedWeeks={selectedWeeks}
        availableClasses={availableClasses}
        selectedClasses={selectedClasses}
        onClassesChange={onClassesChange}
        expandedStudents={expandedStudents}
        setExpandedStudents={setExpandedStudents}
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
        visibleColumns={visibleColumns}
      />
    </main>
  );
};

export default MainContent;
