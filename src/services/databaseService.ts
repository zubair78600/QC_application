import { invoke } from '@tauri-apps/api/core';
import { CustomCard, QCRecord } from '../types';

export async function initDatabase(baseDirectory: string): Promise<void> {
  await invoke('init_database', { baseDirectory });
}

export async function createSession(
  baseDirectory: string,
  qcName: string,
  folderPath: string
): Promise<number> {
  const sessionId = await invoke<number>('create_session', {
    baseDirectory,
    payload: {
      qcName,
      folderPath,
    },
  });
  return sessionId;
}

export interface SaveRecordOptions {
  baseDirectory: string;
  sessionId: number;
  record: QCRecord;
  imageStartTime: string | null;
  imageEndTime: string | null;
  timeSpentSeconds: number | null;
  customCards: CustomCard[];
}

export async function saveQcRecordToDatabase(options: SaveRecordOptions): Promise<void> {
  const { baseDirectory, sessionId, record, imageStartTime, imageEndTime, timeSpentSeconds, customCards } =
    options;

  // Extract dynamic custom-card fields into a JSON blob
  const customFieldNames: string[] = [];
  customCards.forEach((card) => {
    customFieldNames.push(card.fieldName);
    if (card.type === 'decision_observation' && card.observationFieldName) {
      customFieldNames.push(card.observationFieldName);
    }
  });
  const customFields: Record<string, string> = {};

  for (const fieldName of customFieldNames) {
    const value = record[fieldName];
    if (typeof value === 'string') {
      customFields[fieldName] = value;
    }
  }

  const payload = {
    sessionId,
    weekNumber: record['Week Number'],
    qcDate: record['QC Date'],
    receivedDate: record['Received Date'],
    namespace: record['Namespace'],
    filename: record['Filename'],
    qcName: record['QC Name'],
    qcDecision: record['QC Decision'],
    qcObservations: record['QC Observations'],
    retouchQuality: record['Retouch Quality'],
    retouchObservations: record['Retouch Observations'],
    nextAction: record['Next Action'],
    imageStartTime,
    imageEndTime,
    timeSpentSeconds,
    customFieldsJson: Object.keys(customFields).length > 0 ? JSON.stringify(customFields) : null,
  };

  await invoke('save_qc_record', {
    baseDirectory,
    payload,
  });
}

export interface AnalyticsSummary {
  totalImages: number;
  totalRight: number;
  totalWrong: number;
  averageTimeSeconds: number | null;
}

export interface AnalyticsRecord {
  qcDate: string | null;
  filename: string;
  qcDecision: string | null;
  nextAction: string | null;
  timeSpentSeconds: number | null;
  qcObservations: string | null;
}

export async function getAnalyticsData(
  baseDirectory: string,
  qcName: string
): Promise<AnalyticsSummary> {
  const result = await invoke<AnalyticsSummary>('get_analytics_data', {
    baseDirectory,
    qcName,
  });
  return result;
}

export async function getAnalyticsRecords(
  baseDirectory: string,
  qcName: string
): Promise<AnalyticsRecord[]> {
  const result = await invoke<AnalyticsRecord[]>('get_analytics_records', {
    baseDirectory,
    qcName,
  });
  return result;
}

export interface AppSettingRow {
  key: string;
  value: string;
}

export async function saveAppSetting(key: string, value: unknown): Promise<void> {
  const serialized = JSON.stringify(value);
  await invoke('save_app_setting', {
    key,
    value: serialized,
  });
}

export async function loadAppSettings(): Promise<Record<string, unknown>> {
  const rows = await invoke<AppSettingRow[]>('load_app_settings');
  const settings: Record<string, unknown> = {};

  for (const row of rows) {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  }

  return settings;
}

export async function getDatabasePath(): Promise<string> {
  return invoke<string>('get_database_path');
}
