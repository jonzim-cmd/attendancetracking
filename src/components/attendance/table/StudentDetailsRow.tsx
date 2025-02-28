import React from 'react';
import { getLastNWeeks } from '@/lib/attendance-utils';
import { AbsenceEntry } from '@/types';

interface StudentDetailsRowProps {
  student: string;
  detailedData: AbsenceEntry[];
  rowColor: string;
  isVisible: boolean;
  filterType?: string;
  selectedWeeks: string;
  visibleColumns: string[];
}

const StudentDetailsRow: React.FC<StudentDetailsRowProps> = ({
  student,
  detailedData,
  rowColor,
  isVisible,
  filterType,
  selectedWeeks,
  visibleColumns,
}) => {
  const getFilterTitle = () => {
    switch (filterType) {
      case 'details': return 'Unentschuldigte Abwesenheiten';
      case 'verspaetungen_entsch': return 'Entschuldigte Verspätungen';
      case 'verspaetungen_unentsch': return 'Unentschuldigte Verspätungen';
      case 'verspaetungen_offen': return 'Offene Verspätungen';
      case 'fehlzeiten_entsch': return 'Entschuldigte Fehltage';
      case 'fehlzeiten_unentsch': return 'Unentschuldigte Fehltage';
      case 'fehlzeiten_offen': return 'Offene Fehltage';
      case 'sj_verspaetungen': return 'Unentschuldigte Verspätungen im Schuljahr';
      case 'sj_fehlzeiten': return 'Unentschuldigte Fehlzeiten im Schuljahr';
      case 'sj_fehlzeiten_ges': return 'Gesamte Fehlzeiten im Schuljahr';
      case 'sum_verspaetungen': return `Unentschuldigte Verspätungen (${selectedWeeks} Wochen)`;
      case 'sum_fehlzeiten': return `Unentschuldigte Fehlzeiten (${selectedWeeks} Wochen)`;
      default: return 'Abwesenheitsdetails';
    }
  };

  const formatDate = (datum: Date | string) => {
    if (typeof datum === 'string') {
      const [day, month, year] = datum.split('.');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
    return datum.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getStatusColor = (status: string, datum: Date | string) => {
    if (status === 'entsch.' || status === 'Attest' || status === 'Attest Amtsarzt') {
      return 'text-green-600 dark:text-green-400';
    }
    if (status === 'nicht entsch.' || status === 'nicht akzep.') {
      return 'text-red-600 dark:text-red-400';
    }
    if (!status || status.trim() === '') {
      const today = new Date();
      let abwesenheitsDatum: Date;
      if (typeof datum === 'string') {
        const [day, month, year] = datum.split('.');
        abwesenheitsDatum = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        abwesenheitsDatum = new Date(datum);
      }
      const deadlineDate = new Date(abwesenheitsDatum.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (today > deadlineDate) {
        return 'text-red-600 dark:text-red-400';
      }
    }
    return 'text-yellow-600 dark:text-yellow-400';
  };

  const renderDetailSection = (entries: AbsenceEntry[], title: string) => {
    if (!entries || entries.length === 0) return null;

    return (
      <div className="mb-4">
        <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{title}</h5>
        <div className="space-y-1 pl-4">
          {entries.map((entry, i) => {
            const statusColor = getStatusColor(entry.status || '', entry.datum);
            const reverseIndex = entries.length - i;
            return (
              <div 
                key={i}
                className={`${statusColor} hover:bg-gray-50 dark:hover:bg-gray-600 p-1 rounded`}
              >
                <span className="font-medium">{reverseIndex}. {formatDate(entry.datum)}</span>
                {entry.art === 'Verspätung' ? (
                  <span className="ml-2">
                    {entry.beginnZeit} - {entry.endZeit} Uhr
                    {entry.grund && ` (${entry.grund})`}
                  </span>
                ) : (
                  <span className="ml-2">
                    {entry.art}
                    {entry.grund && ` - ${entry.grund}`}
                  </span>
                )}
                {entry.status && (
                  <span className="ml-2 italic">[{entry.status}]</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const isUnexcused = (entry: AbsenceEntry) => {
    const status = entry.status || '';
    const isUnentschuldigt = status === 'nicht entsch.' || status === 'nicht akzep.';
    if (!status.trim()) {
      const today = new Date();
      const dateParts = (typeof entry.datum === 'string' ? entry.datum : entry.datum.toLocaleDateString('de-DE')).split('.');
      const entryDate = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
      const deadlineDate = new Date(entryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      return today > deadlineDate;
    }
    return isUnentschuldigt;
  };

  const parseDateString = (datum: string | Date): Date => {
    if (typeof datum === 'string') {
      const [day, month, year] = datum.split('.');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return datum;
  };

  const groupEntriesByWeek = (entries: AbsenceEntry[], weeks: { startDate: Date; endDate: Date }[]) => {
    const grouped: AbsenceEntry[][] = weeks.map(() => []);
    entries.forEach(entry => {
      const entryDate = parseDateString(entry.datum);
      const weekIndex = weeks.findIndex(week => entryDate >= week.startDate && entryDate <= week.endDate);
      if (weekIndex >= 0) {
        grouped[weekIndex].push(entry);
      }
    });
    return grouped;
  };

  const renderWeeklyDetails = (isVerspaetung: boolean) => {
    const weeks = getLastNWeeks(parseInt(selectedWeeks));
    const reversedWeeks = [...weeks].reverse();
    const groupedEntries = groupEntriesByWeek(detailedData.filter(e => (isVerspaetung ? e.art === 'Verspätung' : e.art !== 'Verspätung')), weeks);
    const reversedGroupedEntries = [...groupedEntries].reverse();

    return (
      <div className="space-y-4">
        {reversedWeeks.map((week, index) => {
          const weekEntries = reversedGroupedEntries[index];
          const weekStart = week.startDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
          const weekEnd = week.endDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

          const sortedWeekEntries = weekEntries.sort((a, b) => 
            parseDateString(b.datum).getTime() - parseDateString(a.datum).getTime()
          );

          return (
            <div key={index}>
              <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Woche {index + 1} ({weekStart} - {weekEnd})</h5>
              <div className="space-y-1 pl-4">
                {sortedWeekEntries.length > 0 ? (
                  sortedWeekEntries.map((entry, i) => {
                    const statusColor = getStatusColor(entry.status || '', entry.datum);
                    return (
                      <div 
                        key={i}
                        className={`${statusColor} hover:bg-gray-50 dark:hover:bg-gray-600 p-1 rounded`}
                      >
                        <span className="font-medium">{formatDate(entry.datum)}</span>
                        {entry.art === 'Verspätung' ? (
                          <span className="ml-2">
                            {entry.beginnZeit} - {entry.endZeit} Uhr
                            {entry.grund && ` (${entry.grund})`}
                          </span>
                        ) : (
                          <span className="ml-2">
                            {entry.art}
                            {entry.grund && ` - ${entry.grund}`}
                          </span>
                        )}
                        {entry.status && (
                          <span className="ml-2 italic">[{entry.status}]</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 italic">Keine Einträge</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDetailsContent = () => {
    if (!detailedData || detailedData.length === 0) return (
      <div className="text-gray-500 dark:text-gray-400 italic">Keine Daten verfügbar</div>
    );

    if (filterType === 'details') {
      const unexcusedLates = detailedData
        .filter(entry => entry.art === 'Verspätung' && isUnexcused(entry))
        .sort((a, b) => parseDateString(b.datum).getTime() - parseDateString(a.datum).getTime());
      const unexcusedAbsences = detailedData
        .filter(entry => entry.art !== 'Verspätung' && isUnexcused(entry))
        .sort((a, b) => parseDateString(b.datum).getTime() - parseDateString(a.datum).getTime());

      return (
        <>
          {renderDetailSection(unexcusedLates, 'Unentschuldigte Verspätungen')}
          {renderDetailSection(unexcusedAbsences, 'Unentschuldigte Fehlzeiten')}
          {(!unexcusedLates?.length && !unexcusedAbsences?.length) && (
            <div className="text-gray-500 dark:text-gray-400 italic">Keine unentschuldigten Einträge</div>
          )}
        </>
      );
    }

    if (filterType === 'sum_verspaetungen') return renderWeeklyDetails(true);
    if (filterType === 'sum_fehlzeiten') return renderWeeklyDetails(false);

    const sortedData = [...detailedData].sort((a, b) => 
      parseDateString(b.datum).getTime() - parseDateString(a.datum).getTime()
    );

    return (
      <div className="space-y-1">
        {sortedData.length > 0 ? (
          sortedData.map((entry, i) => {
            const statusColor = getStatusColor(entry.status || '', entry.datum);
            const reverseIndex = sortedData.length - i;
            return (
              <div 
                key={i}
                className={`${statusColor} hover:bg-gray-50 dark:hover:bg-gray-600 p-1 rounded`}
              >
                <span className="font-medium">{reverseIndex}. {formatDate(entry.datum)}</span>
                {entry.art === 'Verspätung' ? (
                  <span className="ml-2">
                    {entry.beginnZeit} - {entry.endZeit} Uhr
                    {entry.grund && ` (${entry.grund})`}
                  </span>
                ) : (
                  <span className="ml-2">
                    {entry.art}
                    {entry.grund && ` - ${entry.grund}`}
                  </span>
                )}
                {entry.status && (
                  <span className="ml-2 italic">[{entry.status}]</span>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-gray-500 dark:text-gray-400 italic">Keine Einträge</div>
        )}
      </div>
    );
  };

  const isStatsFilter = filterType && ['sj_verspaetungen', 'sj_fehlzeiten', 'sj_fehlzeiten_ges', 'sum_verspaetungen', 'sum_fehlzeiten'].includes(filterType);
  if (isStatsFilter && !visibleColumns.includes('stats')) return null;

  return (
    <tr 
      id={`details-${student}`}
      className={`${rowColor} transition-all duration-300 ${isVisible ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}
    >
      <td colSpan={visibleColumns.includes('stats') ? 14 : 9} className="px-4 py-2 text-sm border-b border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-white">{getFilterTitle()}</h4>
          <div className="pl-4">{renderDetailsContent()}</div>
        </div>
      </td>
    </tr>
  );
};

export default StudentDetailsRow;