import React, { memo } from 'react';
import { 
  CARD_CLASSES, 
  CARD_TITLE_CLASSES
} from './styles';
import { 
  AttendanceLineChart, 
  AttendanceBarChart, 
  AttendancePieChart,
  InfoTile 
} from './ChartComponents';

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
  };
  setChartVisibility: React.Dispatch<React.SetStateAction<{
    verspaetungen: boolean;
    fehlzeitenEntsch: boolean;
    fehlzeitenUnentsch: boolean;
    fehlzeitenGesamt: boolean;
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
}

const TrendCharts: React.FC<TrendChartsProps> = memo(({
  weeklyTrends,
  attendanceOverTime,
  dayOfWeekData,
  absenceTypes,
  groupingOption,
  chartVisibility,
  setChartVisibility,
  weekdayChartVisibility,
  setWeekdayChartVisibility
}) => {
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
      entry.unentschuldigt || 0
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

  // Entschuldigungsstatistik berechnen
  const totalEntschuldigt = absenceTypes.find(type => type.name === 'Entschuldigt')?.value || 0;
  const totalUnentschuldigt = absenceTypes.find(type => type.name === 'Unentschuldigt')?.value || 0;
  const totalOffen = absenceTypes.find(type => type.name === 'Offen')?.value || 0;
  const totalAll = totalEntschuldigt + totalUnentschuldigt + totalOffen;
  
  // Berechnung der Verspätungsquote
  const totalVerspaetungen = weeklyTrends.reduce((sum, week) => sum + week.verspaetungen, 0);
  const totalFehlzeitenGesamt = weeklyTrends.reduce((sum, week) => sum + week.fehlzeitenTotal, 0);
  const verspaetungsQuote = (totalVerspaetungen + totalFehlzeitenGesamt) > 0
    ? Math.round((totalVerspaetungen / (totalVerspaetungen + totalFehlzeitenGesamt)) * 100)
    : 0;
  
  // Prepare visible lines for the chart based on user preferences
  const visibleLines = [];
  
  if (chartVisibility.verspaetungen) {
    visibleLines.push({ 
      dataKey: "verspaetungen", 
      name: "Verspätungen", 
      color: "#9333ea", // Purple
      activeDot: true 
    });
  }
  
  if (chartVisibility.fehlzeitenEntsch) {
    visibleLines.push({ 
      dataKey: "fehlzeitenEntsch", 
      name: "Fehltage (entsch.)", 
      color: "#16a34a", // Green
      activeDot: false 
    });
  }
  
  if (chartVisibility.fehlzeitenUnentsch) {
    visibleLines.push({ 
      dataKey: "fehlzeitenUnentsch", 
      name: "Fehltage (unentsch.)", 
      color: "#dc2626", // Red
      activeDot: false 
    });
  }
  
  if (chartVisibility.fehlzeitenGesamt) {
    visibleLines.push({ 
      dataKey: "fehlzeiten", 
      name: "Fehltage (gesamt)", 
      color: "#3b82f6", // Blue
      activeDot: true 
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
      const dataEntry = attendanceOverTime.find(entry => entry.name === label);
      const dateRange = dataEntry?.dateRange || '';
      
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{formatDate(label)}</p>
          {dateRange && (
            <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">{dateRange}</p>
          )}
          <div className="flex flex-col space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center">
                <div className="w-3 h-3 mr-2" style={{ backgroundColor: entry.color }}></div>
                <span className="text-gray-700 dark:text-gray-300">
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };
  
  // We don't need this function anymore since we're using responsive sizing with min-width
  
  return (
    <>
      {/* Zeitlicher Trend - Full width chart */}
      <div className={CARD_CLASSES}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={CARD_TITLE_CLASSES.replace('mb-4', '')}>
            Zeitlicher Verlauf
            <span className="text-sm font-normal ml-2 text-gray-500 dark:text-gray-400">
              ({groupingTitle})
            </span>
          </h3>
          <div className="flex space-x-2 text-sm">
            <label className="inline-flex items-center cursor-pointer" title="Verspätungen im Trend anzeigen">
              <input 
                type="checkbox" 
                checked={chartVisibility.verspaetungen} 
                onChange={() => setChartVisibility(prev => ({...prev, verspaetungen: !prev.verspaetungen}))}
                className="mr-1 w-3 h-3"
              />
              <span className="text-purple-600 dark:text-purple-400">Verspätungen</span>
            </label>
            <label className="inline-flex items-center cursor-pointer" title="Entschuldigte Fehltage im Trend anzeigen">
              <input 
                type="checkbox" 
                checked={chartVisibility.fehlzeitenEntsch} 
                onChange={() => setChartVisibility(prev => ({...prev, fehlzeitenEntsch: !prev.fehlzeitenEntsch}))}
                className="mr-1 w-3 h-3"
              />
              <span className="text-green-600 dark:text-green-400">F (entsch.)</span>
            </label>
            <label className="inline-flex items-center cursor-pointer" title="Unentschuldigte Fehltage im Trend anzeigen">
              <input 
                type="checkbox" 
                checked={chartVisibility.fehlzeitenUnentsch} 
                onChange={() => setChartVisibility(prev => ({...prev, fehlzeitenUnentsch: !prev.fehlzeitenUnentsch}))}
                className="mr-1 w-3 h-3"
              />
              <span className="text-red-600 dark:text-red-400">F (unentsch.)</span>
            </label>
            <label className="inline-flex items-center cursor-pointer" title="Gesamte Fehltage im Trend anzeigen">
              <input 
                type="checkbox" 
                checked={chartVisibility.fehlzeitenGesamt} 
                onChange={() => setChartVisibility(prev => ({...prev, fehlzeitenGesamt: !prev.fehlzeitenGesamt}))}
                className="mr-1 w-3 h-3"
              />
              <span className="text-blue-600 dark:text-blue-400">F (gesamt)</span>
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div style={{ 
            width: attendanceOverTime.length > 8 ? `${Math.max(attendanceOverTime.length * 80, 1200)}px` : '100%', 
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
          <div className="text-center text-gray-500 dark:text-gray-400 mt-4">
            Keine Daten für den ausgewählten Zeitraum verfügbar.
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wochentagsanalyse */}
        <div className={CARD_CLASSES}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={CARD_TITLE_CLASSES.replace('mb-4', '')}>
              Wochentagsanalyse
              <span className="text-sm font-normal ml-2 text-gray-500 dark:text-gray-400">
                (Mo-Fr)
              </span>
            </h3>
            <div className="flex space-x-2 text-sm">
              <label className="inline-flex items-center cursor-pointer" title="Verspätungen nach Wochentag anzeigen">
                <input 
                  type="checkbox" 
                  checked={weekdayChartVisibility.verspaetungen} 
                  onChange={() => setWeekdayChartVisibility(prev => ({...prev, verspaetungen: !prev.verspaetungen}))}
                  className="mr-1 w-3 h-3"
                />
                <span className="text-purple-600 dark:text-purple-400">Versp.</span>
              </label>
              <label className="inline-flex items-center cursor-pointer" title="Entschuldigte Fehltage nach Wochentag anzeigen">
                <input 
                  type="checkbox" 
                  checked={weekdayChartVisibility.fehlzeitenEntsch} 
                  onChange={() => setWeekdayChartVisibility(prev => ({...prev, fehlzeitenEntsch: !prev.fehlzeitenEntsch}))}
                  className="mr-1 w-3 h-3"
                />
                <span className="text-green-600 dark:text-green-400">F (entsch.)</span>
              </label>
              <label className="inline-flex items-center cursor-pointer" title="Unentschuldigte Fehltage nach Wochentag anzeigen">
                <input 
                  type="checkbox" 
                  checked={weekdayChartVisibility.fehlzeitenUnentsch} 
                  onChange={() => setWeekdayChartVisibility(prev => ({...prev, fehlzeitenUnentsch: !prev.fehlzeitenUnentsch}))}
                  className="mr-1 w-3 h-3"
                />
                <span className="text-red-600 dark:text-red-400">F (unentsch.)</span>
              </label>
              <label className="inline-flex items-center cursor-pointer" title="Gesamte Fehltage nach Wochentag anzeigen">
                <input 
                  type="checkbox" 
                  checked={weekdayChartVisibility.fehlzeitenGesamt} 
                  onChange={() => setWeekdayChartVisibility(prev => ({...prev, fehlzeitenGesamt: !prev.fehlzeitenGesamt}))}
                  className="mr-1 w-3 h-3"
                />
                <span className="text-blue-600 dark:text-blue-400">F (gesamt)</span>
              </label>
            </div>
          </div>
          <div className="h-64 w-full">
            <AttendanceBarChart 
              data={dayOfWeekData}
              bars={dayOfWeekBars}
            />
          </div>
          {dayOfWeekData.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {maxVerspaetungenTag && (
                <InfoTile 
                  title="Kritischer Tag (Verspätungen)" 
                  value={`${maxVerspaetungenTag.name} (${maxVerspaetungenTag.verspaetungen})`}
                  className="bg-transparent dark:bg-transparent border border-gray-200 dark:border-gray-600"
                  valueClassName="text-purple-600 dark:text-purple-400" // Spezifische Textfarbe
                />
              )}
              {maxFehlzeitenUnentschTag && (
                <InfoTile 
                  title="Kritischer Tag (unentsch. Fehltage)" 
                  value={`${maxFehlzeitenUnentschTag.name} (${maxFehlzeitenUnentschTag.fehlzeitenUnentsch})`}
                  className="bg-transparent dark:bg-transparent border border-gray-200 dark:border-gray-600"
                  valueClassName="text-red-600 dark:text-red-400" // Spezifische Textfarbe
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
                  valueClassName="text-blue-600 dark:text-blue-400" // Spezifische Textfarbe
                />
              )}
            </div>
          )}
        </div>
        
        {/* Entschuldigungsstatus */}
        <div className={CARD_CLASSES}>
          <h3 className={CARD_TITLE_CLASSES}>Entschuldigungsstatus</h3>
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/2">
              <AttendancePieChart 
                data={absenceTypes} 
                dataKey="value"
                label={true}
              />
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center p-4">
              <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Gesamtübersicht
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Gesamteinträge:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{totalAll}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600 dark:text-green-400">Entschuldigt:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {totalEntschuldigt} ({totalAll > 0 ? Math.round((totalEntschuldigt / totalAll) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600 dark:text-red-400">Unentschuldigt:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {totalUnentschuldigt} ({totalAll > 0 ? Math.round((totalUnentschuldigt / totalAll) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-600 dark:text-yellow-400">Offen:</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    {totalOffen} ({totalAll > 0 ? Math.round((totalOffen / totalAll) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-purple-600 dark:text-purple-400">Unentschuldigtquote:</span>
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {totalAll > 0 ? Math.round((totalUnentschuldigt / totalAll) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 dark:text-blue-400">Verspätungsquote:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {verspaetungsQuote}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default TrendCharts;