import * as XLSX from 'xlsx';
import { unparse } from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getLastNWeeks } from '@/lib/attendance-utils';
import { AbsenceEntry, DetailedStats, StudentStats } from '@/types';

interface ExportProps {
  getFilteredStudents: () => [string, StudentStats][];
  startDate: string;
  endDate: string;
  schoolYearStats: Record<string, { verspaetungen_unentsch: number; fehlzeiten_unentsch: number; fehlzeiten_gesamt: number }>;
  weeklyStats: Record<string, { verspaetungen: { total: number; weekly: number[] }; fehlzeiten: { total: number; weekly: number[] } }>;
  selectedWeeks: string;
  detailedData: Record<string, DetailedStats>;
  schoolYearDetailedData: Record<string, any>;
  weeklyDetailedData: Record<string, DetailedStats>;
  expandedStudents: Set<string>;
  activeFilters: Map<string, string>;
}

const parseDate = (dateStr: string | Date): Date => {
  if (dateStr instanceof Date) return dateStr;
  const [day, month, year] = dateStr.split('.');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

const getDetailHeader = (filterType: string): string => {
  switch (filterType) {
    case 'verspaetungen_entsch': return 'Entschuldigte Verspätungen';
    case 'verspaetungen_unentsch': return 'Unentschuldigte Verspätungen';
    case 'verspaetungen_offen': return 'Noch zu entschuldigende Verspätungen (Frist läuft noch)';
    case 'fehlzeiten_entsch': return 'Entschuldigte Fehlzeiten';
    case 'fehlzeiten_unentsch': return 'Unentschuldigte Fehlzeiten';
    case 'fehlzeiten_offen': return 'Noch zu entschuldigende Fehlzeiten (Frist läuft noch)';
    case 'sj_verspaetungen': return 'Unent. Verspätungen im Schuljahr';
    case 'sj_fehlzeiten': return 'Unent. Fehlzeiten im Schuljahr';
    case 'sj_fehlzeiten_ges': return 'Ges. Fehlzeiten im Schuljahr (E + U)';
    case 'sum_verspaetungen': return `Unent. Verspätungen in den letzten ${filterType.split('_')[1]} Wochen`;
    case 'sum_fehlzeiten': return `Unent. Fehlzeiten in den letzten ${filterType.split('_')[1]} Wochen`;
    case 'details': return 'Unent. Verspätungen und Fehlzeiten';
    default: return '';
  }
};

const getFilterTypeColor = (filterType: string): number[] => {
  switch (filterType) {
    case 'verspaetungen_entsch': return [220, 237, 200];
    case 'verspaetungen_unentsch': return [255, 213, 213];
    case 'verspaetungen_offen': return [255, 243, 205];
    case 'fehlzeiten_entsch': return [200, 230, 201];
    case 'fehlzeiten_unentsch': return [255, 205, 210];
    case 'fehlzeiten_offen': return [255, 236, 179];
    case 'sj_verspaetungen': case 'sum_verspaetungen': return [225, 225, 255];
    case 'sj_fehlzeiten': case 'sum_fehlzeiten': case 'sj_fehlzeiten_ges': return [230, 230, 250];
    case 'details': return [240, 240, 240];
    default: return [245, 245, 245];
  }
};

const getStatusColor = (status: string, datum: Date | string): number[] => {
  if (status === 'entsch.' || status === 'Attest' || status === 'Attest Amtsarzt') {
    return [0, 150, 0];
  }
  if (status === 'nicht entsch.' || status === 'nicht akzep.') {
    return [200, 0, 0];
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
      return [200, 0, 0];
    }
  }
  return [204, 163, 0];
};

