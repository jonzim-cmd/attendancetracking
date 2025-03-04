// src/components/attendance/dashboard/PatternsTab.tsx
import React from 'react';
import { 
  CARD_CLASSES, 
  CARD_TITLE_CLASSES,
  DASHBOARD_CONTAINER_CLASSES
} from './styles';
import { 
  AttendanceLineChart, 
  AttendanceBarChart, 
  AttendancePieChart,
  InsightTile
} from './ChartComponents';

interface PatternsTabProps {
  weeklyTrends: any[];
  absenceTypes: any[];
  dayOfWeekData: any[];
}

const PatternsTab: React.FC<PatternsTabProps> = ({
  weeklyTrends,
  absenceTypes,
  dayOfWeekData
}) => {
  // Ermittle Wochentage mit den meisten Verspätungen/Fehlzeiten
  const maxVerspaetungenTag = dayOfWeekData.length > 0 
    ? dayOfWeekData.reduce((max, day) => day.verspaetungen > max.verspaetungen ? day : max, dayOfWeekData[0]).name
    : '';
  
  const maxFehlzeitenTag = dayOfWeekData.length > 0 
    ? dayOfWeekData.reduce((max, day) => day.fehlzeiten > max.fehlzeiten ? day : max, dayOfWeekData[0]).name
    : '';

  // Berechne Wochentrend
  const calculateWeeklyTrend = () => {
    if (weeklyTrends.length >= 2) {
      const firstWeek = weeklyTrends[0];
      const lastWeek = weeklyTrends[weeklyTrends.length - 1];
      const verspaetungsTrend = lastWeek.verspaetungen - firstWeek.verspaetungen;
      const fehlzeitenTrend = lastWeek.fehlzeiten - firstWeek.fehlzeiten;
      
      return (
        <>
          Die Verspätungen haben sich {verspaetungsTrend > 0 ? 'erhöht' : verspaetungsTrend < 0 ? 'verringert' : 'nicht verändert'}.
          Die Fehlzeiten haben sich {fehlzeitenTrend > 0 ? 'erhöht' : fehlzeitenTrend < 0 ? 'verringert' : 'nicht verändert'}.
        </>
      );
    }
    return 'Nicht genügend Daten für Trendanalyse.';
  };

  // Berechne Entschuldigungsrate
  const calculateExcuseRate = () => {
    const entschuldigt = absenceTypes.find(type => type.name === 'Entschuldigt')?.value || 0;
    const unentschuldigt = absenceTypes.find(type => type.name === 'Unentschuldigt')?.value || 0;
    const offen = absenceTypes.find(type => type.name === 'Offen')?.value || 0;
    const total = entschuldigt + unentschuldigt + offen;
    
    if (total === 0) return 'Keine Daten verfügbar.';
    
    const entschuldigtProzent = ((entschuldigt / total) * 100).toFixed(1);
    const unentschuldigtProzent = ((unentschuldigt / total) * 100).toFixed(1);
    
    return `${entschuldigtProzent}% aller Einträge sind entschuldigt, ${unentschuldigtProzent}% sind unentschuldigt.`;
  };

  return (
    <div className={DASHBOARD_CONTAINER_CLASSES}>
      {/* Wochentagsanalyse (ausführlicher) */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>Wochentagstrends</h3>
        <AttendanceBarChart 
          data={dayOfWeekData}
          bars={[
            { dataKey: "verspaetungen", name: "Verspätungen", color: "#8884d8" },
            { dataKey: "fehlzeiten", name: "Fehlzeiten", color: "#82ca9d" }
          ]}
        />
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>
            {dayOfWeekData.length > 0 ? (
              <>
                Tag mit den meisten Verspätungen: <span className="font-medium text-gray-700 dark:text-gray-300">
                  {maxVerspaetungenTag}
                </span>
                <br />
                Tag mit den meisten Fehlzeiten: <span className="font-medium text-gray-700 dark:text-gray-300">
                  {maxFehlzeitenTag}
                </span>
              </>
            ) : (
              'Keine Daten für Wochentagsanalyse verfügbar.'
            )}
          </p>
        </div>
      </div>
      
      {/* Muster & Trends */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>Zeitliche Trends</h3>
        <AttendanceLineChart 
          data={weeklyTrends}
          lines={[
            { dataKey: "verspaetungen", name: "Verspätungen", color: "#8884d8", activeDot: true },
            { dataKey: "fehlzeiten", name: "Fehlzeiten", color: "#82ca9d", activeDot: false }
          ]}
        />
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>
            {weeklyTrends.length > 0 ? (
              <>
                Insgesamt {weeklyTrends.reduce((sum, week) => sum + week.verspaetungen, 0)} Verspätungen und {weeklyTrends.reduce((sum, week) => sum + week.fehlzeiten, 0)} Fehltage im ausgewählten Zeitraum.
              </>
            ) : (
              'Keine Daten für Zeitliche Trends verfügbar.'
            )}
          </p>
        </div>
      </div>
      
      {/* Entschuldigungsstatus (ausführlicher) */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>Entschuldigungsanalyse</h3>
        <AttendancePieChart 
          data={absenceTypes} 
          dataKey="value"
        />
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>
            {absenceTypes.length > 0 ? (
              <>
                <span className="text-green-600 font-medium">{absenceTypes.find(type => type.name === 'Entschuldigt')?.value || 0}</span> entschuldigte Einträge, 
                <span className="text-red-600 font-medium ml-1">{absenceTypes.find(type => type.name === 'Unentschuldigt')?.value || 0}</span> unentschuldigte Einträge,
                <span className="text-yellow-600 font-medium ml-1">{absenceTypes.find(type => type.name === 'Offen')?.value || 0}</span> offene Einträge
              </>
            ) : (
              'Keine Daten für Entschuldigungsanalyse verfügbar.'
            )}
          </p>
        </div>
      </div>
      
      {/* Zusammenfassung der Erkenntnisse */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>Erkenntnisse</h3>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
          {weeklyTrends.length > 0 && (
            <InsightTile 
              title="Wochentrend:"
              content={calculateWeeklyTrend() as string}
            />
          )}
          
          {dayOfWeekData.length > 0 && (
            <InsightTile 
              title="Wochentagsmuster:"
              content={`Die meisten Verspätungen treten am ${maxVerspaetungenTag} auf, die meisten Fehlzeiten am ${maxFehlzeitenTag}.`}
            />
          )}
          
          {absenceTypes.length > 0 && (
            <InsightTile 
              title="Entschuldigungsrate:"
              content={calculateExcuseRate()}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PatternsTab;