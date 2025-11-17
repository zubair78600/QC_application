import Papa from 'papaparse';
import { invoke } from '@tauri-apps/api/core';
import { QCRecord, CustomCard } from '../types';

// CSV column order - matches Python app exactly
const BASE_COLUMNS = [
  'Week Number',
  'QC Date',
  'Received Date',
  'Namespace',
  'Filename',
  'QC Name',
  'QC Decision',
  'QC Observations',
  'Retouch Quality',
  'Retouch Observations',
  'Next Action',
];

/**
 * Load CSV file and parse into results
 */
export async function loadCSV(filePath: string): Promise<Record<string, QCRecord>> {
  try {
    const fileExists = await invoke<boolean>('file_exists', { filePath });
    if (!fileExists) {
      return {};
    }

    const content = await invoke<string>('read_text_file', { filePath });

    return new Promise((resolve, reject) => {
      Papa.parse<QCRecord>(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const records: Record<string, QCRecord> = {};

          results.data.forEach((row) => {
            const filename = row.Filename;
            if (filename) {
              records[filename] = row;
            }
          });

          resolve(records);
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error('Error loading CSV:', error);
    return {};
  }
}

/**
 * Save results to CSV file
 */
export async function saveCSV(
  filePath: string,
  results: Record<string, QCRecord>,
  customCards: CustomCard[]
): Promise<void> {
  try {
    // Get all custom card field names
    const customFieldNames = customCards.map((card) => card.fieldName);

    // Create column order: base columns + custom fields
    const allColumns = [...BASE_COLUMNS, ...customFieldNames];

    // Convert results object to array
    const records = Object.values(results);

    // Filter only complete records (those with QC Decision set)
    const completeRecords = records.filter((record) => record['QC Decision']);

    // Ensure all records have all columns (fill missing with empty string)
    const normalizedRecords = completeRecords.map((record) => {
      const normalized: any = {};
      allColumns.forEach((col) => {
        let value = record[col] || '';

        // Filter out 'Comment' flag from observations columns
        if (col === 'QC Observations' || col === 'Retouch Observations') {
          const obsList = value.split(';').filter(o => o.trim());
          // Remove 'Comment' flag but keep actual comment text
          const filtered = obsList.filter(o => o.trim() !== 'Comment');
          value = filtered.join(';');
        }

        normalized[col] = value;
      });
      return normalized;
    });

    // Convert to CSV
    const csv = Papa.unparse(normalizedRecords, {
      columns: allColumns,
      quotes: false,
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ',',
      header: true,
      newline: '\n',
    });

    // Write to file
    await invoke('write_text_file', {
      filePath,
      content: csv,
    });
  } catch (error) {
    console.error('Error saving CSV:', error);
    throw error;
  }
}

/**
 * Export CSV for specific images (for auto-copy on exit)
 */
export async function exportFilteredCSV(
  filePath: string,
  results: Record<string, QCRecord>,
  filenames: string[],
  customCards: CustomCard[]
): Promise<void> {
  try {
    // Filter results to only include specified filenames
    const filteredResults: Record<string, QCRecord> = {};
    filenames.forEach((filename) => {
      const record = results[filename];
      if (record && record['QC Decision']) {
        filteredResults[filename] = record;
      }
    });

    // Save filtered results
    await saveCSV(filePath, filteredResults, customCards);
  } catch (error) {
    console.error('Error exporting filtered CSV:', error);
    throw error;
  }
}
