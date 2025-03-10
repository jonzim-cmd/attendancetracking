import React, { memo, useRef, useEffect, useState } from 'react';
import { CARD_CLASSES } from './styles';
import { 
  AttendanceLineChart, 
  AttendanceBarChart, 
  InfoTile 
} from './ChartComponents';
import { useFilters } from '@/contexts/FilterContext';
import { shouldShowAverages } from './classAverages';
import { TimeSeriesDataPointWithAvg } from './classAverages';
import { TimeSeriesDataPointWithStudentAvg } from './studentAverages';

// Extend the TimeSeriesDataPoint to include student average data
type TimeSeriesDataPointWithAllAvg = TimeSeriesDataPointWithAvg & TimeSeriesDataPointWithStudentAvg;

interface TrendChartsProps {
  weeklyTrends: any[];
  attendanceOverTime: any[];
  dayOfWeekData: any[];
  absenceTypes: any[];
  groupingOption: 'weekly' | 'monthly';
  chartVisibility: {
    verspaetungen: boolean;
    fehlzeitenEntsch: boolean;
    fehlzeitenUnentsch: boolean;
    fehlzeitenGesamt: boolean;
    verspaetungenAvg: boolean;
    fehlzeitenAvg: boolean;
    verspaetungenStudentAvg: boolean;
    fehlzeitenStudentAvg: boolean;
  };
  setChartVisibility: React.Dispatch<React.SetStateAction<{
    verspaetungen: boolean;
    fehlzeitenEntsch: boolean;
    fehlzeitenUnentsch: boolean;
    fehlzeitenGesamt: boolean;
    verspaetungenAvg: boolean;
    fehlzeitenAvg: boolean;
    verspaetungenStudentAvg: boolean;
    fehlzeitenStudentAvg: boolean;
  }>>;
  weekdayChartVisibility: {
    verspaetungen: boolean;
    fehlzeitenEntsch: boolean;
    fehlzeitenUnentsch: boolean;
    fehlzeitenGesamt: boolean;
  };
  setWeekdayChartVisibility: React.Dispatch<React.SetStateAction<{
    verspaetungen: boolean;
    fehlzeitenEntsch: boolean;
    fehlzeitenUnentsch: boolean;
    fehlzeitenGesamt: boolean;
  }>>;
  // New props for student comparison
  selectedStudent?: string;
  showStudentAverageComparison?: boolean;
  setShowStudentAverageComparison?: (show: boolean) => void;
}

