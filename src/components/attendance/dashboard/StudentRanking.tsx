import React, { useState } from 'react';
import { CARD_CLASSES, CARD_TITLE_CLASSES } from './styles';
import { StudentStats } from '@/types';

interface StudentRankingProps {
  filteredStudents: [string, StudentStats][];
  selectedClasses: string[];
  selectedStudents: string[];
}

const StudentRanking: React.FC<StudentRankingProps> = ({
  filteredStudents,
  selectedClasses,
  selectedStudents
}) => {
  const [sortType, setSortType] = useState<'fehlzeiten_unentsch' | 'fehlzeiten_gesamt' | 'verspaetungen'>('fehlzeiten_unentsch');
  
  if (filteredStudents.length === 0) {
    return null;
  }
  
  // Get title based on filter selection
  const getTitle = () => {
    if (selectedStudents.length > 0) {
      return `Schüler-Rangliste (${selectedStudents.length} ausgewählte Schüler)`;
    } else if (selectedClasses.length > 0) {
      return `Schüler-Rangliste (${selectedClasses.join(', ')})`;
    } else {
      return 'Schüler-Rangliste (Alle Klassen)';
    }
  };
  
  // Calculate total values for each student
  const studentsWithTotals = filteredStudents.map(([student, stats]) => {
    const fehlzeitenGesamt = stats.fehlzeiten_entsch + stats.fehlzeiten_unentsch + stats.fehlzeiten_offen;
    const verspaetungenGesamt = stats.verspaetungen_entsch + stats.verspaetungen_unentsch + stats.verspaetungen_offen;
    
    return {
      student,
      stats,
      fehlzeitenGesamt,
      verspaetungenGesamt
    };
  });
  
  // Sort students based on selected criteria
  const sortedStudents = [...studentsWithTotals].sort((a, b) => {
    if (sortType === 'fehlzeiten_unentsch') {
      return b.stats.fehlzeiten_unentsch - a.stats.fehlzeiten_unentsch;
    } else if (sortType === 'fehlzeiten_gesamt') {
      return b.fehlzeitenGesamt - a.fehlzeitenGesamt;
    } else { // verspaetungen
      return b.verspaetungenGesamt - a.verspaetungenGesamt;
    }
  });
  
  return (
    <div className={CARD_CLASSES}>
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h3 className={CARD_TITLE_CLASSES.replace('mb-4', '')}>
          {getTitle()}
        </h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setSortType('fehlzeiten_unentsch')}
            className={`px-3 py-1 text-sm rounded ${
              sortType === 'fehlzeiten_unentsch'
                ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Sortieren nach unentschuldigten Fehltagen"
          >
            Fehltage (U)
          </button>
          <button
            onClick={() => setSortType('fehlzeiten_gesamt')}
            className={`px-3 py-1 text-sm rounded ${
              sortType === 'fehlzeiten_gesamt'
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Sortieren nach Fehltagen gesamt"
          >
            Fehltage (Ges.)
          </button>
          <button
            onClick={() => setSortType('verspaetungen')}
            className={`px-3 py-1 text-sm rounded ${
              sortType === 'verspaetungen'
                ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Sortieren nach Verspätungen gesamt"
          >
            Verspätungen
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-table-light-header dark:bg-table-dark-header">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" title="Ranglistenposition">
                #
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" title="Vollständiger Name des Schülers">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" title="Klasse des Schülers">
                Klasse
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" title="Unentschuldigte Fehltage im gewählten Zeitraum">
                Fehlt. (U)
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" title="Gesamte Fehltage (entschuldigt + unentschuldigt + offen) im gewählten Zeitraum">
                Fehlt. (Ges.)
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" title="Gesamte Verspätungen (entschuldigt + unentschuldigt + offen) im gewählten Zeitraum">
                Versp. (Ges.)
              </th>
            </tr>
          </thead>
          <tbody className="bg-table-light-base dark:bg-table-dark-base divide-y divide-gray-200 dark:divide-gray-700">
            {sortedStudents.slice(0, 10).map(({ student, stats, fehlzeitenGesamt, verspaetungenGesamt }, index) => (
              <tr key={student} className={index % 2 === 0 ? 'bg-table-light-base dark:bg-table-dark-base' : 'bg-table-light-alternate dark:bg-table-dark-alternate'}>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300" title={`Platz ${index + 1} in der Rangliste`}>
                  {index + 1}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white" title={student}>
                  {student}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" title={`Klasse: ${stats.klasse}`}>
                  {stats.klasse}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400" title={`Unentschuldigte Fehltage: ${stats.fehlzeiten_unentsch}`}>
                  {stats.fehlzeiten_unentsch}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-blue-600 dark:text-blue-400" title={`Gesamte Fehltage: ${fehlzeitenGesamt}`}>
                  {fehlzeitenGesamt}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-purple-600 dark:text-purple-400" title={`Gesamte Verspätungen: ${verspaetungenGesamt}`}>
                  {verspaetungenGesamt}
                </td>
              </tr>
            ))}
            
            {sortedStudents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Keine Schüler gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentRanking;