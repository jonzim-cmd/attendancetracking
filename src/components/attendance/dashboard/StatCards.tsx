import React from 'react';
import { CARD_CLASSES } from './styles';
import { StudentStats } from '@/types';
import { 
  calculateLateThreshold, 
  calculateSchoolDays, 
  hasWeekWithExcessiveLateArrivals,
  getMaxWeeklyLateArrivals,
  calculateUnexcusedRate,
  calculateClassAverage
} from './kritische-muster-utils';

interface StatCardsProps {
  absenceTypes: any[];
  weeklyTrends: any[];
  dayOfWeekData: any[];
  getFilteredStudents: () => [string, StudentStats][];
  criticalStudents: {name: string, verspaetungen: number, fehlzeiten: number}[];
  onShowCriticalStudents: () => void;
  onShowCriticalDays: () => void;
  onShowCriticalPatterns: () => void;
  weeklyStats?: Record<string, any>;
}

const StatCards: React.FC<StatCardsProps> = ({
  absenceTypes,
  weeklyTrends,
  dayOfWeekData,
  getFilteredStudents,
  criticalStudents,
  onShowCriticalStudents,
  onShowCriticalDays,
  onShowCriticalPatterns,
  weeklyStats = {}
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

  return (
    <div className="space-y-4">
      {/* Übersichtskachel - Kompakt mit Inline-Flex statt Grid */}
      <div className={`${CARD_CLASSES} flex flex-col w-auto`}>
        <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-100">Übersicht</h3>
        <div className="flex flex-wrap gap-2 mt-1">
          <StatBox
            label="Schüler"
            value={getFilteredStudents().length.toString()}
            color="bg-transparent dark:bg-transparent"
            tooltip="Anzahl der Schüler im gewählten Zeitraum"
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
            tooltip="Gesamtanzahl der Fehltage im gewählten Zeitraum"
          />
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
        </div>
      </div>
      
      {/* Kachel für kritische Muster (Alerts) - Angepasst für dark mode */}
      <div className={`${CARD_CLASSES} flex flex-col h-full w-full`}>
        <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-100">Kritische Muster</h3>
        
        {getFilteredStudents().length === 1 ? (
          <div className="space-y-2 pr-1">
            {(() => {
              // Einzelner Schüler - Daten extrahieren
              const [studentName, stats] = getFilteredStudents()[0];
              
              // Holen der Wochendaten für den Schüler, falls verfügbar
              const studentWeeklyData = weeklyStats[studentName] || {
                verspaetungen: { total: 0, weekly: Array(4).fill(0) },
                fehlzeiten: { total: 0, weekly: Array(4).fill(0) }
              };
              
              // 2.1 Alert bei unentschuldigten Fehltagen
              const hasUnexcusedAbsences = stats.fehlzeiten_unentsch > 0;
              
              // 2.2 Alert bei hoher Anzahl von Verspätungen
              const weeksCount = weeklyTrends.length;
              const lateThreshold = calculateLateThreshold(weeksCount);
              
              // Prüfen, ob Schwellenwert überschritten wird
              const exceedsLateThreshold = stats.verspaetungen_unentsch >= lateThreshold;
              
              // Prüfen, ob mehr als 3 Verspätungen in einer Woche
              const hasWeekWithManyLateArrivals = hasWeekWithExcessiveLateArrivals(
                studentWeeklyData.verspaetungen.weekly,
                3 // Schwellenwert: mehr als 3 Verspätungen pro Woche
              );
              
              const maxWeeklyLateArrivals = getMaxWeeklyLateArrivals(studentWeeklyData.verspaetungen.weekly);
              
              const hasLateAlert = exceedsLateThreshold || hasWeekWithManyLateArrivals;
              
              // 2.3 Fehltage-Ratio
              const schoolDays = calculateSchoolDays(weeksCount);
              const totalAbsences = stats.fehlzeiten_entsch + stats.fehlzeiten_unentsch + stats.fehlzeiten_offen;
              const absenceRatio = schoolDays > 0 
                ? (totalAbsences / schoolDays) * 100 
                : 0;
              
              // 2.5 Quote der unentschuldigten Fehltage
              const unexcusedRate = calculateUnexcusedRate(stats.fehlzeiten_unentsch, totalAbsences);
              
              // 2.6 Vergleich mit Klassendurchschnitt
              const classAverage = calculateClassAverage(getFilteredStudents(), stats.klasse);
              
              // Berechne abweichungen vom Klassendurchschnitt in Prozent
              const verspaetungenComparedToAverage = classAverage.averageVerspaetungen > 0
                ? Math.round(((stats.verspaetungen_unentsch / classAverage.averageVerspaetungen) - 1) * 100)
                : 0;
              
              const fehlzeitenComparedToAverage = classAverage.averageFehlzeiten > 0
                ? Math.round(((totalAbsences / classAverage.averageFehlzeiten) - 1) * 100)
                : 0;
              
              return (
                <div className="flex flex-col space-y-2">
                  {/* 2.1 Alert bei unentschuldigten Fehltagen */}
                  {hasUnexcusedAbsences && (
                    <div className="p-2 bg-transparent dark:bg-transparent border border-red-200 dark:border-red-700 rounded-md">
                      <div className="font-medium text-red-600 dark:text-red-400 text-sm">Unentschuldigte Fehltage</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        Der Schüler hat <span className="font-bold">{stats.fehlzeiten_unentsch}</span> unentschuldigte Fehltage im gewählten Zeitraum.
                      </div>
                    </div>
                  )}
                  
                  {/* 2.2 Alert bei hoher Anzahl von Verspätungen */}
                  {hasLateAlert && (
                    <div className="p-2 bg-transparent dark:bg-transparent border border-yellow-200 dark:border-yellow-700 rounded-md">
                      <div className="font-medium text-yellow-600 dark:text-yellow-400 text-sm">Zu viele Verspätungen</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <div className="whitespace-nowrap">
                          Der Schüler hat <span className="font-bold">{stats.verspaetungen_unentsch}</span> Verspätungen 
                          (Schwellenwert: {lateThreshold} für {weeksCount} Wochen).
                        </div>
                        {hasWeekWithManyLateArrivals && (
                          <div className="whitespace-nowrap mt-1">
                            <span className="font-medium">Kritisch:</span> Maximale Anzahl von <span className="font-bold">{maxWeeklyLateArrivals}</span> Verspätungen 
                            in einer einzelnen Woche (Schwellenwert: 3).
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* 2.3 Fehltage-Ratio */}
                  <div className="p-2 bg-transparent dark:bg-transparent border border-blue-200 dark:border-blue-700 rounded-md">
                    <div className="font-medium text-blue-600 dark:text-blue-400 text-sm">Fehltage-Ratio</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      <span className="font-bold">{absenceRatio.toFixed(1)}%</span> der Schultage im gewählten Zeitraum wurden versäumt.
                      ({totalAbsences} von ca. {schoolDays} Schultagen)
                    </div>
                  </div>
                  
                  {/* 2.5 Quote der unentschuldigten Fehltage */}
                  {totalAbsences > 0 && (
                    <div className="p-2 bg-transparent dark:bg-transparent border border-purple-200 dark:border-purple-700 rounded-md">
                      <div className="font-medium text-purple-600 dark:text-purple-400 text-sm">Unentschuldigungsquote</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        <span className="font-bold">{unexcusedRate.toFixed(1)}%</span> der Fehltage sind unentschuldigt.
                        ({stats.fehlzeiten_unentsch} von {totalAbsences} Fehltagen)
                      </div>
                    </div>
                  )}
                  
                  {/* 2.6 Vergleich mit Klassendurchschnitt */}
                  <div className="p-2 bg-transparent dark:bg-transparent border border-gray-200 dark:border-gray-600 rounded-md">
                    <div className="font-medium text-gray-600 dark:text-gray-400 text-sm">Vergleich mit Klassendurchschnitt</div>
                    <div className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                      <div className="flex justify-between whitespace-nowrap">
                        <span>Fehltage:</span>
                        <span className={fehlzeitenComparedToAverage > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
                          {totalAbsences} ({fehlzeitenComparedToAverage > 0 ? '+' : ''}{fehlzeitenComparedToAverage}% ggü. Durchschnitt)
                        </span>
                      </div>
                      <div className="flex justify-between mt-1 whitespace-nowrap">
                        <span>Verspätungen:</span>
                        <span className={verspaetungenComparedToAverage > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
                          {stats.verspaetungen_unentsch} ({verspaetungenComparedToAverage > 0 ? '+' : ''}{verspaetungenComparedToAverage}% ggü. Durchschnitt)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 p-2">
            Diese Kachel ist nur für einzelne Schüler relevant.
          </div>
        )}
      </div>
    </div>
  );
};

// Statbox Komponente für einzelne Statistikwerte - Kompakteres Design
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
      className={`p-2 rounded border border-gray-200 dark:border-gray-700 ${color} flex flex-col justify-center items-center ${isClickable ? 'cursor-pointer hover:opacity-80' : ''} min-w-[75px]`}
      title={tooltip}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-base font-bold">{value}</div>
    </div>
  );
};

export default StatCards;