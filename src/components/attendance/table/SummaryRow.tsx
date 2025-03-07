import React, { useMemo } from 'react';
import { StudentStats } from '@/types';

interface SummaryRowProps {
  students: [string, StudentStats][];
  schoolYearStats: Record<string, { verspaetungen_unentsch: number; fehlzeiten_unentsch: number; fehlzeiten_gesamt: number }>;
  weeklyStats: Record<string, { verspaetungen: { total: number; weekly: number[] }; fehlzeiten: { total: number; weekly: number[] } }>;
  selectedWeeks: string;
  visibleColumns: string[];
  isSticky?: boolean;
}

const SummaryRow: React.FC<SummaryRowProps> = ({
  students,
  schoolYearStats,
  weeklyStats,
  selectedWeeks,
  visibleColumns,
  isSticky = true,
}) => {
  // Berechne Summen für alle Werte
  const { 
    totalVerspaetungenEntsch, 
    totalVerspaetungenUnentsch, 
    totalVerspaetungenOffen,
    totalFehlzeitenEntsch,
    totalFehlzeitenUnentsch,
    totalFehlzeitenOffen,
    totalSJVerspaetungen,
    totalSJFehlzeiten,
    totalSJFehlzeitenGes,
    weeklyVerspaetungenSums,
    weeklyFehlzeitenSums,
    weeklyVerspaetungenTotal,
    weeklyFehlzeitenTotal
  } = useMemo(() => {
    let vEntsch = 0;
    let vUnentsch = 0;
    let vOffen = 0;
    let fEntsch = 0;
    let fUnentsch = 0;
    let fOffen = 0;
    let sjV = 0;
    let sjF = 0;
    let sjFG = 0;
    
    // Initialisiere Arrays für die wöchentlichen Summen
    const wvSums = Array(parseInt(selectedWeeks)).fill(0);
    const wfSums = Array(parseInt(selectedWeeks)).fill(0);
    let wvTotal = 0;
    let wfTotal = 0;
    
    // Berechne Summen für jede Schülerzeile
    students.forEach(([student, stats]) => {
      vEntsch += stats.verspaetungen_entsch;
      vUnentsch += stats.verspaetungen_unentsch;
      vOffen += stats.verspaetungen_offen;
      fEntsch += stats.fehlzeiten_entsch;
      fUnentsch += stats.fehlzeiten_unentsch;
      fOffen += stats.fehlzeiten_offen;
      
      // Schuljahresstatistiken
      const sjStats = schoolYearStats[student] || { 
        verspaetungen_unentsch: 0, 
        fehlzeiten_unentsch: 0,
        fehlzeiten_gesamt: 0
      };
      sjV += sjStats.verspaetungen_unentsch;
      sjF += sjStats.fehlzeiten_unentsch;
      sjFG += sjStats.fehlzeiten_gesamt;
      
      // Wochenstatistiken
      const weeklyData = weeklyStats[student] || {
        verspaetungen: { total: 0, weekly: Array(parseInt(selectedWeeks)).fill(0) },
        fehlzeiten: { total: 0, weekly: Array(parseInt(selectedWeeks)).fill(0) },
      };
      
      // Wochenweises Aufsummieren
      weeklyData.verspaetungen.weekly.forEach((value, index) => {
        if (index < wvSums.length) {
          wvSums[index] += value;
        }
      });
      
      weeklyData.fehlzeiten.weekly.forEach((value, index) => {
        if (index < wfSums.length) {
          wfSums[index] += value;
        }
      });
      
      wvTotal += weeklyData.verspaetungen.total;
      wfTotal += weeklyData.fehlzeiten.total;
    });
    
    return {
      totalVerspaetungenEntsch: vEntsch,
      totalVerspaetungenUnentsch: vUnentsch,
      totalVerspaetungenOffen: vOffen,
      totalFehlzeitenEntsch: fEntsch,
      totalFehlzeitenUnentsch: fUnentsch,
      totalFehlzeitenOffen: fOffen,
      totalSJVerspaetungen: sjV,
      totalSJFehlzeiten: sjF,
      totalSJFehlzeitenGes: sjFG,
      weeklyVerspaetungenSums: wvSums,
      weeklyFehlzeitenSums: wfSums,
      weeklyVerspaetungenTotal: wvTotal,
      weeklyFehlzeitenTotal: wfTotal
    };
  }, [students, schoolYearStats, weeklyStats, selectedWeeks]);
  
  // Format für die Wöchentliche Anzeige generieren (ähnlich wie in StudentTableRow)
  const verspaetungenSum = `${weeklyVerspaetungenTotal}(${[...weeklyVerspaetungenSums].reverse().join(',')})`;
  const fehlzeitenSum = `${weeklyFehlzeitenTotal}(${[...weeklyFehlzeitenSums].reverse().join(',')})`;
  
  // Klassen für Sticky-Positionierung
  const stickyClasses = isSticky 
    ? 'sticky bottom-0 z-10 shadow-lg' 
    : '';
  
  return (
    <tr className={`italic bg-table-light-base dark:bg-table-dark-base border-t-2 border-tableBorder-light dark:border-tableBorder-dark ${stickyClasses}`}>
      {/* Spalte für Nummerierung */}
      <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-300 border-r border-tableBorder-light dark:border-tableBorder-dark">#</td>
      
      {/* Spalte für Name - zeigt "Summe" an */}
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white border-r border-tableBorder-light dark:border-tableBorder-dark">
        Summe ({students.length} Schüler)
      </td>
      
      {/* Spalte für Klasse - bleibt leer */}
      <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white border-r border-tableBorder-light dark:border-tableBorder-dark whitespace-nowrap"></td>
      
      {/* Verspätungen - alle Daten */}
      {visibleColumns.includes('verspaetungen') && (
        <>
          <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400 border-r border-tableBorder-light dark:border-tableBorder-dark">
            {totalVerspaetungenEntsch}
          </td>
          <td className="px-4 py-3 text-sm text-center text-red-600 dark:text-red-400 border-r border-tableBorder-light dark:border-tableBorder-dark">
            {totalVerspaetungenUnentsch}
          </td>
          <td className="px-4 py-3 text-sm text-center text-yellow-600 dark:text-yellow-400 border-r border-tableBorder-light dark:border-tableBorder-dark">
            {totalVerspaetungenOffen}
          </td>
        </>
      )}
      
      {/* Statistiken für Verspätungen */}
      {visibleColumns.includes('verspaetungen') && visibleColumns.includes('stats') && (
        <>
          <td className="px-4 py-3 text-sm text-center text-red-600 dark:text-red-400 border-r border-tableBorder-light dark:border-tableBorder-dark">
            {totalSJVerspaetungen}
          </td>
          <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white border-r border-tableBorder-light dark:border-tableBorder-dark">
            {verspaetungenSum}
          </td>
        </>
      )}
      
      {/* Fehlzeiten - alle Daten */}
      {visibleColumns.includes('fehlzeiten') && (
        <>
          <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400 border-r border-tableBorder-light dark:border-tableBorder-dark">
            {totalFehlzeitenEntsch}
          </td>
          <td className="px-4 py-3 text-sm text-center text-red-600 dark:text-red-400 border-r border-tableBorder-light dark:border-tableBorder-dark">
            {totalFehlzeitenUnentsch}
          </td>
          <td className="px-4 py-3 text-sm text-center text-yellow-600 dark:text-yellow-400 border-r border-tableBorder-light dark:border-tableBorder-dark">
            {totalFehlzeitenOffen}
          </td>
        </>
      )}
      
      {/* Statistiken für Fehlzeiten */}
      {visibleColumns.includes('fehlzeiten') && visibleColumns.includes('stats') && (
        <>
          <td className="px-4 py-3 text-sm text-center text-red-600 dark:text-red-400 border-r border-tableBorder-light dark:border-tableBorder-dark">
            {totalSJFehlzeiten}
          </td>
          <td className="px-4 py-3 text-sm text-center text-black dark:text-white border-r border-tableBorder-light dark:border-tableBorder-dark">
            {totalSJFehlzeitenGes}
          </td>
          <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white border-r border-tableBorder-light dark:border-tableBorder-dark">
            {fehlzeitenSum}
          </td>
        </>
      )}
      
      {/* Leere Zelle für die Checkbox-Spalte */}
      <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white"></td>
    </tr>
  );
};

export default SummaryRow;