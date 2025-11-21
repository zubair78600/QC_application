import { useState, useEffect, useRef } from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useAppStore, DEFAULT_QC_NAMES } from '../store/appStore';
import {
    initDatabase,
    createSession,
    getDatabasePath,
    loadAppSettings,
    saveAppSetting,
} from '../services/databaseService';
import { loadState } from '../services/stateService';
import { loadCSV } from '../services/csvService';
import { generateCSVFilename, getBaseFilename } from '../services/fileUtils';
import { QCRecord } from '../types';

const DEFAULT_WALLPAPER_SRC = new URL('../../assets/Lamborghini.mp4', import.meta.url).href;

export function useAppInitialization() {
    const {
        setWorkingDirectory,
        setImageList,
        setFilteredImageList,
        setQCName,
        setCSVFilename,
        loadState: loadStoreState,
        setImageViewerHeight,
        setSessionId,
    } = useAppStore();

    const [isInitialized, setIsInitialized] = useState(false);
    const [showNameSelection, setShowNameSelection] = useState(false);
    const [startupWallpaperUrl, setStartupWallpaperUrl] = useState(DEFAULT_WALLPAPER_SRC);
    const [startupWallpaperMode, setStartupWallpaperMode] = useState<'default' | 'image' | 'video'>('default');
    const [startupWallpaperScale, setStartupWallpaperScale] = useState(100);
    const [startupWallpaperFit, setStartupWallpaperFit] = useState(true);
    const [selectableNames, setSelectableNames] = useState<string[]>(DEFAULT_QC_NAMES);
    const [loadedSettings, setLoadedSettings] = useState<Record<string, unknown>>({});

    // Keep track of baseDirectory between steps
    const baseDirectoryRef = useRef<string | null>(null);

    const initializationStarted = useRef(false);

    const normalizeResults = (results: Record<string, QCRecord> = {}): Record<string, QCRecord> => {
        const normalized: Record<string, QCRecord> = {};
        Object.entries(results).forEach(([key, value]) => {
            const filename = getBaseFilename(key);
            normalized[filename] = { ...value, Filename: filename };
        });
        return normalized;
    };

    const initializeApp = async () => {
        if (initializationStarted.current) return;
        initializationStarted.current = true;

        try {
            console.log('Starting initialization...');

            // Prompt for directory
            const selectedDir = await open({
                directory: true,
                multiple: false,
                title: 'Select Image Directory',
            });

            console.log('Selected directory:', selectedDir);

            if (!selectedDir) {
                alert('No directory selected. Please restart the application.');
                setIsInitialized(true); // End init even if failed to show UI
                return;
            }

            const baseDirectory = selectedDir as string;
            baseDirectoryRef.current = baseDirectory;
            setWorkingDirectory(baseDirectory);

            // Ensure database exists and load global app settings
            let settings: Record<string, unknown> = {};
            try {
                await initDatabase(baseDirectory);
                settings = await loadAppSettings();
                setLoadedSettings(settings);
            } catch (settingsError) {
                console.error('Error initializing app settings from database:', settingsError);
            }

            // Compute wallpaper
            let wallpaperUrl = DEFAULT_WALLPAPER_SRC;
            let wallpaperMode: 'default' | 'image' | 'video' = 'default';
            let wallpaperScale = 100;
            let wallpaperFit = true;

            const wallpaperSetting = settings.wallpaper as
                | { mode?: string; source?: string | null; scale?: number; fit?: boolean }
                | undefined;

            if (wallpaperSetting) {
                if (typeof wallpaperSetting.scale === 'number') wallpaperScale = wallpaperSetting.scale;
                if (typeof wallpaperSetting.fit === 'boolean') wallpaperFit = wallpaperSetting.fit;

                if (
                    (wallpaperSetting.mode === 'image' || wallpaperSetting.mode === 'video') &&
                    wallpaperSetting.source
                ) {
                    wallpaperMode = wallpaperSetting.mode as 'image' | 'video';
                    try {
                        wallpaperUrl = convertFileSrc(wallpaperSetting.source);
                    } catch (err) {
                        console.error('Error resolving startup wallpaper path:', err);
                        // Fallback to default
                    }
                }
            }

            // If default mode or fallback needed, try to get the bundled resource
            if (wallpaperMode === 'default') {
                try {
                    const resourcePath = await invoke<string>('get_default_wallpaper');
                    console.log('Resolved default wallpaper resource:', resourcePath);
                    wallpaperUrl = convertFileSrc(resourcePath);
                } catch (err) {
                    console.warn('Could not resolve default wallpaper resource (dev mode?):', err);
                    // Keep DEFAULT_WALLPAPER_SRC (import.meta.url) as fallback for dev
                }
            }

            setStartupWallpaperUrl(wallpaperUrl);
            setStartupWallpaperMode(wallpaperMode);
            setStartupWallpaperScale(wallpaperScale);
            setStartupWallpaperFit(wallpaperFit);

            // Determine selectable QC names
            const names =
                Array.isArray(settings.qcNames) && (settings.qcNames as string[]).length > 0
                    ? (settings.qcNames as string[])
                    : DEFAULT_QC_NAMES;
            setSelectableNames(names);

            // Ready for name selection
            setShowNameSelection(true);

        } catch (error) {
            console.error('Error initializing app:', error);
            alert(`Error loading images: ${error}. Please check the directory and try again.`);
            setIsInitialized(true);
        }
    };

    const finalizeInitialization = async (name: string) => {
        try {
            setShowNameSelection(false);
            console.log('QC Name selected:', name);
            setQCName(name);

            const baseDirectory = baseDirectoryRef.current;
            if (!baseDirectory) {
                throw new Error('Base directory lost during initialization');
            }

            // Load images
            console.log('Loading images from:', baseDirectory);
            const images = await invoke<string[]>('get_image_files', { directory: baseDirectory });
            console.log('Found images:', images.length);

            if (images.length === 0) {
                alert('No .jpg images found in the selected directory.');
                setIsInitialized(true);
                return;
            }

            setImageList(images);
            setFilteredImageList(images);

            // Start a new QC session
            try {
                const newSessionId = await createSession(baseDirectory, name, baseDirectory);
                setSessionId(newSessionId);

                try {
                    const dbPath = await getDatabasePath();
                    console.log('QC Analytics database path:', dbPath);
                } catch (pathError) {
                    console.error('Error getting database path:', pathError);
                }
            } catch (dbError) {
                console.error('Error initializing database/session:', dbError);
            }

            // Try to load existing state
            const savedState = await loadState(baseDirectory);

            if (savedState) {
                const normalizedResults = normalizeResults(savedState.results);
                loadStoreState({
                    results: normalizedResults,
                    currentIndex: savedState.currentIndex,
                    customCards: savedState.customCards || [],
                });
                setCSVFilename(savedState.csvFilename);
            } else {
                const newCSVFilename = generateCSVFilename(name);
                setCSVFilename(newCSVFilename);

                const separator = baseDirectory.includes('\\') ? '\\' : '/';
                const csvPath = `${baseDirectory}${separator}${newCSVFilename}`;
                const csvResults = normalizeResults(await loadCSV(csvPath));
                if (Object.keys(csvResults).length > 0) {
                    loadStoreState({ results: csvResults });
                }
            }

            // Load global app settings into store
            try {
                const settings = loadedSettings;
                const statePatch: any = {};
                if (settings.customCards) statePatch.customCards = settings.customCards;
                if (settings.qcDecisionOptions) statePatch.qcDecisionOptions = settings.qcDecisionOptions;
                if (settings.retouchDecisionOptions) statePatch.retouchDecisionOptions = settings.retouchDecisionOptions;
                if (settings.qcObservations) statePatch.qcObservations = settings.qcObservations;
                if (settings.retouchObservations) statePatch.retouchObservations = settings.retouchObservations;
                if (settings.nextActionOptions) statePatch.nextActionOptions = settings.nextActionOptions;
                if (settings.nextActionOptions) statePatch.nextActionOptions = settings.nextActionOptions;

                // Handle color settings with migration for old defaults
                if (settings.colorSettings) {
                    // const loadedColors = settings.colorSettings as any;
                    // Check for old defaults (Opacity 0.15, Blur 12, Angle 0)
                    // User explicitly requested these "old" defaults, so we do NOT want to migrate them away.
                    // Migration logic removed.
                    statePatch.colorSettings = settings.colorSettings;
                } else {
                    // No colorSettings in database - save defaults to database for first time
                    console.log('No color settings found in database, initializing with defaults');
                    const { DEFAULT_COLOR_SETTINGS } = await import('../store/appStore');
                    statePatch.colorSettings = DEFAULT_COLOR_SETTINGS;
                    saveAppSetting('colorSettings', DEFAULT_COLOR_SETTINGS);
                }
                if (settings.qcNames) statePatch.qcNames = settings.qcNames;
                if (settings.wallpaper) statePatch.wallpaper = settings.wallpaper;

                if (Object.keys(statePatch).length > 0) {
                    loadStoreState(statePatch);
                }

                if (typeof settings.imageViewerHeight === 'number') {
                    setImageViewerHeight(settings.imageViewerHeight);
                }
            } catch (settingsError) {
                console.error('Error loading app settings from database:', settingsError);
            }

            console.log('Initialization complete!');
            setIsInitialized(true);
        } catch (error) {
            console.error('Error finalizing initialization:', error);
            alert(`Error finalizing initialization: ${error}`);
            setIsInitialized(true);
        }
    };

    // Start initialization on mount
    useEffect(() => {
        initializeApp();
    }, []);

    const updateStartupWallpaper = async (
        mode: 'default' | 'image' | 'video',
        source: string | null,
        scale: number = 100,
        fit: boolean = true
    ) => {
        try {
            // Update local state
            setStartupWallpaperMode(mode);
            setStartupWallpaperScale(scale);
            setStartupWallpaperFit(fit);
            if (mode === 'default') {
                setStartupWallpaperUrl(DEFAULT_WALLPAPER_SRC);
            } else if (source) {
                setStartupWallpaperUrl(convertFileSrc(source));
            }

            // Update store
            const { setWallpaper } = useAppStore.getState();
            const newWallpaper = { mode, source, scale, fit };
            setWallpaper(newWallpaper);

            // Save to database
            await saveAppSetting('wallpaper', newWallpaper);

            // Update loaded settings cache
            setLoadedSettings(prev => ({
                ...prev,
                wallpaper: newWallpaper
            }));

        } catch (error) {
            console.error('Error updating wallpaper:', error);
            alert(`Error updating wallpaper: ${error}`);
        }
    };

    return {
        isInitialized,
        showNameSelection,
        startupWallpaperUrl,
        startupWallpaperMode,
        startupWallpaperScale,
        startupWallpaperFit,
        selectableNames,
        finalizeInitialization,
        updateStartupWallpaper,
        loadedSettings, // Exported in case needed, though mostly used internally
    };
}
