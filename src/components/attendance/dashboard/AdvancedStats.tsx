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
  
  // Berechnung der Entschuldigungsquote
  const entschuldigungsQuote = totalAll > 0 
    ? Math.round((totalEntschuldigt / totalAll) * 100) 
    : 0;
  
  // Ermittle den "kritischsten" Tag aus den Wochentagsdaten
  const maxVerspaetungenTag = dayOfWeekData.length > 0 
    ? dayOfWeekData.reduce((max, day) => day.verspaetungen > max.verspaetungen ? day : max, dayOfWeekData[0]).name
    : 'N/A';
  
  const maxFehlzeitenTag = dayOfWeekData.length > 0 
    ? dayOfWeekData.reduce((max, day) => day.fehlzeiten > max.fehlzeiten ? day : max, dayOfWeekData[0]).name
    : 'N/A';
  
  // Analyse des Entschuldigungsverhaltens
  const schnellsteEntschuldigung = entschuldigungsverhalten.length > 0
    ? Math.min(...entschuldigungsverhalten.map(item => item.durchschnittlicheEntschuldigungstage || 999))
    : 'N/A';
  
  const langsamsteEntschuldigung = entschuldigungsverhalten.length > 0
    ? Math.max(...entschuldigungsverhalten.map(item => item.durchschnittlicheEntschuldigungstage || 0))
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

  // Analyse des Entschuldigungsverhaltens (für zukünftige Features)
  const analyzeEntschuldigungsVerhalten = () => {
    if (entschuldigungsverhalten.length === 0) return { früh: 0, spät: 0, nicht: 0 };
    
    let früh = 0, spät = 0, nicht = 0;
    
    entschuldigungsverhalten.forEach(item => {
      if (item.durchschnittlicheEntschuldigungstage <= 2) früh++;
      else if (item.durchschnittlicheEntschuldigungstage <= 5) spät++;
      else nicht++;
    });
    
    return { früh, spät, nicht };
  };
  
  // Wir berechnen die Werte, nutzen sie aber aktuell nicht in der UI
  // Diese Funktion kann für zukünftige Erweiterungen verwendet werden
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const entschuldigungsAnalyse = analyzeEntschuldigungsVerhalten();
  
  // Handlungsempfehlungen basierend auf den Daten
  const getRecommendation = () => {
    if (entschuldigungsQuote < 50) {
      return "Es besteht dringender Handlungsbedarf beim Entschuldigungsmanagement. Klare Regeln und Fristen sollten kommuniziert und durchgesetzt werden.";
    } else if (entschuldigungsQuote < 75) {
      return "Die Entschuldigungsquote kann verbessert werden. Besprechen Sie mit den Schülern die Wichtigkeit rechtzeitiger Entschuldigungen.";
    } else {
      return "Die Entschuldigungsquote ist gut. Für weitere Verbesserungen könnten Sie digitale Entschuldigungsprozesse etablieren.";
    }
  };
  
  // Muster in den Wochentagsdaten
  const getPatternsInsight = () => {
    if (maxVerspaetungenTag === maxFehlzeitenTag) {
      return `${maxVerspaetungenTag} ist sowohl für Verspätungen als auch für Fehltage kritisch. Prüfen Sie den Stundenplan für diesen Tag.`;
    } else {
      return `${maxVerspaetungenTag} zeigt die meisten Verspätungen, während ${maxFehlzeitenTag} die meisten Fehltage aufweist.`;
    }
  };
  
  return (
    <>
      {/* Muster-Analyse */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>Musteranalyse</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <InsightTile 
            title="Wochentagsmuster" 
            content={getPatternsInsight()}
          />
          <InsightTile 
            title="Entschuldigungsverhalten" 
            content={`Die Entschuldigungsquote liegt bei ${entschuldigungsQuote}%. ${
              entschuldigungsQuote >= 75 
                ? 'Dies ist ein guter Wert.' 
                : entschuldigungsQuote >= 50 
                  ? 'Hier besteht Verbesserungspotential.' 
                  : 'Dies ist ein kritischer Wert, der Handlungsbedarf anzeigt.'
            }`}
          />
        </div>
        
        {entschuldigungsverhalten.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <InsightTile 
              title="Entschuldigungsgeschwindigkeit" 
              content={`Die durchschnittliche Entschuldigungszeit variiert zwischen ${
                schnellsteEntschuldigung === 'N/A' ? '?' : schnellsteEntschuldigung
              } und ${
                langsamsteEntschuldigung === 'N/A' ? '?' : langsamsteEntschuldigung
              } Tagen.`}
            />
          </div>
        )}
      </div>

      {/* Handlungsempfehlungen */}
      <div className={CARD_CLASSES}>
        <h3 className={CARD_TITLE_CLASSES}>Handlungsempfehlungen</h3>
        <div className="p-4 mb-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
          <p className="text-gray-700 dark:text-gray-300">{getRecommendation()}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Kritische Wochentage</h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Prüfen Sie den Stundenplan für {maxVerspaetungenTag} und {maxFehlzeitenTag}, 
              um mögliche Ursachen für gehäufte Abwesenheiten zu identifizieren.
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Entschuldigungsprozess</h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {entschuldigungsQuote < 75 
                ? "Setzen Sie klare Fristen und vereinfachen Sie den Entschuldigungsprozess. Digitale Lösungen können helfen."
                : "Ihr Entschuldigungsprozess funktioniert gut. Prüfen Sie individuelle Fälle mit häufigen unentschuldigten Fehlzeiten."}
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Präventive Maßnahmen</h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Identifizieren Sie frühzeitig Schüler mit erhöhten unentschuldigten Fehlzeiten und führen 
              Sie Einzelgespräche, um Probleme zu adressieren, bevor sie sich verschärfen.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvancedStats;