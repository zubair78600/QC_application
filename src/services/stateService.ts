import { invoke } from '@tauri-apps/api/core';
import { QCRecord, CustomCard } from '../types';
import { getFolderName } from './fileUtils';

export interface SavedState {
  currentIndex: number;
  imageList: string[];
  results: Record<string, QCRecord>;
  qcName: string;
  csvFilename: string;
  customCards: CustomCard[];
}

/**
 * Get state file path for a directory
 */
export function getStateFilePath(directory: string): string {
  const folderName = getFolderName(directory);
  return `${directory}/${folderName}.json`;
}

/**
 * Load state from JSON file
 */
export async function loadState(directory: string): Promise<SavedState | null> {
  try {
    const stateFilePath = getStateFilePath(directory);
    const fileExists = await invoke<boolean>('file_exists', { filePath: stateFilePath });

    if (!fileExists) {
      return null;
    }

    const content = await invoke<string>('read_text_file', { filePath: stateFilePath });
    const state = JSON.parse(content) as SavedState;

    return state;
  } catch (error) {
    console.error('Error loading state:', error);
    return null;
  }
}

/**
 * Save state to JSON file
 */
export async function saveState(
  directory: string,
  currentIndex: number,
  imageList: string[],
  results: Record<string, QCRecord>,
  qcName: string,
  csvFilename: string,
  customCards: CustomCard[]
): Promise<void> {
  try {
    const stateFilePath = getStateFilePath(directory);

    const state: SavedState = {
      currentIndex,
      imageList,
      results,
      qcName,
      csvFilename,
      customCards,
    };

    const content = JSON.stringify(state, null, 2);

    await invoke('write_text_file', {
      filePath: stateFilePath,
      content,
    });
  } catch (error) {
    console.error('Error saving state:', error);
    throw error;
  }
}
