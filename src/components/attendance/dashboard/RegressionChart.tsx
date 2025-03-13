// src/components/attendance/dashboard/RegressionChart.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { prepareRegressionData, RegressionResult, aggregateAttendanceDataForRegression } from './regressionUtils';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceDot, ReferenceLine
} from 'recharts';
import { CARD_CLASSES } from './styles';
import InfoButton from '@/components/ui/InfoButton';
import { CHART_EXPLANATIONS } from './chartExplanations';

/**
 * Props für die Regressionsanalyse-Komponente
 */
interface RegressionChartProps {
  // Hauptdaten und Kontext
  attendanceOverTime: any[];                    // Zeitreihen-Daten aus dem Dashboard
  schoolYearDetailedData: Record<string, any>;  // Detaillierte Daten für das ganze Schuljahr
  weeklyDetailedData: Record<string, any>;      // Detaillierte Daten nach Wochen
  allStudentStats: Record<string, any>;         // Statistiken für alle Schüler (für Klassenzuordnung)
  
  // Filter und Auswahl
  selectedStudent?: string;                     // Ausgewählter Schüler (wenn vorhanden)
  selectedClass?: string;                       // Ausgewählte Klasse (wenn vorhanden)
  
  // Layout
  className?: string;                           // Zusätzliche CSS-Klassen
}

/**
 * Komponente zur Visualisierung der Regressionsanalyse
 * für Schüler- oder Klassenauswertungen
 */
