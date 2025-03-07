import React from 'react';
import { StudentStats } from '@/types';
import EnhancedDashboard from './dashboard/EnhancedDashboard';
import { formatDate } from './dashboard/utils';

interface DashboardViewProps {
  getFilteredStudents: () => [string, StudentStats][];
  rawData: any[] | null;
  startDate: string;
  endDate: string;
  selectedWeeks: string;
  availableClasses: string[];
  selectedClasses: string[];
  weeklyStats?: Record<string, any>;
  schoolYearStats?: Record<string, any>; // Added schoolYearStats prop
}

const DashboardView: React.FC<DashboardViewProps> = ({
  getFilteredStudents,
  rawData,
  startDate,
  endDate,
  selectedWeeks,
  availableClasses,
  selectedClasses,
  weeklyStats = {},
  schoolYearStats = {}, // Added with default value
}) => {
  if (!rawData) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Bitte laden Sie Anwesenheitsdaten hoch, um das Dashboard anzuzeigen.
      </div>
    );
  }
  
  return (
    <div className="space-y-2 pb-6 relative">
      {/* Sticky Header Container */}
      <div className="sticky top-0 z-10 bg-table-light-base dark:bg-table-dark-base pt-2 pb-0">
        {/* Kompakte Überschrift */}
        <h3 className="text-base font-semibold text-chatGray-textLight dark:text-chatGray-textDark mb-2">
          Dashboard für den Zeitraum {formatDate(startDate)} - {formatDate(endDate)}
        </h3>
      </div>
      
      {/* Integration der EnhancedDashboard-Komponente */}
      <div className="relative bg-table-light-base dark:bg-table-dark-base pt-4">
        <EnhancedDashboard
          getFilteredStudents={getFilteredStudents}
          rawData={rawData}
          startDate={startDate}
          endDate={endDate}
          selectedWeeks={selectedWeeks}
          availableClasses={availableClasses}
          selectedClasses={selectedClasses}
          weeklyStats={weeklyStats}
          schoolYearStats={schoolYearStats} // Pass schoolYearStats to EnhancedDashboard
        />
      </div>
    </div>
  );
};

export default DashboardView;