// src/components/attendance/dashboard/MovingAverageChart.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { prepareMovingAverageData, aggregateAttendanceData } from './movingAverageUtils';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceDot
} from 'recharts';
import { CARD_CLASSES } from './styles';

/**
 * Props für die Moving Average Chart Komponente
 */
interface MovingAverageChartProps {
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
 * Komponente zur Visualisierung des gleitenden Durchschnitts
 * für Schüler- oder Klassenauswertungen
 */
const MovingAverageChart: React.FC<MovingAverageChartProps> = ({
  attendanceOverTime,
  schoolYearDetailedData,
  weeklyDetailedData,
  allStudentStats,
  selectedStudent,
  selectedClass,
  className = ""
}) => {
  // State für Moving Average-Parameter
  const [dataType, setDataType] = useState<'verspaetungen' | 'fehlzeiten'>('verspaetungen');
  const [periodSize, setPeriodSize] = useState<number>(3);
  const [useSchoolYearData, setUseSchoolYearData] = useState<boolean>(true);
  const [groupBy, setGroupBy] = useState<'weekly' | 'monthly'>('weekly');
  
  // Berechnete Daten für das Chart
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Status für Daten
  const [noDataAvailable, setNoDataAvailable] = useState<boolean>(false);
  
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
  
  // Daten für Moving Average aufbereiten, wenn sich Eingabedaten oder Parameter ändern
  useEffect(() => {
    // Fallback auf attendanceOverTime, wenn keine detaillierten Daten vorhanden sind
    if (!schoolYearDetailedData && !weeklyDetailedData && (!attendanceOverTime || attendanceOverTime.length === 0)) {
      setChartData([]);
      setNoDataAvailable(true);
      return;
    }
    
    let processedData: any[] = [];
    
    // Je nach Auswahl entweder schoolYearDetailedData oder attendanceOverTime verwenden
    if (useSchoolYearData && (selectedStudent || selectedClass)) {
      // Eigene Aggregation basierend auf detaillierten Daten durchführen
      const detailedSource = schoolYearDetailedData || weeklyDetailedData;
      
      if (detailedSource) {
        processedData = aggregateAttendanceData(
          detailedSource,
          selectedStudent,
          selectedClass,
          allStudentStats,
          groupBy
        );
      }
    } else {
      // Existierende attendanceOverTime Daten verwenden
      // Diese sind bereits gefiltert durch Dashboard und Filter-Kontext
      processedData = [...attendanceOverTime];
    }
    
    if (processedData.length === 0) {
      setChartData([]);
      setNoDataAvailable(true);
      return;
    }
    
    // Moving Average berechnen und Ausreißer erkennen
    const dataWithMA = prepareMovingAverageData(
      processedData,
      dataType,
      periodSize
    );
    
    setChartData(dataWithMA);
    setNoDataAvailable(false);
  }, [
    attendanceOverTime, 
    schoolYearDetailedData, 
    weeklyDetailedData,
    selectedStudent, 
    selectedClass, 
    dataType, 
    periodSize, 
    useSchoolYearData,
    groupBy,
    allStudentStats
  ]);
  
  // Optimierte Daten für die Anzeige vorbereiten
  const optimizedChartData = useMemo(() => {
    // Daten ohne NaN und null-Werte zurückgeben
    return chartData.map(point => ({
      ...point,
      // Sicherstellen, dass movingAverage eine gültige Zahl ist oder undefined
      movingAverage: point.movingAverage !== null && !isNaN(point.movingAverage) 
        ? point.movingAverage 
        : undefined
    }));
  }, [chartData]);
  
  // Keine Daten verfügbar
  if (noDataAvailable || !optimizedChartData || optimizedChartData.length === 0) {
    return (
      <div className={`${CARD_CLASSES} ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Gleitender Durchschnitt
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {selectedEntity 
            ? `Keine Daten verfügbar für ${entityType === 'student' ? 'den Schüler' : 'die Klasse'} "${selectedEntity}".`
            : 'Bitte wählen Sie einen Schüler oder eine Klasse aus, um den gleitenden Durchschnitt anzuzeigen.'}
          <p className="mt-2 text-sm">
            Die Analyse benötigt mindestens 3 Datenpunkte.
          </p>
        </div>
      </div>
    );
  }
  
  // Farben basierend auf dem Datentyp
  const mainColor = dataType === 'verspaetungen' ? '#9333ea' : '#3b82f6';
  const maColor = dataType === 'verspaetungen' ? '#b980ed' : '#7facf5';
  const outlierColor = dataType === 'verspaetungen' ? '#d946ef' : '#60a5fa';
  
  // Formatierung für X-Achse
  const formatXAxis = (value: string) => {
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
      const dateRange = dataPoint?.dateRange || '';
      
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1 text-base">{formatXAxis(label)}</p>
          {dateRange && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{dateRange}</p>
          )}
          
          <div className="flex flex-col space-y-1">
            {payload.map((entry: any, index: number) => {
              // Formatierte Werte anzeigen
              const value = typeof entry.value === 'number' 
                ? entry.value.toFixed(1) 
                : entry.value;
                
              return (
                <div key={`item-${index}`} className="flex items-center">
                  <div className="w-3 h-3 mr-2" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">
                    {entry.name}: {value}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Ausreißer-Info, falls relevant */}
          {dataPoint?.isOutlier && (
            <div className="mt-1 text-xs font-medium text-orange-500 dark:text-orange-400">
              Ausreißer: Ungewöhnlich {dataPoint[dataType] > (dataPoint.movingAverage || 0) ? 'hoher' : 'niedriger'} Wert
            </div>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Titeltext basierend auf der Auswahl generieren
  const getTitleText = () => {
    if (selectedStudent) {
      return `Gleitender Durchschnitt: ${selectedStudent.split(',')[0]} ${selectedStudent.split(',')[1]}`;
    } else if (selectedClass) {
      return `Gleitender Durchschnitt: Klasse ${selectedClass}`;
    }
    return 'Gleitender Durchschnitt';
  };
  
  // Beschreibungstext für die verwendeten Daten
  const getDataSourceDescription = () => {
    if (useSchoolYearData) {
      return 'Daten: Gesamtes Schuljahr';
    } else {
      return 'Daten: Ausgewählter Zeitraum';
    }
  };
  
  return (
    <div className={`${CARD_CLASSES} ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {getTitleText()}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {getDataSourceDescription()}
          </p>
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
          
          {/* Periodengröße auswählen */}
          <div className="flex items-center">
            <label className="text-sm mr-1 text-gray-700 dark:text-gray-300">Periode:</label>
            <select
              value={periodSize}
              onChange={(e) => setPeriodSize(parseInt(e.target.value))}
              className="bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm rounded px-1 py-0.5"
            >
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="6">6</option>
            </select>
          </div>
          
          {/* Gruppierung auswählen */}
          <div className="flex items-center">
            <label className="text-sm mr-1 text-gray-700 dark:text-gray-300">Gruppierung:</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'weekly' | 'monthly')}
              className="bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm rounded px-1 py-0.5"
            >
              <option value="weekly">Wöchentlich</option>
              <option value="monthly">Monatlich</option>
            </select>
          </div>
          
          {/* Option für Schuljahres- oder gefilterte Daten */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useSchoolYearData}
              onChange={() => setUseSchoolYearData(!useSchoolYearData)}
              className="mr-1.5 h-3.5 w-3.5"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Schuljahr</span>
          </label>
        </div>
      </div>
      
      <div className="h-72 w-full overflow-x-auto">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={optimizedChartData}
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
            />
            <YAxis 
              tick={{ fill: 'currentColor', fontSize: 14 }}
              axisLine={{ stroke: '#777' }}
              tickLine={{ stroke: '#777' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              wrapperStyle={{ paddingTop: '10px', fontSize: '14px' }}
            />
            
            {/* Originaldaten */}
            <Line 
              type="monotone" 
              dataKey={dataType} 
              name={dataType === 'verspaetungen' ? 'Verspätungen' : 'Fehltage'} 
              stroke={mainColor} 
              activeDot={{ r: 8 }}
              dot={{ r: 4 }}
            />
            
            {/* Gleitender Durchschnitt */}
            <Line 
              type="monotone" 
              dataKey="movingAverage" 
              name={`${periodSize}-Perioden gleitender Durchschnitt`} 
              stroke={maColor} 
              strokeWidth={2}
              activeDot={false}
              dot={false}
              strokeDasharray="5 5"
            />
            
            {/* Ausreißer markieren */}
            {optimizedChartData
              .filter(point => point.isOutlier)
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
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <h4 className="font-medium">Gleitender Durchschnitt</h4>
            <p className="text-xs">Hilft kurzfristige Schwankungen zu glätten und langfristige Trends sichtbar zu machen.</p>
          </div>
          <div>
            <h4 className="font-medium">Ausreißererkennung</h4>
            <p className="text-xs">Hervorgehobene Punkte zeigen ungewöhnliche Werte, die deutlich vom Trend abweichen.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovingAverageChart;