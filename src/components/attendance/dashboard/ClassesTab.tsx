// src/components/attendance/dashboard/ClassesTab.tsx
import React from 'react';
import { 
  CARD_CLASSES, 
  CARD_TITLE_CLASSES, 
  TABLE_HEADER_CLASSES,
  TABLE_CELL_CLASSES
} from './styles';
import { AttendanceBarChart } from './ChartComponents';

interface ClassesTabProps {
  classComparison: any[];
}

const ClassesTab: React.FC<ClassesTabProps> = ({ classComparison }) => {
  return (
    <div className="grid grid-cols-1 gap-6 pb-6">
      {/* Klassenvergleich */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>Klassenvergleich</h3>
        <div className="h-64">
          <AttendanceBarChart 
            data={classComparison}
            bars={[
              { dataKey: "verspaetungen", name: "Verspätungen", color: "#8884d8" },
              { dataKey: "fehlzeiten", name: "Fehlzeiten", color: "#82ca9d" }
            ]}
          />
        </div>
      </div>
      
      {/* Klassendetails */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>Klassendetails</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className={TABLE_HEADER_CLASSES}>
                  Klasse
                </th>
                <th className={`${TABLE_HEADER_CLASSES} text-center`}>
                  Verspätungen
                </th>
                <th className={`${TABLE_HEADER_CLASSES} text-center`}>
                  Fehltage
                </th>
                <th className={`${TABLE_HEADER_CLASSES} text-center`}>
                  Gesamt
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {classComparison.map((classData, index) => (
                <tr key={classData.name} className={index % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-700'}>
                  <td className={`${TABLE_CELL_CLASSES} font-medium text-gray-900 dark:text-white`}>
                    {classData.name}
                  </td>
                  <td className={`${TABLE_CELL_CLASSES} text-center text-gray-900 dark:text-white`}>
                    {classData.verspaetungen}
                  </td>
                  <td className={`${TABLE_CELL_CLASSES} text-center text-gray-900 dark:text-white`}>
                    {classData.fehlzeiten}
                  </td>
                  <td className={`${TABLE_CELL_CLASSES} text-center text-gray-900 dark:text-white`}>
                    {classData.verspaetungen + classData.fehlzeiten}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClassesTab;