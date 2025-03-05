import React, { useState } from 'react';
import { CARD_CLASSES, CARD_TITLE_CLASSES } from './styles';
import { StudentStats } from '@/types';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface StudentRankingProps {
  filteredStudents: [string, StudentStats][];
  selectedClasses: string[];
  selectedStudents: string[];
}

type SortColumn = 'name' | 'klasse' | 'fehlzeiten_unentsch' | 'fehlzeiten_gesamt' | 'verspaetungen';
type SortDirection = 'asc' | 'desc';

const StudentRanking: React.FC<StudentRankingProps> = ({
  filteredStudents,
  selectedClasses,
  selectedStudents
}) => {
  // Updated state for column-based sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>('fehlzeiten_unentsch');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
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
      klasse: stats.klasse,
      fehlzeiten_unentsch: stats.fehlzeiten_unentsch,
      fehlzeitenGesamt,
      verspaetungenGesamt
    };
  });
  
  // Function to handle column header clicks
  const handleColumnClick = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with default desc direction
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  
  // Sort students based on selected column and direction
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
  
  // Helper function to render sort indicator
  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    
    return sortDirection === 'asc' 
      ? <ChevronUp className="inline-block w-4 h-4 ml-1" /> 
      : <ChevronDown className="inline-block w-4 h-4 ml-1" />;
  };
  
  // Helper function for sortable column classes
  const getSortableColumnClass = (column: SortColumn) => {
    return `px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
      sortColumn === column ? 'bg-gray-50 dark:bg-gray-700' : ''
    }`;
  };
  
  return (
    <div className={CARD_CLASSES}>
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h3 className={CARD_TITLE_CLASSES.replace('mb-4', '')}>
          {getTitle()}
        </h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleColumnClick('fehlzeiten_unentsch')}
            className={`px-3 py-1 text-sm rounded ${
              sortColumn === 'fehlzeiten_unentsch'
                ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Sortieren nach unentschuldigten Fehltagen"
          >
            Fehltage (U)
          </button>
          <button
            onClick={() => handleColumnClick('fehlzeiten_gesamt')}
            className={`px-3 py-1 text-sm rounded ${
              sortColumn === 'fehlzeiten_gesamt'
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Sortieren nach Fehltagen gesamt"
          >
            Fehltage (Ges.)
          </button>
          <button
            onClick={() => handleColumnClick('verspaetungen')}
            className={`px-3 py-1 text-sm rounded ${
              sortColumn === 'verspaetungen'
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
              <th 
                scope="col" 
                className={getSortableColumnClass('name') + " text-left"} 
                title="Vollständiger Name des Schülers"
                onClick={() => handleColumnClick('name')}
              >
                Name {renderSortIndicator('name')}
              </th>
              <th 
                scope="col" 
                className={getSortableColumnClass('klasse') + " text-left"} 
                title="Klasse des Schülers"
                onClick={() => handleColumnClick('klasse')}
              >
                Klasse {renderSortIndicator('klasse')}
              </th>
              <th 
                scope="col" 
                className={getSortableColumnClass('fehlzeiten_unentsch') + " text-right"} 
                title="Unentschuldigte Fehltage im gewählten Zeitraum"
                onClick={() => handleColumnClick('fehlzeiten_unentsch')}
              >
                Fehlt. (U) {renderSortIndicator('fehlzeiten_unentsch')}
              </th>
              <th 
                scope="col" 
                className={getSortableColumnClass('fehlzeiten_gesamt') + " text-right"} 
                title="Gesamte Fehltage (entschuldigt + unentschuldigt + offen) im gewählten Zeitraum"
                onClick={() => handleColumnClick('fehlzeiten_gesamt')}
              >
                Fehlt. (Ges.) {renderSortIndicator('fehlzeiten_gesamt')}
              </th>
              <th 
                scope="col" 
                className={getSortableColumnClass('verspaetungen') + " text-right"} 
                title="Gesamte Verspätungen (entschuldigt + unentschuldigt + offen) im gewählten Zeitraum"
                onClick={() => handleColumnClick('verspaetungen')}
              >
                Versp. (Ges.) {renderSortIndicator('verspaetungen')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-table-light-base dark:bg-table-dark-base divide-y divide-gray-200 dark:divide-gray-700">
            {sortedStudents.slice(0, 10).map(({ student, stats, klasse, fehlzeiten_unentsch, fehlzeitenGesamt, verspaetungenGesamt }, index) => (
              <tr key={student} className={index % 2 === 0 ? 'bg-table-light-base dark:bg-table-dark-base' : 'bg-table-light-alternate dark:bg-table-dark-alternate'}>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300" title={`Platz ${index + 1} in der Rangliste`}>
                  {index + 1}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white" title={student}>
                  {student}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" title={`Klasse: ${klasse}`}>
                  {klasse}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400" title={`Unentschuldigte Fehltage: ${fehlzeiten_unentsch}`}>
                  {fehlzeiten_unentsch}
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