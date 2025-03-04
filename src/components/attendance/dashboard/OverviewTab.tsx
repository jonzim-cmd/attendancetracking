import React from 'react';
import { 
  CARD_CLASSES, 
  CARD_TITLE_CLASSES, 
  DASHBOARD_CONTAINER_CLASSES
} from './styles';
import { 
  AttendanceLineChart, 
  AttendanceBarChart, 
  AttendancePieChart,
  InfoTile 
} from './ChartComponents';
import { StudentStats } from '@/types';

interface OverviewTabProps {
  weeklyTrends: any[];
  absenceTypes: any[];
  dayOfWeekData: any[];
  getFilteredStudents: () => [string, StudentStats][];
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  weeklyTrends,
  absenceTypes,
  dayOfWeekData,
  getFilteredStudents
}) => {
  return (
    <div className={DASHBOARD_CONTAINER_CLASSES}>
      {/* Wochentrends */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>Wöchentlicher Trend</h3>
        <AttendanceLineChart 
          data={weeklyTrends}
          lines={[
            { dataKey: "verspaetungen", name: "Verspätungen", color: "#8884d8", activeDot: true },
            { dataKey: "fehlzeiten", name: "Fehlzeiten", color: "#82ca9d", activeDot: false }
          ]}
        />
      </div>
      
      {/* Entschuldigungsstatus */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>Entschuldigungsstatus</h3>
        <AttendancePieChart 
          data={absenceTypes} 
          dataKey="value"
        />
      </div>
      
      {/* Statistik-Zusammenfassung */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>Schnellstatistik</h3>
        <div className="grid grid-cols-2 gap-4">
          <InfoTile 
            title="Gesamtzahl Verspätungen" 
            value={weeklyTrends.reduce((sum, week) => sum + week.verspaetungen, 0)}
          />
          <InfoTile 
            title="Gesamtzahl Fehltage" 
            value={weeklyTrends.reduce((sum, week) => sum + week.fehlzeiten, 0)}
          />
          <InfoTile 
            title="Erfasste Schüler" 
            value={getFilteredStudents().length}
          />
          <InfoTile 
            title="Unentschuldigte Einträge" 
            value={absenceTypes.find(type => type.name === 'Unentschuldigt')?.value || 0}
            className="text-red-600 dark:text-red-400"
          />
        </div>
      </div>
      
      {/* Wochentagsanalyse */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>Wochentagsanalyse</h3>
        <AttendanceBarChart 
          data={dayOfWeekData}
          bars={[
            { dataKey: "verspaetungen", name: "Verspätungen", color: "#8884d8" },
            { dataKey: "fehlzeiten", name: "Fehlzeiten", color: "#82ca9d" }
          ]}
        />
      </div>
    </div>
  );
};

export default OverviewTab;