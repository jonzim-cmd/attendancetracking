// src/contexts/FilterContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { StudentStats } from '@/types';

// Context-Typ definieren
interface FilterContextType {
  // Dashboard-spezifische Filter
  selectedDashboardClasses: string[];
  setSelectedDashboardClasses: (classes: string[]) => void;
  selectedStudents: string[];
  setSelectedStudents: (students: string[]) => void;
  groupingOption: 'weekly' | 'monthly';
  setGroupingOption: (option: 'weekly' | 'monthly') => void;
  
  // Gemeinsame Filter
  viewMode: 'table' | 'dashboard';
  setViewMode: (mode: 'table' | 'dashboard') => void;
  
  // Hilfsfunktion, um zu prüfen, ob wir im Dashboard-Modus sind
  isDashboardMode: boolean;
  
  // NEU: Zugriff auf die gefilterten Schülerdaten
  getContextFilteredStudents: () => [string, StudentStats][];
}

// Context erstellen
const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Provider-Komponente
export const FilterProvider: React.FC<{
  children: ReactNode;
  propSelectedClasses: string[];
  propViewMode: 'table' | 'dashboard';
  onViewModeChange: (mode: 'table' | 'dashboard') => void;
  getFilteredStudents: () => [string, StudentStats][];
}> = ({ 
  children, 
  propSelectedClasses, 
  propViewMode, 
  onViewModeChange,
  getFilteredStudents 
}) => {
  // Dashboard-Filter
  const [selectedDashboardClasses, setSelectedDashboardClasses] = useState<string[]>(propSelectedClasses);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [groupingOption, setGroupingOption] = useState<'weekly' | 'monthly'>('weekly');
  
  // Gemeinsame Filter - wir nutzen die Prop für den tatsächlichen Zustand
  const viewMode = propViewMode;
  const setViewMode = onViewModeChange;
  
  // Effect um selectedDashboardClasses zu aktualisieren, wenn propSelectedClasses sich ändert
  useEffect(() => {
    setSelectedDashboardClasses(propSelectedClasses);
  }, [propSelectedClasses]);
  
  return (
    <FilterContext.Provider value={{
      selectedDashboardClasses,
      setSelectedDashboardClasses,
      selectedStudents,
      setSelectedStudents,
      groupingOption,
      setGroupingOption,
      viewMode,
      setViewMode,
      isDashboardMode: viewMode === 'dashboard',
      // NEU: Die getFilteredStudents-Funktion im Context bereitstellen
      getContextFilteredStudents: getFilteredStudents
    }}>
      {children}
    </FilterContext.Provider>
  );
};

// Custom Hook für einfachen Zugriff
export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};