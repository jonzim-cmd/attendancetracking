import React, { useState, useEffect } from 'react';
import { StudentStats } from '@/types';
import { TAB_CLASSES } from './dashboard/styles';
import { formatDate } from './dashboard/utils';
import {
  prepareWeeklyTrends,
  prepareClassComparison,
  prepareAbsenceTypes,
  prepareDayOfWeekAnalysis
} from './dashboard/utils';

// Tab-Komponenten importieren
import OverviewTab from './dashboard/OverviewTab';
import ClassesTab from './dashboard/ClassesTab';
import PatternsTab from './dashboard/PatternsTab';

interface DashboardViewProps {
  getFilteredStudents: () => [string, StudentStats][];
  rawData: any[] | null;
  startDate: string;
  endDate: string;
  selectedWeeks: string;
  availableClasses: string[];
  selectedClasses: string[];
}

const DashboardView: React.FC<DashboardViewProps> = ({
  getFilteredStudents,
  rawData,
  startDate,
  endDate,
  selectedWeeks,
  availableClasses,
  selectedClasses,
}) => {
  // States für die verschiedenen Datenaufbereitungen
  const [weeklyTrends, setWeeklyTrends] = useState<any[]>([]);
  const [classComparison, setClassComparison] = useState<any[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<any[]>([]);
  const [dayOfWeekData, setDayOfWeekData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'patterns'>('overview');
  
  // Effekt zum Aufbereiten aller Daten
  useEffect(() => {
    if (!rawData || !startDate || !endDate) return;
    
    // Aufbereitung der Daten für die verschiedenen Diagramme
    setWeeklyTrends(prepareWeeklyTrends(rawData, selectedWeeks));
    setClassComparison(prepareClassComparison(rawData, startDate, endDate, selectedClasses));
    setAbsenceTypes(prepareAbsenceTypes(rawData, startDate, endDate, selectedClasses));
    setDayOfWeekData(prepareDayOfWeekAnalysis(rawData, startDate, endDate, selectedClasses));
  }, [rawData, startDate, endDate, selectedWeeks, selectedClasses]);
  
  if (!rawData) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Bitte laden Sie Anwesenheitsdaten hoch, um das Dashboard anzuzeigen.
      </div>
    );
  }
  
  return (
    <div className="space-y-2 pb-6">
      {/* Kompakte Überschrift */}
      <h3 className="text-base font-semibold text-chatGray-textLight dark:text-chatGray-textDark mb-1">
        Dashboard für den Zeitraum {formatDate(startDate)} - {formatDate(endDate)}
      </h3>
      
      {/* Tab-Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          className={activeTab === 'overview' ? TAB_CLASSES.active : TAB_CLASSES.inactive}
          onClick={() => setActiveTab('overview')}
        >
          Übersicht
        </button>
        <button
          className={activeTab === 'classes' ? TAB_CLASSES.active : TAB_CLASSES.inactive}
          onClick={() => setActiveTab('classes')}
        >
          Klassenvergleich
        </button>
        <button
          className={activeTab === 'patterns' ? TAB_CLASSES.active : TAB_CLASSES.inactive}
          onClick={() => setActiveTab('patterns')}
        >
          Muster & Trends
        </button>
      </div>
      
      {/* Optimierter Container für die Diagramme mit fester Höhe */}
      <div 
        className="relative border border-tableBorder-light dark:border-tableBorder-dark rounded-md overflow-auto bg-table-light-base dark:bg-table-dark-base p-4"
        style={{ height: 'calc(100vh - 115px)' }}
      >
        {activeTab === 'overview' && (
          <OverviewTab 
            weeklyTrends={weeklyTrends}
            absenceTypes={absenceTypes}
            dayOfWeekData={dayOfWeekData}
            getFilteredStudents={getFilteredStudents}
          />
        )}
        
        {activeTab === 'classes' && (
          <ClassesTab 
            classComparison={classComparison}
          />
        )}
        
        {activeTab === 'patterns' && (
          <PatternsTab 
            weeklyTrends={weeklyTrends}
            absenceTypes={absenceTypes}
            dayOfWeekData={dayOfWeekData}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardView;