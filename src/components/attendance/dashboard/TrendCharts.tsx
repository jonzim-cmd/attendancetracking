// src/components/attendance/dashboard/TrendCharts.tsx
import React, { memo, useRef, useEffect, useState } from 'react';
import { 
  CARD_CLASSES, 
  CHART_CONTENT_HEIGHT, 
  CHART_SCROLL_CONTAINER_CLASSES 
} from './styles';
import { 
  AttendanceLineChart, 
  AttendanceBarChart, 
  InfoTile 
} from './ChartComponents';
import { useFilters } from '@/contexts/FilterContext';
import { shouldShowAverages } from './classAverages';
import { TimeSeriesDataPointWithAvg } from './classAverages';
import { TimeSeriesDataPointWithStudentAvg } from './studentAverages';
import AnalyticsSection from './AnalyticsSection';
import InfoButton from '@/components/ui/InfoButton';
import { CHART_EXPLANATIONS } from './chartExplanations';
import { getChartWidth} from './chartUtils';

// Extend the TimeSeriesDataPoint to include student average data
type TimeSeriesDataPointWithAllAvg = TimeSeriesDataPointWithAvg & TimeSeriesDataPointWithStudentAvg;

interface TrendChartsProps {
  weeklyTrends: any[];
  attendanceOverTime: any[];
  dayOfWeekData: any[];
  absenceTypes: any[];
  groupingOption: 'weekly' | 'monthly';
  chartMode?: 'all' | 'timeSeries' | 'weekday'; // Neue Prop für selektives Rendering
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
  // Neue Prop für Klassenvergleichsfunktion
  classAverageAvailability?: { 
    isAvailable: boolean, 
    tooltip: string, 
    classCount: number 
  };
  // Daten für statistische Analysen
  schoolYearDetailedData?: Record<string, any>;
  weeklyDetailedData?: Record<string, any>;
  allStudentStats?: Record<string, any>;
  // Neue Props für Single-Class-Erkennung
  hasSingleClassOnly?: boolean;
  singleClassName?: string;
}

