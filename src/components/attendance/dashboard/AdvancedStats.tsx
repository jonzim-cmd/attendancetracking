import React from 'react';
import { 
  CARD_CLASSES, 
  CARD_TITLE_CLASSES
} from './styles';
import { InsightTile } from './ChartComponents';

interface AdvancedStatsProps {
  entschuldigungsverhalten: any[];
  dayOfWeekData: any[];
  absenceTypes: any[];
}

const AdvancedStats: React.FC<AdvancedStatsProps> = ({
  entschuldigungsverhalten,
  dayOfWeekData,
  absenceTypes
}) => {
  // Berechnung wichtiger Kennzahlen für die Analysen
  const totalEntschuldigt = absenceTypes.find(type => type.name === 'Entschuldigt')?.value || 0;
  const totalUnentschuldigt = absenceTypes.find(type => type.name === 'Unentschuldigt')?.value || 0;
  const totalOffen = absenceTypes.find(type => type.name === 'Offen')?.value || 0;
  const totalAll = totalEntschuldigt + totalUnentschuldigt + totalOffen;
  
  // Berechnung der Unentschuldigungsquote
  const unentschuldigungsQuote = totalAll > 0 
    ? Math.round((totalUnentschuldigt / totalAll) * 100) 
    : 0;
  
  // Updated thresholds to be more strict
  const getQuoteEvaluation = (quote: number) => {
    if (quote <= 10) return 'Dies ist ein guter Wert.';
    if (quote <= 20) return 'Hier besteht leichtes Verbesserungspotential.';
    return 'Dies ist ein kritischer Wert, der Handlungsbedarf anzeigt.';
  };
  
  // Ermittle die kritischsten Tage aus den Wochentagsdaten
  const maxVerspaetungenTag = dayOfWeekData.length > 0 
    ? dayOfWeekData.reduce((max, day) => day.verspaetungen > max.verspaetungen ? day : max, dayOfWeekData[0]).name
    : 'N/A';
  
  const maxFehlzeitenTag = dayOfWeekData.length > 0 
    ? dayOfWeekData.reduce((max, day) => day.fehlzeitenUnentsch > max.fehlzeitenUnentsch ? day : max, dayOfWeekData[0]).name
    : 'N/A';
  
  // Trend für unentschuldigte Fehlzeiten
  const unentschuldigteTrend = entschuldigungsverhalten.length >= 2
    ? entschuldigungsverhalten[entschuldigungsverhalten.length - 1].unentschuldigtRate - 
      entschuldigungsverhalten[0].unentschuldigtRate
    : 0;

  const trendText = unentschuldigteTrend > 0 
    ? `Anstieg um ${unentschuldigteTrend.toFixed(1)}%` 
    : unentschuldigteTrend < 0 
      ? `Rückgang um ${Math.abs(unentschuldigteTrend).toFixed(1)}%` 
      : 'Keine Veränderung';
      
  const trendDirection = unentschuldigteTrend > 0 
    ? 'negative' 
    : unentschuldigteTrend < 0 
      ? 'positive' 
      : 'neutral';
  
  // Muster in den Wochentagsdaten
  const getPatternsInsight = () => {
    if (maxVerspaetungenTag === maxFehlzeitenTag) {
      return `${maxVerspaetungenTag} ist sowohl für Verspätungen als auch für unentschuldigte Fehltage kritisch. Prüfen Sie den Stundenplan für diesen Tag.`;
    } else {
      return `${maxVerspaetungenTag} zeigt die meisten Verspätungen, während ${maxFehlzeitenTag} die meisten unentschuldigten Fehltage aufweist.`;
    }
  };
  
  return (
    <>
      {/* Muster-Analyse */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>Musteranalyse</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InsightTile 
            title="Wochentagsmuster" 
            content={getPatternsInsight()}
          />
          <InsightTile 
            title="Unentschuldigungsquote" 
            content={`Die Unentschuldigungsquote bei Fehltagen liegt bei ${unentschuldigungsQuote}%. ${getQuoteEvaluation(unentschuldigungsQuote)}`}
          />
        </div>
        
        {entschuldigungsverhalten.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <InsightTile 
              title="Trend unentschuldigte Fehlzeiten" 
              content={`${trendText} im Betrachtungszeitraum. ${
                trendDirection === 'positive' 
                  ? 'Dies ist eine positive Entwicklung.'
                  : trendDirection === 'negative'
                    ? 'Dies ist eine negative Entwicklung, die Aufmerksamkeit erfordert.'
                    : 'Die Situation ist stabil.'
              }`}
            />
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
              <h4 className="font-medium mb-1 text-gray-800 dark:text-gray-100">Erklärung Unentschuldigungsquote</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Die Unentschuldigungsquote bezeichnet den Anteil unentschuldigter Fehltage im Verhältnis zu allen Fehltagen. 
                Eine Quote über 25% ist problematisch und sollte Anlass für eine genauere Betrachtung des Entschuldigungsverhaltens sein.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdvancedStats;