import { create } from 'zustand';
import { AppState, ObservationOption, GridLayoutItem } from '../types';

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

const DEFAULT_QC_DECISIONS = [
  { id: 'Right', label: 'Right', shortcut: 'Q' },
  { id: 'Wrong', label: 'Wrong', shortcut: 'W' },
];

const DEFAULT_RETOUCH_DECISIONS = [
  { id: 'Good', label: 'Good', shortcut: 'Q' },
  { id: 'Bad', label: 'Bad', shortcut: 'W' },
];

const DEFAULT_NEXT_ACTIONS = [
  { id: 'retake', label: 'Retake', shortcut: 'A' },
  { id: 'retouch', label: 'Retouch', shortcut: 'S' },
  { id: 'ignore', label: 'Ignore', shortcut: 'D' },
  { id: 'blunder', label: 'Blunder', shortcut: 'F' },
];

export const DEFAULT_COLOR_SETTINGS = {
  primaryColor: '#667eea',
  activeColor: '#ffae0c',
  backgroundColor: '#ece9e9',
  glassColor: '#8e8e8e',
  cardRadius: 16,
  shadowOpacity: 0.25,
  shadowBlur: 7,
  shadowAngle: 45,
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  workingDirectory: null,
  imageList: [],
  filteredImageList: [],
  currentIndex: 0,
  sessionId: null,
  imageViewerHeight: 400,
  results: {},
  qcName: '',
  csvFilename: '',
  qcNames: DEFAULT_QC_NAMES,
  showIncompleteOnly: false,
  customCards: [],
  gridLayout: DEFAULT_GRID_LAYOUT,
  isReorganizeMode: false,
  qcDecisionOptions: DEFAULT_QC_DECISIONS,
  retouchDecisionOptions: DEFAULT_RETOUCH_DECISIONS,
  qcObservations: DEFAULT_QC_OBSERVATIONS,
  retouchObservations: DEFAULT_RETOUCH_OBSERVATIONS,
  nextActionOptions: DEFAULT_NEXT_ACTIONS,
  colorSettings: DEFAULT_COLOR_SETTINGS,
  wallpaper: {
    mode: 'default',
    source: null,
  },

  // Actions
  setWorkingDirectory: (dir) => set({ workingDirectory: dir }),

  setImageList: (images) => set({ imageList: images }),

  setFilteredImageList: (images) => set({ filteredImageList: images }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setSessionId: (id) => set({ sessionId: id }),

  setImageViewerHeight: (height) => set({ imageViewerHeight: height }),

  setQCName: (name) => set({ qcName: name }),

  setCSVFilename: (filename) => set({ csvFilename: filename }),

  setQCNames: (names) => set({ qcNames: names }),

  addQCName: (name) =>
    set((state) => ({
      qcNames: state.qcNames.includes(name) ? state.qcNames : [...state.qcNames, name],
    })),

  deleteQCName: (name) =>
    set((state) => ({
      qcNames: state.qcNames.filter((n) => n !== name),
    })),

  resetQCNames: () => set({ qcNames: DEFAULT_QC_NAMES }),

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

  resetCustomCards: () => {
    set({
      customCards: [],
    });
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

  // Decision options management
  updateQCDecisionOption: (id, updates) => {
    const state = get();
    set({
      qcDecisionOptions: state.qcDecisionOptions.map((option) =>
        option.id === id ? { ...option, ...updates } : option
      ),
    });
  },

  updateRetouchDecisionOption: (id, updates) => {
    const state = get();
    set({
      retouchDecisionOptions: state.retouchDecisionOptions.map((option) =>
        option.id === id ? { ...option, ...updates } : option
      ),
    });
  },

  // Next Action options management (shortcuts only)
  addNextActionOption: (option) => {
    const state = get();
    set({
      nextActionOptions: [...state.nextActionOptions, option],
    });
  },

  updateNextActionOption: (id, updates) => {
    const state = get();
    set({
      nextActionOptions: state.nextActionOptions.map((option) =>
        option.id === id ? { ...option, ...updates } : option
      ),
    });
  },

  deleteNextActionOption: (id) => {
    const state = get();
    set({
      nextActionOptions: state.nextActionOptions.filter((option) => option.id !== id),
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

  setWallpaper: (wallpaper) => {
    set({ wallpaper });
  },

  resetWallpaper: () => {
    set({
      wallpaper: {
        mode: 'default',
        source: null,
      },
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
      filteredImageList: [],
      currentIndex: 0,
      sessionId: null,
      imageViewerHeight: 400,
      results: {},
      qcName: '',
      csvFilename: '',
      qcNames: DEFAULT_QC_NAMES,
      showIncompleteOnly: false,
      customCards: [],
      gridLayout: DEFAULT_GRID_LAYOUT,
      isReorganizeMode: false,
      qcDecisionOptions: DEFAULT_QC_DECISIONS,
      retouchDecisionOptions: DEFAULT_RETOUCH_DECISIONS,
      qcObservations: DEFAULT_QC_OBSERVATIONS,
      retouchObservations: DEFAULT_RETOUCH_OBSERVATIONS,
      nextActionOptions: DEFAULT_NEXT_ACTIONS,
      wallpaper: {
        mode: 'default',
        source: null,
      },
    });
  },
}));
