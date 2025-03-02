import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

type SortField = 'name' | 'klasse' | 
  'verspaetungen_entsch' | 'verspaetungen_unentsch' | 'verspaetungen_offen' |
  'fehlzeiten_entsch' | 'fehlzeiten_unentsch' | 'fehlzeiten_offen' |
  'sj_verspaetungen' | 'sj_fehlzeiten' | 'sj_fehlzeiten_ges' |
  'sum_verspaetungen' | 'sum_fehlzeiten';

type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection | null;
  order: number;
}

interface StudentTableHeaderProps {
  onSort: (field: SortField) => void;
  sortStates: Map<SortField, SortState>;
  onResetSelection: () => void;
  visibleColumns: string[];
}

const StudentTableHeader: React.FC<StudentTableHeaderProps> = ({ onSort, sortStates, onResetSelection, visibleColumns }) => {
  const renderSortIndicator = (field: SortField) => {
    const state = sortStates.get(field);
    if (!state) return null;

    return (
      <span className="inline-flex items-center">
        {state.direction === 'asc' ? (
          <ChevronUp className="w-4 h-4 ml-1" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-1" />
        )}
        {sortStates.size > 1 && (
          <span className="ml-1 text-xs">{state.order + 1}</span>
        )}
      </span>
    );
  };

  const getSortableHeaderClass = (field: SortField) => {
    const state = sortStates.get(field);
    return `cursor-pointer hover:bg-table-light-hover dark:hover:bg-table-dark-hover ${state ? 'bg-table-light-hover dark:bg-table-dark-hover' : ''}`;
  };

  // Berechne die colspan-Werte basierend auf sichtbaren Spalten
  const verspColspan = visibleColumns.includes('verspaetungen') ? (visibleColumns.includes('stats') ? 5 : 3) : 0;
  const fehlzColspan = visibleColumns.includes('fehlzeiten') ? (visibleColumns.includes('stats') ? 6 : 3) : 0;

  return (
    <thead className="sticky top-0 z-50 bg-table-light-header dark:bg-table-dark-header shadow-sm">
      <tr>
        {/* Grundinformationen - immer sichtbar */}
        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-tableBorder-light dark:border-tableBorder-dark w-12">Nr.</th>
        <th 
          onClick={() => onSort('name')}
          className={`px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-tableBorder-light dark:border-tableBorder-dark w-48 ${getSortableHeaderClass('name')}`}
        >
          Name {renderSortIndicator('name')}
        </th>
        <th 
          onClick={() => onSort('klasse')}
          className={`px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-tableBorder-light dark:border-tableBorder-dark min-w-[3rem] max-w-[6rem] whitespace-nowrap ${getSortableHeaderClass('klasse')}`}
        >
          Klasse {renderSortIndicator('klasse')}
        </th>
        
        {/* Verspätungen - nur wenn sichtbar */}
        {visibleColumns.includes('verspaetungen') && (
          <th colSpan={verspColspan} className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-tableBorder-light dark:border-tableBorder-dark">
            Verspätungen
            <div className="text-xs font-normal normal-case text-gray-400 dark:text-gray-400">E, U und O betreffen gewählten Zeitraum</div>
          </th>
        )}
        
        {/* Fehlzeiten - nur wenn sichtbar */}
        {visibleColumns.includes('fehlzeiten') && (
          <th colSpan={fehlzColspan} className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-tableBorder-light dark:border-tableBorder-dark">
            Fehltage
            <div className="text-xs font-normal normal-case text-gray-400 dark:text-gray-400">E, U und O betreffen gewählten Zeitraum</div>
          </th>
        )}
        
        {/* Auswahl-Spalte */}
        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-tableBorder-light dark:border-tableBorder-dark w-16">
          <button
            onClick={onResetSelection}
            className="text-xs h-6 px-2 bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark rounded text-gray-700 dark:text-gray-300 transition-colors duration-200"
          >
            Reset
          </button>
        </th>
      </tr>
      <tr>
        {/* Grundinformationen - Unterkategorien */}
        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-r border-tableBorder-light dark:border-tableBorder-dark"></th>
        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-r border-tableBorder-light dark:border-tableBorder-dark"></th>
        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-r border-tableBorder-light dark:border-tableBorder-dark"></th>
        
        {/* Verspätungen - Unterkategorien */}
        {visibleColumns.includes('verspaetungen') && (
          <>
            <th 
              onClick={() => onSort('verspaetungen_entsch')}
              className={`px-4 py-2 text-center text-xs font-medium text-green-600 dark:text-green-400 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('verspaetungen_entsch')}`}
              title="Entschuldigte Verspätungen im gewählten Zeitraum"
            >
              E {renderSortIndicator('verspaetungen_entsch')}
            </th>
            <th 
              onClick={() => onSort('verspaetungen_unentsch')}
              className={`px-4 py-2 text-center text-xs font-medium text-red-600 dark:text-red-400 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('verspaetungen_unentsch')}`}
              title="Unentschuldigte Verspätungen im gewählten Zeitraum"
            >
              U {renderSortIndicator('verspaetungen_unentsch')}
            </th>
            <th 
              onClick={() => onSort('verspaetungen_offen')}
              className={`px-4 py-2 text-center text-xs font-medium text-yellow-600 dark:text-yellow-400 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('verspaetungen_offen')}`}
              title="Offene Verspätungen im gewählten Zeitraum"
            >
              O {renderSortIndicator('verspaetungen_offen')}
            </th>
          </>
        )}
        
        {/* Statistiken für Verspätungen - wenn beide aktiviert sind */}
        {visibleColumns.includes('verspaetungen') && visibleColumns.includes('stats') && (
          <>
            <th 
              onClick={() => onSort('sj_verspaetungen')}
              className={`px-4 py-2 text-center text-xs font-medium text-red-600 dark:text-red-400 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('sj_verspaetungen')}`}
              title="Unentschuldigte Verspätungen im gesamten Schuljahr"
            >
              SJ<sub className="text-xs">u.</sub> {renderSortIndicator('sj_verspaetungen')}
            </th>
            <th 
              onClick={() => onSort('sum_verspaetungen')}
              className={`px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('sum_verspaetungen')}`}
              title="Summe der unentschuldigten Verspätungen in den letzten Wochen (Anzahl der Wochen kann eingestellt werden)"
            >
              ∑W {renderSortIndicator('sum_verspaetungen')}
            </th>
          </>
        )}
        
        {/* Fehlzeiten - Unterkategorien */}
        {visibleColumns.includes('fehlzeiten') && (
          <>
            <th 
              onClick={() => onSort('fehlzeiten_entsch')}
              className={`px-4 py-2 text-center text-xs font-medium text-green-600 dark:text-green-400 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('fehlzeiten_entsch')}`}
              title="Entschuldigte Fehltage im gewählten Zeitraum"
            >
              E {renderSortIndicator('fehlzeiten_entsch')}
            </th>
            <th 
              onClick={() => onSort('fehlzeiten_unentsch')}
              className={`px-4 py-2 text-center text-xs font-medium text-red-600 dark:text-red-400 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('fehlzeiten_unentsch')}`}
              title="Unentschuldigte Fehltage im gewählten Zeitraum"
            >
              U {renderSortIndicator('fehlzeiten_unentsch')}
            </th>
            <th 
              onClick={() => onSort('fehlzeiten_offen')}
              className={`px-4 py-2 text-center text-xs font-medium text-yellow-600 dark:text-yellow-400 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('fehlzeiten_offen')}`}
              title="Offene Fehltage im gewählten Zeitraum"
            >
              O {renderSortIndicator('fehlzeiten_offen')}
            </th>
          </>
        )}
        
        {/* Statistiken für Fehlzeiten - wenn beide aktiviert sind */}
        {visibleColumns.includes('fehlzeiten') && visibleColumns.includes('stats') && (
          <>
            <th 
              onClick={() => onSort('sj_fehlzeiten')}
              className={`px-4 py-2 text-center text-xs font-medium text-red-600 dark:text-red-400 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('sj_fehlzeiten')}`}
              title="Unentschuldigte Fehltage im gesamten Schuljahr"
            >
              SJ<sub className="text-xs">u.</sub> {renderSortIndicator('sj_fehlzeiten')}
            </th>
            <th 
              onClick={() => onSort('sj_fehlzeiten_ges')}
              className={`px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('sj_fehlzeiten_ges')}`}
              title="Gesamte Fehltage im Schuljahr (entschuldigte, unentschuldigte + offene)"
            >
              SJ<sub className="text-xs">ges.</sub> {renderSortIndicator('sj_fehlzeiten_ges')}
            </th>
            <th 
              onClick={() => onSort('sum_fehlzeiten')}
              className={`px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('sum_fehlzeiten')}`}
              title="Summe der unentschuldigten Fehltage in den letzten Wochen (Anzahl der Wochen kann eingestellt werden)"
            >
              ∑W {renderSortIndicator('sum_fehlzeiten')}
            </th>
          </>
        )}
        
        {/* Auswahl-Spalte */}
        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-tableBorder-light dark:border-tableBorder-dark">
          Auswahl
        </th>
      </tr>
    </thead>
  );
};

export default StudentTableHeader;