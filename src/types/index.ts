// QC Record structure matching CSV format
export interface QCRecord {
  "Week Number": string;
  "QC Date": string;
  "Received Date": string;
  "Namespace": string;
  "Filename": string;
  "QC Name": string;
  "QC Decision": "Right" | "Wrong" | "";
  "QC Observations": string;
  "Retouch Quality": "Good" | "Bad" | "";
  "Retouch Observations": string;
  "Next Action": "Retake" | "Retouch" | "Ignore" | "Blunder" | "";
  // Dynamic custom card fields
  [key: string]: string;
}

// Custom Card definition (legacy - will be replaced by Panel system)
export interface CustomCard {
  id: string;
  title: string;
  fieldName: string;
  type: "text" | "select" | "multiselect";
  options?: string[];
  mandatory: boolean;
  order: number;
}

// Observation option (legacy)
export interface ObservationOption {
  id: string;
  label: string;
  shortcut: string;
}

// New Panel System Types
export interface SubOption {
  id: string;
  label: string;
  shortcut: string;
}

export interface PanelOption {
  id: string;
  label: string;
  shortcut: string;
  hasSubOptions: boolean;
  subOptions?: SubOption[];
  subOptionType?: 'single' | 'multi'; // how to select sub-options
}

export interface Panel {
  id: string;
  name: string; // Display name (e.g., "QC Decision")
  type: 'decision' | 'single' | 'multi' | 'text'; // Panel type
  mandatory: boolean;
  csvColumn: string; // Column name in CSV
  options: PanelOption[]; // For decision/single/multi types
  order: number; // Display order
}

// Auto-generated field configuration
export interface AutoField {
  key: string;
  label: string;
  enabled: boolean;
  alwaysIncluded: boolean; // Cannot be disabled
}

// Grid Layout Item
export interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

// Application state
export interface AppState {
  // Directory and file management
  workingDirectory: string | null;
  imageList: string[];
  currentIndex: number;

  // QC data
  results: Record<string, QCRecord>;
  qcName: string;
  csvFilename: string;

  // UI state
  showIncompleteOnly: boolean;
  customCards: CustomCard[]; // Legacy - kept for migration
  gridLayout: GridLayoutItem[];
  isReorganizeMode: boolean;

  // New Panel System
  panels: Panel[];
  autoFields: AutoField[];

  // Settings (legacy - kept for migration)
  qcObservations: ObservationOption[];
  retouchObservations: ObservationOption[];
  nextActionOptions: Array<{id: string; label: string; shortcut: string}>;

  // Color settings
  colorSettings: {
    primaryColor: string;
    activeColor: string;
    backgroundColor: string;
    glassColor: string;
    cardRadius: number;
    shadowOpacity: number;
    shadowBlur: number;
    shadowAngle: number;
  };

  // Actions
  setWorkingDirectory: (dir: string | null) => void;
  setImageList: (images: string[]) => void;
  setCurrentIndex: (index: number) => void;
  setQCName: (name: string) => void;
  setCSVFilename: (filename: string) => void;
  updateResult: (filename: string, data: Partial<QCRecord>) => void;
  getResult: (filename: string) => QCRecord | undefined;
  setShowIncompleteOnly: (show: boolean) => void;

  // Legacy card actions (kept for migration)
  addCustomCard: (card: CustomCard) => void;
  updateCustomCard: (id: string, card: Partial<CustomCard>) => void;
  deleteCustomCard: (id: string) => void;
  reorderCustomCards: (cards: CustomCard[]) => void;
  updateQCObservation: (id: string, updates: Partial<ObservationOption>) => void;
  addQCObservation: (observation: ObservationOption) => void;
  deleteQCObservation: (id: string) => void;
  updateRetouchObservation: (id: string, updates: Partial<ObservationOption>) => void;
  addRetouchObservation: (observation: ObservationOption) => void;
  deleteRetouchObservation: (id: string) => void;

  // New Panel System actions
  createPanel: (panel: Panel) => void;
  updatePanel: (id: string, updates: Partial<Panel>) => void;
  deletePanel: (id: string) => void;
  reorderPanels: (panels: Panel[]) => void;
  updateAutoFields: (fields: AutoField[]) => void;
  resetStructure: () => void; // Clear all panels and start fresh

  // Grid and UI actions
  setGridLayout: (layout: GridLayoutItem[]) => void;
  setIsReorganizeMode: (mode: boolean) => void;
  resetGridLayout: () => void;
  updateColorSettings: (colors: Partial<AppState['colorSettings']>) => void;
  loadState: (state: Partial<AppState>) => void;
  resetState: () => void;
}

// Parsed filename info
export interface ParsedFilename {
  namespace: string;
  receivedDate: string;
  token: string;
  fullFilename: string;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
}

// Statistics
export interface Statistics {
  total: number;
  completed: number;
  retouchCount: number;
  retakeCount: number;
  wrongCount: number;
  blunderCount: number;
}
