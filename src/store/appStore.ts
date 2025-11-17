import { create } from 'zustand';
import { AppState, ObservationOption, GridLayoutItem, Panel, AutoField } from '../types';

// Default QC Names from Python app
export const DEFAULT_QC_NAMES = [
  'Padmaja Rilkar',
  'Vignesh Shankaran',
  'Shashank BR',
  'Prerana Gouda',
  'Pavan C',
  'Sahana Basheer',
  'Justin Michael',
  'Akash GS',
  'Rakesh GR',
  'Pallavi Kumari P',
];

// Default grid layout configuration
const DEFAULT_GRID_LAYOUT: GridLayoutItem[] = [
  { i: 'qc-panel', x: 0, y: 0, w: 4, h: 40, minW: 3, minH: 30 },
  { i: 'retouch-panel', x: 4, y: 0, w: 4, h: 40, minW: 3, minH: 30 },
  { i: 'next-action-panel', x: 8, y: 0, w: 4, h: 40, minW: 3, minH: 30 },
];

// Default observations from Python app
const DEFAULT_QC_OBSERVATIONS: ObservationOption[] = [
  { id: 'outline', label: 'Outline', shortcut: '1' },
  { id: 'shadow', label: 'Shadow', shortcut: '2' },
  { id: 'perspective', label: 'Perspective', shortcut: '3' },
  { id: 'license_plate', label: 'License Plate', shortcut: '4' },
  { id: 'background', label: 'Background', shortcut: '5' },
  { id: 'comment', label: 'Comment', shortcut: '6' },
];

const DEFAULT_RETOUCH_OBSERVATIONS: ObservationOption[] = [
  { id: 'outline', label: 'Outline', shortcut: '1' },
  { id: 'shadow', label: 'Shadow', shortcut: '2' },
  { id: 'perspective', label: 'Perspective', shortcut: '3' },
  { id: 'license_plate', label: 'License Plate', shortcut: '4' },
  { id: 'background', label: 'Background', shortcut: '5' },
  { id: 'comment', label: 'Comment', shortcut: '6' },
];

const DEFAULT_NEXT_ACTIONS = [
  { id: 'retake', label: 'Retake', shortcut: 'A' },
  { id: 'retouch', label: 'Retouch', shortcut: 'S' },
  { id: 'ignore', label: 'Ignore', shortcut: 'D' },
  { id: 'blunder', label: 'Blunder', shortcut: 'F' },
];

