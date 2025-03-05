// src/contexts/FilterContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
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
  
  // Neue Filter für Suche und Schülerauswahl
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Hilfsfunktion, um zu prüfen, ob wir im Dashboard-Modus sind
  isDashboardMode: boolean;
  
  // Zugriff auf die gefilterten Schülerdaten
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
  propSearchQuery?: string; // Neu: searchQuery als optionale Prop
  onSearchChange?: (query: string) => void; // Neu: searchQuery-Handler als optionale Prop
}> = ({ 
  children, 
  propSelectedClasses, 
  propViewMode, 
  onViewModeChange,
  getFilteredStudents,
  propSearchQuery = '', // Default-Wert
  onSearchChange = () => {}, // Leere Funktion als Default
}) => {
  // Dashboard-Filter
  const [selectedDashboardClasses, setSelectedDashboardClasses] = useState<string[]>(propSelectedClasses);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [groupingOption, setGroupingOption] = useState<'weekly' | 'monthly'>('weekly');
  
  // Neuer State für die Suche
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>(propSearchQuery);
  const [isUpdatingFromProp, setIsUpdatingFromProp] = useState(false);
  
  // Memoized setSearchQuery um Endlosschleifen zu vermeiden
  const setSearchQuery = useCallback((query: string) => {
    setInternalSearchQuery(query);
    if (!isUpdatingFromProp) {
      onSearchChange(query);
    }
  }, [onSearchChange, isUpdatingFromProp]);
  
  // Gemeinsame Filter - wir nutzen die Prop für den tatsächlichen Zustand
  const viewMode = propViewMode;
  const setViewMode = onViewModeChange;
  
  // Effect um selectedDashboardClasses zu aktualisieren, wenn propSelectedClasses sich ändert
  useEffect(() => {
    setSelectedDashboardClasses(propSelectedClasses);
  }, [propSelectedClasses]);
  
  // Neuer Effect um searchQuery zu aktualisieren, wenn propSearchQuery sich ändert
  useEffect(() => {
    if (propSearchQuery !== internalSearchQuery) {
      setIsUpdatingFromProp(true);
      setInternalSearchQuery(propSearchQuery);
      // Flag nach kurzer Verzögerung zurücksetzen
      setTimeout(() => {
        setIsUpdatingFromProp(false);
      }, 0);
    }
  }, [propSearchQuery, internalSearchQuery]);
  
  const contextValue = {
    selectedDashboardClasses,
    setSelectedDashboardClasses,
    selectedStudents,
    setSelectedStudents,
    groupingOption,
    setGroupingOption,
    viewMode,
    setViewMode,
    searchQuery: internalSearchQuery,
    setSearchQuery,
    isDashboardMode: viewMode === 'dashboard',
    getContextFilteredStudents: getFilteredStudents
  };
  
  return (
    <FilterContext.Provider value={contextValue}>
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