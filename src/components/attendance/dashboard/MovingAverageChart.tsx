// src/components/attendance/dashboard/MovingAverageChart.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { prepareMovingAverageData, formatDataForMovingAverageChart } from './movingAverageUtils';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceDot
} from 'recharts';
import { CARD_CLASSES } from './styles';
import InfoButton from '@/components/ui/InfoButton';
import { CHART_EXPLANATIONS } from './chartExplanations';

/**
 * Props for the Moving Average Chart component
 */
interface MovingAverageChartProps {
  // Main data and context
  attendanceOverTime: any[];                    // Time series data from the dashboard
  schoolYearDetailedData: Record<string, any>;  // Detailed data for the entire school year
  weeklyDetailedData: Record<string, any>;      // Detailed data by week
  allStudentStats: Record<string, any>;         // Statistics for all students
  
  // Filters and selection
  selectedStudent?: string;                     // Selected student (if any)
  selectedClass?: string;                       // Selected class (if any)
  
  // Layout
  className?: string;                           // Additional CSS classes
}

/**
 * Component to visualize moving averages
 * for student or class evaluations
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
  // State for Moving Average parameters
  const [dataType, setDataType] = useState<'verspaetungen' | 'fehlzeiten'>('verspaetungen');
  const [periodSize, setPeriodSize] = useState<number>(3);
  const [groupBy, setGroupBy] = useState<'weekly' | 'monthly'>('weekly');
  
  // Calculated data for the chart
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Data status
  const [noDataAvailable, setNoDataAvailable] = useState<boolean>(false);
  
  // Ref for scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Determine the selected entity (student or class)
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

  // Function to ensure we have data points for every period (week or month)
  // Define as useCallback to use in dependency arrays
  const ensureCompleteDataSet = useCallback((data: any[], groupingType: 'weekly' | 'monthly') => {
    if (!data || data.length === 0) return [];
    
    // Get all unique periods from the data
    const periods = new Set(data.map(item => item.name));
    
    // If we already have a complete dataset, return it
    if (periods.size >= 36) { // Most school years have about 36-40 weeks
      return data;
    }
    
    // Create a complete set of periods
    const completeData = [...data];
    
    // For weekly grouping, ensure all weeks of the school year are present
    if (groupingType === 'weekly') {
      // Find min and max weeks to establish the range
      const weekNumbers = Array.from(periods)
        .map(name => {
          const match = String(name).match(/KW\s*(\d+)/i);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(num => num > 0);
      
      if (weekNumbers.length === 0) return data;
      
      // Determine school year start and end week
      let startWeek = Math.min(...weekNumbers);
      let endWeek = Math.max(...weekNumbers);
      
      // If the range includes week 1, it likely spans from previous year to this year
      const spansNewYear = weekNumbers.some(week => week < 10) && 
                         weekNumbers.some(week => week > 40);
      
      if (spansNewYear) {
        startWeek = weekNumbers.find(week => week > 35) || 37; // School typically starts at KW37
        endWeek = weekNumbers.find(week => week < 10) || 5; // End around KW5
        
        // Build the complete sequence: startWeek to 52, then 1 to endWeek
        const weekSequence = [];
        
        // First part: startWeek to 52
        for (let week = startWeek; week <= 52; week++) {
          if (!periods.has(`KW ${week}`)) {
            weekSequence.push({
              name: `KW ${week}`,
              [dataType]: 0,
              sortKey: week + 100 // Add 100 to weeks in first half (KW37-KW52)
            });
          }
        }
        
        // Second part: 1 to endWeek
        for (let week = 1; week <= endWeek; week++) {
          if (!periods.has(`KW ${week}`)) {
            weekSequence.push({
              name: `KW ${week}`,
              [dataType]: 0,
              sortKey: week + 200 // Add 200 to weeks in second half (KW1-KW36)
            });
          }
        }
        
        completeData.push(...weekSequence);
      } else {
        // Simple sequential range
        for (let week = startWeek; week <= endWeek; week++) {
          if (!periods.has(`KW ${week}`)) {
            completeData.push({
              name: `KW ${week}`,
              [dataType]: 0,
              sortKey: week
            });
          }
        }
      }
    }
    // For monthly grouping, ensure all months are present
    else if (groupingType === 'monthly') {
      const months = ['Sep', 'Okt', 'Nov', 'Dez', 'Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug'];
      const currentYear = new Date().getFullYear();
      
      months.forEach((month, index) => {
        // Create a sortKey based on month position in school year (Sep = 1, Aug = 12)
        const sortKey = index + 1;
        const year = index < 4 ? currentYear : currentYear + 1; // Sep-Dec = current year, Jan-Aug = next year
        
        if (!periods.has(`${month} ${year}`)) {
          completeData.push({
            name: `${month} ${year}`,
            [dataType]: 0,
            sortKey: sortKey
          });
        }
      });
    }
    
    // Sort the complete dataset
    return completeData.sort((a, b) => (a.sortKey || 0) - (b.sortKey || 0));
  }, [dataType]);
  
  // Prepare data for the chart using the formatDataForMovingAverageChart function
  const formattedData = useMemo(() => {
    const data = formatDataForMovingAverageChart(
      attendanceOverTime,
      selectedStudent,
      selectedClass
    );
    
    // Create proper sort keys for school year ordering
    return data.map(item => {
      // Parse week numbers from names like "KW 37"
      if (typeof item.name === 'string' && item.name.includes('KW')) {
        const weekMatch = item.name.match(/KW\s*(\d+)/i);
        if (weekMatch) {
          const weekNum = parseInt(weekMatch[1]);
          // School year ordering: KW37-KW52 comes before KW1-KW36
          // We use sortKey 100-152 for KW1-KW52 of the first year
          // and sortKey 200-236 for KW1-KW36 of the second year
          let sortKey;
          if (weekNum >= 35 && weekNum <= 36) {
            sortKey = weekNum;
          } else if (weekNum >= 37) {
            sortKey = weekNum + 100;
          } else {
            sortKey = weekNum + 200;
          }
          return { ...item, sortKey };
        }
      }
      // For month names, create sort keys based on school year
      else if (typeof item.name === 'string' && /^(Jan|Feb|Mar|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)/.test(item.name)) {
        const monthMap: Record<string, number> = {
          'Sep': 1, 'Okt': 2, 'Nov': 3, 'Dez': 4,
          'Jan': 5, 'Feb': 6, 'Mar': 7, 'Apr': 8,
          'Mai': 9, 'Jun': 10, 'Jul': 11, 'Aug': 12
        };
        
        const monthMatch = item.name.match(/^(Jan|Feb|Mar|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)/);
        if (monthMatch) {
          const month = monthMatch[1];
          return { ...item, sortKey: monthMap[month] };
        }
      }
      return item;
    }).sort((a, b) => (a.sortKey || 0) - (b.sortKey || 0));
  }, [attendanceOverTime, selectedStudent, selectedClass]);
  
  // Process and prepare the data when inputs change
  useEffect(() => {
    // Fall back to attendanceOverTime if no detailed data is available
    if (!formattedData || formattedData.length === 0) {
      setChartData([]);
      setNoDataAvailable(true);
      return;
    }
    
    // Include "zero" data points for times when the student had no absences/tardiness
    // This makes sure we have enough data points for analysis
    const completeDataSet = ensureCompleteDataSet(formattedData, groupBy);
    
    // We need at least 3 data points for meaningful analysis
    if (completeDataSet.length < 3) {
      console.warn(`Not enough data points for ${selectedEntity || 'analysis'}: ${completeDataSet.length}`);
      setChartData([]);
      setNoDataAvailable(true);
      return;
    }

    console.log(`Processing ${completeDataSet.length} data points for ${selectedEntity || 'analysis'}`);
    
    // Calculate moving average and detect outliers
    const dataWithMA = prepareMovingAverageData(
      completeDataSet,
      dataType,
      periodSize,
      selectedStudent,
      selectedClass
    );
    
    setChartData(dataWithMA);
    setNoDataAvailable(false);
  }, [
    formattedData,
    selectedStudent, 
    selectedClass, 
    dataType, 
    periodSize,
    groupBy,
    selectedEntity,
    ensureCompleteDataSet
  ]);
  
  // Effect for initial scrolling to the end of the chart
  useEffect(() => {
    if (scrollContainerRef.current && chartData.length > 0) {
      const container = scrollContainerRef.current;
      // Scroll to the end of the container
      setTimeout(() => {
        container.scrollLeft = container.scrollWidth - container.clientWidth;
      }, 100); // Slightly longer timeout to ensure rendering is complete
    }
  }, [chartData, groupBy]); // Also respond to groupBy changes
  
  // Optimize chart data for display - this hook runs regardless of data availability
  const optimizedChartData = useMemo(() => {
    // Return data without NaN and null values
    return chartData.map(point => ({
      ...point,
      // Ensure movingAverage is a valid number or undefined
      movingAverage: point.movingAverage !== null && !isNaN(point.movingAverage) 
        ? point.movingAverage 
        : undefined
    }));
  }, [chartData]);
  
  // Function to control which labels to show on the x-axis to prevent overlapping
  const shouldShowLabel = (value: string, index: number): boolean => {
    // For wide displays or few data points, show all labels
    if (chartData.length <= 15) return true;
    
    // Otherwise show every nth label based on data size
    const showEvery = chartData.length > 30 ? 4 : chartData.length > 20 ? 3 : 2;
    return index % showEvery === 0;
  };
  
  // No data available - render early if no data
  if (noDataAvailable || !optimizedChartData || optimizedChartData.length === 0) {
    return (
      <div className={`${className} w-full h-full`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Gleitender Durchschnitt
              {selectedEntity && (
                <span className="text-base font-normal ml-2 text-gray-500 dark:text-gray-400">
                  {selectedStudent 
                    ? `(${selectedStudent.split(',')[0]} ${selectedStudent.split(',')[1]})`
                    : selectedClass ? `(Klasse ${selectedClass})` : ''}
                </span>
              )}
            </h3>
            <InfoButton 
              title={CHART_EXPLANATIONS.movingAverage.title} 
              content={CHART_EXPLANATIONS.movingAverage.content} 
              className="ml-2"
            />
          </div>
          <div className="flex flex-wrap gap-x-2 text-sm items-center">
            {/* Switch between tardiness and absences */}
            <div className="flex items-center gap-1">
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={dataType === 'verspaetungen'} 
                  onChange={() => setDataType(dataType === 'verspaetungen' ? 'fehlzeiten' : 'verspaetungen')}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-5 w-10 items-center rounded-full ${dataType === 'verspaetungen' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${dataType === 'verspaetungen' ? 'translate-x-1' : 'translate-x-6'}`}></span>
                </div>
                <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {dataType === 'verspaetungen' ? 'Verspätungen' : 'Fehltage'}
                </span>
              </label>
            </div>
            
            {/* Period size selection */}
            <div className="flex items-center">
              <label className="text-sm mr-1 text-gray-700 dark:text-gray-300">Periode:</label>
              <select
                value={periodSize}
                onChange={(e) => setPeriodSize(parseInt(e.target.value))}
                className="bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm rounded px-1 py-0.5"
                title="Anzahl der Perioden für die Berechnung des gleitenden Durchschnitts"
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="6">6</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Chart content remains the same */}
      </div>
    );
  }
  
  // Colors based on data type
  const mainColor = dataType === 'verspaetungen' ? '#9333ea' : '#3b82f6';
  const maColor = dataType === 'verspaetungen' ? '#b980ed' : '#7facf5';
  const outlierColor = dataType === 'verspaetungen' ? '#d946ef' : '#60a5fa';
  
  // Formatting for X-axis
  const formatXAxis = (value: string, index: number) => {
    // Skip labels if needed to prevent overlapping
    if (!shouldShowLabel(value, index)) return '';
    
    // If periodLabel is available, use it
    const dataPoint = chartData.find(p => p.name === value);
    if (dataPoint?.periodLabel) {
      return dataPoint.periodLabel;
    }
    return value;
  };
  
  // Custom tooltip with formatted display
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find the corresponding data point based on the label
      const dataPoint = chartData.find(p => p.name === label);
      const dateRange = dataPoint?.dateRange || '';
      
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1 text-base">{label}</p>
          {dateRange && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{dateRange}</p>
          )}
          
          <div className="flex flex-col space-y-1">
            {payload.map((entry: any, index: number) => {
              // Display formatted values
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
          
          {/* Outlier info if relevant */}
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
  
  // Generate title text based on selection
  const getTitleText = () => {
    if (selectedStudent) {
      return `Gleitender Durchschnitt: ${selectedStudent.split(',')[0]} ${selectedStudent.split(',')[1]}`;
    } else if (selectedClass) {
      return `Gleitender Durchschnitt: Klasse ${selectedClass}`;
    }
    return 'Gleitender Durchschnitt';
  };
  
  // Calculate the appropriate width for the chart based on data points
  const getChartWidth = () => {
    if (!optimizedChartData || optimizedChartData.length === 0) return '100%';
    
    // For many data points, make it scrollable
    const minWidth = 800; // Minimum width in pixels
    // Allocate more width per point for monthly grouping
    const pointWidth = groupBy === 'monthly' ? 100 : 60; // Width per data point in pixels
    
    // Always make scrollable if we have enough data points
    if (optimizedChartData.length > 8) {
      return `${Math.max(optimizedChartData.length * pointWidth, minWidth)}px`;
    }
    
    // For few data points, stretch to container
    return '100%';
  };
  
  return (
    <div className={`${className} w-full h-full`}>
     <div className="flex justify-between items-center mb-4">
      <div className="flex items-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {getTitleText()}
        </h3>
        <InfoButton 
          title={CHART_EXPLANATIONS.movingAverage.title} 
          content={CHART_EXPLANATIONS.movingAverage.content} 
          className="ml-2"
        />
      </div>
      <div className="flex flex-wrap gap-3 items-center">
          {/* Switch between tardiness and absences */}
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
          
          {/* Period size selection */}
          <div className="flex items-center">
            <label className="text-sm mr-1 text-gray-700 dark:text-gray-300">Periode:</label>
            <select
              value={periodSize}
              onChange={(e) => setPeriodSize(parseInt(e.target.value))}
              className="bg-header-btn-dropdown dark:bg-header-btn-dropdown-dark hover:bg-header-btn-dropdown-hover dark:hover:bg-header-btn-dropdown-hover-dark text-chatGray-textLight dark:text-chatGray-textDark text-sm rounded px-1 py-0.5"
              title="Anzahl der Perioden für die Berechnung des gleitenden Durchschnitts"
            >
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="6">6</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto" ref={scrollContainerRef}>
        <div style={{ 
          width: getChartWidth(),
          minWidth: '100%', 
          height: '280px' 
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={optimizedChartData}
              margin={{ top: 5, right: 50, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#777" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'currentColor', fontSize: 14 }}
                axisLine={{ stroke: '#777' }}
                tickLine={{ stroke: '#777' }}
                height={40}
                tickFormatter={formatXAxis}
                interval={0} // Force to display all labels, our custom formatter will handle filtering
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
              
              {/* Original data */}
              <Line 
                type="monotone" 
                dataKey={dataType} 
                name={dataType === 'verspaetungen' ? 'Verspätungen' : 'Fehltage'} 
                stroke={mainColor} 
                activeDot={{ r: 8 }}
                dot={{ r: 4 }}
              />
              
              {/* Moving average */}
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
              
              {/* Mark outliers */}
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
      </div>
    </div>
  );
};

export default MovingAverageChart;