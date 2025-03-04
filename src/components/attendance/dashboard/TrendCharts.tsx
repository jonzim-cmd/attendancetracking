import React from 'react';
import { 
  CARD_CLASSES, 
  CARD_TITLE_CLASSES,
  CHART_CONTAINER_CLASSES
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
}

const TrendCharts: React.FC<TrendChartsProps> = ({
  weeklyTrends,
  attendanceOverTime,
  dayOfWeekData,
  absenceTypes,
  timeRange,
  groupingOption
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
      entry.entschuldigt || 0,
      entry.unentschuldigt || 0
    ))
  );
  
  // Ermittle den Tag mit den meisten Verspätungen
  const criticalDay = dayOfWeekData.length > 0
    ? dayOfWeekData.reduce((max, day) => 
        day.verspaetungen + day.fehlzeiten > max.verspaetungen + max.fehlzeiten ? day : max, 
        dayOfWeekData[0]
      )
    : null;
  
  // Formatiere das Datum für die Anzeige
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (groupingOption === 'daily') {
      return dateStr; // Tägliches Format bereits sinnvoll (z.B. '01.05.')
    } else if (groupingOption === 'weekly') {
      return `Woche ${dateStr}`; // Wochenformat (z.B. 'KW 20')
    } else {
      return dateStr; // Monatsformat bereits sinnvoll (z.B. 'Mai 2023')
    }
  };
  
  // Entschuldigungsstatistik berechnen
  const totalEntschuldigt = absenceTypes.find(type => type.name === 'Entschuldigt')?.value || 0;
  const totalUnentschuldigt = absenceTypes.find(type => type.name === 'Unentschuldigt')?.value || 0;
  const totalOffen = absenceTypes.find(type => type.name === 'Offen')?.value || 0;
  const totalAll = totalEntschuldigt + totalUnentschuldigt + totalOffen;
  
  return (
    <>
      {/* Zeitlicher Trend */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>
          {trendTitle} 
          <span className="text-sm font-normal ml-2 text-gray-500 dark:text-gray-400">
            ({groupingTitle})
          </span>
        </h3>
        <div className={CHART_CONTAINER_CLASSES}>
          <AttendanceLineChart 
            data={attendanceOverTime}
            lines={[
              { 
                dataKey: "verspaetungen", 
                name: "Verspätungen", 
                color: "#9333ea", // Angepasst an das Farbschema (lila statt blau)
                activeDot: true 
              },
              { 
                dataKey: "fehlzeiten", 
                name: "Fehltage", 
                color: "#22c55e", // Grün, aber nicht bläulich
                activeDot: true 
              },
              { 
                dataKey: "entschuldigt", 
                name: "Entschuldigt", 
                color: "#16a34a", // Dunkleres Grün
                activeDot: false 
              },
              { 
                dataKey: "unentschuldigt", 
                name: "Unentschuldigt", 
                color: "#dc2626", // Rot
                activeDot: false 
              }
            ]}
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
      
      {/* Wochentagsanalyse */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>Wochentagsanalyse</h3>
        <div className={CHART_CONTAINER_CLASSES}>
          <AttendanceBarChart 
            data={dayOfWeekData}
            bars={[
              { dataKey: "verspaetungen", name: "Verspätungen", color: "#9333ea" }, // Lila
              { dataKey: "fehlzeiten", name: "Fehltage", color: "#22c55e" } // Grün
            ]}
          />
        </div>
        {criticalDay && dayOfWeekData.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">
            <InfoTile 
              title="Kritischster Tag" 
              value={criticalDay.name}
            />
            <InfoTile 
              title="Verspätungen" 
              value={criticalDay.verspaetungen.toString()}
            />
            <InfoTile 
              title="Fehltage" 
              value={criticalDay.fehlzeiten.toString()}
            />
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrendCharts;