import React, { useState } from 'react';
import { CARD_CLASSES } from './styles';
import { StudentStats } from '@/types';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface StudentRankingProps {
  filteredStudents: [string, StudentStats][];
  selectedClasses: string[];
  selectedStudents: string[];
}

type SortColumn = 'name' | 'klasse' | 'fehlzeiten_unentsch' | 'fehlzeiten_gesamt' | 'verspaetungen';
type SortDirection = 'asc' | 'desc';

// Deaktivierungs-Flag
const isEnabled = false;

const StudentRanking: React.FC<StudentRankingProps> = ({
  filteredStudents,
  selectedClasses,
  selectedStudents
}) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('fehlzeiten_unentsch');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Wenn deaktiviert, nichts rendern
  if (!isEnabled) {
    return null; // Oder <></> für ein leeres Fragment
  }

  if (filteredStudents.length === 0) {
    return (
      <div className={`${CARD_CLASSES} h-full`}>
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Schüler-Rangliste
        </h3>
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400 text-base">
          Keine Schüler verfügbar
        </div>
      </div>
    );
  }
  
  const getTitle = () => {
    const topLabel = "Top 10 ";
    if (selectedStudents.length > 0) {
      return `${topLabel}Schüler-Rangliste (${selectedStudents.length} ausgewählte)`;
    } else if (selectedClasses.length > 0) {
      return `${topLabel}Schüler-Rangliste (${selectedClasses.join(', ')})`;
    } else {
      return `${topLabel}Schüler-Rangliste (Alle Klassen)`;
    }
  };
  
  const studentsWithTotals = filteredStudents.map(([student, stats]) => {
    const fehlzeitenGesamt = stats.fehlzeiten_entsch + stats.fehlzeiten_unentsch + stats.fehlzeiten_offen;
    const verspaetungenGesamt = stats.verspaetungen_entsch + stats.verspaetungen_unentsch + stats.verspaetungen_offen;
    
    return {
      student,
      stats,
      klasse: stats.klasse,
      fehlzeiten_unentsch: stats.fehlzeiten_unentsch,
      fehlzeitenGesamt,
      verspaetungenGesamt
    };
  });
  
  const handleColumnClick = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  
  const sortedStudents = [...studentsWithTotals].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortColumn) {
      case 'name':
        return modifier * a.student.localeCompare(b.student);
      case 'klasse':
        return modifier * a.klasse.localeCompare(b.klasse);
      case 'fehlzeiten_unentsch':
        return modifier * (a.fehlzeiten_unentsch - b.fehlzeiten_unentsch);
      case 'fehlzeiten_gesamt':
        return modifier * (a.fehlzeitenGesamt - b.fehlzeitenGesamt);
      case 'verspaetungen':
        return modifier * (a.verspaetungenGesamt - b.verspaetungenGesamt);
      default:
        return 0;
    }
  });
  
  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    
    return sortDirection === 'asc' 
      ? <ChevronUp className="inline-block w-4 h-4 ml-1" /> 
      : <ChevronDown className="inline-block w-4 h-4 ml-1" />;
  };
  
  const getSortableColumnClass = (column: SortColumn) => {
    return `px-2 py-1 text-base font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
      sortColumn === column ? 'bg-gray-50 dark:bg-gray-700' : ''
    }`;
  };
  
  return (
    <div className={`${CARD_CLASSES} h-full overflow-auto max-w-fit`}>
      <div className="mb-3">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
          {getTitle()}
        </h3>
        <div className="flex space-x-2 justify-start">
          <button
            onClick={() => handleColumnClick('fehlzeiten_unentsch')}
            className={`px-1.5 py-0.5 text-base rounded ${
              sortColumn === 'fehlzeiten_unentsch'
                ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Sortieren nach unentschuldigten Fehltagen"
          >
            F (U)
          </button>
          <button
            onClick={() => handleColumnClick('fehlzeiten_gesamt')}
            className={`px-1.5 py-0.5 text-base rounded ${
              sortColumn === 'fehlzeiten_gesamt'
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Sortieren nach Fehltagen gesamt"
          >
            F (Ges)
          </button>
          <button
            onClick={() => handleColumnClick('verspaetungen')}
            className={`px-1.5 py-0.5 text-base rounded ${
              sortColumn === 'verspaetungen'
                ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Sortieren nach Verspätungen gesamt"
          >
            Versp
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-table-light-header dark:bg-table-dark-header">
            <tr>
              <th scope="col" className="px-1 py-0.5 text-left text-base font-medium text-gray-500 dark:text-gray-300" title="Ranglistenposition">
                #
              </th>
              <th 
                scope="col" 
                className={getSortableColumnClass('name').replace('px-2 py-1', 'px-1 py-0.5') + " text-left"} 
                title="Vollständiger Name des Schülers"
                onClick={() => handleColumnClick('name')}
              >
                Name {renderSortIndicator('name')}
              </th>
              <th 
                scope="col" 
                className={getSortableColumnClass('klasse').replace('px-2 py-1', 'px-1 py-0.5') + " text-left"} 
                title="Klasse des Schülers"
                onClick={() => handleColumnClick('klasse')}
              >
                Kl. {renderSortIndicator('klasse')}
              </th>
              <th 
                scope="col" 
                className={getSortableColumnClass('fehlzeiten_unentsch').replace('px-2 py-1', 'px-1 py-0.5') + " text-right"} 
                title="Unentschuldigte Fehltage im gewählten Zeitraum"
                onClick={() => handleColumnClick('fehlzeiten_unentsch')}
              >
                F(U) {renderSortIndicator('fehlzeiten_unentsch')}
              </th>
              <th 
                scope="col" 
                className={getSortableColumnClass('fehlzeiten_gesamt').replace('px-2 py-1', 'px-1 py-0.5') + " text-right"} 
                title="Gesamte Fehltage (entschuldigt + unentschuldigt + offen) im gewählten Zeitraum"
                onClick={() => handleColumnClick('fehlzeiten_gesamt')}
              >
                F(G) {renderSortIndicator('fehlzeiten_gesamt')}
              </th>
              <th 
                scope="col" 
                className={getSortableColumnClass('verspaetungen').replace('px-2 py-1', 'px-1 py-0.5') + " text-right"} 
                title="Gesamte Verspätungen (entschuldigt + unentschuldigt + offen) im gewählten Zeitraum"
                onClick={() => handleColumnClick('verspaetungen')}
              >
                Versp {renderSortIndicator('verspaetungen')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-table-light-base dark:bg-table-dark-base divide-y divide-gray-200 dark:divide-gray-700">
            {sortedStudents.slice(0, 10).map(({ student, stats, klasse, fehlzeiten_unentsch, fehlzeitenGesamt, verspaetungenGesamt }, index) => (
              <tr key={student} className={index % 2 === 0 ? 'bg-table-light-base dark:bg-table-dark-base' : 'bg-table-light-alternate dark:bg-table-dark-alternate'}>
                <td className="px-1 py-0.5 whitespace-nowrap text-base text-gray-900 dark:text-gray-300" title={`Platz ${index + 1} in der Rangliste`}>
                  {index + 1}
                </td>
                <td className="px-1 py-0.5 whitespace-nowrap text-base font-medium text-gray-900 dark:text-white" title={student}>
                  {student}
                </td>
                <td className="px-1 py-0.5 whitespace-nowrap text-base text-gray-500 dark:text-gray-400" title={`Klasse: ${klasse}`}>
                  {klasse}
                </td>
                <td className="px-1 py-0.5 whitespace-nowrap text-base text-right text-red-600 dark:text-red-400" title={`Unentschuldigte Fehltage: ${fehlzeiten_unentsch}`}>
                  {fehlzeiten_unentsch}
                </td>
                <td className="px-1 py-0.5 whitespace-nowrap text-base text-right text-blue-600 dark:text-blue-400" title={`Gesamte Fehltage: ${fehlzeitenGesamt}`}>
                  {fehlzeitenGesamt}
                </td>
                <td className="px-1 py-0.5 whitespace-nowrap text-base text-right text-purple-600 dark:text-purple-400" title={`Gesamte Verspätungen: ${verspaetungenGesamt}`}>
                  {verspaetungenGesamt}
                </td>
              </tr>
            ))}
            
            {sortedStudents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-1 py-2 text-center text-base text-gray-500 dark:text-gray-400">
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