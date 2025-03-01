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

  return (
    <thead className="sticky top-0 z-10 bg-table-light-header dark:bg-table-dark-header shadow-sm">
      <tr>
        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-tableBorder-light dark:border-tableBorder-dark w-12">Nr.</th>
        <th 
          onClick={() => onSort('name')}
          className={`px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-tableBorder-light dark:border-tableBorder-dark w-48 ${getSortableHeaderClass('name')}`}
        >
          Name {renderSortIndicator('name')}
        </th>
        <th 
          onClick={() => onSort('klasse')}
          className={`px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-tableBorder-light dark:border-tableBorder-dark min-w-[4rem] whitespace-nowrap ${getSortableHeaderClass('klasse')}`}
        >
          Klasse {renderSortIndicator('klasse')}
        </th>
        <th colSpan={3} className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-tableBorder-light dark:border-tableBorder-dark">
          Verspätungen
          <div className="text-xs font-normal normal-case">Zeitraum</div>
        </th>
        <th colSpan={3} className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-tableBorder-light dark:border-tableBorder-dark">
          Fehlzeiten
          <div className="text-xs font-normal normal-case">Zeitraum</div>
        </th>
        {visibleColumns.includes('stats') && (
          <th colSpan={5} className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-tableBorder-light dark:border-tableBorder-dark">
            Statistik
            <div className="text-xs font-normal normal-case">Schuljahr & Wochen</div>
          </th>
        )}
        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-tableBorder-light dark:border-tableBorder-dark w-16">
          <button
            onClick={onResetSelection}
            className="text-xs h-6 px-2 bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark rounded text-gray-700 dark:text-gray-300 transition-colors duration-200"
          >
            Reset
          </button>
        </th>
      </tr>
      <tr className="bg-table-light-header dark:bg-table-dark-header">
        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-r border-tableBorder-light dark:border-tableBorder-dark"></th>
        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-r border-tableBorder-light dark:border-tableBorder-dark">
          
        </th>
        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-r border-tableBorder-light dark:border-tableBorder-dark"></th>
        <th 
          onClick={() => onSort('verspaetungen_entsch')}
          className={`px-4 py-2 text-center text-xs font-medium text-green-600 dark:text-green-400 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('verspaetungen_entsch')}`}
        >
          E {renderSortIndicator('verspaetungen_entsch')}
        </th>
        <th 
          onClick={() => onSort('verspaetungen_unentsch')}
          className={`px-4 py-2 text-center text-xs font-medium text-red-600 dark:text-red-400 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('verspaetungen_unentsch')}`}
        >
          U {renderSortIndicator('verspaetungen_unentsch')}
        </th>
        <th 
          onClick={() => onSort('verspaetungen_offen')}
          className={`px-4 py-2 text-center text-xs font-medium text-yellow-600 dark:text-yellow-400 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('verspaetungen_offen')}`}
        >
          O {renderSortIndicator('verspaetungen_offen')}
        </th>
        <th 
          onClick={() => onSort('fehlzeiten_entsch')}
          className={`px-4 py-2 text-center text-xs font-medium text-green-600 dark:text-green-400 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('fehlzeiten_entsch')}`}
        >
          E {renderSortIndicator('fehlzeiten_entsch')}
        </th>
        <th 
          onClick={() => onSort('fehlzeiten_unentsch')}
          className={`px-4 py-2 text-center text-xs font-medium text-red-600 dark:text-red-400 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('fehlzeiten_unentsch')}`}
        >
          U {renderSortIndicator('fehlzeiten_unentsch')}
        </th>
        <th 
          onClick={() => onSort('fehlzeiten_offen')}
          className={`px-4 py-2 text-center text-xs font-medium text-yellow-600 dark:text-yellow-400 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('fehlzeiten_offen')}`}
        >
          O {renderSortIndicator('fehlzeiten_offen')}
        </th>
        {visibleColumns.includes('stats') && (
          <>
            <th 
              onClick={() => onSort('sj_verspaetungen')}
              className={`px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('sj_verspaetungen')}`}
            >
              ∑SJ V {renderSortIndicator('sj_verspaetungen')}
            </th>
            <th 
              onClick={() => onSort('sj_fehlzeiten')}
              className={`px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('sj_fehlzeiten')}`}
            >
              ∑SJ F {renderSortIndicator('sj_fehlzeiten')}
            </th>
            <th 
              onClick={() => onSort('sj_fehlzeiten_ges')}
              className={`px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('sj_fehlzeiten_ges')}`}
            >
              ∑SJ F₍ges₎ {renderSortIndicator('sj_fehlzeiten_ges')}
            </th>
            <th 
              onClick={() => onSort('sum_verspaetungen')}
              className={`px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('sum_verspaetungen')}`}
            >
              ∑x() V {renderSortIndicator('sum_verspaetungen')}
            </th>
            <th 
              onClick={() => onSort('sum_fehlzeiten')}
              className={`px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-r border-tableBorder-light dark:border-tableBorder-dark ${getSortableHeaderClass('sum_fehlzeiten')}`}
            >
              ∑x() F {renderSortIndicator('sum_fehlzeiten')}
            </th>
          </>
        )}
        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 border-b border-tableBorder-light dark:border-tableBorder-dark">
          Auswahl
        </th>
      </tr>
    </thead>
  );
};

export default StudentTableHeader;