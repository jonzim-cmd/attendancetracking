import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { StudentStats } from '@/types';
import { getLastNWeeks, parseDate } from '@/lib/attendance-utils';

interface DashboardViewProps {
  getFilteredStudents: () => [string, StudentStats][];
  rawData: any[] | null;
  startDate: string;
  endDate: string;
  selectedWeeks: string;
  availableClasses: string[];
  selectedClasses: string[];
}

const DashboardView: React.FC<DashboardViewProps> = ({
  getFilteredStudents,
  rawData,
  startDate,
  endDate,
  selectedWeeks,
  availableClasses,
  selectedClasses,
}) => {
  // States für die verschiedenen Datenaufbereitungen
  const [weeklyTrends, setWeeklyTrends] = useState<any[]>([]);
  const [classComparison, setClassComparison] = useState<any[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<any[]>([]);
  const [dayOfWeekData, setDayOfWeekData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'patterns'>('overview');
  
  // Farbpalette für Diagramme
  const COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', 
    '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1'
  ];
  
  useEffect(() => {
    if (!rawData || !startDate || !endDate) return;
    
    // Aufbereitung der Daten für die verschiedenen Diagramme
    prepareWeeklyTrends();
    prepareClassComparison();
    prepareAbsenceTypes();
    prepareDayOfWeekAnalysis();
  }, [rawData, startDate, endDate, selectedWeeks, selectedClasses]);
  
  const prepareWeeklyTrends = () => {
    if (!rawData) return;
    
    const weeks = getLastNWeeks(parseInt(selectedWeeks));
    const weeklyData = weeks.map(week => {
      // Startdatum der Woche im Format "DD.MM." formatieren
      const startDay = week.startDate.getDate().toString().padStart(2, '0');
      const startMonth = (week.startDate.getMonth() + 1).toString().padStart(2, '0');
      const weekLabel = `${startDay}.${startMonth}.`;
      
      // Filtern der Daten für diese Woche
      const weekEntries = rawData.filter(entry => {
        if (!entry.Beginndatum) return false;
        
        const entryDate = parseDate(entry.Beginndatum);
        return entryDate >= week.startDate && entryDate <= week.endDate;
      });
      
      // Zählen der verschiedenen Arten von Fehlzeiten/Verspätungen
      const verspaetungen = weekEntries.filter(entry => 
        entry.Abwesenheitsgrund === 'Verspätung' || 
        (entry.Endzeit && new Date(`01/01/2000 ${entry.Endzeit}`) < new Date(`01/01/2000 16:50`))
      ).length;
      
      const fehlzeiten = weekEntries.filter(entry => 
        entry.Abwesenheitsgrund !== 'Verspätung' && 
        !(entry.Endzeit && new Date(`01/01/2000 ${entry.Endzeit}`) < new Date(`01/01/2000 16:50`))
      ).length;
      
      return {
        name: weekLabel,
        verspaetungen,
        fehlzeiten
      };
    });
    
    setWeeklyTrends(weeklyData);
  };
  
  const prepareClassComparison = () => {
    if (!rawData) return;
    
    const classStats: {[key: string]: any} = {};
    
    rawData.forEach(entry => {
      if (!entry.Beginndatum || !entry.Klasse) return;
      
      const entryDate = parseDate(entry.Beginndatum);
      const startDateTime = new Date(startDate + 'T00:00:00');
      const endDateTime = new Date(endDate + 'T23:59:59');
      
      // Nur Einträge im gewählten Zeitraum berücksichtigen
      if (entryDate < startDateTime || entryDate > endDateTime) return;
      
      // Nur ausgewählte Klassen berücksichtigen oder alle, wenn keine ausgewählt sind
      if (selectedClasses.length > 0 && !selectedClasses.includes(entry.Klasse)) return;
      
      const className = entry.Klasse;
      
      if (!classStats[className]) {
        classStats[className] = {
          name: className,
          verspaetungen: 0,
          fehlzeiten: 0,
          total: 0
        };
      }
      
      const isVerspaetung = entry.Abwesenheitsgrund === 'Verspätung' || 
                          (entry.Endzeit && new Date(`01/01/2000 ${entry.Endzeit}`) < new Date(`01/01/2000 16:50`));
      
      if (isVerspaetung) {
        classStats[className].verspaetungen++;
      } else {
        classStats[className].fehlzeiten++;
      }
      
      classStats[className].total++;
    });
    
    // In Array konvertieren und nach Klasse sortieren
    const classArray = Object.values(classStats).sort((a: any, b: any) => a.name.localeCompare(b.name));
    
    setClassComparison(classArray);
  };
  
  const prepareAbsenceTypes = () => {
    if (!rawData) return;
    
    let entschuldigt = 0;
    let unentschuldigt = 0;
    let offen = 0;
    
    rawData.forEach(entry => {
      if (!entry.Beginndatum) return;
      
      const entryDate = parseDate(entry.Beginndatum);
      const startDateTime = new Date(startDate + 'T00:00:00');
      const endDateTime = new Date(endDate + 'T23:59:59');
      
      // Nur Einträge im gewählten Zeitraum berücksichtigen
      if (entryDate < startDateTime || entryDate > endDateTime) return;
      
      // Nur ausgewählte Klassen berücksichtigen oder alle, wenn keine ausgewählt sind
      if (selectedClasses.length > 0 && !selectedClasses.includes(entry.Klasse)) return;
      
      const status = entry.Status ? entry.Status.trim() : '';
      
      if (status === 'entsch.' || status === 'Attest' || status === 'Attest Amtsarzt') {
        entschuldigt++;
      } else if (status === 'nicht entsch.' || status === 'nicht akzep.') {
        unentschuldigt++;
      } else {
        // Prüfen, ob die Entschuldigungsfrist abgelaufen ist
        const today = new Date();
        const deadlineDate = new Date(entryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        if (today > deadlineDate) {
          unentschuldigt++;
        } else {
          offen++;
        }
      }
    });
    
    setAbsenceTypes([
      { name: 'Entschuldigt', value: entschuldigt, color: '#10B981' },
      { name: 'Unentschuldigt', value: unentschuldigt, color: '#EF4444' },
      { name: 'Offen', value: offen, color: '#F59E0B' }
    ]);
  };
  
  const prepareDayOfWeekAnalysis = () => {
    if (!rawData) return;
    
    const dayStats = Array(7).fill(0).map((_, index) => ({
      name: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][index],
      fehlzeiten: 0,
      verspaetungen: 0
    }));
    
    rawData.forEach(entry => {
      if (!entry.Beginndatum) return;
      
      const entryDate = parseDate(entry.Beginndatum);
      const startDateTime = new Date(startDate + 'T00:00:00');
      const endDateTime = new Date(endDate + 'T23:59:59');
      
      // Nur Einträge im gewählten Zeitraum berücksichtigen
      if (entryDate < startDateTime || entryDate > endDateTime) return;
      
      // Nur ausgewählte Klassen berücksichtigen oder alle, wenn keine ausgewählt sind
      if (selectedClasses.length > 0 && !selectedClasses.includes(entry.Klasse)) return;
      
      const dayOfWeek = entryDate.getDay(); // 0 = Sonntag, 1 = Montag, ...
      
      const isVerspaetung = entry.Abwesenheitsgrund === 'Verspätung' || 
                          (entry.Endzeit && new Date(`01/01/2000 ${entry.Endzeit}`) < new Date(`01/01/2000 16:50`));
      
      if (isVerspaetung) {
        dayStats[dayOfWeek].verspaetungen++;
      } else {
        dayStats[dayOfWeek].fehlzeiten++;
      }
    });
    
    // Filtere Wochenenden heraus, wenn keine Daten vorhanden
    const filteredDayStats = dayStats.filter(day => 
      (day.name !== 'Samstag' && day.name !== 'Sonntag') || 
      (day.fehlzeiten > 0 || day.verspaetungen > 0)
    );
    
    setDayOfWeekData(filteredDayStats);
  };
  
  // Formatierung der Daten und Beschriftungen für das Dashboard
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  if (!rawData) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Bitte laden Sie Anwesenheitsdaten hoch, um das Dashboard anzuzeigen.
      </div>
    );
  }
  
  return (
    <div className="space-y-2 pb-6">
      {/* Kompakte Überschrift */}
      <h3 className="text-base font-semibold text-chatGray-textLight dark:text-chatGray-textDark mb-1">
        Dashboard für den Zeitraum {formatDate(startDate)} - {formatDate(endDate)}
      </h3>
      
      {/* Tab-Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'overview'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Übersicht
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'classes'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('classes')}
        >
          Klassenvergleich
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'patterns'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('patterns')}
        >
          Muster & Trends
        </button>
      </div>
      
      {/* Optimierter Container für die Diagramme mit fester Höhe */}
      <div 
        className="relative border border-tableBorder-light dark:border-tableBorder-dark rounded-md overflow-auto bg-table-light-base dark:bg-table-dark-base p-4"
        style={{ height: 'calc(100vh - 115px)' }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            {/* Wochentrends */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Wöchentlicher Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="verspaetungen" 
                      name="Verspätungen" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fehlzeiten" 
                      name="Fehlzeiten" 
                      stroke="#82ca9d" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Entschuldigungsstatus */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Entschuldigungsstatus</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={absenceTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {absenceTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Einträge`, 'Anzahl']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Statistik-Zusammenfassung */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Schnellstatistik</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gesamtzahl Verspätungen</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {weeklyTrends.reduce((sum, week) => sum + week.verspaetungen, 0)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gesamtzahl Fehltage</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {weeklyTrends.reduce((sum, week) => sum + week.fehlzeiten, 0)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Erfasste Schüler</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getFilteredStudents().length}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Unentschuldigte Einträge</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {absenceTypes.find(type => type.name === 'Unentschuldigt')?.value || 0}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Wochentagsanalyse */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Wochentagsanalyse</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="verspaetungen" 
                      name="Verspätungen" 
                      fill="#8884d8" 
                    />
                    <Bar 
                      dataKey="fehlzeiten" 
                      name="Fehlzeiten" 
                      fill="#82ca9d" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 gap-6 pb-6">
            {/* Klassenvergleich */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Klassenvergleich</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="verspaetungen" 
                      name="Verspätungen" 
                      fill="#8884d8" 
                    />
                    <Bar 
                      dataKey="fehlzeiten" 
                      name="Fehlzeiten" 
                      fill="#82ca9d" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Klassendetails */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Klassendetails</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Klasse
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Verspätungen
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Fehltage
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Gesamt
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {classComparison.map((classData, index) => (
                      <tr key={classData.name} className={index % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-700'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {classData.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                          {classData.verspaetungen}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                          {classData.fehlzeiten}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                          {classData.verspaetungen + classData.fehlzeiten}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'patterns' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            {/* Wochentagsanalyse (ausführlicher) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Wochentagstrends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="verspaetungen" 
                      name="Verspätungen" 
                      fill="#8884d8" 
                    />
                    <Bar 
                      dataKey="fehlzeiten" 
                      name="Fehlzeiten" 
                      fill="#82ca9d" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  {dayOfWeekData.length > 0 ? (
                    <>
                      Tag mit den meisten Verspätungen: <span className="font-medium text-gray-700 dark:text-gray-300">
                        {dayOfWeekData.reduce((max, day) => day.verspaetungen > max.verspaetungen ? day : max, dayOfWeekData[0]).name}
                      </span>
                      <br />
                      Tag mit den meisten Fehlzeiten: <span className="font-medium text-gray-700 dark:text-gray-300">
                        {dayOfWeekData.reduce((max, day) => day.fehlzeiten > max.fehlzeiten ? day : max, dayOfWeekData[0]).name}
                      </span>
                    </>
                  ) : (
                    'Keine Daten für Wochentagsanalyse verfügbar.'
                  )}
                </p>
              </div>
            </div>
            
            {/* Muster & Trends */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Zeitliche Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="verspaetungen" 
                      name="Verspätungen" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fehlzeiten" 
                      name="Fehlzeiten" 
                      stroke="#82ca9d" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  {weeklyTrends.length > 0 ? (
                    <>
                      Insgesamt {weeklyTrends.reduce((sum, week) => sum + week.verspaetungen, 0)} Verspätungen und {weeklyTrends.reduce((sum, week) => sum + week.fehlzeiten, 0)} Fehltage im ausgewählten Zeitraum.
                    </>
                  ) : (
                    'Keine Daten für Zeitliche Trends verfügbar.'
                  )}
                </p>
              </div>
            </div>
            
            {/* Entschuldigungsstatus (ausführlicher) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Entschuldigungsanalyse</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={absenceTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {absenceTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Einträge`, 'Anzahl']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  {absenceTypes.length > 0 ? (
                    <>
                      <span className="text-green-600 font-medium">{absenceTypes.find(type => type.name === 'Entschuldigt')?.value || 0}</span> entschuldigte Einträge, 
                      <span className="text-red-600 font-medium ml-1">{absenceTypes.find(type => type.name === 'Unentschuldigt')?.value || 0}</span> unentschuldigte Einträge,
                      <span className="text-yellow-600 font-medium ml-1">{absenceTypes.find(type => type.name === 'Offen')?.value || 0}</span> offene Einträge
                    </>
                  ) : (
                    'Keine Daten für Entschuldigungsanalyse verfügbar.'
                  )}
                </p>
              </div>
            </div>
            
            {/* Zusammenfassung der Erkenntnisse */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Erkenntnisse</h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                {weeklyTrends.length > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-medium mb-1">Wochentrend:</p>
                    <p>
                      {(() => {
                        // Vergleiche ersten und letzten Eintrag
                        if (weeklyTrends.length >= 2) {
                          const firstWeek = weeklyTrends[0];
                          const lastWeek = weeklyTrends[weeklyTrends.length - 1];
                          const verspaetungsTrend = lastWeek.verspaetungen - firstWeek.verspaetungen;
                          const fehlzeitenTrend = lastWeek.fehlzeiten - firstWeek.fehlzeiten;
                          
                          return (
                            <>
                              Die Verspätungen haben sich {verspaetungsTrend > 0 ? 'erhöht' : verspaetungsTrend < 0 ? 'verringert' : 'nicht verändert'}.
                              Die Fehlzeiten haben sich {fehlzeitenTrend > 0 ? 'erhöht' : fehlzeitenTrend < 0 ? 'verringert' : 'nicht verändert'}.
                            </>
                          );
                        }
                        return 'Nicht genügend Daten für Trendanalyse.';
                      })()}
                    </p>
                  </div>
                )}
                
                {dayOfWeekData.length > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-medium mb-1">Wochentagsmuster:</p>
                    <p>
                      {(() => {
                        const maxVerspaetungenTag = dayOfWeekData.reduce((max, day) => day.verspaetungen > max.verspaetungen ? day : max, dayOfWeekData[0]);
                        const maxFehlzeitenTag = dayOfWeekData.reduce((max, day) => day.fehlzeiten > max.fehlzeiten ? day : max, dayOfWeekData[0]);
                        
                        return `Die meisten Verspätungen treten am ${maxVerspaetungenTag.name} auf, die meisten Fehlzeiten am ${maxFehlzeitenTag.name}.`;
                      })()}
                    </p>
                  </div>
                )}
                
                {absenceTypes.length > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-medium mb-1">Entschuldigungsrate:</p>
                    <p>
                      {(() => {
                        const entschuldigt = absenceTypes.find(type => type.name === 'Entschuldigt')?.value || 0;
                        const unentschuldigt = absenceTypes.find(type => type.name === 'Unentschuldigt')?.value || 0;
                        const offen = absenceTypes.find(type => type.name === 'Offen')?.value || 0;
                        const total = entschuldigt + unentschuldigt + offen;
                        
                        if (total === 0) return 'Keine Daten verfügbar.';
                        
                        const entschuldigtProzent = ((entschuldigt / total) * 100).toFixed(1);
                        const unentschuldigtProzent = ((unentschuldigt / total) * 100).toFixed(1);
                        
                        return `${entschuldigtProzent}% aller Einträge sind entschuldigt, ${unentschuldigtProzent}% sind unentschuldigt.`;
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;