import React from 'react';
import { CARD_CLASSES } from './styles';
import { StudentStats } from '@/types';

interface StatCardsProps {
  absenceTypes: any[];
  weeklyTrends: any[];
  dayOfWeekData: any[];
  getFilteredStudents: () => [string, StudentStats][];
}

const StatCards: React.FC<StatCardsProps> = ({
  absenceTypes,
  weeklyTrends,
  dayOfWeekData,
  getFilteredStudents
}) => {
  // Berechnung der Gesamtzahlen
  const totalVerspaetungen = weeklyTrends.reduce((sum, week) => sum + week.verspaetungen, 0);
  const totalFehlzeiten = weeklyTrends.reduce((sum, week) => sum + week.fehlzeiten, 0);
  const totalEntschuldigt = absenceTypes.find(type => type.name === 'Entschuldigt')?.value || 0;
  const totalUnentschuldigt = absenceTypes.find(type => type.name === 'Unentschuldigt')?.value || 0;
  const totalOffen = absenceTypes.find(type => type.name === 'Offen')?.value || 0;
  const totalAll = totalEntschuldigt + totalUnentschuldigt + totalOffen;
  
  // Berechnung der Entschuldigungsquote
  const entschuldigungsQuote = totalAll > 0 
    ? Math.round((totalEntschuldigt / totalAll) * 100) 
    : 0;
  
  // Berechnung von Trends
  const criticalStudents = getFilteredStudents().filter(
    ([_, stats]) => stats.verspaetungen_unentsch >= 3 || stats.fehlzeiten_unentsch >= 3
  ).length;
  
  // Ermittlung des kritischsten Wochentags
  const maxVerspaetungenTag = dayOfWeekData.length > 0 
    ? dayOfWeekData.reduce((max, day) => day.verspaetungen > max.verspaetungen ? day : max, dayOfWeekData[0]).name
    : 'N/A';
  
  const maxFehlzeitenTag = dayOfWeekData.length > 0 
    ? dayOfWeekData.reduce((max, day) => day.fehlzeiten > max.fehlzeiten ? day : max, dayOfWeekData[0]).name
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
              color="bg-gray-100 dark:bg-gray-700"
            />
            <StatBox
              label="Einträge"
              value={totalAll.toString()}
              color="bg-gray-100 dark:bg-gray-700"
            />
            <StatBox
              label="Verspätungen"
              value={totalVerspaetungen.toString()}
              color="bg-gray-100 dark:bg-gray-700"
            />
            <StatBox
              label="Fehltage"
              value={totalFehlzeiten.toString()}
              color="bg-gray-100 dark:bg-gray-700"
            />
          </div>
        </div>
      </div>
      
      {/* Entschuldigungsstatus Karte */}
      <div className={CARD_CLASSES}>
        <div className="flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Entschuldigungsstatus</h3>
          <div className="grid grid-cols-2 gap-2 flex-grow">
            <StatBox
              label="Entschuldigt"
              value={totalEntschuldigt.toString()}
              color="bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-400"
            />
            <StatBox
              label="Unentschuldigt"
              value={totalUnentschuldigt.toString()}
              color="bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400"
            />
            <StatBox
              label="Noch offen"
              value={totalOffen.toString()}
              color="bg-yellow-50 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400"
            />
            <StatBox
              label="Quote"
              value={`${entschuldigungsQuote}%`}
              color={`${entschuldigungsQuote >= 75 
                ? 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-400' 
                : entschuldigungsQuote >= 50 
                  ? 'bg-yellow-50 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
                  : 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400'
              }`}
            />
          </div>
        </div>
      </div>
      
      {/* Muster-Übersicht Karte */}
      <div className={CARD_CLASSES}>
        <div className="flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Muster</h3>
          <div className="grid grid-cols-2 gap-2 flex-grow">
            <StatBox
              label="Kritische Schüler"
              value={criticalStudents.toString()}
              color={criticalStudents > 5 
                ? 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700'
              }
            />
            <StatBox
              label="Häufigste Abw."
              value={Math.max(totalVerspaetungen, totalFehlzeiten) === totalVerspaetungen ? 'Verspätungen' : 'Fehltage'}
              color="bg-gray-100 dark:bg-gray-700"
            />
            <StatBox
              label="Top Versp. Tag"
              value={maxVerspaetungenTag}
              color="bg-gray-100 dark:bg-gray-700"
            />
            <StatBox
              label="Top Fehlz. Tag"
              value={maxFehlzeitenTag}
              color="bg-gray-100 dark:bg-gray-700"
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
            />
            <StatBar 
              label="Unentschuldigt" 
              percent={totalAll > 0 ? Math.round((totalUnentschuldigt / totalAll) * 100) : 0} 
              color="bg-red-500 dark:bg-red-600" 
            />
            <StatBar 
              label="Offen" 
              percent={totalAll > 0 ? Math.round((totalOffen / totalAll) * 100) : 0} 
              color="bg-yellow-500 dark:bg-yellow-600" 
            />
            <StatBar 
              label="Verspät./Fehlz." 
              percent={totalVerspaetungen + totalFehlzeiten > 0 
                ? Math.round((totalVerspaetungen / (totalVerspaetungen + totalFehlzeiten)) * 100) 
                : 0
              } 
              color="bg-blue-500 dark:bg-blue-600" 
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
}> = ({ label, value, color = "bg-gray-100 dark:bg-gray-700" }) => {
  return (
    <div className={`p-3 rounded-lg ${color} flex flex-col justify-center items-center`}>
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
}> = ({ label, percent, color = "bg-blue-500 dark:bg-blue-600" }) => {
  return (
    <div className="flex-grow flex flex-col">
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