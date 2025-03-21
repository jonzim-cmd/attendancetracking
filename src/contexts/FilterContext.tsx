// src/contexts/FilterContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { StudentStats } from '@/types';

// NEU: Definiere den DashboardTileType
export type DashboardTileType = 'regression' | 'timeSeries' | 'weekday' | 'movingAverage';

// NEU: Standardreihenfolge der Dashboard-Kacheln
const DEFAULT_DASHBOARD_TILES_ORDER: DashboardTileType[] = [
  'regression',
  'weekday',
  'timeSeries',
  'movingAverage'
];

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
  
  // QuickSelect Werte und Funktionen
  quickSelectValue: string;
  handleQuickSelect: (value: string) => void;
  
  // Zugriff auf die gefilterten Schülerdaten
  getContextFilteredStudents: () => [string, StudentStats][];
  
  // NEUE FUNKTION: Zugriff auf alle Schüler, ohne nach selectedStudents zu filtern
  getAllStudents: () => [string, StudentStats][];
  
  // NEU: Dashboard-Kachel-Sichtbarkeit
  visibleDashboardTiles: Record<string, boolean>;
  setVisibleDashboardTiles: (tiles: Record<string, boolean>) => void;
  toggleDashboardTile: (tileId: string) => void;
  toggleAllDashboardTiles: (visible: boolean) => void;
  
  // NEU: Dashboard-Kachel-Reihenfolge
  dashboardTilesOrder: DashboardTileType[];
  setDashboardTileOrder: (tileType: DashboardTileType, newPosition: number) => void;
  resetDashboardTilesOrder: () => void;
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
  quickSelectValue?: string; // Neu: QuickSelect-Value als optionale Prop
  handleQuickSelect?: (value: string) => void; // Neu: QuickSelect-Handler als optionale Prop
  onDashboardClassesChange?: (classes: string[]) => void; // Neu: Callback für Dashboard-Klassen-Änderungen
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
  quickSelectValue = '', // Default-Wert für QuickSelect
  handleQuickSelect = () => {}, // Leere Funktion als Default
  onDashboardClassesChange = () => {}, // Neu: Leere Funktion als Default
}) => {
  // Dashboard-Filter
  const [selectedDashboardClasses, setSelectedDashboardClasses] = useState<string[]>(propSelectedClasses);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [groupingOption, setGroupingOption] = useState<'weekly' | 'monthly'>('monthly');
  
  // Neuer State für die Suche
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>(propSearchQuery);
  const [isUpdatingFromProp, setIsUpdatingFromProp] = useState(false);
  
  // Neuer State für Klassensynchronisation
  const [isUpdatingClassesFromProp, setIsUpdatingClassesFromProp] = useState(false);
  
  // Interne Speicherung der Dashboard-Datumsfilter
  const [internalDashboardStartDate, setInternalDashboardStartDate] = useState<string>(dashboardStartDate);
  const [internalDashboardEndDate, setInternalDashboardEndDate] = useState<string>(dashboardEndDate);
  const [isUpdatingDashboardDates, setIsUpdatingDashboardDates] = useState(false);
  
  // NEU: State für die Sichtbarkeit der Dashboard-Kacheln
  const [visibleDashboardTiles, setVisibleDashboardTiles] = useState<Record<string, boolean>>({
    timeSeries: true,
    weekday: true,
    movingAverage: true,
    regression: true
  });
  
  // NEU: State für die Reihenfolge der Dashboard-Kacheln
  const [dashboardTilesOrder, setDashboardTilesOrderState] = useState<DashboardTileType[]>(DEFAULT_DASHBOARD_TILES_ORDER);
  
  // NEU: Funktion zum Ändern der Reihenfolge einer Kachel
  const setDashboardTileOrder = useCallback((tileType: DashboardTileType, newPosition: number) => {
    setDashboardTilesOrderState(prevOrder => {
      // Erzeuge eine Kopie der aktuellen Reihenfolge
      const newOrder = [...prevOrder];
      
      // Finde die aktuelle Position des Elements
      const currentIndex = newOrder.indexOf(tileType);
      
      // Wenn das Element nicht gefunden wird, keine Änderung
      if (currentIndex === -1) return prevOrder;
      
      // Entferne das Element aus der aktuellen Position
      newOrder.splice(currentIndex, 1);
      
      // Stelle sicher, dass die neue Position gültig ist
      const safeNewPosition = Math.max(0, Math.min(newPosition, newOrder.length));
      
      // Füge das Element an der neuen Position ein
      newOrder.splice(safeNewPosition, 0, tileType);
      
      return newOrder;
    });
  }, []);
  
  // NEU: Funktion zum Zurücksetzen auf die Standardreihenfolge
  const resetDashboardTilesOrder = useCallback(() => {
    setDashboardTilesOrderState(DEFAULT_DASHBOARD_TILES_ORDER);
  }, []);
  
  // NEU: Funktion zum Umschalten der Sichtbarkeit einer einzelnen Kachel
  const toggleDashboardTile = useCallback((tileId: string) => {
    setVisibleDashboardTiles(prev => ({
      ...prev,
      [tileId]: !prev[tileId]
    }));
  }, []);
  
  // NEU: Funktion zum Umschalten der Sichtbarkeit aller Kacheln
  const toggleAllDashboardTiles = useCallback((visible: boolean) => {
    setVisibleDashboardTiles({
      timeSeries: visible,
      weekday: visible,
      movingAverage: visible,
      regression: visible
    });
  }, []);
  
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
  
  // Memoized setSelectedDashboardClasses um Endlosschleifen zu vermeiden
  const setSelectedDashboardClassesWithCallback = useCallback((classes: string[]) => {
    setSelectedDashboardClasses(classes);
    if (!isUpdatingClassesFromProp) {
      onDashboardClassesChange(classes);
    }
  }, [onDashboardClassesChange, isUpdatingClassesFromProp]);
  
  // Gemeinsame Filter - wir nutzen die Prop für den tatsächlichen Zustand
  const viewMode = propViewMode;
  const setViewMode = onViewModeChange;
  
  // Effect um selectedDashboardClasses zu aktualisieren, wenn propSelectedClasses sich ändert
  useEffect(() => {
    if (JSON.stringify(propSelectedClasses) !== JSON.stringify(selectedDashboardClasses)) {
      setIsUpdatingClassesFromProp(true);
      setSelectedDashboardClasses(propSelectedClasses);
      // Flag nach kurzer Verzögerung zurücksetzen
      setTimeout(() => {
        setIsUpdatingClassesFromProp(false);
      }, 0);
    }
  }, [propSelectedClasses, selectedDashboardClasses]);
  
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
      setGroupingOption('monthly');
      // NEU: Alle Kacheln wieder sichtbar machen
      toggleAllDashboardTiles(true);
      // NEU: Reihenfolge zurücksetzen
      resetDashboardTilesOrder();
    }
  }, [resetTriggerId, toggleAllDashboardTiles, resetDashboardTilesOrder]);
  
  // NEU: Laden der gespeicherten Kachel-Sichtbarkeit aus dem localStorage, wenn die Komponente geladen wird
  useEffect(() => {
    try {
      const savedVisibility = localStorage.getItem('dashboardTilesVisibility');
      if (savedVisibility) {
        setVisibleDashboardTiles(JSON.parse(savedVisibility));
      }
      
      // NEU: Laden der gespeicherten Kachel-Reihenfolge
      const savedOrder = localStorage.getItem('dashboardTilesOrder');
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        // Prüfen, ob es sich um ein gültiges Array mit korrekten Werten handelt
        if (Array.isArray(parsedOrder) && parsedOrder.length === 4 &&
            parsedOrder.every(tile => ['regression', 'timeSeries', 'weekday', 'movingAverage'].includes(tile))) {
          setDashboardTilesOrderState(parsedOrder as DashboardTileType[]);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Kachel-Einstellungen:', error);
    }
  }, []);
  
  // NEU: Speichern der Kachel-Sichtbarkeit im localStorage, wenn sie sich ändert
  useEffect(() => {
    try {
      localStorage.setItem('dashboardTilesVisibility', JSON.stringify(visibleDashboardTiles));
    } catch (error) {
      console.error('Fehler beim Speichern der Kachel-Sichtbarkeit:', error);
    }
  }, [visibleDashboardTiles]);
  
  // NEU: Speichern der Kachel-Reihenfolge im localStorage, wenn sie sich ändert
  useEffect(() => {
    try {
      localStorage.setItem('dashboardTilesOrder', JSON.stringify(dashboardTilesOrder));
    } catch (error) {
      console.error('Fehler beim Speichern der Kachel-Reihenfolge:', error);
    }
  }, [dashboardTilesOrder]);
  
  const contextValue = {
    selectedDashboardClasses,
    setSelectedDashboardClasses: setSelectedDashboardClassesWithCallback,
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
    quickSelectValue,
    handleQuickSelect,
    
    // NEU: Dashboard Tile Visibility
    visibleDashboardTiles,
    setVisibleDashboardTiles,
    toggleDashboardTile,
    toggleAllDashboardTiles,
    
    // NEU: Dashboard Tile Order
    dashboardTilesOrder,
    setDashboardTileOrder,
    resetDashboardTilesOrder,
    
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