// Default auto-generated fields
const DEFAULT_AUTO_FIELDS: AutoField[] = [
  { key: 'weekNumber', label: 'Week Number', enabled: true, alwaysIncluded: true },
  { key: 'qcDate', label: 'QC Date', enabled: true, alwaysIncluded: true },
  { key: 'filename', label: 'Filename', enabled: true, alwaysIncluded: true },
  { key: 'qcName', label: 'QC Name', enabled: true, alwaysIncluded: true },
  { key: 'receivedDate', label: 'Received Date', enabled: false, alwaysIncluded: false },
  { key: 'namespace', label: 'Namespace', enabled: false, alwaysIncluded: false },
  { key: 'token', label: 'Token', enabled: false, alwaysIncluded: false },
  { key: 'uuid', label: 'UUID', enabled: false, alwaysIncluded: false },
  { key: 'vendor', label: 'Vendor', enabled: false, alwaysIncluded: false },
  { key: 'imageId', label: 'Image ID', enabled: false, alwaysIncluded: false },
];

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  workingDirectory: null,
  imageList: [],
  currentIndex: 0,
  results: {},
  qcName: '',
  csvFilename: '',
  showIncompleteOnly: false,
  customCards: [],
  gridLayout: DEFAULT_GRID_LAYOUT,
  isReorganizeMode: false,

  // New Panel System
  panels: [], // Start with empty panels - user creates their own
  autoFields: DEFAULT_AUTO_FIELDS,

  // Legacy (kept for migration)
  qcObservations: DEFAULT_QC_OBSERVATIONS,
  retouchObservations: DEFAULT_RETOUCH_OBSERVATIONS,
  nextActionOptions: DEFAULT_NEXT_ACTIONS,

  colorSettings: {
    primaryColor: '#667eea',
    activeColor: '#ffae0c',
    backgroundColor: '#ece9e9',
    glassColor: '#8e8e8e',
    cardRadius: 16,
    shadowOpacity: 0.15,
    shadowBlur: 12,
    shadowAngle: 0,
  },

  // Actions
  setWorkingDirectory: (dir) => set({ workingDirectory: dir }),

  setImageList: (images) => set({ imageList: images }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setQCName: (name) => set({ qcName: name }),

  setCSVFilename: (filename) => set({ csvFilename: filename }),

  updateResult: (filename, data) => {
    const state = get();
    const existingResult = state.results[filename] || {};

    set({
      results: {
        ...state.results,
        [filename]: {
          ...existingResult,
          ...data,
          Filename: filename,
        },
      },
    });
  },

  getResult: (filename) => {
    const state = get();
    return state.results[filename];
  },

  setShowIncompleteOnly: (show) => set({ showIncompleteOnly: show }),

  addCustomCard: (card) => {
    const state = get();
    set({
      customCards: [...state.customCards, card],
    });
  },

  updateCustomCard: (id, updates) => {
    const state = get();
    set({
      customCards: state.customCards.map((card) =>
        card.id === id ? { ...card, ...updates } : card
      ),
    });
  },

  deleteCustomCard: (id) => {
    const state = get();
    set({
      customCards: state.customCards.filter((card) => card.id !== id),
    });
  },

  reorderCustomCards: (cards) => {
    set({ customCards: cards });
  },

  // QC Observations management
  updateQCObservation: (id, updates) => {
    const state = get();
    set({
      qcObservations: state.qcObservations.map((obs) =>
        obs.id === id ? { ...obs, ...updates } : obs
      ),
    });
  },

  addQCObservation: (observation) => {
    const state = get();
    set({
      qcObservations: [...state.qcObservations, observation],
    });
  },

  deleteQCObservation: (id) => {
    const state = get();
    set({
      qcObservations: state.qcObservations.filter((obs) => obs.id !== id),
    });
  },

  // Retouch Observations management
  updateRetouchObservation: (id, updates) => {
    const state = get();
    set({
      retouchObservations: state.retouchObservations.map((obs) =>
        obs.id === id ? { ...obs, ...updates } : obs
      ),
    });
  },

  addRetouchObservation: (observation) => {
    const state = get();
    set({
      retouchObservations: [...state.retouchObservations, observation],
    });
  },

  deleteRetouchObservation: (id) => {
    const state = get();
    set({
      retouchObservations: state.retouchObservations.filter((obs) => obs.id !== id),
    });
  },

  // Grid Layout management
  setGridLayout: (layout) => {
    set({ gridLayout: layout });
  },

  setIsReorganizeMode: (mode) => {
    set({ isReorganizeMode: mode });
  },

  resetGridLayout: () => {
    set({ gridLayout: DEFAULT_GRID_LAYOUT });
  },

  updateColorSettings: (colors) => {
    set((state) => ({
      ...state,
      colorSettings: {
        ...state.colorSettings,
        ...colors,
      },
    }));
  },

  // New Panel System actions
  createPanel: (panel) => {
    const state = get();
    set({
      panels: [...state.panels, panel],
    });
  },

  updatePanel: (id, updates) => {
    const state = get();
    set({
      panels: state.panels.map((panel) =>
        panel.id === id ? { ...panel, ...updates } : panel
      ),
    });
  },

  deletePanel: (id) => {
    const state = get();
    set({
      panels: state.panels.filter((panel) => panel.id !== id),
    });
  },

  reorderPanels: (panels) => {
    set({ panels });
  },

  updateAutoFields: (fields) => {
    set({ autoFields: fields });
  },

  resetStructure: () => {
    set({
      panels: [],
      autoFields: DEFAULT_AUTO_FIELDS,
      // Also reset legacy fields
      customCards: [],
      qcObservations: DEFAULT_QC_OBSERVATIONS,
      retouchObservations: DEFAULT_RETOUCH_OBSERVATIONS,
      nextActionOptions: DEFAULT_NEXT_ACTIONS,
    });
  },

  loadState: (newState) => {
    set((state) => ({
      ...state,
      ...newState,
    }));
  },

  resetState: () => {
    set({
      workingDirectory: null,
      imageList: [],
      currentIndex: 0,
      results: {},
      qcName: '',
      csvFilename: '',
      showIncompleteOnly: false,
      customCards: [],
      gridLayout: DEFAULT_GRID_LAYOUT,
      isReorganizeMode: false,
      qcObservations: DEFAULT_QC_OBSERVATIONS,
      retouchObservations: DEFAULT_RETOUCH_OBSERVATIONS,
      nextActionOptions: DEFAULT_NEXT_ACTIONS,
    });
  },
}));
