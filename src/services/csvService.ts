import Papa from 'papaparse';
import { invoke } from '@tauri-apps/api/core';
import { QCRecord, CustomCard, Panel, AutoField } from '../types';

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
 * Generate dynamic column order based on autoFields and panels
 */
function generateColumnOrder(autoFields: AutoField[], panels: Panel[]): string[] {
  const columns: string[] = [];

  // Add enabled auto fields in order
  const autoFieldMap: Record<string, string> = {
    'weekNumber': 'Week Number',
    'qcDate': 'QC Date',
    'receivedDate': 'Received Date',
    'namespace': 'Namespace',
    'filename': 'Filename',
    'qcName': 'QC Name',
    'token': 'Token',
    'uuid': 'UUID',
    'vendor': 'Vendor',
    'imageId': 'Image ID',
  };

  autoFields
    .filter(f => f.enabled)
    .forEach(field => {
      const columnName = autoFieldMap[field.key];
      if (columnName) {
        columns.push(columnName);
      }
    });

  // Add panel CSV columns
  panels
    .sort((a, b) => a.order - b.order)
    .forEach(panel => {
      columns.push(panel.csvColumn);
    });

  return columns;
}

/**
 * Save results to CSV file (legacy function - uses customCards)
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
    console.log('[CSV] Attempting to save CSV to:', filePath);
    console.log('[CSV] Records to save:', normalizedRecords.length);

    try {
      await invoke('write_text_file', {
        filePath,
        content: csv,
      });
      console.log('[CSV] ✓ CSV saved successfully');
    } catch (writeError) {
      console.error('[CSV] ✗ Write failed:', writeError);
      throw new Error(`Failed to write CSV: ${writeError}`);
    }
  } catch (error) {
    console.error('[CSV] ✗ Error saving CSV:', error);
    // Show alert to user on Windows
    if (typeof window !== 'undefined') {
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`Failed to save CSV file:\n${errorMsg}\n\nPlease ensure:\n• You have write permissions\n• File is not open elsewhere\n• Sufficient disk space`);
    }
    throw error;
  }
}

/**
 * Save results to CSV file (new panel-based system)
 */
export async function saveCSVWithPanels(
  filePath: string,
  results: Record<string, QCRecord>,
  autoFields: AutoField[],
  panels: Panel[]
): Promise<void> {
  try {
    // Generate dynamic column order
    const allColumns = generateColumnOrder(autoFields, panels);

    // Convert results object to array
    const records = Object.values(results);

    // Filter only complete records
    // Check if any panel marked as mandatory has data
    const completeRecords = records.filter((record) => {
      // At minimum, check if at least one mandatory panel field is filled
      const hasMandatoryData = panels
        .filter(p => p.mandatory)
        .some(p => record[p.csvColumn]);

      return hasMandatoryData;
    });

    // Ensure all records have all columns (fill missing with empty string)
    const normalizedRecords = completeRecords.map((record) => {
      const normalized: any = {};
      allColumns.forEach((col) => {
        normalized[col] = record[col] || '';
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
    console.log('[CSV] Attempting to save CSV to:', filePath);
    console.log('[CSV] Records to save:', normalizedRecords.length);
    console.log('[CSV] Columns:', allColumns);

    try {
      await invoke('write_text_file', {
        filePath,
        content: csv,
      });
      console.log('[CSV] ✓ CSV saved successfully');
    } catch (writeError) {
      console.error('[CSV] ✗ Write failed:', writeError);
      throw new Error(`Failed to write CSV: ${writeError}`);
    }
  } catch (error) {
    console.error('[CSV] ✗ Error saving CSV:', error);
    if (typeof window !== 'undefined') {
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`Failed to save CSV file:\n${errorMsg}\n\nPlease ensure:\n• You have write permissions\n• File is not open elsewhere\n• Sufficient disk space`);
    }
    throw error;
  }
}

/**
 * Export CSV for specific images (for auto-copy on exit) - legacy
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

/**
 * Export CSV for specific images (for auto-copy on exit) - new panel system
 */
export async function exportFilteredCSVWithPanels(
  filePath: string,
  results: Record<string, QCRecord>,
  filenames: string[],
  autoFields: AutoField[],
  panels: Panel[]
): Promise<void> {
  try {
    // Filter results to only include specified filenames
    const filteredResults: Record<string, QCRecord> = {};
    filenames.forEach((filename) => {
      const record = results[filename];
      const hasMandatoryData = panels
        .filter(p => p.mandatory)
        .some(p => record[p.csvColumn]);

      if (hasMandatoryData) {
        filteredResults[filename] = record;
      }
    });

    // Save filtered results
    await saveCSVWithPanels(filePath, filteredResults, autoFields, panels);
  } catch (error) {
    console.error('Error exporting filtered CSV:', error);
    throw error;
  }
}
