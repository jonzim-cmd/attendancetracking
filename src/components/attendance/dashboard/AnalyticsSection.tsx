// src/components/attendance/dashboard/AnalyticsSection.tsx
import React from 'react';
import { CARD_CLASSES } from './styles';
import MovingAverageChart from './MovingAverageChart';
import RegressionChart from './RegressionChart';
import { useFilters } from '@/contexts/FilterContext';

/**
 * Die Props für die AnalyticsSection-Komponente
 */
interface AnalyticsSectionProps {
  // Hauptdaten
  attendanceOverTime: any[];                    // Zeitreihen-Daten aus dem Dashboard
  schoolYearDetailedData: Record<string, any>;  // Detaillierte Daten für das ganze Schuljahr
  weeklyDetailedData: Record<string, any>;      // Detaillierte Daten nach Wochen
  allStudentStats: Record<string, any>;         // Statistiken für alle Schüler

  // Neue Props für Single-Class-Erkennung
  hasSingleClassOnly?: boolean;
  singleClassName?: string;

  // Layout
  className?: string;                           // Zusätzliche CSS-Klassen
  
  // NEUE PROP: Chart-Modus
  chartMode?: 'both' | 'movingAverage' | 'regression';
}

/**
 * Komponente zur Anzeige der beiden Analysetools: Moving Average und Regressionsanalyse
 * Diese Komponente kann später leicht in TrendCharts eingefügt werden
 */
const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  attendanceOverTime,
  schoolYearDetailedData,
  weeklyDetailedData,
  allStudentStats,
  className = "",
  // Füge diese Zeilen hinzu:
  hasSingleClassOnly = false,
  singleClassName,
  chartMode = 'both' // Default: beide Charts anzeigen
}) => {
  // Hole die aktuellen Filtereinstellungen aus dem Context
  const { selectedStudents, selectedDashboardClasses } = useFilters();
  
  // Bestimme den ausgewählten Schüler oder die ausgewählte Klasse
  const selectedStudent = selectedStudents.length === 1 ? selectedStudents[0] : undefined;
  const selectedClass = !selectedStudent && selectedDashboardClasses.length === 1 ? selectedDashboardClasses[0] : undefined;
  
  // Prüfen, ob eine Auswahl getroffen wurde
  const hasSelection = selectedStudent || selectedClass || 
                       // NEUE BEDINGUNG: Auch true, wenn keine Klasse ausgewählt ist ("Alle Klassen") 
                       // aber es gibt nur eine einzige Klasse im Datensatz
                       (selectedDashboardClasses.length === 0 && hasSingleClassOnly);
  
  // Ermittle, ob der Benutzer Hilfestellung braucht
  const hasFilters = selectedStudents.length > 0 || selectedDashboardClasses.length > 0;
  const needsFilterGuidance = !hasSelection && hasFilters;
  
  // Bestimme, ob genügend Daten für die Analysen vorhanden sind
  const hasEnoughDataForAnalysis = attendanceOverTime && attendanceOverTime.length >= 3;
  
  // Falls keine Auswahl getroffen wurde, zeige einen Hinweis
  if (!hasSelection) {
    return (
      <div className={`${CARD_CLASSES} ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Statistische Analysen
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {needsFilterGuidance ? (
            <>
              <p>Für die statistischen Analysen wird genau ein Schüler oder eine Klasse benötigt.</p>
              <p className="mt-2">
                Bitte wählen Sie genau einen Schüler oder genau eine Klasse aus.
              </p>
            </>
          ) : (
            <>
              <p>Bitte wählen Sie einen Schüler oder eine Klasse aus, um die statistischen Analysen anzuzeigen.</p>
              <p className="mt-2">
                Die Analysen zeigen Trends und Muster in den Anwesenheitsdaten.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }
  
  // Falls nicht genügend Daten vorhanden sind, zeige einen Hinweis
  if (!hasEnoughDataForAnalysis) {
    return (
      <div className={`${CARD_CLASSES} ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Statistische Analysen
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Für die statistischen Analysen werden mindestens 3 Datenpunkte benötigt.</p>
          <p className="mt-2">
            Bitte wählen Sie einen größeren Zeitraum oder reduzieren Sie die Filterung.
          </p>
        </div>
      </div>
    );
  }
  
  // Bestimme den effektiven Class-Parameter für die Charts
  // Wenn "Alle Klassen" ausgewählt ist und es nur eine Klasse gibt, verwende diese
  const effectiveClass = selectedClass || (hasSingleClassOnly && selectedDashboardClasses.length === 0 ? singleClassName : undefined);
  
  return (
    <div className={`${className}`}>
      {chartMode !== 'regression' && (
        <MovingAverageChart 
          attendanceOverTime={attendanceOverTime} 
          schoolYearDetailedData={schoolYearDetailedData}
          weeklyDetailedData={weeklyDetailedData}
          allStudentStats={allStudentStats}
          selectedStudent={selectedStudent}
          selectedClass={effectiveClass}
          className={`w-full ${CARD_CLASSES} mb-4`}
        />
      )}
      
      {chartMode !== 'movingAverage' && (
        <RegressionChart 
          attendanceOverTime={attendanceOverTime} 
          schoolYearDetailedData={schoolYearDetailedData}
          weeklyDetailedData={weeklyDetailedData}
          allStudentStats={allStudentStats}
          selectedStudent={selectedStudent}
          selectedClass={effectiveClass}
          className={`w-full ${CARD_CLASSES} mb-4`}
        />
      )}
    </div>
  );
};

export default AnalyticsSection;