const TrendCharts: React.FC<TrendChartsProps> = memo(({
  weeklyTrends,
  attendanceOverTime,
  dayOfWeekData,
  groupingOption,
  chartVisibility,
  setChartVisibility,
  weekdayChartVisibility,
  setWeekdayChartVisibility,
  // Student comparison props
  selectedStudent,
  showStudentAverageComparison = false,
  setShowStudentAverageComparison = () => {}
}) => {
  // Zugriff auf den FilterContext
  const {
    selectedDashboardClasses,
    selectedStudents
  } = useFilters();
  
  // No longer needed as we use the chartVisibility state now
  // Removed student average visibility state
  
  // Prüfen, ob Durchschnittskurven verfügbar sein sollen
  const showAverageOptions = shouldShowAverages(selectedDashboardClasses, selectedStudents);
  
  // Prüfen, ob Schülerdurchschnittskurven verfügbar sein sollen
  const showStudentAverageOptions = selectedStudents.length === 1;
  
  // Typ-Cast: Wir wissen, dass attendanceOverTime möglicherweise Durchschnittswerte enthält
  const timeSeriesData = attendanceOverTime as TimeSeriesDataPointWithAllAvg[];
  
  // Referenz für den scrollbaren Container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Effect für initiales Scrollen zum Ende
  useEffect(() => {
    if (scrollContainerRef.current && attendanceOverTime.length > 0) {
      const container = scrollContainerRef.current;
      // Scrollen zum Ende des Containers
      setTimeout(() => {
        container.scrollLeft = container.scrollWidth - container.clientWidth;
      }, 0);
    }
  }, [attendanceOverTime]);

  // Ermittle den geeigneten Gruppierungstitel basierend auf groupingOption
  const groupingTitle = {
    'weekly': 'Wöchentliche Gruppierung',
    'monthly': 'Monatliche Gruppierung'
  }[groupingOption];
  
  // Berechne die maximalen Werte für sinnvolle Y-Achsen-Skalierung
  const maxAttendanceValue = Math.max(
    ...attendanceOverTime.map(entry => Math.max(
      entry.verspaetungen || 0, 
      entry.fehlzeiten || 0,
      entry.fehlzeitenEntsch || 0,
      entry.fehlzeitenUnentsch || 0,
      entry.entschuldigt || 0,
      entry.unentschuldigt || 0,
      // Also consider student average values
      entry.verspaetungenStudentAvg || 0,
      entry.fehlzeitenStudentAvg || 0,
      entry.fehlzeitenEntschStudentAvg || 0,
      entry.fehlzeitenUnentschStudentAvg || 0
    ))
  );
  
  // Ermittle den Tag mit den meisten Verspätungen
  const maxVerspaetungenTag = dayOfWeekData.length > 0
    ? dayOfWeekData.reduce((max, day) => 
        day.verspaetungen > max.verspaetungen ? day : max, 
        dayOfWeekData[0]
      )
    : null;
  
  // Ermittle den Tag mit den meisten Fehlzeiten (unentschuldigt)
  const maxFehlzeitenUnentschTag = dayOfWeekData.length > 0
    ? dayOfWeekData.reduce((max, day) => 
        day.fehlzeitenUnentsch > max.fehlzeitenUnentsch ? day : max, 
        dayOfWeekData[0]
      )
    : null;
  
  // Formatiere das Datum für die Anzeige - Vereinfacht für bessere Lesbarkeit
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    
    // For weekly view, just show "KW XX" without any additional text
    if (groupingOption === 'weekly' && dateStr.startsWith('KW ')) {
      return dateStr; // Just return "KW XX"
    }
    
    // For monthly view
    return dateStr; // Already formatted as "Mon YYYY"
  };

  // Toggle showing student average comparison
  const toggleStudentAverageComparison = () => {
    setShowStudentAverageComparison(!showStudentAverageComparison);
  };
  
  // Prepare visible lines for the chart based on user preferences
  const visibleLines = [];
  
  if (chartVisibility.verspaetungen) {
    visibleLines.push({ 
      dataKey: "verspaetungen", 
      name: selectedStudent ? `${selectedStudent} - Verspätungen` : "Verspätungen", 
      color: "#9333ea", // Purple
      activeDot: true 
    });
    
    // Durchschnittskurve für Verspätungen, wenn aktiviert
    if (showAverageOptions && chartVisibility.verspaetungenAvg) {
      visibleLines.push({ 
        dataKey: "verspaetungenAvg", 
        name: "⌀ Verspätungen pro Klasse", 
        color: "#9333ea", // Gleiche Farbe wie Verspätungen
        strokeDasharray: "5 5", // Gestrichelte Linie
        activeDot: false, // Keine hervorgehobenen Punkte
        strokeWidth: 2,
        opacity: 0.7 // Halbtransparent
      });
    }
    
    // Student average curve for tardiness when a student is selected and comparison is enabled
    if (showStudentAverageOptions && showStudentAverageComparison && 
        chartVisibility.verspaetungenStudentAvg && 
        timeSeriesData.some(point => point.verspaetungenStudentAvg !== undefined)) {
      visibleLines.push({ 
        dataKey: "verspaetungenStudentAvg", 
        name: "⌀ Verspätungen pro Schüler", 
        color: "#9333ea", // Same color as regular tardiness (purple)
        strokeDasharray: "3 3", // Different dash pattern from class averages
        activeDot: false, 
        strokeWidth: 2,
        opacity: 0.6 // Slightly more transparent
      });
    }
  }
  
  if (chartVisibility.fehlzeitenEntsch) {
    visibleLines.push({ 
      dataKey: "fehlzeitenEntsch", 
      name: selectedStudent ? `${selectedStudent} - Fehltage (entsch.)` : "Fehltage (entsch.)", 
      color: "#16a34a", // Green
      activeDot: true 
    });
  }
  
  if (chartVisibility.fehlzeitenUnentsch) {
    visibleLines.push({ 
      dataKey: "fehlzeitenUnentsch", 
      name: selectedStudent ? `${selectedStudent} - Fehltage (unentsch.)` : "Fehltage (unentsch.)", 
      color: "#dc2626", // Red
      activeDot: true
    });
  }
  
  if (chartVisibility.fehlzeitenGesamt) {
    visibleLines.push({ 
      dataKey: "fehlzeiten", 
      name: selectedStudent ? `${selectedStudent} - Fehltage (gesamt)` : "Fehltage (gesamt)", 
      color: "#3b82f6", // Blue
      activeDot: true 
    });
    
    // Durchschnittskurve für Fehltage, wenn aktiviert
    if (showAverageOptions && chartVisibility.fehlzeitenAvg) {
      visibleLines.push({ 
        dataKey: "fehlzeitenAvg", 
        name: "⌀ Fehltage pro Klasse", 
        color: "#3b82f6", // Gleiche Farbe wie Fehltage
        strokeDasharray: "5 5", // Gestrichelte Linie
        activeDot: false, // Keine hervorgehobenen Punkte
        strokeWidth: 2,
        opacity: 0.5 // Halbtransparent
      });
    }
    
    // Student average curve for absences when a student is selected and comparison is enabled
    if (showStudentAverageOptions && showStudentAverageComparison && 
        chartVisibility.fehlzeitenStudentAvg && 
        timeSeriesData.some(point => point.fehlzeitenStudentAvg !== undefined)) {
      visibleLines.push({ 
        dataKey: "fehlzeitenStudentAvg", 
        name: "⌀ Fehltage pro Schüler", 
        color: "#3b82f6", // Same color as regular absences (blue)
        strokeDasharray: "3 3", // Different dash pattern from class averages
        activeDot: false, 
        strokeWidth: 2,
        opacity: 0.6 // Slightly more transparent
      });
    }
  }
  
  // Prepare bars for weekday analysis
  const dayOfWeekBars = [];
  
  if (weekdayChartVisibility.verspaetungen) {
    dayOfWeekBars.push({ 
      dataKey: "verspaetungen", 
      name: "Verspätungen", 
      color: "#9333ea" // Purple
    });
  }
  
  if (weekdayChartVisibility.fehlzeitenEntsch) {
    dayOfWeekBars.push({ 
      dataKey: "fehlzeitenEntsch", 
      name: "Fehltage (entsch.)", 
      color: "#16a34a" // Green
    });
  }
  
  if (weekdayChartVisibility.fehlzeitenUnentsch) {
    dayOfWeekBars.push({ 
      dataKey: "fehlzeitenUnentsch", 
      name: "Fehltage (unentsch.)", 
      color: "#dc2626" // Red
    });
  }
  
  if (weekdayChartVisibility.fehlzeitenGesamt) {
    dayOfWeekBars.push({ 
      dataKey: "fehlzeitenGesamt", 
      name: "Fehltage (gesamt)", 
      color: "#3b82f6" // Blue
    });
  }

  // Custom tooltip for attendance chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Find the corresponding data entry to get the date range
    const dataEntry = timeSeriesData.find(entry => entry.name === label);
    const dateRange = dataEntry?.dateRange || '';
    
    // Group entries to display normal values, class averages, and student averages
    const normalEntries: any[] = [];
    const classAvgEntries: any[] = [];
    const studentAvgEntries: any[] = [];
    
    // Sort entries into appropriate groups
    payload.forEach((entry: any) => {
      if (entry.dataKey.includes('StudentAvg')) {
        studentAvgEntries.push(entry);
      } else if (entry.dataKey.includes('Avg')) {
        classAvgEntries.push(entry);
      } else {
        normalEntries.push(entry);
      }
    });
    
    return (
      <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
        <p className="text-gray-700 dark:text-gray-300 font-medium mb-1 text-base">{formatDate(label)}</p>
        {dateRange && (
          <p className="text-gray-600 dark:text-gray-400 text-base mb-1">{dateRange}</p>
        )}
        
        {/* Student name if available */}
        {dataEntry?.studentName && (
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">
            Schüler: {dataEntry.studentName}
          </p>
        )}
        
        {/* Class metadata if available */}
        {classAvgEntries.length > 0 && dataEntry?.totalClassCount && (
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
            Durchschnitte basierend auf {dataEntry.totalClassCount} Klassen
          </p>
        )}
        
        {/* Student average metadata if available */}
        {studentAvgEntries.length > 0 && dataEntry?.totalStudentCount && (
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
            Durchschnitte basierend auf {dataEntry.totalStudentCount} Schülern
          </p>
        )}
        
        {/* Student data */}
        <div className="flex flex-col space-y-1">
          {normalEntries.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center">
              <div className="w-3 h-3 mr-2" style={{ backgroundColor: entry.color }}></div>
              <span className="text-gray-700 dark:text-gray-300 text-base">
                {entry.name}: {entry.value}
              </span>
            </div>
          ))}
          
          {/* Class averages if available */}
          {classAvgEntries.length > 0 && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
              {classAvgEntries.map((entry: any, index: number) => (
                <div key={`class-avg-${index}`} className="flex items-center">
                  <div className="w-3 h-3 mr-2" style={{ 
                    backgroundColor: entry.color,
                    opacity: 0.7,
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.4) 2px, rgba(255,255,255,0.4) 4px)'
                  }}></div>
                  <span className="text-gray-700 dark:text-gray-300 text-base">
                    {entry.name}: {entry.value.toFixed(1)}
                  </span>
                </div>
              ))}
            </>
          )}
          
          {/* Student averages if available */}
          {studentAvgEntries.length > 0 && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
              {studentAvgEntries.map((entry: any, index: number) => (
                <div key={`student-avg-${index}`} className="flex items-center">
                  <div className="w-3 h-3 mr-2" style={{ 
                    backgroundColor: entry.color,
                    opacity: 0.8,
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.4) 2px, rgba(255,255,255,0.4) 4px)'
                  }}></div>
                  <span className="text-gray-700 dark:text-gray-300 text-base">
                    {entry.name}: {entry.value.toFixed(1)}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }
  
  return null;
};
  
  return (
    <>
      {/* Zeitlicher Trend - Full width chart */}
      <div className={CARD_CLASSES}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Zeitlicher Verlauf
            <span className="text-base font-normal ml-2 text-gray-500 dark:text-gray-400">
              ({groupingTitle})
            </span>
          </h3>
          <div className="flex flex-wrap space-x-2 text-base">
            <label className="inline-flex items-center cursor-pointer" title="Verspätungen im Trend anzeigen">
              <input 
                type="checkbox" 
                checked={chartVisibility.verspaetungen} 
                onChange={() => setChartVisibility(prev => ({...prev, verspaetungen: !prev.verspaetungen}))}
                className="mr-1 w-4 h-4"
              />
              <span className="text-purple-600 dark:text-purple-400">Versp.</span>
            </label>
            <label className="inline-flex items-center cursor-pointer" title="Entschuldigte Fehltage im Trend anzeigen">
              <input 
                type="checkbox" 
                checked={chartVisibility.fehlzeitenEntsch} 
                onChange={() => setChartVisibility(prev => ({...prev, fehlzeitenEntsch: !prev.fehlzeitenEntsch}))}
                className="mr-1 w-4 h-4"
              />
              <span className="text-green-600 dark:text-green-400">F (entsch.)</span>
            </label>
            <label className="inline-flex items-center cursor-pointer" title="Unentschuldigte Fehltage im Trend anzeigen">
              <input 
                type="checkbox" 
                checked={chartVisibility.fehlzeitenUnentsch} 
                onChange={() => setChartVisibility(prev => ({...prev, fehlzeitenUnentsch: !prev.fehlzeitenUnentsch}))}
                className="mr-1 w-4 h-4"
              />
              <span className="text-red-600 dark:text-red-400">F (unentsch.)</span>
            </label>
            <label className="inline-flex items-center cursor-pointer" title="Gesamte Fehltage im Trend anzeigen">
              <input 
                type="checkbox" 
                checked={chartVisibility.fehlzeitenGesamt} 
                onChange={() => setChartVisibility(prev => ({...prev, fehlzeitenGesamt: !prev.fehlzeitenGesamt}))}
                className="mr-1 w-4 h-4"
              />
              <span className="text-blue-600 dark:text-blue-400">F (gesamt)</span>
            </label>
            
            {/* Checkboxen für Durchschnittskurven - nur anzeigen, wenn relevant */}
            {showAverageOptions && (
              <>
                {chartVisibility.verspaetungen && (
                  <label className="inline-flex items-center cursor-pointer ml-2" title="Durchschnittliche Verspätungen pro Klasse">
                    <input 
                      type="checkbox" 
                      checked={chartVisibility.verspaetungenAvg}
                      onChange={() => setChartVisibility(prev => ({...prev, verspaetungenAvg: !prev.verspaetungenAvg}))}
                      className="mr-1 w-4 h-4"
                    />
                    <span className="text-purple-600 dark:text-purple-400 text-opacity-70 dark:text-opacity-70">⌀ Versp.</span>
                  </label>
                )}
                
                {chartVisibility.fehlzeitenGesamt && (
                  <label className="inline-flex items-center cursor-pointer" title="Durchschnittliche Fehltage pro Klasse">
                    <input 
                      type="checkbox" 
                      checked={chartVisibility.fehlzeitenAvg}
                      onChange={() => setChartVisibility(prev => ({...prev, fehlzeitenAvg: !prev.fehlzeitenAvg}))}
                      className="mr-1 w-4 h-4"
                    />
                    <span className="text-blue-600 dark:text-blue-400 text-opacity-70 dark:text-opacity-70">⌀ F (ges.)</span>
                  </label>
                )}
              </>
            )}
            
            {/* Student average checkboxes - similar to class averages */}
            {showStudentAverageOptions && (
              <>
                <div className="border-l border-gray-300 dark:border-gray-600 pl-4 ml-4"></div>
                {chartVisibility.verspaetungen && (
                  <label className="inline-flex items-center cursor-pointer ml-2" title="Durchschnittliche Verspätungen pro Schüler">
                    <input 
                      type="checkbox" 
                      checked={showStudentAverageComparison && chartVisibility.verspaetungenStudentAvg}
                      onChange={() => {
                        if (!showStudentAverageComparison) {
                          setShowStudentAverageComparison(true);
                        }
                        setChartVisibility(prev => ({...prev, verspaetungenStudentAvg: !prev.verspaetungenStudentAvg}))
                      }}
                      className="mr-1 w-4 h-4"
                    />
                    <span className="text-purple-600 dark:text-purple-400 text-opacity-70 dark:text-opacity-70">⌀ Schüler (V)</span>
                  </label>
                )}
                
                {chartVisibility.fehlzeitenGesamt && (
                  <label className="inline-flex items-center cursor-pointer" title="Durchschnittliche Fehltage pro Schüler">
                    <input 
                      type="checkbox" 
                      checked={showStudentAverageComparison && chartVisibility.fehlzeitenStudentAvg}
                      onChange={() => {
                        if (!showStudentAverageComparison) {
                          setShowStudentAverageComparison(true);
                        }
                        setChartVisibility(prev => ({...prev, fehlzeitenStudentAvg: !prev.fehlzeitenStudentAvg}))
                      }}
                      className="mr-1 w-4 h-4"
                    />
                    <span className="text-blue-600 dark:text-blue-400 text-opacity-70 dark:text-opacity-70">⌀ Schüler (F)</span>
                  </label>
                )}
              </>
            )}
          </div>
        </div>
        <div className="overflow-x-auto" ref={scrollContainerRef}>
          <div style={{ 
            width: attendanceOverTime.length > 8 ? `${Math.max(attendanceOverTime.length * 80, 800)}px` : '100%', 
            minWidth: '100%',
            height: '300px' 
          }}>
            <AttendanceLineChart 
              data={attendanceOverTime}
              lines={visibleLines}
              formatXAxis={formatDate}
              yAxisMax={maxAttendanceValue > 0 ? undefined : 10}
              customTooltip={CustomTooltip}
            />
          </div>
        </div>
        {attendanceOverTime.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-4 text-base">
            Keine Daten für den ausgewählten Zeitraum verfügbar.
          </div>
        )}
      </div>
      
      {/* Wochentagsanalyse - Jetzt auch full width */}
      <div className={CARD_CLASSES}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Wochentagsanalyse
            <span className="text-sm font-normal ml-2 text-gray-500 dark:text-gray-400">
              (Max. erfasste Fehlzeiten nach Wochentag - unabhängig von Zeitraumsauswahl)
            </span>
          </h3>
          <div className="flex flex-wrap space-x-2 text-base">
            <label className="inline-flex items-center cursor-pointer" title="Verspätungen nach Wochentag anzeigen">
              <input 
                type="checkbox" 
                checked={weekdayChartVisibility.verspaetungen} 
                onChange={() => setWeekdayChartVisibility(prev => ({...prev, verspaetungen: !prev.verspaetungen}))}
                className="mr-1 w-4 h-4"
              />
              <span className="text-purple-600 dark:text-purple-400">Versp.</span>
            </label>
            <label className="inline-flex items-center cursor-pointer" title="Entschuldigte Fehltage nach Wochentag anzeigen">
              <input 
                type="checkbox" 
                checked={weekdayChartVisibility.fehlzeitenEntsch} 
                onChange={() => setWeekdayChartVisibility(prev => ({...prev, fehlzeitenEntsch: !prev.fehlzeitenEntsch}))}
                className="mr-1 w-4 h-4"
              />
              <span className="text-green-600 dark:text-green-400">F (entsch.)</span>
            </label>
            <label className="inline-flex items-center cursor-pointer" title="Unentschuldigte Fehltage nach Wochentag anzeigen">
              <input 
                type="checkbox" 
                checked={weekdayChartVisibility.fehlzeitenUnentsch} 
                onChange={() => setWeekdayChartVisibility(prev => ({...prev, fehlzeitenUnentsch: !prev.fehlzeitenUnentsch}))}
                className="mr-1 w-4 h-4"
              />
              <span className="text-red-600 dark:text-red-400">F (unentsch.)</span>
            </label>
            <label className="inline-flex items-center cursor-pointer" title="Gesamte Fehltage nach Wochentag anzeigen">
              <input 
                type="checkbox" 
                checked={weekdayChartVisibility.fehlzeitenGesamt} 
                onChange={() => setWeekdayChartVisibility(prev => ({...prev, fehlzeitenGesamt: !prev.fehlzeitenGesamt}))}
                className="mr-1 w-4 h-4"
              />
              <span className="text-blue-600 dark:text-blue-400">F (gesamt)</span>
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div style={{ 
            width: '100%',
            height: '300px' 
          }}>
            <AttendanceBarChart 
              data={dayOfWeekData}
              bars={dayOfWeekBars}
              criticalDays={{
                verspaetungen: maxVerspaetungenTag?.name,
                fehlzeitenUnentsch: maxFehlzeitenUnentschTag?.name,
                fehlzeitenGesamt: dayOfWeekData.reduce((max, day) => 
                  day.fehlzeitenGesamt > max.fehlzeitenGesamt ? day : max, 
                  dayOfWeekData[0])?.name
              }}
            />
          </div>
        </div>
        {dayOfWeekData.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {maxVerspaetungenTag && (
              <InfoTile 
                title="Kritischer Tag (Verspätungen)" 
                value={`${maxVerspaetungenTag.name} (${maxVerspaetungenTag.verspaetungen})`}
                className="bg-transparent dark:bg-transparent border border-gray-200 dark:border-gray-600"
                valueClassName="text-purple-600 dark:text-purple-400 text-base"
              />
            )}
            {maxFehlzeitenUnentschTag && (
              <InfoTile 
                title="Kritischer Tag (unentsch. Fehltage)" 
                value={`${maxFehlzeitenUnentschTag.name} (${maxFehlzeitenUnentschTag.fehlzeitenUnentsch})`}
                className="bg-transparent dark:bg-transparent border border-gray-200 dark:border-gray-600"
                valueClassName="text-red-600 dark:text-red-400 text-base"
              />
            )}
            {dayOfWeekData.length > 0 && (
              <InfoTile 
                title="Kritischer Tag (Fehltage gesamt)" 
                value={`${dayOfWeekData.reduce((max, day) => 
                  day.fehlzeitenGesamt > max.fehlzeitenGesamt ? day : max, 
                  dayOfWeekData[0]).name} (${dayOfWeekData.reduce((max, day) => 
                    day.fehlzeitenGesamt > max.fehlzeitenGesamt ? day : max, 
                    dayOfWeekData[0]).fehlzeitenGesamt})`}
                className="bg-transparent dark:bg-transparent border border-gray-200 dark:border-gray-600"
                valueClassName="text-blue-600 dark:text-blue-400 text-base"
              />
            )}
          </div>
        )}
      </div>
    </>
  );
});

export default TrendCharts;