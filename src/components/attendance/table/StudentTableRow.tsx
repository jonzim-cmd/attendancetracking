import React from 'react';
import { StudentStats } from '@/types';

interface StudentTableRowProps {
  student: string;
  index: number;
  stats: StudentStats;
  schoolYearData: { verspaetungen_unentsch: number; fehlzeiten_unentsch: number; fehlzeiten_gesamt: number };
  weeklyData: { verspaetungen: { total: number; weekly: number[] }; fehlzeiten: { total: number; weekly: number[] } };
  selectedWeeks: string;
  rowColor: string;
  onToggleDetails: () => void;
  onShowFilteredDetails: (student: string, type: string, weekData?: number[]) => void;
  isChecked: boolean;
  onToggleChecked: () => void;
  visibleColumns: string[];
}

const StudentTableRow: React.FC<StudentTableRowProps> = ({
  student,
  index,
  stats,
  schoolYearData,
  weeklyData,
  selectedWeeks,
  rowColor,
  onToggleDetails,
  onShowFilteredDetails,
  isChecked,
  onToggleChecked,
  visibleColumns,
}) => {
  const verspaetungenSum = `${weeklyData.verspaetungen.total}(${weeklyData.verspaetungen.weekly.join(',')})`;
  const fehlzeitenSum = `${weeklyData.fehlzeiten.total}(${weeklyData.fehlzeiten.weekly.join(',')})`;

  const createClickableCell = (value: number, type: string, className: string = "") => (
    <span
      className={`cursor-pointer hover:underline ${className}`}
      onClick={() => onShowFilteredDetails(student, type)}
    >
      {value}
    </span>
  );

  const createClickableWeeklyCell = (displayText: string, weeklyData: number[], type: string) => (
    <span
      className="cursor-pointer hover:underline"
      onClick={() => onShowFilteredDetails(student, type, weeklyData)}
    >
      {displayText}
    </span>
  );

  return (
    <tr className={`${rowColor} transition-all duration-200`}>
      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 text-center">
        {index + 1}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 truncate">
        <span className="cursor-pointer hover:underline" onClick={onToggleDetails}>
          {student}
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            ({stats.verspaetungen_unentsch}/{stats.fehlzeiten_unentsch})
          </span>
        </span>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
        {stats.klasse}
      </td>
      <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400 border-r border-gray-200 dark:border-gray-700">
        {createClickableCell(stats.verspaetungen_entsch, 'verspaetungen_entsch', 'text-green-600 dark:text-green-400')}
      </td>
      <td className="px-4 py-3 text-sm text-center text-red-600 dark:text-red-400 border-r border-gray-200 dark:border-gray-700">
        {createClickableCell(stats.verspaetungen_unentsch, 'verspaetungen_unentsch', 'text-red-600 dark:text-red-400')}
      </td>
      <td className="px-4 py-3 text-sm text-center text-yellow-600 dark:text-yellow-400 border-r border-gray-200 dark:border-gray-700">
        {createClickableCell(stats.verspaetungen_offen, 'verspaetungen_offen', 'text-yellow-600 dark:text-yellow-400')}
      </td>
      <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400 border-r border-gray-200 dark:border-gray-700">
        {createClickableCell(stats.fehlzeiten_entsch, 'fehlzeiten_entsch', 'text-green-600 dark:text-green-400')}
      </td>
      <td className="px-4 py-3 text-sm text-center text-red-600 dark:text-red-400 border-r border-gray-200 dark:border-gray-700">
        {createClickableCell(stats.fehlzeiten_unentsch, 'fehlzeiten_unentsch', 'text-red-600 dark:text-red-400')}
      </td>
      <td className="px-4 py-3 text-sm text-center text-yellow-600 dark:text-yellow-400 border-r border-gray-200 dark:border-gray-700">
        {createClickableCell(stats.fehlzeiten_offen, 'fehlzeiten_offen', 'text-yellow-600 dark:text-yellow-400')}
      </td>
      {visibleColumns.includes('stats') && (
        <>
          <td className="px-4 py-3 text-sm text-center text-red-600 dark:text-red-400 border-r border-gray-200 dark:border-gray-700">
            {createClickableCell(schoolYearData.verspaetungen_unentsch, 'sj_verspaetungen', 'text-red-600 dark:text-red-400')}
          </td>
          <td className="px-4 py-3 text-sm text-center text-red-600 dark:text-red-400 border-r border-gray-200 dark:border-gray-700">
            {createClickableCell(schoolYearData.fehlzeiten_unentsch, 'sj_fehlzeiten', 'text-red-600 dark:text-red-400')}
          </td>
          <td className="px-4 py-3 text-sm text-center text-black dark:text-white border-r border-gray-200 dark:border-gray-700">
            {createClickableCell(schoolYearData.fehlzeiten_gesamt, 'sj_fehlzeiten_ges', 'text-black dark:text-white')}
          </td>
          <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
            {createClickableWeeklyCell(verspaetungenSum, weeklyData.verspaetungen.weekly, 'sum_verspaetungen')}
          </td>
          <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
            {createClickableWeeklyCell(fehlzeitenSum, weeklyData.fehlzeiten.weekly, 'sum_fehlzeiten')}
          </td>
        </>
      )}
      <td className="px-4 py-3 text-sm text-center border-gray-200 dark:border-gray-700">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onToggleChecked}
          className="form-checkbox h-4 w-4 text-gray-600 dark:text-gray-300"
          title="Schüler markieren"
        />
      </td>
    </tr>
  );
};

export default StudentTableRow;