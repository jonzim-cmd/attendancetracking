import React from 'react';
import NormalView from '@/components/attendance/NormalView';
import DashboardView from '@/components/attendance/DashboardView';
import { StudentStats } from '@/types';
import { useFilters } from '@/contexts/FilterContext'; // NEU: useFilters importieren

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
  
  // Props - als optional deklariert für Abwärtskompatibilität
  viewMode?: 'table' | 'dashboard';
  rawData?: any[] | null;
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
  
  // Prop für Abwärtskompatibilität
  viewMode: propViewMode = 'table',
  rawData = null
}) => {
  // NEU: Context für viewMode verwenden
  const { viewMode: contextViewMode } = useFilters();
  
  // Für sanfte Migration nutzen wir die Prop mit Priorität
  const effectiveViewMode = propViewMode !== 'table' ? propViewMode : contextViewMode;
  
  return (
    <main
      className="overflow-hidden bg-chatGray-light dark:bg-chatGray-dark min-h-screen transition-all duration-300"
      style={{
        marginLeft: 'var(--sidebar-width)',
        paddingTop: '48px', // Feste Höhe statt pt-20 für konsistente Berechnung
        paddingLeft: 'calc(var(--header-padding-left) + 0px)' // erhöhter Puffer von 8px auf 16px
      }}
    >
      <div className="p-6">
        {effectiveViewMode === 'table' ? (
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
        ) : (
          <DashboardView
            getFilteredStudents={getFilteredStudents}
            rawData={rawData}
            startDate={startDate}
            endDate={endDate}
            selectedWeeks={selectedWeeks}
            availableClasses={availableClasses}
            selectedClasses={selectedClasses}
            weeklyStats={weeklyStats}
          />
        )}
      </div>
    </main>
  );  
};

export default MainContent;