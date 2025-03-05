import React from 'react';
import { CARD_CLASSES } from './styles';
import { StudentStats } from '@/types';

interface StatCardsProps {
  absenceTypes: any[];
  weeklyTrends: any[];
  dayOfWeekData: any[];
  getFilteredStudents: () => [string, StudentStats][];
  criticalStudents: {name: string, verspaetungen: number, fehlzeiten: number}[];
  onShowCriticalStudents: () => void;
  onShowCriticalDays: () => void;
  onShowCriticalPatterns: () => void;
}

const StatCards: React.FC<StatCardsProps> = ({
  absenceTypes,
  weeklyTrends,
  dayOfWeekData,
  getFilteredStudents,
  criticalStudents,
  onShowCriticalStudents,
  onShowCriticalDays,
  onShowCriticalPatterns
}) => {
  // Berechnung der Gesamtzahlen
  const totalVerspaetungen = weeklyTrends.reduce((sum, week) => sum + week.verspaetungen, 0);
  const totalFehlzeitenGesamt = weeklyTrends.reduce((sum, week) => sum + week.fehlzeitenTotal, 0);
  const totalFehlzeitenEntsch = weeklyTrends.reduce((sum, week) => sum + week.fehlzeitenEntsch, 0);
  const totalFehlzeitenUnentsch = weeklyTrends.reduce((sum, week) => sum + week.fehlzeitenUnentsch, 0);
  
  const totalEntschuldigt = absenceTypes.find(type => type.name === 'Entschuldigt')?.value || 0;
  const totalUnentschuldigt = absenceTypes.find(type => type.name === 'Unentschuldigt')?.value || 0;
  const totalOffen = absenceTypes.find(type => type.name === 'Offen')?.value || 0;
  const totalAll = totalEntschuldigt + totalUnentschuldigt + totalOffen;
  
  // Berechnung der Unentschuldigungsquote
  const unentschuldigungsQuote = totalAll > 0 
    ? Math.round((totalUnentschuldigt / totalAll) * 100) 
    : 0;
  
  // Berechnung der Verspätungsquote
  const verspaetungsQuote = (totalVerspaetungen + totalFehlzeitenGesamt) > 0
    ? Math.round((totalVerspaetungen / (totalVerspaetungen + totalFehlzeitenGesamt)) * 100)
    : 0;
  
  // Ermittlung des kritischsten Wochentags
  const maxVerspaetungenTag = dayOfWeekData.length > 0 
    ? dayOfWeekData.reduce((max, day) => day.verspaetungen > max.verspaetungen ? day : max, dayOfWeekData[0]).name
    : 'N/A';
  
  const maxFehlzeitenUnentschTag = dayOfWeekData.length > 0
    ? dayOfWeekData.reduce((max, day) => day.fehlzeitenUnentsch > max.fehlzeitenUnentsch ? day : max, dayOfWeekData[0]).name
    : 'N/A';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Gesamtübersicht Karte */}
      <div className={CARD_CLASSES}>
        <div className="flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Gesamt</h3>
          <div className="grid grid-cols-2 gap-2 flex-grow">
            <StatBox
              label="Schüler"
              value={getFilteredStudents().length.toString()}
              color="bg-transparent dark:bg-transparent"
            />
            <StatBox
              label="Einträge"
              value={totalAll.toString()}
              color="bg-transparent dark:bg-transparent"
            />
            <StatBox
              label="Verspätungen"
              value={totalVerspaetungen.toString()}
              color="bg-transparent dark:bg-transparent text-purple-600 dark:text-purple-400"
              tooltip="Gesamtanzahl der Verspätungen im gewählten Zeitraum"
            />
            <StatBox
              label="Fehltage"
              value={totalFehlzeitenGesamt.toString()}
              color="bg-transparent dark:bg-transparent text-blue-600 dark:text-blue-400"
              tooltip="Gesamtanzahl der Fehltage im gewählten Zeitraum (entschuldigt + unentschuldigt)"
            />
          </div>
        </div>
      </div>
      
      {/* Entschuldigungsstatus Karte */}
      <div className={CARD_CLASSES}>
        <div className="flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Fehltage</h3>
          <div className="grid grid-cols-2 gap-2 flex-grow">
            <StatBox
              label="Entschuldigt"
              value={totalFehlzeitenEntsch.toString()}
              color="bg-transparent dark:bg-transparent text-green-600 dark:text-green-400"
              tooltip="Anzahl der entschuldigten Fehltage im gewählten Zeitraum"
            />
            <StatBox
              label="Unentschuldigt"
              value={totalFehlzeitenUnentsch.toString()}
              color="bg-transparent dark:bg-transparent text-red-600 dark:text-red-400"
              tooltip="Anzahl der unentschuldigten Fehltage im gewählten Zeitraum"
            />
            <StatBox
              label="Noch offen"
              value={totalOffen.toString()}
              color="bg-transparent dark:bg-transparent text-yellow-600 dark:text-yellow-400"
              tooltip="Anzahl der noch zu entschuldigenden Fehltage (Frist läuft noch)"
            />
            <StatBox
              label="Unentsch. Quote"
              value={`${unentschuldigungsQuote}%`}
              color={`bg-transparent dark:bg-transparent ${unentschuldigungsQuote <= 15
                ? 'text-green-600 dark:text-green-400' 
                : unentschuldigungsQuote <= 25 
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
              tooltip="Anteil unentschuldigter Fehltage an allen Fehltagen"
            />
          </div>
        </div>
      </div>
      
      {/* Muster-Übersicht Karte */}
      <div className={CARD_CLASSES}>
        <div className="flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Kritische Muster</h3>
          <div className="grid grid-cols-2 gap-2 flex-grow">
            <StatBox
              label="Kritische Schüler"
              value={criticalStudents.length.toString()}
              color={criticalStudents.length > 0 
                ? 'bg-transparent dark:bg-transparent text-red-600 dark:text-red-400'
                : 'bg-transparent dark:bg-transparent'
              }
              tooltip="Anzahl der Schüler mit ≥ 3 unentschuldigten Verspätungen oder Fehltagen"
              onClick={onShowCriticalStudents}
              isClickable={true}
            />
            <StatBox
              label="Verspät. Quote"
              value={`${verspaetungsQuote}%`}
              color="bg-transparent dark:bg-transparent text-purple-600 dark:text-purple-400"
              tooltip="Anteil der Verspätungen an allen Abwesenheiten (Verspätungen + Fehltage)"
              onClick={onShowCriticalPatterns}
              isClickable={true}
            />
            <StatBox
              label="Top Versp. Tag"
              value={maxVerspaetungenTag}
              color="bg-transparent dark:bg-transparent text-purple-600 dark:text-purple-400"
              tooltip="Wochentag mit den meisten Verspätungen"
              onClick={onShowCriticalDays}
              isClickable={true}
            />
            <StatBox
              label="Top Fehlz. Tag"
              value={maxFehlzeitenUnentschTag}
              color="bg-transparent dark:bg-transparent text-red-600 dark:text-red-400"
              tooltip="Wochentag mit den meisten unentschuldigten Fehltagen"
              onClick={onShowCriticalDays}
              isClickable={true}
            />
          </div>
        </div>
      </div>
      
      {/* Prozent-Übersicht Karte */}
      <div className={CARD_CLASSES}>
        <div className="flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Statistik</h3>
          <div className="flex flex-col gap-2 flex-grow">
            <StatBar 
              label="Entschuldigt" 
              percent={totalAll > 0 ? Math.round((totalEntschuldigt / totalAll) * 100) : 0} 
              color="bg-green-500 dark:bg-green-600" 
              tooltip="Anteil entschuldigter Abwesenheiten an allen Abwesenheiten"
            />
            <StatBar 
              label="Unentschuldigt" 
              percent={totalAll > 0 ? Math.round((totalUnentschuldigt / totalAll) * 100) : 0} 
              color="bg-red-500 dark:bg-red-600" 
              tooltip="Anteil unentschuldigter Abwesenheiten an allen Abwesenheiten"
            />
            <StatBar 
              label="Offen" 
              percent={totalAll > 0 ? Math.round((totalOffen / totalAll) * 100) : 0} 
              color="bg-yellow-500 dark:bg-yellow-600" 
              tooltip="Anteil offener Abwesenheiten (Frist läuft noch) an allen Abwesenheiten"
            />
            <StatBar 
              label="Verspät./Fehlz." 
              percent={verspaetungsQuote}
              color="bg-purple-500 dark:bg-purple-600" 
              tooltip="Verhältnis zwischen Verspätungen und Fehltagen"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Statbox Komponente für einzelne Statistikwerte
const StatBox: React.FC<{
  label: string;
  value: string;
  color?: string;
  tooltip?: string;
  onClick?: () => void;
  isClickable?: boolean;
}> = ({ label, value, color = "bg-transparent dark:bg-transparent", tooltip, onClick, isClickable = false }) => {
  return (
    <div 
      className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 ${color} flex flex-col justify-center items-center ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}`}
      title={tooltip}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="text-xs font-medium mb-1 opacity-80">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
};

// StatBar Komponente für Prozentbalken
const StatBar: React.FC<{
  label: string;
  percent: number;
  color?: string;
  tooltip?: string;
}> = ({ label, percent, color = "bg-blue-500 dark:bg-blue-600", tooltip }) => {
  return (
    <div className="flex-grow flex flex-col" title={tooltip}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{percent}%</span>
      </div>
      <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StatCards;