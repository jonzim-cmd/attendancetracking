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
    <main
      className="pt-20 p-6 bg-chatGray-light dark:bg-chatGray-dark min-h-screen transition-all duration-300"
      style={{
        marginLeft: 'var(--sidebar-width)',
        paddingLeft: 'calc(var(--header-padding-left) + 8px)' // Add a small buffer
      }}
    >
      {/* Überschrift mit angepasstem Datumsbereich ohne Trennlinie */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-chatGray-textLight dark:text-chatGray-textDark">
            Anwesenheitsübersicht
          </h1>
          <div className="text-sm text-chatGray-textLight dark:text-chatGray-textDark">
            {formatDate(startDate)} - {formatDate(endDate)}
          </div>
        </div>
      </div>
      
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