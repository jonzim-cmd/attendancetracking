import React, { useState, useEffect } from 'react';
import FilterPanel from './FilterPanel';
import StatCards from './StatCards';
import TrendCharts from './TrendCharts';
import ComparisonView from './ComparisonView';
import AdvancedStats from './AdvancedStats';
import { 
  CARD_CLASSES, 
  DASHBOARD_CONTAINER_CLASSES 
} from './styles';
import { 
  prepareWeeklyTrends, 
  prepareAbsenceTypes, 
  prepareDayOfWeekAnalysis,
  prepareStudentComparisonData,
  prepareAttendanceOverTime,
  prepareEntschuldigungsverhalten
} from './utils';
import { StudentStats } from '@/types';

interface EnhancedDashboardProps {
  getFilteredStudents: () => [string, StudentStats][];
  rawData: any[] | null;
  startDate: string;
  endDate: string;
  selectedWeeks: string;
  availableClasses: string[];
  selectedClasses: string[];
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
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
  const [absenceTypes, setAbsenceTypes] = useState<any[]>([]);
  const [dayOfWeekData, setDayOfWeekData] = useState<any[]>([]);
  const [attendanceOverTime, setAttendanceOverTime] = useState<any[]>([]);
  const [entschuldigungsverhalten, setEntschuldigungsverhalten] = useState<any[]>([]);
  
  // Filter-States
  const [selectedFilter, setSelectedFilter] = useState<'classes' | 'students'>('classes');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [groupingOption, setGroupingOption] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [viewMode, setViewMode] = useState<'dashboard' | 'comparison'>('dashboard');
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  
  // Effekt zum Aufbereiten aller Daten
  useEffect(() => {
    if (!rawData || !startDate || !endDate) return;
    
    // Aufbereitung der Daten für die verschiedenen Diagramme
    setWeeklyTrends(prepareWeeklyTrends(rawData, selectedWeeks));
    setAbsenceTypes(prepareAbsenceTypes(rawData, startDate, endDate, selectedClasses));
    setDayOfWeekData(prepareDayOfWeekAnalysis(rawData, startDate, endDate, selectedClasses));
    
    // Neue Datenaufbereitungen
    setAttendanceOverTime(prepareAttendanceOverTime(rawData, startDate, endDate, groupingOption, selectedClasses));
    setEntschuldigungsverhalten(prepareEntschuldigungsverhalten(rawData, startDate, endDate, selectedClasses));
    
    // Wenn Entitäten ausgewählt sind, bereite Vergleichsdaten vor
    if (selectedEntities.length > 0) {
      setComparisonData(
        prepareStudentComparisonData(
          rawData, 
          startDate, 
          endDate, 
          selectedEntities, 
          selectedFilter
        )
      );
    }
  }, [
    rawData, 
    startDate, 
    endDate, 
    selectedWeeks, 
    selectedClasses, 
    selectedEntities, 
    selectedFilter,
    groupingOption
  ]);
  
  const handleEntitySelection = (entities: string[]) => {
    setSelectedEntities(entities);
    if (entities.length >= 2) {
      setViewMode('comparison');
    } else {
      setViewMode('dashboard');
    }
  };
  
  const handleReturnToDashboard = () => {
    setViewMode('dashboard');
    setSelectedEntities([]);
  };
  
  if (!rawData) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Bitte laden Sie Anwesenheitsdaten hoch, um das Dashboard anzuzeigen.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <div className={CARD_CLASSES}>
        <FilterPanel 
          availableClasses={availableClasses}
          selectedClasses={selectedClasses}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          selectedEntities={selectedEntities}
          onEntitySelect={handleEntitySelection}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          groupingOption={groupingOption}
          onGroupingChange={setGroupingOption}
          getFilteredStudents={getFilteredStudents}
        />
      </div>
      
      {viewMode === 'dashboard' ? (
        <>
          {/* Stat Cards */}
          <StatCards 
            absenceTypes={absenceTypes}
            dayOfWeekData={dayOfWeekData}
            weeklyTrends={weeklyTrends}
            getFilteredStudents={getFilteredStudents}
          />
          
          {/* Trend Charts Container */}
          <div className={DASHBOARD_CONTAINER_CLASSES}>
            <TrendCharts 
              weeklyTrends={weeklyTrends}
              attendanceOverTime={attendanceOverTime}
              dayOfWeekData={dayOfWeekData}
              absenceTypes={absenceTypes}
              timeRange={timeRange}
              groupingOption={groupingOption}
            />
            
            {/* Advanced Stats Container */}
            <AdvancedStats 
              entschuldigungsverhalten={entschuldigungsverhalten}
              dayOfWeekData={dayOfWeekData}
              absenceTypes={absenceTypes}
            />
          </div>
        </>
      ) : (
        <ComparisonView 
          comparisonData={comparisonData}
          selectedEntities={selectedEntities}
          entityType={selectedFilter}
          onReturnToDashboard={handleReturnToDashboard}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
};

export default EnhancedDashboard;