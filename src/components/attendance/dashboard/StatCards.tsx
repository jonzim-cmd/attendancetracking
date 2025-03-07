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
  schoolYearStats?: Record<string, any>; // Added schoolYearStats prop
}

// Deaktivierungs-Flag
const isEnabled = false;

const StatCards: React.FC<StatCardsProps> = ({
  absenceTypes,
  weeklyTrends,
  dayOfWeekData,
  getFilteredStudents,
  criticalStudents,
  onShowCriticalStudents,
  onShowCriticalDays,
  onShowCriticalPatterns,
  weeklyStats = {},
  schoolYearStats = {} // Default value
}) => {
  // Rest of the component remains unchanged
  // If deactivated, return nothing
  if (!isEnabled) {
    return null;
  }

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

  // Bestimme, ob ein einzelner Schüler ausgewählt ist
  const isSingleStudentSelected = getFilteredStudents().length === 1;

  return (
    <div className={`${CARD_CLASSES} h-full overflow-auto max-w-fit`}>
      {/* Überschrift */}
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Dashboard Übersicht</h3>
      
      {/* Übersichtskachel - Kompakt mit Flex statt Grid */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 justify-start">
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
      
      {/* Kachel für kritische Muster (nur wenn ein Schüler ausgewählt ist) */}
      {isSingleStudentSelected && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Kritische Muster</h3>
          <div className="space-y-2">
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
                <div className="grid grid-cols-1 gap-2 max-w-md">
                  {/* 2.1 Alert bei unentschuldigten Fehltagen */}
                  {hasUnexcusedAbsences && (
                    <div className="p-2 bg-transparent dark:bg-transparent border border-red-200 dark:border-red-700 rounded-md">
                      <div className="font-medium text-red-600 dark:text-red-400 text-base">Unentschuldigte Fehltage</div>
                      <div className="text-base text-gray-700 dark:text-gray-300">
                        <span className="font-bold">{stats.fehlzeiten_unentsch}</span> unentsch. Fehltage im Zeitraum
                      </div>
                    </div>
                  )}
                  
                  {/* 2.2 Alert bei hoher Anzahl von Verspätungen */}
                  {hasLateAlert && (
                    <div className="p-2 bg-transparent dark:bg-transparent border border-yellow-200 dark:border-yellow-700 rounded-md">
                      <div className="font-medium text-yellow-600 dark:text-yellow-400 text-base">Verspätungen</div>
                      <div className="text-base text-gray-700 dark:text-gray-300">
                        <span className="font-bold">{stats.verspaetungen_unentsch}</span> Versp. (Schwelle: {lateThreshold})
                      </div>
                    </div>
                  )}
                  
                  {/* 2.3 Fehltage-Ratio */}
                  <div className="p-2 bg-transparent dark:bg-transparent border border-blue-200 dark:border-blue-700 rounded-md">
                    <div className="font-medium text-blue-600 dark:text-blue-400 text-base">Fehltage-Ratio</div>
                    <div className="text-base text-gray-700 dark:text-gray-300">
                      <span className="font-bold">{absenceRatio.toFixed(1)}%</span> ({totalAbsences} von ca. {schoolDays} Tagen)
                    </div>
                  </div>
                  
                  {/* 2.5 Quote der unentschuldigten Fehltage */}
                  {totalAbsences > 0 && (
                    <div className="p-2 bg-transparent dark:bg-transparent border border-purple-200 dark:border-purple-700 rounded-md">
                      <div className="font-medium text-purple-600 dark:text-purple-400 text-base">Unentsch. Quote</div>
                      <div className="text-base text-gray-700 dark:text-gray-300">
                        <span className="font-bold">{unexcusedRate.toFixed(1)}%</span> ({stats.fehlzeiten_unentsch} von {totalAbsences})
                      </div>
                    </div>
                  )}
                  
                  {/* 2.6 Vergleich mit Klassendurchschnitt */}
                    <div className="p-2 bg-transparent dark:bg-transparent border border-gray-200 dark:border-gray-600 rounded-md">
                      <div className="font-medium text-gray-600 dark:text-gray-400 text-base">Vergleich zum Durchschnitt</div>
                      <div className="text-base text-gray-700 dark:text-gray-300">
                        <div className="flex">
                          <span className="w-28">Fehltage:</span>
                          <span className={fehlzeitenComparedToAverage > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
                            {fehlzeitenComparedToAverage > 0 ? '+' : ''}{fehlzeitenComparedToAverage}%
                          </span>
                        </div>
                        <div className="flex mt-1">
                          <span className="w-28">Verspätungen:</span>
                          <span className={verspaetungenComparedToAverage > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
                            {verspaetungenComparedToAverage > 0 ? '+' : ''}{verspaetungenComparedToAverage}%
                          </span>
                        </div>
                      </div>
                    </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
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
      className={`p-2 rounded border border-gray-200 dark:border-gray-700 ${color} flex flex-col justify-center items-center ${isClickable ? 'cursor-pointer hover:opacity-80' : ''} min-w-[80px] max-w-[100px]`}
      title={tooltip}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="text-base font-medium opacity-80">{label}</div>
      <div className="text-base font-medium">{value}</div>
    </div>
  );
};

export default StatCards;