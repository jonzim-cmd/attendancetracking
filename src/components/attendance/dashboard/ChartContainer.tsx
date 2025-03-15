import React from 'react';
import InfoButton from '@/components/ui/InfoButton';
import { CHART_EXPLANATIONS } from './chartExplanations';

// Define the type for chart explanations
interface ChartExplanation {
  title: string;
  content: string;
}

// Define the type for the CHART_EXPLANATIONS object
interface ChartExplanations {
  timeSeriesChart: ChartExplanation;
  weekdayAnalysis: ChartExplanation;
  movingAverage: ChartExplanation;
  regression: ChartExplanation;
}

// Type assertion for CHART_EXPLANATIONS
const TYPED_CHART_EXPLANATIONS = CHART_EXPLANATIONS as ChartExplanations;

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  explanation?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ 
  title, 
  subtitle,
  children,
  className = "",
  explanation
}) => {
  const getExplanationKey = (): keyof ChartExplanations => {
    if (explanation) return explanation as keyof ChartExplanations;
    
    if (title.includes('Zeitlicher Verlauf')) return 'timeSeriesChart';
    if (title.includes('Wochentagsanalyse')) return 'weekdayAnalysis';
    if (title.includes('Gleitender Durchschnitt')) return 'movingAverage';
    if (title.includes('Regressionsanalyse')) return 'regression';
    
    return 'timeSeriesChart'; // Default fallback
  };
  
  const explanationKey = getExplanationKey();
  
  return (
    <div className={`p-1 h-full flex flex-col ${className}`}>
      <div className="chart-drag-handle cursor-move flex items-center justify-between mb-2">
        <div className="flex items-center">
          {title && (
            <>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {title}
                {subtitle && (
                  <span className="text-base font-normal ml-2 text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </span>
                )}
              </h3>
              {explanationKey && TYPED_CHART_EXPLANATIONS[explanationKey] && (
                <InfoButton 
                  title={TYPED_CHART_EXPLANATIONS[explanationKey].title} 
                  content={TYPED_CHART_EXPLANATIONS[explanationKey].content} 
                  className="ml-2"
                />
              )}
            </>
          )}
        </div>
        <div className="text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default ChartContainer;