const RegressionChart: React.FC<RegressionChartProps> = ({
  attendanceOverTime,
  schoolYearDetailedData,
  weeklyDetailedData,
  allStudentStats,
  selectedStudent,
  selectedClass,
  className = ""
}) => {
  // State für die Regressionsanalyse
  const [dataType, setDataType] = useState<'verspaetungen' | 'fehlzeiten'>('fehlzeiten');
  const [excludeOutliers, setExcludeOutliers] = useState<boolean>(false);
  const [useRelativeValues, setUseRelativeValues] = useState<boolean>(true); // Neue State-Variable für relative Werte
  
  // State für Ergebnisse
  const [chartData, setChartData] = useState<any[]>([]);
  const [regressionResult, setRegressionResult] = useState<RegressionResult>({
    slope: 0,
    intercept: 0,
    rSquared: 0,
    trendDescription: 'Keine Daten',
    outliers: []
  });
  
  // Status für Daten
  const [noDataAvailable, setNoDataAvailable] = useState<boolean>(false);
  
  // Ref für den scrollbaren Container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Bestimmung des ausgewählten Entity (Schüler oder Klasse)
  const selectedEntity = selectedStudent 
    ? selectedStudent 
    : selectedClass 
      ? selectedClass 
      : null;
  
  const entityType = selectedStudent 
    ? 'student' 
    : selectedClass 
      ? 'class' 
      : null;
  
  // Daten für Regressionsanalyse vorbereiten, wenn sich Eingabedaten oder Parameter ändern
  useEffect(() => {
    console.log(`RegressionChart: Verarbeite Daten mit Parametern: dataType=${dataType}, excludeOutliers=${excludeOutliers}, useRelativeValues=${useRelativeValues}`);
    console.log(`RegressionChart: Ausgewählte${selectedStudent ? 'r Schüler' : ' Klasse'}: ${selectedStudent || selectedClass}`);
    
    // Fallback auf attendanceOverTime, wenn keine detaillierten Daten vorhanden sind
    if (!schoolYearDetailedData && !weeklyDetailedData && (!attendanceOverTime || attendanceOverTime.length === 0)) {
      console.log("RegressionChart: Keine Daten verfügbar");
      setChartData([]);
      setRegressionResult({
        slope: 0,
        intercept: 0,
        rSquared: 0,
        trendDescription: 'Keine Daten',
        outliers: []
      });
      setNoDataAvailable(true);
      return;
    }
    
    let processedData: any[] = [];
    
    // Immer die attendanceOverTime Daten verwenden
    // Diese sind bereits gefiltert durch Dashboard und Filter-Kontext
    processedData = [...attendanceOverTime];
    
    if (processedData.length === 0) {
      console.log("RegressionChart: Keine Daten nach Verarbeitung verfügbar");
      setChartData([]);
      setRegressionResult({
        slope: 0,
        intercept: 0,
        rSquared: 0,
        trendDescription: 'Keine Daten',
        outliers: []
      });
      setNoDataAvailable(true);
      return;
    }
    
    console.log(`RegressionChart: ${processedData.length} Datenpunkte nach Verarbeitung gefunden`);
    
    // Regression berechnen - jetzt mit explizitem useRelativeValues
    const { dataWithRegression, regressionResult } = prepareRegressionData(
      processedData,
      dataType,
      excludeOutliers,
      useRelativeValues // Explizite Verwendung der State-Variable
    );
    
    setChartData(dataWithRegression);
    setRegressionResult(regressionResult);
    setNoDataAvailable(false);
    
    console.log(`RegressionChart: Regressionsergebnisse - slope=${regressionResult.slope.toFixed(2)}, rSquared=${regressionResult.rSquared.toFixed(2)}, description="${regressionResult.trendDescription}"`);
  }, [
    attendanceOverTime, 
    schoolYearDetailedData, 
    weeklyDetailedData,
    selectedStudent, 
    selectedClass, 
    dataType, 
    excludeOutliers,
    useRelativeValues, // Abhängigkeit
    allStudentStats
  ]);
  
  // Effect für initiales Scrollen zum Ende des Charts
  useEffect(() => {
    if (scrollContainerRef.current && chartData.length > 0) {
      const container = scrollContainerRef.current;
      // Scrollen zum Ende des Containers
      setTimeout(() => {
        container.scrollLeft = container.scrollWidth - container.clientWidth;
      }, 100); // Leichte Verzögerung, um sicherzustellen, dass das Rendering abgeschlossen ist
    }
  }, [chartData]);
  
  // Optimierte Daten für die Anzeige vorbereiten
  const optimizedChartData = useMemo(() => {
    // Sicherstellen, dass die Regressionslinie keine NaN oder null-Werte enthält
    return chartData.map(point => ({
      ...point,
      regressionLine: point.regressionLine !== null && !isNaN(point.regressionLine) 
        ? point.regressionLine 
        : undefined
    }));
  }, [chartData]);
  
  const sortedChartData = useMemo(() => {
    return [...optimizedChartData].sort((a, b) => {
      // Prüfe zuerst, ob einer der Punkte ein Vorhersagepunkt ist
      // Vorhersagen sollten immer am Ende stehen
      if (a.isPrediction && !b.isPrediction) return 1;
      if (!a.isPrediction && b.isPrediction) return -1;
      
      // Versuche, Wochennummern zu extrahieren
      const weekA = a.name?.match(/KW\s*(\d+)/i)?.[1];
      const weekB = b.name?.match(/KW\s*(\d+)/i)?.[1];
      
      if (weekA && weekB) {
        const weekNumA = parseInt(weekA);
        const weekNumB = parseInt(weekB);
        
        // KORRIGIERTE SCHLÜSSEL-LOGIK:
        // KW35-KW36 kommen ZUERST (35-36)
        // KW37-KW52 kommen als ZWEITES (137-152)
        // KW1-KW34 kommen als DRITTES (201-234)
        let sortKeyA, sortKeyB;
        
        if (weekNumA >= 35 && weekNumA <= 36) sortKeyA = weekNumA;
        else if (weekNumA >= 37) sortKeyA = weekNumA + 100;
        else sortKeyA = weekNumA + 200;
        
        if (weekNumB >= 35 && weekNumB <= 36) sortKeyB = weekNumB;
        else if (weekNumB >= 37) sortKeyB = weekNumB + 100;
        else sortKeyB = weekNumB + 200;
        
        return sortKeyA - sortKeyB;
      }
      
      // Falls es sich um Monate handelt, sortiere basierend auf dem Schuljahr (Sep-Aug)
      const monthA = a.name?.match(/^(Jan|Feb|Mar|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)/)?.[1];
      const monthB = b.name?.match(/^(Jan|Feb|Mar|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)/)?.[1];
      
      if (monthA && monthB) {
        const monthOrder: Record<string, number> = {
          'Sep': 1, 'Okt': 2, 'Nov': 3, 'Dez': 4,
          'Jan': 5, 'Feb': 6, 'Mar': 7, 'Apr': 8,
          'Mai': 9, 'Jun': 10, 'Jul': 11, 'Aug': 12
        };
        
        return (monthOrder[monthA] || 0) - (monthOrder[monthB] || 0);
      }
      
      // Wenn weder Wochen noch Monate, verwende sortKey falls vorhanden
      if (a.sortKey !== undefined && b.sortKey !== undefined) {
        return a.sortKey - b.sortKey;
      }
      
      // Fallback: verwende Timestamps, falls vorhanden
      if (a.timestamp && b.timestamp) {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      
      // Letzte Möglichkeit: nach Namen sortieren
      return String(a.name).localeCompare(String(b.name));
    });
  }, [optimizedChartData]);
  
  // Keine Daten verfügbar
  if (noDataAvailable || !sortedChartData || sortedChartData.length === 0) {
    return (
      <div className={`${CARD_CLASSES} ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Regressionsanalyse
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {selectedEntity 
            ? `Keine Daten verfügbar für ${entityType === 'student' ? 'den Schüler' : 'die Klasse'} "${selectedEntity}".`
            : 'Bitte wählen Sie einen Schüler oder eine Klasse aus, um die Regressionsanalyse anzuzeigen.'}
          <p className="mt-2 text-sm">
            Die Regressionsanalyse benötigt mindestens 3 Datenpunkte.
          </p>
        </div>
      </div>
    );
  }
  
  // Farben basierend auf dem Datentyp
  const mainColor = dataType === 'verspaetungen' ? '#9333ea' : '#3b82f6';
  const regressionColor = dataType === 'verspaetungen' ? '#d946ef' : '#60a5fa';
  const outlierColor = dataType === 'verspaetungen' ? '#f472b6' : '#93c5fd';
  const predictionColor = dataType === 'verspaetungen' ? '#c026d3' : '#3b82f6';
  
  // Funktion zur Kontrolle, welche Labels auf der X-Achse angezeigt werden sollen
  const shouldShowLabel = (value: string, index: number): boolean => {
    // Bei breiten Displays oder wenigen Datenpunkten alle Labels anzeigen
    if (chartData.length <= 15) return true;
    
    // Ansonsten jedes n-te Label anzeigen, abhängig von der Datenmenge
    const showEvery = chartData.length > 30 ? 4 : chartData.length > 20 ? 3 : 2;
    return index % showEvery === 0;
  };
  
  // Formatierung für X-Achse
  const formatXAxis = (value: string, index: number) => {
    if (value === 'Prognose') return 'Prognose';
    
    // Labels überspringen wenn nötig, um Überlappungen zu vermeiden
    if (!shouldShowLabel(value, index)) return '';
    
    // Wenn periodLabel vorhanden ist, diesen verwenden
    const dataPoint = chartData.find(p => p.name === value);
    if (dataPoint?.periodLabel) {
      return dataPoint.periodLabel;
    }
    return value;
  };
  
  // Benutzerdefinierter Tooltip mit formatierter Anzeige
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Finde den entsprechenden Datenpunkt anhand des Labels
      const dataPoint = chartData.find(p => p.name === label);
      
      // Prüfe, ob es ein Prognosepunkt ist
      const isPrediction = label === 'Prognose' || dataPoint?.isPrediction;
      
      // Datumsbereich für normale Datenpunkte
      const dateRange = !isPrediction && dataPoint?.dateRange ? dataPoint.dateRange : '';
      
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1 text-base">
            {isPrediction ? 'Prognose (nächste Periode)' : formatXAxis(label, 0)}
          </p>
          {dateRange && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{dateRange}</p>
          )}
          
          <div className="flex flex-col space-y-1">
          {payload.map((entry: any, index: number) => {
            // Formatierte Werte anzeigen - Nur wenn sie existieren
            if (entry.value === null || entry.value === undefined) return null;
            
            // Angepasste Formatierung basierend auf dem Modus (relativ/absolut)
            const value = typeof entry.value === 'number' 
              ? (entry.dataKey === 'displayValue' && dataPoint?.isRelativeMode
                ? entry.value.toFixed(3)  // Mehr Dezimalstellen für relative Werte
                : entry.value.toFixed(1)) // Standardformat für absolute Werte
              : entry.value;
            
            let displayName = entry.name;
            if (entry.dataKey === 'regressionLine' && isPrediction) {
              displayName = 'Prognosewert';
            }
              
            return (
              <div key={`item-${index}`} className="flex items-center">
                <div className="w-3 h-3 mr-2" style={{ backgroundColor: entry.color }}></div>
                <span className="text-gray-700 dark:text-gray-300 text-sm">
                  {displayName}: {value}
                </span>
              </div>
            );
          })}
          </div>
          
          {/* Schultagsinformation, falls verfügbar */}
          {useRelativeValues && dataPoint?.schoolDays && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Schultage in dieser Periode: {dataPoint.schoolDays}
            </div>
          )}
          
          {/* Relativer Wert, falls verfügbar */}
          {useRelativeValues && dataPoint?.relativeValue !== undefined && !isPrediction && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Pro Schultag: {dataPoint.relativeValue.toFixed(3)}
            </div>
          )}
          
          {/* Ausreißer-Info, falls relevant */}
          {dataPoint?.isOutlier && !isPrediction && (
            <div className="mt-1 text-xs font-medium text-orange-500 dark:text-orange-400">
              Ausreißer: Deutliche Abweichung vom Trend
            </div>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Formatiert die Ausgabe für die Steigung
  const formatSlope = (slope: number): string => {
    const sign = slope >= 0 ? '+' : '';
    return `${sign}${slope.toFixed(2)}`;
  };
  
  // Bestimmt die Farbe für den Trend basierend auf dem Kontext
  const getTrendColor = (slope: number, isVerspaetung: boolean): string => {
    // Bei Verspaetungen ist ein negativer Trend positiv (weniger Verspätungen)
    // Bei Fehlzeiten ist ein negativer Trend positiv (weniger Fehlzeiten)
    const isPositiveTrend = slope < 0;
    
    if (Math.abs(slope) < 0.05) return 'text-gray-600 dark:text-gray-400'; // Neutral
    return isPositiveTrend ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };
  
  // Titeltext basierend auf der Auswahl generieren
  const getTitleText = () => {
    if (selectedStudent) {
      return `Regressionsanalyse: ${selectedStudent.split(',')[0]} ${selectedStudent.split(',')[1]}`;
    } else if (selectedClass) {
      return `Regressionsanalyse: Klasse ${selectedClass}`;
    }
    return 'Regressionsanalyse';
  };
  
  const hasPrediction = sortedChartData.some(item => item.isPrediction);
  
  // Berechne die geeignete Breite für das Chart basierend auf den Datenpunkten
  const getChartWidth = () => {
    if (!sortedChartData || sortedChartData.length === 0) return '100%';
    
    // Für viele Datenpunkte, scrollbar machen
    const minWidth = 800; // Minimale Breite in Pixeln
    const pointWidth = 60; // Breite pro Datenpunkt in Pixeln
    
    // Immer scrollbar machen, wenn wir genug Datenpunkte haben
    if (sortedChartData.length > 8) {
      return `${Math.max(sortedChartData.length * pointWidth, minWidth)}px`;
    }
    
    // Für wenige Datenpunkte, an Container anpassen
    return '100%';
  };
  
  return (
    <div className={`${CARD_CLASSES} ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {getTitleText()}
            </h3>
          </div>
          <InfoButton 
            title={CHART_EXPLANATIONS.regression.title} 
            content={CHART_EXPLANATIONS.regression.content} 
            className="ml-2"
          />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Umschaltung zwischen Verspätungen und Fehltagen */}
          <div className="flex items-center gap-1">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={dataType === 'verspaetungen'} 
                onChange={() => setDataType(dataType === 'verspaetungen' ? 'fehlzeiten' : 'verspaetungen')}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full ${dataType === 'verspaetungen' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${dataType === 'verspaetungen' ? 'translate-x-1' : 'translate-x-6'}`}></span>
              </div>
              <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {dataType === 'verspaetungen' ? 'Verspätungen' : 'Fehltage'}
              </span>
            </label>
          </div>
          
          {/* Option für Ausreißer auszuschließen */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={excludeOutliers}
              onChange={() => setExcludeOutliers(!excludeOutliers)}
              className="mr-1.5 h-3.5 w-3.5"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Ausreißer ignorieren</span>
          </label>
          
          {/* OPTION: Relative Werte (pro Schultag) */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useRelativeValues}
              onChange={() => setUseRelativeValues(!useRelativeValues)}
              className="mr-1.5 h-3.5 w-3.5"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Pro Schultag</span>
          </label>
        </div>
      </div>
      
      {/* Regressionsergebnisse */}
      <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="bg-gray-100 dark:bg-transparent border border-gray-200 dark:border-gray-700 rounded rounded p-2 text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400">Trend</p>
          <p className={`text-sm font-medium ${getTrendColor(regressionResult.slope, dataType === 'verspaetungen')}`}>
            {regressionResult.trendDescription}
          </p>
        </div>
        
        <div className="bg-gray-100 dark:bg-transparent border border-gray-200 dark:border-gray-700 rounded rounded p-2 text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400">Steigung</p>
          <p className={`text-sm font-medium ${getTrendColor(regressionResult.slope, dataType === 'verspaetungen')}`}>
            {formatSlope(regressionResult.slope)} pro Zeitraum
          </p>
        </div>
        
        <div className="bg-gray-100 dark:bg-transparent p-2 border border-gray-200 dark:border-gray-700 rounded rounded p-2 text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400">Bestimmtheitsmaß</p>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            R² = {regressionResult.rSquared.toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="h-72 w-full overflow-x-auto" ref={scrollContainerRef}>
        <div style={{ 
          width: getChartWidth(),
          minWidth: '100%', 
          height: '100%' 
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={sortedChartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#777" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'currentColor', fontSize: 14 }}
                axisLine={{ stroke: '#777' }}
                tickLine={{ stroke: '#777' }}
                height={30}
                tickFormatter={formatXAxis}
                interval={0} // Erzwingt die Anzeige aller Labels, unser angepasster Formatter übernimmt das Filtern
                type="category" // Diese Eigenschaft ist der Schlüssel
              />
              <YAxis 
                tick={{ fill: 'currentColor', fontSize: 14 }}
                axisLine={{ stroke: '#777' }}
                tickLine={{ stroke: '#777' }}
                allowDecimals={useRelativeValues} // Dezimalstellen nur für relative Werte
                tickFormatter={(value) => {
                  if (useRelativeValues) {
                    // Bei relativen Werten zeigen wir bis zu 2 Dezimalstellen an
                    return value.toFixed(2);
                  }
                  return Math.round(value).toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                wrapperStyle={{ paddingTop: '10px', fontSize: '14px' }}
              />
              
              {/* Horizontale Nulllinie */}
              <ReferenceLine y={0} stroke="#777" strokeDasharray="3 3" />
              
              {/* Vertikale Linie für Prognose */}
              {hasPrediction && (
                <ReferenceLine 
                  x="Prognose" 
                  stroke="#999" 
                  strokeDasharray="5 5" 
                  label={{ 
                    value: "Prognose", 
                    position: "insideTopRight",
                    fill: 'currentColor'
                  }} 
                />
              )}
              
              {/* Originaldaten - Verwende displayValue anstelle von dataType */}
              <Line 
                type="monotone" 
                dataKey="displayValue" 
                name={dataType === 'verspaetungen' ? 
                  (useRelativeValues ? 'Verspätungen pro Schultag' : 'Verspätungen') : 
                  (useRelativeValues ? 'Fehltage pro Schultag' : 'Fehltage')} 
                stroke={mainColor} 
                activeDot={{ r: 8 }}
                dot={{ r: 4 }}
                connectNulls={false}
              />
              
              {/* Regressionslinie */}
              <Line 
                type="monotone" 
                dataKey="regressionLine" 
                name="Regressionslinie" 
                stroke={regressionColor} 
                strokeWidth={3}
                activeDot={false}
                dot={false}
                // Verbinden über Nullwerte hinweg für durchgängige Linie
                connectNulls={true}
              />
              
              {/* Ausreißer markieren */}
              {sortedChartData
                .filter(point => point.isOutlier && !point.isPrediction)
                .map((point, index) => (
                  <ReferenceDot
                    key={`outlier-${index}`}
                    x={point.name}
                    y={point[dataType]}
                    r={6}
                    fill={outlierColor}
                    stroke="white"
                    strokeWidth={1}
                  />
                ))}
              
              {/* Prognosepunkt */}
              {sortedChartData
                .filter(point => point.isPrediction)
                .map((point, index) => (
                  <ReferenceDot
                    key={`prediction-${index}`}
                    x={point.name}
                    y={point.regressionLine}
                    r={7}
                    fill={predictionColor}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RegressionChart;