const formatDate = (datum: Date | string): string => {
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

interface Week {
  startDate: Date;
  endDate: Date;
}

const getStudentDetails = (
  studentName: string,
  filterType: string | undefined,
  selectedWeeks: string,
  detailedData: Record<string, DetailedStats>,
  schoolYearDetailedData: Record<string, any>,
  weeklyDetailedData: Record<string, DetailedStats>
): AbsenceEntry[] => {
  if (!filterType) return [];
  let details: AbsenceEntry[] = [];
  let studentData: DetailedStats | any;
  if (filterType.startsWith('sj_')) {
    studentData = schoolYearDetailedData[studentName];
  } else if (filterType.startsWith('sum_')) {
    studentData = weeklyDetailedData[studentName];
  } else {
    studentData = detailedData[studentName];
  }
  if (studentData) {
    switch (filterType) {
      case 'verspaetungen_entsch':
      case 'verspaetungen_unentsch':
      case 'verspaetungen_offen':
      case 'fehlzeiten_entsch':
      case 'fehlzeiten_unentsch':
      case 'fehlzeiten_offen':
        details = studentData[filterType as keyof DetailedStats] || [];
        break;
      case 'sj_verspaetungen':
        details = studentData.verspaetungen_unentsch || [];
        break;
      case 'sj_fehlzeiten':
        details = studentData.fehlzeiten_unentsch || [];
        break;
      case 'sj_fehlzeiten_ges':
        details = studentData.fehlzeiten_gesamt || [];
        break;
      case 'sum_verspaetungen':
      case 'sum_fehlzeiten': {
        const isVerspaetung = filterType.includes('verspaetungen');
        const entries = isVerspaetung 
          ? studentData.verspaetungen_unentsch 
          : studentData.fehlzeiten_unentsch;
        const weeks: Week[] = getLastNWeeks(parseInt(selectedWeeks));
        details = (entries || []).filter((entry: AbsenceEntry) => {
          const date = typeof entry.datum === 'string' ? parseDate(entry.datum) : entry.datum;
          return weeks.some((week: Week) => date >= week.startDate && date <= week.endDate);
        });
        break;
      }
      case 'details':
        details = [
          ...(studentData.verspaetungen_unentsch || []),
          ...(studentData.fehlzeiten_unentsch || [])
        ];
        break;
    }
  }
  return details.sort((a, b) => {
    const dateA = typeof a.datum === 'string' ? parseDate(a.datum) : a.datum;
    const dateB = typeof b.datum === 'string' ? parseDate(b.datum) : b.datum;
    return dateB.getTime() - dateA.getTime();
  });
};

const formatDetailEntriesForPDF = (details: AbsenceEntry[]): { content: string, styles: any }[] => {
  return details.map((entry, index) => {
    const indexNumber = details.length - index;
    const date = formatDate(entry.datum);
    let content = '';
    if (entry.art === 'Verspätung') {
      content = `${indexNumber}. ${date}: ${entry.beginnZeit} - ${entry.endZeit} Uhr`;
    } else {
      content = `${indexNumber}. ${date}: ${entry.art}`;
    }
    if (entry.grund) {
      content += ` - ${entry.grund}`;
    }
    if (entry.status) {
      content += ` [${entry.status}]`;
    }
    return {
      content,
      styles: {
        textColor: getStatusColor(entry.status || '', entry.datum),
        fontSize: 8,
        fontStyle: 'normal'
      }
    };
  });
};

interface ExportRow {
  Nachname: string;
  Vorname: string;
  Klasse: string;
  'Verspätungen (E)': number;
  'Verspätungen (U)': number;
  'Verspätungen (O)': number;
  'Fehlzeiten (E)': number;
  'Fehlzeiten (U)': number;
  'Fehlzeiten (O)': number;
  'SJ-Verspätungen': number;
  'SJ-Fehlzeiten': number;
  'SJ-Fehlzeiten (Ges.)': number;
  'Letzte Wochen (V)': string;
  'Letzte Wochen (F)': string;
  Details?: string;
}

const formatData = (props: ExportProps): ExportRow[] => {
  const { getFilteredStudents, schoolYearStats, weeklyStats, selectedWeeks } = props;
  return getFilteredStudents().map(([student, stats]) => {
    const weeklyData = weeklyStats[student] || {
      verspaetungen: { total: 0, weekly: Array(parseInt(selectedWeeks)).fill(0) },
      fehlzeiten: { total: 0, weekly: Array(parseInt(selectedWeeks)).fill(0) }
    };
    const verspaetungenSum = `${weeklyData.verspaetungen.total}(${weeklyData.verspaetungen.weekly.join(',')})`;
    const fehlzeitenSum = `${weeklyData.fehlzeiten.total}(${weeklyData.fehlzeiten.weekly.join(',')})`;
    const schoolYearData = schoolYearStats[student] || { 
      verspaetungen_unentsch: 0, 
      fehlzeiten_unentsch: 0,
      fehlzeiten_gesamt: 0
    };
    const [nachname = "", vorname = ""] = student.split(",").map(s => s.trim());
    return {
      Nachname: nachname,
      Vorname: vorname,
      Klasse: stats.klasse,
      'Verspätungen (E)': stats.verspaetungen_entsch,
      'Verspätungen (U)': stats.verspaetungen_unentsch,
      'Verspätungen (O)': stats.verspaetungen_offen,
      'Fehlzeiten (E)': stats.fehlzeiten_entsch,
      'Fehlzeiten (U)': stats.fehlzeiten_unentsch,
      'Fehlzeiten (O)': stats.fehlzeiten_offen,
      'SJ-Verspätungen': schoolYearData.verspaetungen_unentsch,
      'SJ-Fehlzeiten': schoolYearData.fehlzeiten_unentsch,
      'SJ-Fehlzeiten (Ges.)': schoolYearData.fehlzeiten_gesamt,
      'Letzte Wochen (V)': verspaetungenSum,
      'Letzte Wochen (F)': fehlzeitenSum
    };
  });
};

export const exportToExcel = (props: ExportProps) => {
  const { getFilteredStudents, startDate, endDate, schoolYearStats, weeklyStats, selectedWeeks, detailedData, schoolYearDetailedData, weeklyDetailedData, expandedStudents, activeFilters } = props;
  const formattedData = formatData(props);
  const enrichedData: ExportRow[] = formattedData.map(row => {
    const studentName = `${row.Nachname}, ${row.Vorname}`;
    if (!expandedStudents.has(studentName)) return row;
    const filterType = activeFilters.get(studentName);
    if (!filterType) return row;
    const details = getStudentDetails(studentName, filterType, selectedWeeks, detailedData, schoolYearDetailedData, weeklyDetailedData);
    if (details.length === 0) return row;
    const formattedDetailLines = details.map(entry => {
      const date = formatDate(entry.datum);
      const time = entry.beginnZeit ? `(${entry.beginnZeit}${entry.endZeit ? ` - ${entry.endZeit}` : ''} Uhr)` : '';
      const reason = entry.grund ? ` - ${entry.grund}` : '';
      const status = entry.status ? ` [${entry.status}]` : '';
      return `${date}${time}: ${entry.art}${reason}${status}`;
    });
    const header = getDetailHeader(filterType);
    return {
      ...row,
      Details: `${header}\n${formattedDetailLines.join('\n')}`
    };
  });
  const worksheet = XLSX.utils.json_to_sheet(enrichedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Anwesenheitsstatistik");
  const hasDetails = enrichedData.some(row => row.Details);
  const colWidths = [25, 25, 15, 15, 15, 15, 15, 15, 15, 20, 20, 20, 20, ...(hasDetails ? [80] : [])];
  worksheet['!cols'] = colWidths.map(width => ({ width }));
  worksheet['!rows'] = []; // Initialisierung
  if (hasDetails) {
    let rowIndex = 1;
    enrichedData.forEach(row => {
      worksheet['!rows']![rowIndex] = { hpt: 20 };
      if (row.Details) {
        const lines = row.Details.split('\n').length;
        const detailsRowHeight = Math.max(60, lines * 15);
        worksheet['!rows']![rowIndex + 1] = { hpt: detailsRowHeight };
        rowIndex += 2;
      } else {
        rowIndex += 1;
      }
    });
  }
  const filename = `Anwesenheitsstatistik_${startDate}_${endDate}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

export const exportToCSV = (props: ExportProps) => {
  const { getFilteredStudents, startDate, endDate, schoolYearStats, weeklyStats, selectedWeeks, detailedData, schoolYearDetailedData, weeklyDetailedData, expandedStudents, activeFilters } = props;
  const formattedData = formatData(props);
  const enrichedData: ExportRow[] = formattedData.map(row => {
    const studentName = `${row.Nachname}, ${row.Vorname}`;
    if (!expandedStudents.has(studentName)) return row;
    const filterType = activeFilters.get(studentName);
    if (!filterType) return row;
    const details = getStudentDetails(studentName, filterType, selectedWeeks, detailedData, schoolYearDetailedData, weeklyDetailedData);
    if (details.length === 0) return row;
    const formattedDetailLines = details.map(entry => {
      const date = formatDate(entry.datum);
      const time = entry.beginnZeit ? `(${entry.beginnZeit}${entry.endZeit ? ` - ${entry.endZeit}` : ''} Uhr)` : '';
      const reason = entry.grund ? ` - ${entry.grund}` : '';
      const status = entry.status ? ` [${entry.status}]` : '';
      return `${date}${time}: ${entry.art}${reason}${status}`;
    });
    const header = getDetailHeader(filterType);
    return {
      ...row,
      Details: `${header}\n${formattedDetailLines.join('\n')}`
    };
  });
  const csv = unparse(enrichedData, {
    quotes: true,
    newline: '\n',
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Anwesenheitsstatistik_${startDate}_${endDate}.csv`;
  link.click();
};

export const exportToPDF = (props: ExportProps) => {
  const { getFilteredStudents, startDate, endDate, schoolYearStats, weeklyStats, selectedWeeks, detailedData, schoolYearDetailedData, weeklyDetailedData, expandedStudents, activeFilters } = props;
  const formattedData = formatData(props);
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  }) as jsPDF & { autoTable: any };
  const margin = { left: 15, right: 15, top: 20, bottom: 20 };
  const maxPageWidth = doc.internal.pageSize.width - margin.left - margin.right;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Anwesenheitsstatistik', margin.left, margin.top);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const startDateFormatted = new Date(startDate).toLocaleDateString('de-DE');
  const endDateFormatted = new Date(endDate).toLocaleDateString('de-DE');
  doc.text(`Zeitraum: ${startDateFormatted} - ${endDateFormatted}`, margin.left, margin.top + 10);
  doc.setFontSize(10);
  doc.text(`Wochen für Berechnung: ${selectedWeeks}`, margin.left, margin.top + 16);
  doc.setFont('helvetica', 'italic');
  doc.text('Legende: (E) = Entschuldigt, (U) = Unentschuldigt, (O) = Offen, SJ = Schuljahr, (V) = Verspätungen, (F) = Fehlzeiten', 
           margin.left, margin.top + 22);
  doc.setFontSize(8);
  doc.setFillColor(0, 150, 0);
  doc.rect(margin.left, margin.top + 26, 3, 3, 'F');
  doc.setTextColor(0, 150, 0);
  doc.text('Entschuldigt', margin.left + 5, margin.top + 28);
  doc.setFillColor(200, 0, 0);
  doc.rect(margin.left + 30, margin.top + 26, 3, 3, 'F');
  doc.setTextColor(200, 0, 0);
  doc.text('Unentschuldigt', margin.left + 35, margin.top + 28);
  doc.setFillColor(204, 163, 0);
  doc.rect(margin.left + 70, margin.top + 26, 3, 3, 'F');
  doc.setTextColor(204, 163, 0);
  doc.text('Noch zu entschuldigen (Frist läuft)', margin.left + 75, margin.top + 28);
  doc.setTextColor(0, 0, 0);

  const headerHeight = 35;
  const columnHeaders = {
    Nachname: 'Nachname',
    Vorname: 'Vorname',
    Klasse: 'Klasse',
    'Verspätungen (E)': 'Versp. (E)',
    'Verspätungen (U)': 'Versp. (U)',
    'Verspätungen (O)': 'Versp. (O)',
    'Fehlzeiten (E)': 'Fehlz. (E)',
    'Fehlzeiten (U)': 'Fehlz. (U)',
    'Fehlzeiten (O)': 'Fehlz. (O)',
    'SJ-Verspätungen': 'SJ-Versp.',
    'SJ-Fehlzeiten': 'SJ-Fehlz.',
    'SJ-Fehlzeiten (Ges.)': 'SJ-Fehlz. (Ges.)',
    'Letzte Wochen (V)': `${selectedWeeks}W (V)`,
    'Letzte Wochen (F)': `${selectedWeeks}W (F)`
  };

  const calculateColumnWidths = () => {
    const baseWidths = [20, 20, 12, 12, 12, 12, 12, 12, 12, 15, 15, 20, 20];
    let totalFixedWidth = baseWidths.reduce((sum, w) => sum + w, 0);
    const availableWidth = maxPageWidth - totalFixedWidth;
    const adjustedWidths = [...baseWidths];
    adjustedWidths[11] = availableWidth / 2;
    adjustedWidths[12] = availableWidth / 2;
    return adjustedWidths;
  };
  const calculatedWidths = calculateColumnWidths();
  const baseColumnStyles: { [key: string]: any } = {};
  Object.keys(columnHeaders).forEach((key, index) => {
    if (calculatedWidths[index]) {
      baseColumnStyles[key] = { 
        cellWidth: calculatedWidths[index],
        halign: ['Nachname', 'Vorname', 'Klasse'].includes(key) ? 'left' : 'center'
      };
    }
  });

  const tableRows: any[] = [];
  const columnKeys = Object.keys(columnHeaders);
  const numberOfColumns = columnKeys.length;
  formattedData.forEach((row: ExportRow) => {
    const mainRow = columnKeys.map(key => row[key as keyof ExportRow] ?? '');
    tableRows.push(mainRow);
    const studentName = `${row.Nachname}, ${row.Vorname}`;
    const filterType = activeFilters.get(studentName);
    if (expandedStudents.has(studentName) && filterType) {
      const details = getStudentDetails(studentName, filterType, selectedWeeks, detailedData, schoolYearDetailedData, weeklyDetailedData);
      if (details.length > 0) {
        if (filterType === 'details') {
          const verspätungen = details.filter(entry => entry.art === 'Verspätung');
          const fehlzeiten = details.filter(entry => entry.art !== 'Verspätung');
          if (verspätungen.length > 0) {
            tableRows.push([{
              content: 'Unentschuldigte Verspätungen',
              colSpan: numberOfColumns,
              styles: { fillColor: getFilterTypeColor(filterType), fontStyle: 'bold', fontSize: 8, halign: 'left' }
            }]);
            formatDetailEntriesForPDF(verspätungen).forEach(de => {
              tableRows.push([{
                content: de.content,
                colSpan: numberOfColumns,
                styles: { textColor: de.styles.textColor, fontSize: de.styles.fontSize, fontStyle: de.styles.fontStyle, cellPadding: 3 }
              }]);
            });
          }
          if (fehlzeiten.length > 0) {
            tableRows.push([{
              content: 'Unentschuldigte Fehlzeiten',
              colSpan: numberOfColumns,
              styles: { fillColor: getFilterTypeColor(filterType), fontStyle: 'bold', fontSize: 8, halign: 'left' }
            }]);
            formatDetailEntriesForPDF(fehlzeiten).forEach(de => {
              tableRows.push([{
                content: de.content,
                colSpan: numberOfColumns,
                styles: { textColor: de.styles.textColor, fontSize: de.styles.fontSize, fontStyle: de.styles.fontStyle, cellPadding: 3 }
              }]);
            });
          }
        } else {
          const headerTitle = getDetailHeader(filterType);
          tableRows.push([{
            content: headerTitle,
            colSpan: numberOfColumns,
            styles: { fillColor: getFilterTypeColor(filterType), fontStyle: 'bold', fontSize: 8, halign: 'left' }
          }]);
          formatDetailEntriesForPDF(details).forEach(de => {
            tableRows.push([{
              content: de.content,
              colSpan: numberOfColumns,
              styles: { textColor: de.styles.textColor, fontSize: de.styles.fontSize, fontStyle: de.styles.fontStyle, cellPadding: 3 }
            }]);
          });
        }
      }
    }
  });

  doc.autoTable({
    head: [Object.values(columnHeaders)],
    body: tableRows,
    startY: margin.top + headerHeight,
    margin: margin,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
      cellWidth: 'wrap',
      minCellHeight: 8,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [50, 50, 120],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 9
    },
    columnStyles: baseColumnStyles,
    alternateRowStyles: {
      fillColor: [248, 248, 248]
    },
    didParseCell: (data: any) => {
      if (data.cell.colSpan && data.cell.colSpan > 1) {
        data.cell.styles.fontStyle = 'italic';
      }
    }
  });

  doc.save(`Anwesenheitsstatistik_${startDate}_${endDate}.pdf`);
};

export default { exportToExcel, exportToCSV, exportToPDF };