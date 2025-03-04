import React from 'react';
import { 
  CARD_CLASSES, 
  CARD_TITLE_CLASSES,
  CHART_CONTAINER_CLASSES 
} from './styles';
import { 
  AttendanceLineChart, 
  AttendanceBarChart
} from './ChartComponents';

interface ComparisonViewProps {
  comparisonData: any[];
  selectedEntities: string[];
  entityType: 'classes' | 'students';
  onReturnToDashboard: () => void;
  startDate: string;
  endDate: string;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({
  comparisonData,
  selectedEntities,
  entityType,
  onReturnToDashboard,
  startDate,
  endDate
}) => {
  // Formatiere den Vergleichstitel basierend auf dem Typ
  const comparisonTitle = entityType === 'classes' ? 'Klassenvergleich' : 'Schülervergleich';
  
  // Extrahiere die Daten für den Vergleich
  const verspaetungenData = comparisonData.filter(data => data.type === 'verspaetungen');
  const fehlzeitenData = comparisonData.filter(data => data.type === 'fehlzeiten');
  const entschuldigungData = comparisonData.filter(data => data.type === 'entschuldigung');
  const trendData = comparisonData.filter(data => data.type === 'trend');
  
  // Generiere zufällige aber konsistente Farben für jede Entität
  const getEntityColor = (index: number) => {
    // Nicht-blaue Farbpalette für Konsistenz mit den anderen Diagrammen
    const colors = [
      "#9333ea", // Lila
      "#22c55e", // Grün
      "#ef4444", // Rot
      "#f97316", // Orange
      "#a855f7", // Pink
      "#84cc16", // Lime
      "#eab308", // Gelb
      "#f43f5e"  // Rosa
    ];
    return colors[index % colors.length];
  };
  
  // Konfiguriere Linien für das Trenddiagramm
  const trendLines = selectedEntities.map((entity, index) => ({
    dataKey: entity,
    name: entity,
    color: getEntityColor(index),
    activeDot: true
  }));
  
  return (
    <div className="space-y-4">
      {/* Header mit Zurück-Button */}
      <div className={CARD_CLASSES}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {comparisonTitle}: {selectedEntities.length} {entityType === 'classes' ? 'Klassen' : 'Schüler'}
          </h2>
          <button
            onClick={onReturnToDashboard}
            className="px-3 py-1 bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark rounded"
          >
            Zurück zum Dashboard
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Zeitraum: {new Date(startDate).toLocaleDateString('de-DE')} - {new Date(endDate).toLocaleDateString('de-DE')}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Verspätungen im Vergleich */}
        <div className={CARD_CLASSES}>
          <h3 className={CARD_TITLE_CLASSES}>Verspätungen im Vergleich</h3>
          <div className={CHART_CONTAINER_CLASSES}>
            {verspaetungenData.length > 0 ? (
              <AttendanceBarChart 
                data={[{ name: 'Verspätungen', ...Object.fromEntries(selectedEntities.map(entity => [entity, verspaetungenData.find(d => d.entity === entity)?.verspaetungen || 0])) }]}
                bars={selectedEntities.map((entity, index) => ({
                  dataKey: entity,
                  name: entity,
                  color: getEntityColor(index)
                }))}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Keine Daten verfügbar
              </div>
            )}
          </div>
        </div>
        
        {/* Fehltage im Vergleich */}
        <div className={CARD_CLASSES}>
          <h3 className={CARD_TITLE_CLASSES}>Fehltage im Vergleich</h3>
          <div className={CHART_CONTAINER_CLASSES}>
            {fehlzeitenData.length > 0 ? (
              <AttendanceBarChart 
                data={[{ name: 'Fehltage', ...Object.fromEntries(selectedEntities.map(entity => [entity, fehlzeitenData.find(d => d.entity === entity)?.fehlzeiten || 0])) }]}
                bars={selectedEntities.map((entity, index) => ({
                  dataKey: entity,
                  name: entity,
                  color: getEntityColor(index)
                }))}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Keine Daten verfügbar
              </div>
            )}
          </div>
        </div>
        
        {/* Entschuldigungsverhalten */}
        <div className={CARD_CLASSES}>
          <h3 className={CARD_TITLE_CLASSES}>Entschuldigungsverhalten</h3>
          <div className={CHART_CONTAINER_CLASSES}>
            {entschuldigungData.length > 0 ? (
              <AttendanceBarChart 
                data={[
                  { 
                    name: 'Entschuldigt', 
                    ...Object.fromEntries(selectedEntities.map(entity => [
                      entity, 
                      entschuldigungData.find(d => d.entity === entity)?.entschuldigt || 0
                    ]))
                  },
                  { 
                    name: 'Unentschuldigt', 
                    ...Object.fromEntries(selectedEntities.map(entity => [
                      entity, 
                      entschuldigungData.find(d => d.entity === entity)?.unentschuldigt || 0
                    ]))
                  },
                  { 
                    name: 'Offen', 
                    ...Object.fromEntries(selectedEntities.map(entity => [
                      entity, 
                      entschuldigungData.find(d => d.entity === entity)?.offen || 0
                    ]))
                  }
                ]}
                bars={selectedEntities.map((entity, index) => ({
                  dataKey: entity,
                  name: entity,
                  color: getEntityColor(index)
                }))}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Keine Daten verfügbar
              </div>
            )}
          </div>
        </div>
        
        {/* Trends über Zeit */}
        <div className={CARD_CLASSES}>
          <h3 className={CARD_TITLE_CLASSES}>Trends über Zeit</h3>
          <div className={CHART_CONTAINER_CLASSES}>
            {trendData.length > 0 ? (
              <AttendanceLineChart 
                data={trendData[0].data}
                lines={trendLines}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Keine Daten verfügbar
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Detaillierte Statistiktabelle */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>Detaillierte Statistik</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {entityType === 'classes' ? 'Klasse' : 'Schüler'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Verspätungen
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fehltage
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Entschuldigt %
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Unentschuldigt %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {selectedEntities.map((entity, index) => {
                const verspaetungen = verspaetungenData.find(d => d.entity === entity)?.verspaetungen || 0;
                const fehlzeiten = fehlzeitenData.find(d => d.entity === entity)?.fehlzeiten || 0;
                const entschuldigt = entschuldigungData.find(d => d.entity === entity)?.entschuldigt || 0;
                const unentschuldigt = entschuldigungData.find(d => d.entity === entity)?.unentschuldigt || 0;
                const offen = entschuldigungData.find(d => d.entity === entity)?.offen || 0;
                const total = entschuldigt + unentschuldigt + offen;
                
                return (
                  <tr key={entity} className={index % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-700'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {entity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">
                      {verspaetungen}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">
                      {fehlzeiten}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">
                      {total > 0 ? Math.round((entschuldigt / total) * 100) : 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">
                      {total > 0 ? Math.round((unentschuldigt / total) * 100) : 0}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;