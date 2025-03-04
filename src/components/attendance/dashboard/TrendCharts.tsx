import React from 'react';
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
  timeRange: 'days' | 'weeks' | 'months';
  groupingOption: 'daily' | 'weekly' | 'monthly';
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

const TrendCharts: React.FC<TrendChartsProps> = ({
  weeklyTrends,
  attendanceOverTime,
  dayOfWeekData,
  absenceTypes,
  timeRange,
  groupingOption,
  chartVisibility,
  setChartVisibility,
  weekdayChartVisibility,
  setWeekdayChartVisibility
}) => {
  // Ermittle den geeigneten Trend-Title basierend auf timeRange
  const trendTitle = {
    'days': 'Täglicher Trend',
    'weeks': 'Wöchentlicher Trend',
    'months': 'Monatlicher Trend'
  }[timeRange];
  
  // Ermittle den geeigneten Gruppierungstitel basierend auf groupingOption
  const groupingTitle = {
    'daily': 'Tägliche Gruppierung',
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
  
  // Ermittle den Tag mit den meisten Fehlzeiten (gesamt)
  // Commented out since we're not currently using this in the UI
  // const maxFehlzeitenGesamtTag = dayOfWeekData.length > 0
  //   ? dayOfWeekData.reduce((max, day) => 
  //       day.fehlzeitenGesamt > max.fehlzeitenGesamt ? day : max, 
  //       dayOfWeekData[0]
  //     )
  //   : null;
  
  // Formatiere das Datum für die Anzeige
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (groupingOption === 'daily') {
      return dateStr; // Tägliches Format bereits sinnvoll (z.B. '01.05.')
    } else if (groupingOption === 'weekly') {
      return `KW ${dateStr}`; // Wochenformat (z.B. 'KW 20')
    } else {
      return dateStr; // Monatsformat bereits sinnvoll (z.B. 'Mai 2023')
    }
  };
  
  // Entschuldigungsstatistik berechnen
  const totalEntschuldigt = absenceTypes.find(type => type.name === 'Entschuldigt')?.value || 0;
  const totalUnentschuldigt = absenceTypes.find(type => type.name === 'Unentschuldigt')?.value || 0;
  const totalOffen = absenceTypes.find(type => type.name === 'Offen')?.value || 0;
  const totalAll = totalEntschuldigt + totalUnentschuldigt + totalOffen;
  
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
  
  return (
    <>
      {/* Zeitlicher Trend - Full width chart */}
      <div className={CARD_CLASSES}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={CARD_TITLE_CLASSES.replace('mb-4', '')}>
            {trendTitle} 
            <span className="text-sm font-normal ml-2 text-gray-500 dark:text-gray-400">
              ({groupingTitle})
            </span>
          </h3>
          <div className="flex space-x-2 text-sm">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={chartVisibility.verspaetungen} 
                onChange={() => setChartVisibility(prev => ({...prev, verspaetungen: !prev.verspaetungen}))}
                className="mr-1 w-3 h-3"
              />
              <span className="text-purple-600 dark:text-purple-400">Verspätungen</span>
            </label>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={chartVisibility.fehlzeitenEntsch} 
                onChange={() => setChartVisibility(prev => ({...prev, fehlzeitenEntsch: !prev.fehlzeitenEntsch}))}
                className="mr-1 w-3 h-3"
              />
              <span className="text-green-600 dark:text-green-400">F (entsch.)</span>
            </label>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={chartVisibility.fehlzeitenUnentsch} 
                onChange={() => setChartVisibility(prev => ({...prev, fehlzeitenUnentsch: !prev.fehlzeitenUnentsch}))}
                className="mr-1 w-3 h-3"
              />
              <span className="text-red-600 dark:text-red-400">F (unentsch.)</span>
            </label>
            <label className="inline-flex items-center cursor-pointer">
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
        <div className="h-64 w-full">
          <AttendanceLineChart 
            data={attendanceOverTime}
            lines={visibleLines}
            formatXAxis={formatDate}
            yAxisMax={maxAttendanceValue > 0 ? undefined : 10}
          />
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
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={weekdayChartVisibility.verspaetungen} 
                  onChange={() => setWeekdayChartVisibility(prev => ({...prev, verspaetungen: !prev.verspaetungen}))}
                  className="mr-1 w-3 h-3"
                />
                <span className="text-purple-600 dark:text-purple-400">Versp.</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={weekdayChartVisibility.fehlzeitenEntsch} 
                  onChange={() => setWeekdayChartVisibility(prev => ({...prev, fehlzeitenEntsch: !prev.fehlzeitenEntsch}))}
                  className="mr-1 w-3 h-3"
                />
                <span className="text-green-600 dark:text-green-400">F (entsch.)</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={weekdayChartVisibility.fehlzeitenUnentsch} 
                  onChange={() => setWeekdayChartVisibility(prev => ({...prev, fehlzeitenUnentsch: !prev.fehlzeitenUnentsch}))}
                  className="mr-1 w-3 h-3"
                />
                <span className="text-red-600 dark:text-red-400">F (unentsch.)</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
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
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {maxVerspaetungenTag && (
                <InfoTile 
                  title="Kritischer Tag (Verspätungen)" 
                  value={`${maxVerspaetungenTag.name} (${maxVerspaetungenTag.verspaetungen})`}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-purple-600 dark:text-purple-400"
                />
              )}
              {maxFehlzeitenUnentschTag && (
                <InfoTile 
                  title="Kritischer Tag (unentsch. Fehltage)" 
                  value={`${maxFehlzeitenUnentschTag.name} (${maxFehlzeitenUnentschTag.fehlzeitenUnentsch})`}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-red-600 dark:text-red-400"
                />
              )}
              {/* Removed the gesamt Fehltage InfoTile as it's not currently needed */}
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
};

export default TrendCharts;