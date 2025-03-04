// src/components/attendance/dashboard/styles.ts

// Farbkonstanten für Absenztypen (entschuldigt, unentschuldigt, offen)
export const STATUS_COLORS = {
  entschuldigt: '#16a34a', // grün
  unentschuldigt: '#dc2626', // rot
  offen: '#F59E0B', // gelb/orange
  verspaetungen: '#9333ea', // lila
};

// Gemeinsame Tailwind-Klassen für Karten - Neutrale Grenze
export const CARD_CLASSES = "bg-table-light-base dark:bg-table-dark-base rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm p-4";

// Gemeinsame Tailwind-Klassen für Kartentitel
export const CARD_TITLE_CLASSES = "text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100";

// Gemeinsame Höhen für Charts
export const CHART_HEIGHT = "h-64";

// Gemeinsame Tailwind-Klassen für Chart-Container
export const CHART_CONTAINER_CLASSES = `${CHART_HEIGHT} w-full`;

// Gemeinsame Tailwind-Klassen für Tabellenheader
export const TABLE_HEADER_CLASSES = "px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-200 uppercase tracking-wider";

// Gemeinsame Tailwind-Klassen für Tabellenzellen
export const TABLE_CELL_CLASSES = "px-6 py-4 whitespace-nowrap text-sm";

// Gemeinsame Tailwind-Klassen für Tabs
export const TAB_CLASSES = {
  active: "py-2 px-4 font-medium text-sm border-b-2 border-gray-800 dark:border-gray-300 text-gray-800 dark:text-gray-300",
  inactive: "py-2 px-4 font-medium text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
};

// Gemeinsame Tailwind-Klassen für den Dashboard-Container
export const DASHBOARD_CONTAINER_CLASSES = "grid grid-cols-1 md:grid-cols-2 gap-6 pb-6";

// Gemeinsame Tailwind-Klassen für Info-Kacheln
export const INFO_TILE_CLASSES = "p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600";

// Text-Styling für normale Beschreibungen
export const TEXT_DESCRIPTION_CLASSES = "text-sm text-gray-600 dark:text-gray-300";

// Text-Styling für Werte in Info-Kacheln
export const TEXT_VALUE_CLASSES = "text-2xl font-bold text-gray-800 dark:text-gray-100";