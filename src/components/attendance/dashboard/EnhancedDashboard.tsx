import React, { useState, useEffect, useCallback } from 'react';
import FilterPanel from './FilterPanel';
import StatCards from './StatCards';
import TrendCharts from './TrendCharts';
import ComparisonView from './ComparisonView';
import StudentRanking from './StudentRanking';
import AdvancedStats from './AdvancedStats';
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
  selectedClasses: propSelectedClasses,
}) => {
  // Internal state for selected classes and students
  const [selectedClasses, setSelectedClasses] = useState<string[]>(propSelectedClasses);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // States for various data preparations
  const [weeklyTrends, setWeeklyTrends] = useState<any[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<any[]>([]);
  const [dayOfWeekData, setDayOfWeekData] = useState<any[]>([]);
  const [attendanceOverTime, setAttendanceOverTime] = useState<any[]>([]);
  const [entschuldigungsverhalten, setEntschuldigungsverhalten] = useState<any[]>([]);
  const [criticalStudents, setCriticalStudents] = useState<{name: string, verspaetungen: number, fehlzeiten: number}[]>([]);
  
  // Additional state for filter students
  const [filteredStudentStats, setFilteredStudentStats] = useState<[string, StudentStats][]>([]);
  
  // Modal states
  const [showCriticalStudentsModal, setShowCriticalStudentsModal] = useState(false);
  const [showCriticalDaysModal, setShowCriticalDaysModal] = useState(false);
  const [showCriticalPatternsModal, setShowCriticalPatternsModal] = useState(false);
  
  // Chart settings
  const [groupingOption, setGroupingOption] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [viewMode, setViewMode] = useState<'dashboard' | 'comparison'>('dashboard');
  
  // Chart visibility options
  const [trendChartVisibility, setTrendChartVisibility] = useState({
    verspaetungen: true,
    fehlzeitenEntsch: true,
    fehlzeitenUnentsch: true,
    fehlzeitenGesamt: true
  });
  
  const [weekdayChartVisibility, setWeekdayChartVisibility] = useState({
    verspaetungen: true,
    fehlzeitenEntsch: true,
    fehlzeitenUnentsch: true,
    fehlzeitenGesamt: true
  });
  
  // Custom getter for filtered students based on our internal filters
  const getFilteredStudentsWithFilters = useCallback((): [string, StudentStats][] => {
    const allStudents = getFilteredStudents();
    
    // Filter by selected classes if any
    let result = allStudents;
    if (selectedClasses.length > 0) {
      result = result.filter(([_, stats]) => 
        selectedClasses.includes(stats.klasse)
      );
    }
    
    // Filter by selected students if any
    if (selectedStudents.length > 0) {
      result = result.filter(([student]) => 
        selectedStudents.includes(student)
      );
    }
    
    return result;
  }, [getFilteredStudents, selectedClasses, selectedStudents]);
  
  // Effect to prepare filtered students list based on current filters
  useEffect(() => {
    setFilteredStudentStats(getFilteredStudentsWithFilters());
  }, [getFilteredStudentsWithFilters]);
  
  // Effect to update selected classes when props change
  useEffect(() => {
    setSelectedClasses(propSelectedClasses);
  }, [propSelectedClasses]);
  
  // Calculate critical students
  const calculateCriticalStudents = useCallback(() => {
    if (!rawData) return [];
    
    const students = getFilteredStudentsWithFilters();
    return students
      .filter(([_, stats]) => stats.verspaetungen_unentsch >= 3 || stats.fehlzeiten_unentsch >= 3)
      .map(([name, stats]) => ({
        name,
        verspaetungen: stats.verspaetungen_unentsch,
        fehlzeiten: stats.fehlzeiten_unentsch
      }));
  }, [getFilteredStudentsWithFilters, rawData]);
  
  // Effect to prepare all data when filters change
  useEffect(() => {
    if (!rawData || !startDate || !endDate) return;
    
    // Calculate critical students
    setCriticalStudents(calculateCriticalStudents());
    
    // Data preparation for charts with filtered data
    setWeeklyTrends(prepareWeeklyTrends(
      rawData, 
      selectedWeeks, 
      selectedClasses, 
      selectedStudents
    ));
    
    setAbsenceTypes(prepareAbsenceTypes(
      rawData, 
      startDate, 
      endDate, 
      selectedClasses, 
      selectedStudents
    ));
    
    setDayOfWeekData(prepareDayOfWeekAnalysis(
      rawData, 
      startDate, 
      endDate, 
      selectedClasses, 
      selectedStudents
    ));
    
    setAttendanceOverTime(prepareAttendanceOverTime(
      rawData, 
      startDate, 
      endDate, 
      groupingOption, 
      selectedClasses,
      selectedStudents
    ));
    
    setEntschuldigungsverhalten(prepareEntschuldigungsverhalten(
      rawData, 
      startDate, 
      endDate, 
      selectedClasses,
      selectedStudents,
      groupingOption
    ));
  }, [
    rawData, 
    startDate, 
    endDate, 
    selectedWeeks, 
    selectedClasses, 
    selectedStudents,
    groupingOption,
    calculateCriticalStudents
  ]);
  
  // Handler to update classes
  const handleClassesChange = (classes: string[]) => {
    setSelectedClasses(classes);
    // Reset student selection when classes change
    setSelectedStudents([]);
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
      <FilterPanel 
        availableClasses={availableClasses}
        selectedClasses={selectedClasses}
        onClassesChange={handleClassesChange}
        getFilteredStudents={getFilteredStudents}
        selectedStudents={selectedStudents}
        onStudentsChange={setSelectedStudents}
        groupingOption={groupingOption}
        onGroupingChange={setGroupingOption}
      />
      
      {viewMode === 'dashboard' ? (
        <>
          {/* Stat Cards */}
          <StatCards 
            absenceTypes={absenceTypes}
            dayOfWeekData={dayOfWeekData}
            weeklyTrends={weeklyTrends}
            getFilteredStudents={getFilteredStudentsWithFilters}
            criticalStudents={criticalStudents}
            onShowCriticalStudents={() => setShowCriticalStudentsModal(true)}
            onShowCriticalDays={() => setShowCriticalDaysModal(true)}
            onShowCriticalPatterns={() => setShowCriticalPatternsModal(true)}
          />
          
          {/* Trend Charts */}
          <TrendCharts 
            weeklyTrends={weeklyTrends}
            attendanceOverTime={attendanceOverTime}
            dayOfWeekData={dayOfWeekData}
            absenceTypes={absenceTypes}
            groupingOption={groupingOption}
            chartVisibility={trendChartVisibility}
            setChartVisibility={setTrendChartVisibility}
            weekdayChartVisibility={weekdayChartVisibility}
            setWeekdayChartVisibility={setWeekdayChartVisibility}
          />
          
          {/* Advanced Stats with Excuse Behavior Analysis */}
          <AdvancedStats 
            entschuldigungsverhalten={entschuldigungsverhalten}
            dayOfWeekData={dayOfWeekData}
            absenceTypes={absenceTypes}
          />
          
          {/* Student Ranking Tile */}
          <StudentRanking
            filteredStudents={filteredStudentStats}
            selectedClasses={selectedClasses}
            selectedStudents={selectedStudents}
          />
        </>
      ) : (
        <ComparisonView 
          comparisonData={prepareStudentComparisonData(
            rawData, 
            startDate, 
            endDate, 
            selectedStudents.length > 0 ? selectedStudents : selectedClasses,
            selectedStudents.length > 0 ? 'students' : 'classes'
          )}
          selectedEntities={selectedStudents.length > 0 ? selectedStudents : selectedClasses}
          entityType={selectedStudents.length > 0 ? 'students' : 'classes'}
          onReturnToDashboard={() => setViewMode('dashboard')}
          startDate={startDate}
          endDate={endDate}
        />
      )}
      
      {/* Modal for Critical Students */}
      {showCriticalStudentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCriticalStudentsModal(false)}>
          <div 
            className="bg-table-light-base dark:bg-table-dark-base rounded-lg p-6 max-w-2xl w-full"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: 'calc(100vh - 100px)', overflow: 'auto' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Kritische Schüler ({criticalStudents.length})
              </h3>
              <button
                onClick={() => setShowCriticalStudentsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Schüler mit ≥ 3 unentschuldigten Verspätungen oder Fehltagen im gewählten Zeitraum
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-table-light-header dark:bg-table-dark-header">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Unentsch. Verspätungen
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Unentsch. Fehltage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-table-light-base dark:bg-table-dark-base divide-y divide-gray-200 dark:divide-gray-700">
                  {criticalStudents.map((student, index) => (
                    <tr key={student.name} className={index % 2 === 0 ? 'bg-table-light-base dark:bg-table-dark-base' : 'bg-table-light-alternate dark:bg-table-dark-alternate'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-300">
                        <span className={student.verspaetungen >= 3 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                          {student.verspaetungen}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-300">
                        <span className={student.fehlzeiten >= 3 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                          {student.fehlzeiten}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {criticalStudents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Keine kritischen Schüler im gewählten Zeitraum
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for Critical Days */}
      {showCriticalDaysModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCriticalDaysModal(false)}>
          <div 
            className="bg-table-light-base dark:bg-table-dark-base rounded-lg p-6 max-w-2xl w-full"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: 'calc(100vh - 100px)', overflow: 'auto' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Kritische Wochentage (Mo-Fr)
              </h3>
              <button
                onClick={() => setShowCriticalDaysModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Tage mit den meisten Verspätungen und Fehltagen im gewählten Zeitraum
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-table-light-header dark:bg-table-dark-header">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Wochentag
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Verspätungen
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fehltage (Entsch.)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fehltage (Unentsch.)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fehltage (Gesamt)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-table-light-base dark:bg-table-dark-base divide-y divide-gray-200 dark:divide-gray-700">
                  {dayOfWeekData
                    .sort((a, b) => (b.verspaetungen + b.fehlzeitenGesamt) - (a.verspaetungen + a.fehlzeitenGesamt))
                    .map((day, index) => (
                      <tr key={day.name} className={index % 2 === 0 ? 'bg-table-light-base dark:bg-table-dark-base' : 'bg-table-light-alternate dark:bg-table-dark-alternate'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {day.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-purple-600 dark:text-purple-400">
                          {day.verspaetungen}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600 dark:text-green-400">
                          {day.fehlzeitenEntsch}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600 dark:text-red-400">
                          {day.fehlzeitenUnentsch}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 dark:text-blue-400">
                          {day.fehlzeitenGesamt}
                        </td>
                      </tr>
                    ))}
                  {dayOfWeekData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Keine Daten für Wochentage verfügbar
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for Critical Patterns */}
      {showCriticalPatternsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCriticalPatternsModal(false)}>
          <div 
            className="bg-table-light-base dark:bg-table-dark-base rounded-lg p-6 max-w-2xl w-full"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: 'calc(100vh - 100px)', overflow: 'auto' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Kritische Muster in den Absenzen
              </h3>
              <button
                onClick={() => setShowCriticalPatternsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Auffällige Muster bei Verspätungen und Fehltagen im gewählten Zeitraum
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                <h4 className="text-gray-800 dark:text-gray-100 font-medium mb-2">Wochentagsverteilung</h4>
                <ul className="space-y-1 text-sm">
                  {dayOfWeekData
                    .sort((a, b) => b.verspaetungen - a.verspaetungen)
                    .slice(0, 3)
                    .map(day => (
                      <li key={`v-${day.name}`} className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">{day.name}</span>
                        <span className="text-purple-600 dark:text-purple-400">{day.verspaetungen} Verspätungen</span>
                      </li>
                    ))}
                  
                  {dayOfWeekData
                    .sort((a, b) => b.fehlzeitenUnentsch - a.fehlzeitenUnentsch)
                    .slice(0, 3)
                    .map(day => (
                      <li key={`f-${day.name}`} className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">{day.name}</span>
                        <span className="text-red-600 dark:text-red-400">{day.fehlzeitenUnentsch} unent. Fehltage</span>
                      </li>
                    ))}
                </ul>
              </div>
              
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                <h4 className="text-gray-800 dark:text-gray-100 font-medium mb-2">Entschuldigungsquote</h4>
                <div className="space-y-2">
                  {absenceTypes.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Entschuldigt</span>
                        <span className="text-green-600 dark:text-green-400">
                          {absenceTypes.find(t => t.name === 'Entschuldigt')?.value || 0} Einträge
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Unentschuldigt</span>
                        <span className="text-red-600 dark:text-red-400">
                          {absenceTypes.find(t => t.name === 'Unentschuldigt')?.value || 0} Einträge
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Offen</span>
                        <span className="text-yellow-600 dark:text-yellow-400">
                          {absenceTypes.find(t => t.name === 'Offen')?.value || 0} Einträge
                        </span>
                      </div>
                      
                      <div className="h-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full mt-2">
                        {absenceTypes.map((type, index) => {
                          const total = absenceTypes.reduce((sum, t) => sum + t.value, 0);
                          const percent = total > 0 ? (type.value / total) * 100 : 0;
                          
                          return (
                            <div
                              key={type.name}
                              className="h-full rounded-full"
                              style={{ 
                                width: `${percent}%`, 
                                backgroundColor: type.color,
                                display: 'inline-block',
                                marginLeft: index === 0 ? 0 : undefined
                              }}
                            />
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
              <h4 className="text-gray-800 dark:text-gray-100 font-medium mb-2">Trend-Analyse</h4>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-300">
                  {weeklyTrends.length > 0 ? (
                    `Über den Zeitraum wurden durchschnittlich ${
                      Math.round(weeklyTrends.reduce((sum, week) => sum + week.verspaetungen, 0) / weeklyTrends.length * 10) / 10
                    } Verspätungen und ${
                      Math.round(weeklyTrends.reduce((sum, week) => sum + week.fehlzeitenTotal, 0) / weeklyTrends.length * 10) / 10
                    } Fehltage pro Woche verzeichnet.`
                  ) : (
                    'Keine ausreichenden Daten für eine Trend-Analyse vorhanden.'
                  )}
                </p>
                
                {weeklyTrends.length > 2 && (
                  <p className="text-gray-600 dark:text-gray-300">
                    Trend: {
                      weeklyTrends[weeklyTrends.length - 1].verspaetungen > weeklyTrends[0].verspaetungen
                        ? 'Anstieg der Verspätungen über den Zeitraum.'
                        : 'Rückgang der Verspätungen über den Zeitraum.'
                    } {
                      weeklyTrends[weeklyTrends.length - 1].fehlzeitenTotal > weeklyTrends[0].fehlzeitenTotal
                        ? 'Anstieg der Fehltage über den Zeitraum.'
                        : 'Rückgang der Fehltage über den Zeitraum.'
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDashboard;