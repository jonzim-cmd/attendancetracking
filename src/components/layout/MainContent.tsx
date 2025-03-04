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
      className="overflow-hidden bg-chatGray-light dark:bg-chatGray-dark min-h-screen transition-all duration-300 transition-property-margin"
      style={{
        marginLeft: 'var(--sidebar-width)',
        paddingTop: '48px', // Feste Höhe statt pt-20 für konsistente Berechnung
        paddingLeft: 'calc(var(--header-padding-left) + 0px)' // erhöhter Puffer von 8px auf 16px
      }}
    >
      <div className="p-6">
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
      </div>
    </main>
  );  
};

export default MainContent;