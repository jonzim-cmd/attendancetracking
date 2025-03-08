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
  
  // Dashboard-spezifische Datumsfilter
  dashboardStartDate: string;
  setDashboardStartDate: (date: string) => void;
  dashboardEndDate: string;
  setDashboardEndDate: (date: string) => void;
  
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
  
  // NEUE FUNKTION: Zugriff auf alle Schüler, ohne nach selectedStudents zu filtern
  getAllStudents: () => [string, StudentStats][];
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
  dashboardStartDate?: string; // Neu: Dashboard-Datumsfilter als optionale Prop
  dashboardEndDate?: string; // Neu: Dashboard-Datumsfilter als optionale Prop
  onDashboardStartDateChange?: (date: string) => void; // Neu: Dashboard-Datumsfilter-Handler
  onDashboardEndDateChange?: (date: string) => void; // Neu: Dashboard-Datumsfilter-Handler
  resetTriggerId?: number; // Neu: Trigger für das Zurücksetzen der Filter
}> = ({ 
  children, 
  propSelectedClasses, 
  propViewMode, 
  onViewModeChange,
  getFilteredStudents,
  propSearchQuery = '', // Default-Wert
  onSearchChange = () => {}, // Leere Funktion als Default
  dashboardStartDate = '', // Default-Wert
  dashboardEndDate = '', // Default-Wert
  onDashboardStartDateChange = () => {}, // Leere Funktion als Default
  onDashboardEndDateChange = () => {}, // Leere Funktion als Default
  resetTriggerId = 0, // Default-Wert für Reset-Trigger
}) => {
  // Dashboard-Filter
  const [selectedDashboardClasses, setSelectedDashboardClasses] = useState<string[]>(propSelectedClasses);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [groupingOption, setGroupingOption] = useState<'weekly' | 'monthly'>('weekly');
  
  // Neuer State für die Suche
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>(propSearchQuery);
  const [isUpdatingFromProp, setIsUpdatingFromProp] = useState(false);
  
  // Interne Speicherung der Dashboard-Datumsfilter
  const [internalDashboardStartDate, setInternalDashboardStartDate] = useState<string>(dashboardStartDate);
  const [internalDashboardEndDate, setInternalDashboardEndDate] = useState<string>(dashboardEndDate);
  const [isUpdatingDashboardDates, setIsUpdatingDashboardDates] = useState(false);
  
  // Memoized setSearchQuery um Endlosschleifen zu vermeiden
  const setSearchQuery = useCallback((query: string) => {
    setInternalSearchQuery(query);
    if (!isUpdatingFromProp) {
      onSearchChange(query);
    }
  }, [onSearchChange, isUpdatingFromProp]);
  
  // Memoized setDashboardStartDate um Endlosschleifen zu vermeiden
  const setDashboardStartDate = useCallback((date: string) => {
    setInternalDashboardStartDate(date);
    if (!isUpdatingDashboardDates) {
      onDashboardStartDateChange(date);
    }
  }, [onDashboardStartDateChange, isUpdatingDashboardDates]);
  
  // Memoized setDashboardEndDate um Endlosschleifen zu vermeiden
  const setDashboardEndDate = useCallback((date: string) => {
    setInternalDashboardEndDate(date);
    if (!isUpdatingDashboardDates) {
      onDashboardEndDateChange(date);
    }
  }, [onDashboardEndDateChange, isUpdatingDashboardDates]);
  
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
  
  // Neuer Effect um die Dashboard-Datumsfilter zu aktualisieren, wenn Props sich ändern
  useEffect(() => {
    if (dashboardStartDate !== internalDashboardStartDate || dashboardEndDate !== internalDashboardEndDate) {
      setIsUpdatingDashboardDates(true);
      setInternalDashboardStartDate(dashboardStartDate);
      setInternalDashboardEndDate(dashboardEndDate);
      // Flag nach kurzer Verzögerung zurücksetzen
      setTimeout(() => {
        setIsUpdatingDashboardDates(false);
      }, 0);
    }
  }, [dashboardStartDate, dashboardEndDate, internalDashboardStartDate, internalDashboardEndDate]);
  
  // NEU: Effect zum Zurücksetzen aller Filter wenn resetTriggerId sich ändert
  useEffect(() => {
    if (resetTriggerId > 0) {
      // Alle internen Filter zurücksetzen
      setSelectedStudents([]);
      setGroupingOption('weekly');
    }
  }, [resetTriggerId]);
  
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
    dashboardStartDate: internalDashboardStartDate,
    setDashboardStartDate,
    dashboardEndDate: internalDashboardEndDate,
    setDashboardEndDate,
    isDashboardMode: viewMode === 'dashboard',
    
    // Die ursprüngliche getContextFilteredStudents-Funktion
    getContextFilteredStudents: () => {
      // Rufe die ursprüngliche getFilteredStudents-Funktion auf, um die Basis-Filterung zu erhalten
      const initialFiltered = getFilteredStudents();
      
      // Wenn Schüler ausgewählt sind und keine Suche aktiv ist, zeige nur die ausgewählten Schüler an
      if (selectedStudents.length > 0 && !internalSearchQuery) {
        return initialFiltered.filter(([student]) => selectedStudents.includes(student));
      }
      
      // Wenn Schüler ausgewählt sind und eine Suche aktiv ist, zeige Schüler an, die entweder 
      // ausgewählt wurden oder dem Suchtext entsprechen
      if (selectedStudents.length > 0 && internalSearchQuery) {
        return initialFiltered.filter(([student]) => {
          // Wenn der Schüler ausgewählt wurde, zeige ihn an
          if (selectedStudents.includes(student)) return true;
          
          // Wenn der Schüler dem Suchtext entspricht, zeige ihn auch an
          if (student.toLowerCase().includes(internalSearchQuery.toLowerCase())) {
            return true;
          }
          
          // Andernfalls zeige den Schüler nicht an
          return false;
        });
      }
      
      // Wenn keine Schüler ausgewählt sind, zeige alle ursprünglich gefilterten Schüler an
      return initialFiltered;
    },
    
    // NEUE FUNKTION: Diese Funktion gibt alle Schüler zurück, ohne nach selectedStudents zu filtern
    getAllStudents: () => {
      // Rufe die ursprüngliche getFilteredStudents-Funktion auf, um die Basis-Filterung zu erhalten
      const initialFiltered = getFilteredStudents();
      
      // Gib alle Schüler zurück, die den grundlegenden Filtern entsprechen,
      // aber ohne nach selectedStudents zu filtern
      return initialFiltered;
    }
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