const TrendCharts: React.FC<TrendChartsProps> = memo(({
  weeklyTrends,
  attendanceOverTime,
  dayOfWeekData,
  absenceTypes,
  groupingOption,
  chartMode,
  chartVisibility,
  setChartVisibility,
  weekdayChartVisibility,
  setWeekdayChartVisibility,
  // Student comparison props
  selectedStudent,
  showStudentAverageComparison = false,
  setShowStudentAverageComparison = () => {},
  // Neue Prop mit Default-Wert
  classAverageAvailability = { isAvailable: true, tooltip: "", classCount: 0 },
  // Daten für statistische Analysen
  hasSingleClassOnly = false,
  singleClassName,
  schoolYearDetailedData = {},
  weeklyDetailedData = {},
  allStudentStats = {}
}) => {
  // NEU: Zugriff auf den visibleDashboardTiles-State
  const { visibleDashboardTiles } = useFilters();
  
  // Zugriff auf den FilterContext
  const {
    selectedDashboardClasses,
    selectedStudents
  } = useFilters();
  
  // Prüfen, ob Durchschnittskurven verfügbar sein sollen (nur für Debug-Zwecke)
  const showAverageOptions = shouldShowAverages(selectedDashboardClasses, selectedStudents);
  
  // Prüfen, ob Schülerdurchschnittskurven verfügbar sein sollen (nur für Debug-Zwecke)
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
  
  // Primary data series
  if (chartVisibility.verspaetungen) {
    visibleLines.push({ 
      dataKey: "verspaetungen", 
      name: selectedStudent ? `${selectedStudent} - Verspätungen` : "Verspätungen", 
      color: "#9333ea", // Purple
      activeDot: true 
    });
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
  }
  
  // Average curves - now independent of primary data visibility
  
  // Class average for tardiness
  if (chartVisibility.verspaetungenAvg && classAverageAvailability.isAvailable) {
    visibleLines.push({ 
      dataKey: "verspaetungenAvg", 
      name: "⌀ Verspätungen pro Klasse", 
      color: "#b980ed", // Purple for tardiness
      strokeDasharray: "5 5", // Gestrichelte Linie
      activeDot: false, // Keine hervorgehobenen Punkte
      strokeWidth: 2,
      opacity: 0.7  // Halbtransparent
    });
  }
  
  // Class average for absences
  if (chartVisibility.fehlzeitenAvg && classAverageAvailability.isAvailable) {
    visibleLines.push({ 
      dataKey: "fehlzeitenAvg", 
      name: "⌀ Fehltage pro Klasse", 
      color: "#7facf5", // Blue for absences
      strokeDasharray: "5 5", // Gestrichelte Linie
      activeDot: false, // Keine hervorgehobenen Punkte
      strokeWidth: 2,
      opacity: 0.7 // Halbtransparent
    });
  }
  
  // Student average for tardiness
  if (chartVisibility.verspaetungenStudentAvg && 
      showStudentAverageComparison && 
      timeSeriesData.some(point => point.verspaetungenStudentAvg !== undefined)) {
    visibleLines.push({ 
      dataKey: "verspaetungenStudentAvg", 
      name: "⌀ Verspätungen pro Schüler", 
      color: "#b980ed", // Purple for tardiness
      strokeDasharray: "10 3", // Different dash pattern from class averages
      activeDot: false, 
      strokeWidth: 2,
      opacity: 0.7 // Slightly more transparent
    });
  }
  
  // Student average for absences
  if (chartVisibility.fehlzeitenStudentAvg && 
      showStudentAverageComparison && 
      timeSeriesData.some(point => point.fehlzeitenStudentAvg !== undefined)) {
    visibleLines.push({ 
      dataKey: "fehlzeitenStudentAvg", 
      name: "⌀ Fehltage pro Schüler", 
      color: "#7facf5", // Blue for absences
      strokeDasharray: "10 3", // Different dash pattern from class averages
      activeDot: false, 
      strokeWidth: 2,
      opacity: 0.7 // Slightly more transparent
    });
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
  
  // Diese Funktion bestimmt, welcher Chart-Typ angezeigt werden soll
  const shouldRenderChart = (chartType: string) => {
    if (!chartMode || chartMode === 'all') return true;
    return chartMode === chartType;
  };

  // Im Einzel-Chart-Modus nur den angeforderten Chart-Typ rendern
  if (chartMode === 'timeSeries') {
    return (
      <div className="h-full flex flex-col w-full">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Zeitlicher Verlauf
              <span className="text-base font-normal ml-2 text-gray-500 dark:text-gray-400">
                ({groupingTitle})
              </span>
            </h3>
            <InfoButton 
              title={CHART_EXPLANATIONS.timeSeriesChart.title} 
              content={CHART_EXPLANATIONS.timeSeriesChart.content} 
              className="ml-2"
            />
          </div>
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
              <span className="text-green-600 dark:text-green-400">F (e.)</span>
            </label>
            <label className="inline-flex items-center cursor-pointer" title="Unentschuldigte Fehltage im Trend anzeigen">
              <input 
                type="checkbox" 
                checked={chartVisibility.fehlzeitenUnentsch} 
                onChange={() => setChartVisibility(prev => ({...prev, fehlzeitenUnentsch: !prev.fehlzeitenUnentsch}))}
                className="mr-1 w-4 h-4"
              />
              <span className="text-red-600 dark:text-red-400">F (u.)</span>
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
            
            <div className="border-l border-gray-300 dark:border-gray-600 pl-2 ml-1"></div>
            
            <label 
              className={`inline-flex items-center ${classAverageAvailability.isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`} 
              title={classAverageAvailability.tooltip}
            >
              <input 
                type="checkbox" 
                checked={classAverageAvailability.isAvailable && chartVisibility.verspaetungenAvg}
                onChange={() => {
                  if (classAverageAvailability.isAvailable) {
                    setChartVisibility(prev => ({...prev, verspaetungenAvg: !prev.verspaetungenAvg}));
                  }
                }}
                disabled={!classAverageAvailability.isAvailable}
                className="mr-1 w-4 h-4"
              />
              <span className="text-purple-600 dark:text-purple-400 text-opacity-70 dark:text-opacity-70">⌀ Klasse (V)</span>
            </label>
            
            <label 
              className={`inline-flex items-center ${classAverageAvailability.isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`} 
              title={classAverageAvailability.tooltip}
            >
              <input 
                type="checkbox" 
                checked={classAverageAvailability.isAvailable && chartVisibility.fehlzeitenAvg}
                onChange={() => {
                  if (classAverageAvailability.isAvailable) {
                    setChartVisibility(prev => ({...prev, fehlzeitenAvg: !prev.fehlzeitenAvg}));
                  }
                }}
                disabled={!classAverageAvailability.isAvailable}
                className="mr-1 w-4 h-4"
              />
              <span className="text-blue-600 dark:text-blue-400 text-opacity-70 dark:text-opacity-70">⌀ Klasse (Fges.)</span>
            </label>
            
            <label className="inline-flex items-center cursor-pointer" title="Durchschnittliche Verspätungen pro Schüler">
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
              <span className="text-blue-600 dark:text-blue-400 text-opacity-70 dark:text-opacity-70">⌀ Schüler (Fges.)</span>
            </label>
          </div>
        </div>
        
        <div className="overflow-hidden flex-1">
          <div className={CHART_SCROLL_CONTAINER_CLASSES} ref={scrollContainerRef}>
            <div style={{ 
              width: getChartWidth(attendanceOverTime.length, groupingOption),
              minWidth: '100%',
              height: '100%' 
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
        </div>
        
        {attendanceOverTime.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-4 text-base">
            Keine Daten für den ausgewählten Zeitraum verfügbar.
          </div>
        )}
      </div>
    );
  }
  
  // Einzelner Wochentagsanalyse-Chart
  // Einzelner Wochentagsanalyse-Chart
  if (chartMode === 'weekday') {
    return (
      <div className="h-full flex flex-col w-full">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Wochentagsanalyse
              <span className="text-base font-normal ml-2 text-gray-500 dark:text-gray-400">
                (Unabhängig von Zeitraumsauswahl)
              </span>
            </h3>
            <InfoButton 
              title={CHART_EXPLANATIONS.weekdayAnalysis.title} 
              content={CHART_EXPLANATIONS.weekdayAnalysis.content} 
              className="ml-2"
            />
          </div>
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
              <span className="text-green-600 dark:text-green-400">F (e.)</span>
            </label>
            <label className="inline-flex items-center cursor-pointer" title="Unentschuldigte Fehltage nach Wochentag anzeigen">
              <input 
                type="checkbox" 
                checked={weekdayChartVisibility.fehlzeitenUnentsch} 
                onChange={() => setWeekdayChartVisibility(prev => ({...prev, fehlzeitenUnentsch: !prev.fehlzeitenUnentsch}))}
                className="mr-1 w-4 h-4"
              />
              <span className="text-red-600 dark:text-red-400">F (u.)</span>
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
        
        <div className="overflow-hidden h-48"> {/* Kleinere Höhe für Diagramm, um Platz für Infokacheln zu lassen */}
          <div className="w-full h-full">
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
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
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
    );
  }
  
  return (
    <>
      {/* 1. REGRESSION an erster Stelle */}
      {visibleDashboardTiles.regression && (
        <AnalyticsSection 
          attendanceOverTime={attendanceOverTime}
          schoolYearDetailedData={schoolYearDetailedData}
          weeklyDetailedData={weeklyDetailedData}
          allStudentStats={allStudentStats}
          className="mb-4"
          hasSingleClassOnly={hasSingleClassOnly}
          singleClassName={singleClassName}
          chartMode="regression"
        />
      )}
  
      {/* 2. ZEITLICHER VERLAUF an dritter Stelle */}
      {visibleDashboardTiles.timeSeries && (
        <div className={CARD_CLASSES}>
          <div className="flex justify-between items-center mb-4 w-full pr-2">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Zeitlicher Verlauf
                <span className="text-base font-normal ml-2 text-gray-500 dark:text-gray-400">
                  ({groupingTitle})
                </span>
              </h3>
              <InfoButton 
                title={CHART_EXPLANATIONS.timeSeriesChart.title} 
                content={CHART_EXPLANATIONS.timeSeriesChart.content} 
                className="ml-2"
              />
            </div>
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
                <span className="text-green-600 dark:text-green-400">F (e.)</span>
              </label>
              <label className="inline-flex items-center cursor-pointer" title="Unentschuldigte Fehltage im Trend anzeigen">
                <input 
                  type="checkbox" 
                  checked={chartVisibility.fehlzeitenUnentsch} 
                  onChange={() => setChartVisibility(prev => ({...prev, fehlzeitenUnentsch: !prev.fehlzeitenUnentsch}))}
                  className="mr-1 w-4 h-4"
                />
                <span className="text-red-600 dark:text-red-400">F (u.)</span>
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
              
              <div className="border-l-2 border-gray-300 dark:border-gray-600 pl-2 ml-4"></div>
              <label 
                className={`inline-flex items-center ${classAverageAvailability.isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`} 
                title={classAverageAvailability.tooltip}
              >
                <input 
                  type="checkbox" 
                  checked={classAverageAvailability.isAvailable && chartVisibility.verspaetungenAvg}
                  onChange={() => {
                    if (classAverageAvailability.isAvailable) {
                      setChartVisibility(prev => ({...prev, verspaetungenAvg: !prev.verspaetungenAvg}));
                    }
                  }}
                  disabled={!classAverageAvailability.isAvailable}
                  className="mr-1 w-4 h-4"
                />
                <span className="text-purple-600 dark:text-purple-400 text-opacity-70 dark:text-opacity-70">⌀ Klasse (V)</span>
              </label>
              
              <label 
                className={`inline-flex items-center ${classAverageAvailability.isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`} 
                title={classAverageAvailability.tooltip}
              >
                <input 
                  type="checkbox" 
                  checked={classAverageAvailability.isAvailable && chartVisibility.fehlzeitenAvg}
                  onChange={() => {
                    if (classAverageAvailability.isAvailable) {
                      setChartVisibility(prev => ({...prev, fehlzeitenAvg: !prev.fehlzeitenAvg}));
                    }
                  }}
                  disabled={!classAverageAvailability.isAvailable}
                  className="mr-1 w-4 h-4"
                />
                <span className="text-blue-600 dark:text-blue-400 text-opacity-70 dark:text-opacity-70">⌀ Klasse (Fges.)</span>
              </label>
              
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
                <span className="text-blue-600 dark:text-blue-400 text-opacity-70 dark:text-opacity-70">⌀ Schüler (Fges.)</span>
              </label>
            </div>
          </div>
          <div className="overflow-x-auto h-64" ref={scrollContainerRef}>
            <div style={{ 
              width: attendanceOverTime.length > 8 ? `${Math.max(attendanceOverTime.length * 80, 800)}px` : '100%', 
              minWidth: '100%',
              height: '100%' 
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
      )}
      
      {/* 3. WOCHENTAGSANALYSE an zweiter Stelle */}
      {visibleDashboardTiles.weekday && (
        <div className={CARD_CLASSES}>
          <div className="flex justify-between items-center mb-4 w-full pr-2">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Wochentagsanalyse
                <span className="text-base font-normal ml-2 text-gray-500 dark:text-gray-400">
                  (Unabhängig von Zeitraumsauswahl)
                </span>
              </h3>
              <InfoButton 
                title={CHART_EXPLANATIONS.weekdayAnalysis.title} 
                content={CHART_EXPLANATIONS.weekdayAnalysis.content} 
                className="ml-2"
              />
            </div>
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
                <span className="text-green-600 dark:text-green-400">F (e.)</span>
              </label>
              <label className="inline-flex items-center cursor-pointer" title="Unentschuldigte Fehltage nach Wochentag anzeigen">
                <input 
                  type="checkbox" 
                  checked={weekdayChartVisibility.fehlzeitenUnentsch} 
                  onChange={() => setWeekdayChartVisibility(prev => ({...prev, fehlzeitenUnentsch: !prev.fehlzeitenUnentsch}))}
                  className="mr-1 w-4 h-4"
                />
                <span className="text-red-600 dark:text-red-400">F (u.)</span>
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
          <div className="overflow-x-auto h-64">
            <div style={{ 
              width: '100%',
              height: '100%' 
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
      )}
        
      {/* 4. GLEITENDER DURCHSCHNITT an vierter Stelle */}
      {visibleDashboardTiles.movingAverage && (
        <AnalyticsSection 
          attendanceOverTime={attendanceOverTime}
          schoolYearDetailedData={schoolYearDetailedData}
          weeklyDetailedData={weeklyDetailedData}
          allStudentStats={allStudentStats}
          className="mt-4"
          hasSingleClassOnly={hasSingleClassOnly}
          singleClassName={singleClassName}
          chartMode="movingAverage"
        />
      )}
    </>
  );
});

export default TrendCharts;