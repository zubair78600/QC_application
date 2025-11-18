import { ParsedFilename } from '../types';

/**
 * Parse filename to extract namespace, received date, and token
 * Expected format: comparison-{token}-{date}-{namespace}-{uuid}-{view}.jpg
 * Example: comparison-123-20231025-front-abc123-view1.jpg
 */
export function parseFilename(filename: string): ParsedFilename {
  const baseFilename = filename.split('/').pop() || filename.split('\\').pop() || filename;

  // Remove extension
  const nameWithoutExt = baseFilename.replace(/\.(jpg|jpeg|png)$/i, '');

  // Split by hyphen
  const parts = nameWithoutExt.split('-');

  let namespace = '';
  let receivedDate = '';
  let token = '';

  // Extract token (second segment)
  if (parts.length > 1) {
    token = parts[1];
  }

  // Extract date (third segment, format: YYYYMMDD)
  if (parts.length > 2) {
    const datePart = parts[2];
    if (datePart.length === 8 && /^\d{8}$/.test(datePart)) {
      const year = datePart.substring(0, 4);
      const month = datePart.substring(4, 6);
      const day = datePart.substring(6, 8);
      receivedDate = `${day}/${month}/${year}`;
    }
  }

  // Extract namespace (fourth segment)
  if (parts.length > 3) {
    namespace = parts[3];
  }

  return {
    namespace,
    receivedDate,
    token,
    fullFilename: baseFilename,
  };
}

/**
 * Calculate ISO week number
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Format date as DD/MM/YYYY HH:MM:SS
 */
export function formatDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format date for CSV filename: YYYY-MM-DD_HH_MM
 */
export function formatCSVTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}_${hours}_${minutes}`;
}

/**
 * Sanitize QC name for filename
 */
export function sanitizeQCName(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_');
}

/**
 * Generate CSV filename
 */
export function generateCSVFilename(qcName: string): string {
  const sanitized = sanitizeQCName(qcName);
  const timestamp = formatCSVTimestamp(new Date());
  return `${sanitized}_${timestamp}.CSV`;
}

/**
 * Generate folder name for organized files (same format as CSV)
 */
export function generateOutputFolderName(qcName: string): string {
  const sanitized = sanitizeQCName(qcName);
  const timestamp = formatCSVTimestamp(new Date());
  return `${sanitized}_${timestamp}`;
}

/**
 * Get folder name from path (handles both Windows and Unix paths)
 */
export function getFolderName(directoryPath: string): string {
  // Normalize path separators - handle both / and \
  const normalizedPath = directoryPath.replace(/\\/g, '/');
  const parts = normalizedPath.split('/').filter(p => p);
  return parts[parts.length - 1] || 'qc_state';
}

/**
 * Convert observations array to semicolon-separated string
 */
export function observationsToString(observations: string[]): string {
  return observations.filter(o => o.trim()).join(';');
}

/**
 * Convert semicolon-separated string to observations array
 */
export function stringToObservations(str: string): string[] {
  if (!str || !str.trim()) return [];
  return str.split(';').map(o => o.trim()).filter(o => o);
}

/**
 * Get missing mandatory fields
 */
export function getMissingFields(
  qcDecision: string,
  qcObservations: string,
  retouchQuality: string,
  retouchObservations: string,
  nextAction: string,
  customCards: Array<{mandatory: boolean; fieldName: string}>,
  record: Record<string, string>
): string[] {
  const missingFields: string[] = [];

  // QC Decision must be set
  if (!qcDecision || (qcDecision !== 'Right' && qcDecision !== 'Wrong')) {
    missingFields.push('QC Decision');
  }

  // QC Observations required only if QC Decision is "Right"
  if (qcDecision === 'Right' && (!qcObservations || !qcObservations.trim())) {
    missingFields.push('QC Observations');
  }

  // Retouch Quality must be set
  if (!retouchQuality || (retouchQuality !== 'Good' && retouchQuality !== 'Bad')) {
    missingFields.push('Retouch Quality');
  }

  // Retouch Observations required only if Retouch Quality is "Bad"
  if (retouchQuality === 'Bad' && (!retouchObservations || !retouchObservations.trim())) {
    missingFields.push('Retouch Observations');
  }

  // Next Action must be set (any non-empty value is accepted)
  if (!nextAction || !nextAction.trim()) {
    missingFields.push('Next Action');
  }

  // Check mandatory custom cards
  for (const card of customCards) {
    if (card.mandatory) {
      const value = record[card.fieldName];
      if (!value || !value.trim()) {
        missingFields.push(card.fieldName);
      }
    }
  }

  return missingFields;
}

/**
 * Check if all required fields are filled
 */
export function isRecordComplete(
  qcDecision: string,
  qcObservations: string,
  retouchQuality: string,
  retouchObservations: string,
  nextAction: string,
  customCards: Array<{mandatory: boolean; fieldName: string}>,
  record: Record<string, string>
): boolean {
  return getMissingFields(qcDecision, qcObservations, retouchQuality, retouchObservations, nextAction, customCards, record).length === 0;
}
