import React, { useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FileUploadHandlerProps {
  onFileProcessed: (data: any) => void;
  startDate: string;
  endDate: string;
  setError: (error: string) => void;
}

const FileUploadHandler: React.FC<FileUploadHandlerProps> = ({ onFileProcessed, startDate, endDate, setError }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    try {
      if (!startDate || !endDate) {
        setError('Bitte wählen Sie erst den Zeitraum aus.');
        return;
      }

      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          delimiter: '\t',
          complete: (results) => {
            if (results.data && Array.isArray(results.data) && results.data.length > 0) {
              const firstRow = results.data[0] as any;
              if (!firstRow.Langname || !firstRow.Vorname || !firstRow.Beginndatum) {
                Papa.parse(text, {
                  header: true,
                  skipEmptyLines: true,
                  delimiter: ',',
                  complete: (results) => {
                    if (results.data && Array.isArray(results.data) && results.data.length > 0) {
                      const firstRow = results.data[0] as any;
                      if (!firstRow.Langname || !firstRow.Vorname || !firstRow.Beginndatum) {
                        Papa.parse(text, {
                          header: true,
                          skipEmptyLines: true,
                          delimiter: ';',
                          complete: (results) => {
                            onFileProcessed(results.data);
                          },
                          error: (error: Error) => {
                            setError('Fehler beim Verarbeiten der CSV-Datei: ' + error.message);
                          },
                        });
                      } else {
                        onFileProcessed(results.data);
                      }
                    }
                  },
                  error: (error: Error) => {
                    setError('Fehler beim Verarbeiten der CSV-Datei: ' + error.message);
                  },
                });
              } else {
                onFileProcessed(results.data);
              }
            }
          },
          error: (error: Error) => {
            setError('Fehler beim Verarbeiten der CSV-Datei: ' + error.message);
          },
        });
      } else if (file.name.toLowerCase().match(/\.xlsx?$/)) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
        onFileProcessed(jsonData);
      } else {
        setError('Nicht unterstütztes Dateiformat. Bitte laden Sie eine CSV- oder Excel-Datei hoch.');
      }
    } catch (err: any) {
      setError('Fehler beim Lesen der Datei: ' + err.message);
    }
  };

  return (
    <input
      type="file"
      ref={fileInputRef}
      accept=".csv,.xlsx,.xls"
      onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
      className="hidden"
      id="file-upload"
    />
  );
};

export default FileUploadHandler;