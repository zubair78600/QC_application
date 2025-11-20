import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { useAppStore } from './store/appStore';
import { ImageViewer } from './components/ImageViewer/ImageViewer';
import SimpleLayoutManager, { LayoutManagerRef } from './components/GridLayout/SimpleLayoutManager';
import { NavigationBar } from './components/NavigationBar/NavigationBar';
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel';
import { ButtonEffectsPanel } from './components/SettingsPanel/ButtonEffectsPanel';
import { UserNamesModal } from './components/UserNames/UserNamesModal';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';
import { StartupModal } from './components/StartupModal/StartupModal';
import { ShortcutsMap } from './components/ShortcutsMap/ShortcutsMap';
import { useAppInitialization } from './hooks/useAppInitialization';
import { useShortcuts } from './hooks/useShortcuts';
import { saveCSV } from './services/csvService';
import { saveState } from './services/stateService';
import {
  saveQcRecordToDatabase,
  saveAppSetting,
} from './services/databaseService';
import { useColorTheme } from './hooks/useColorTheme';
import { parseFilename, getWeekNumber, formatDateTime, generateOutputFolderName, isRecordComplete, getMissingFields, getBaseFilename } from './services/fileUtils';
import { QCRecord } from './types';
import './styles/glass-effect.css';
import './App.css';

function App() {
  const {
    workingDirectory,
    imageList,
    filteredImageList,
    currentIndex,
    sessionId,
    imageViewerHeight,
    results,
    qcName,
    csvFilename,
    qcNames,
    showIncompleteOnly,
    customCards,
    isReorganizeMode,
    qcDecisionOptions,
    retouchDecisionOptions,
    qcObservations,
    retouchObservations,
    nextActionOptions,
    colorSettings,
    wallpaper,
    setFilteredImageList,
    setCurrentIndex,
    setImageViewerHeight,
    updateResult,
    getResult,
    setShowIncompleteOnly,
    setIsReorganizeMode,
  } = useAppStore();

  const {
    isInitialized,
    showNameSelection,
    startupWallpaperUrl,
    startupWallpaperMode,
    selectableNames,
    finalizeInitialization,
    updateStartupWallpaper
  } = useAppInitialization();

  const [stats, setStats] = useState({ retouch: 0, retake: 0, wrong: 0, completed: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [showButtonEffects, setShowButtonEffects] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showUserNames, setShowUserNames] = useState(false);
  const [showShortcutsMap, setShowShortcutsMap] = useState(false);
  const [focusedPanel, setFocusedPanel] = useState<'qc' | 'retouch'>('qc'); // Track which panel is focused
  const layoutManagerRef = useRef<LayoutManagerRef>(null);
  const imageStartTimeRef = useRef<number | null>(null);

  // Apply color theme
  useColorTheme();

  // Setup menu event listeners
  useEffect(() => {
    const setupListeners = async () => {
      try {
        await listen('open-settings', () => {
          setShowSettings(true);
        });
        await listen('open-usernames', () => {
          setShowUserNames(true);
        });
      } catch (error) {
        console.log('Menu event listeners available');
      }
    };
    setupListeners();
  }, []);

  // Update filtered list based on incomplete filter
  useEffect(() => {
    if (showIncompleteOnly) {
      const incomplete = imageList.filter((img) => {
        const filename = getBaseFilename(img);
        const result = getResult(filename);

        // No record at all = incomplete
        if (!result) return true;

        // Incomplete if any mandatory condition is not satisfied
        return !isRecordComplete(
          result['QC Decision'],
          result['QC Observations'],
          result['Retouch Quality'],
          result['Retouch Observations'],
          result['Next Action'],
          customCards,
          result
        );
      });
      setFilteredImageList(incomplete);
      setCurrentIndex(0);
    } else {
      setFilteredImageList(imageList);
    }
  }, [showIncompleteOnly, imageList, results, customCards]);

  // Initialize record when image changes
  useEffect(() => {
    if (isInitialized && workingDirectory) {
      handleUpdate();
    }
  }, [currentIndex, isInitialized, workingDirectory]);

  // Calculate statistics
  useEffect(() => {
    let retouchCount = 0;
    let retakeCount = 0;
    let wrongCount = 0;
    let completedCount = 0;

    Object.values(results).forEach((result) => {
      const nextAction = result['Next Action'];
      if (nextAction === 'Retouch' || nextAction === 'Blunder') retouchCount++;
      if (nextAction === 'Retake') retakeCount++;
      if (result['QC Decision'] === 'Wrong') wrongCount++;

      // Check if record is complete
      if (isRecordComplete(
        result['QC Decision'],
        result['QC Observations'],
        result['Retouch Quality'],
        result['Retouch Observations'],
        result['Next Action'],
        customCards,
        result
      )) {
        completedCount++;
      }
    });

    setStats({ retouch: retouchCount, retake: retakeCount, wrong: wrongCount, completed: completedCount });
  }, [results, customCards]);

  // Auto-save custom cards when they change
  useEffect(() => {
    if (!workingDirectory || !csvFilename) return;

    const saveCustomCards = async () => {
      try {
        await saveState(workingDirectory, currentIndex, imageList, results, qcName, csvFilename, customCards);
      } catch (error) {
        console.error('Error saving custom cards:', error);
      }
    };

    // Save immediately when custom cards change
    saveCustomCards();
  }, [customCards, workingDirectory, csvFilename, currentIndex, imageList, results, qcName]);

  // Persist app settings (custom cards, decisions, observations, next actions, colors,
  // QC names, wallpaper, image viewer height) to database
  useEffect(() => {
    if (!isInitialized) return;

    const saveSettingsToDb = async () => {
      try {
        await saveAppSetting('customCards', customCards);
        await saveAppSetting('qcDecisionOptions', qcDecisionOptions);
        await saveAppSetting('retouchDecisionOptions', retouchDecisionOptions);
        await saveAppSetting('qcObservations', qcObservations);
        await saveAppSetting('retouchObservations', retouchObservations);
        await saveAppSetting('nextActionOptions', nextActionOptions);
        await saveAppSetting('colorSettings', colorSettings);
        await saveAppSetting('qcNames', qcNames);
        await saveAppSetting('wallpaper', wallpaper);
        await saveAppSetting('imageViewerHeight', imageViewerHeight);
      } catch (error) {
        console.error('Error saving app settings to database:', error);
      }
    };
    saveSettingsToDb();
  }, [isInitialized, customCards, qcDecisionOptions, retouchDecisionOptions, qcObservations, retouchObservations, nextActionOptions, colorSettings, qcNames, wallpaper, imageViewerHeight]);

  // Record timing and save the current image to the database
  const recordTimeForCurrentImage = useCallback(async () => {
    if (!workingDirectory || sessionId === null) return;

    const currentFilename = getCurrentFilename();
    if (!currentFilename) return;

    const startMs = imageStartTimeRef.current;
    const endMs = Date.now();

    // If we don't have a start time yet, just initialize it
    if (!startMs) {
      imageStartTimeRef.current = endMs;
      return;
    }

    const durationSeconds = (endMs - startMs) / 1000;

    const result = getResult(currentFilename);
    if (!result) {
      imageStartTimeRef.current = endMs;
      return;
    }

    try {
      await saveQcRecordToDatabase({
        baseDirectory: workingDirectory,
        sessionId,
        record: result,
        imageStartTime: new Date(startMs).toISOString(),
        imageEndTime: new Date(endMs).toISOString(),
        timeSpentSeconds: durationSeconds,
        customCards,
      });
    } catch (error) {
      console.error('Error saving QC record to database:', error);
    }

    // Next image timing starts from now
    imageStartTimeRef.current = endMs;
  }, [getCurrentFilename, getResult, workingDirectory, sessionId, customCards]);

  // Auto-save on navigation
  const handleSave = useCallback(async () => {
    if (!workingDirectory || !csvFilename) {
      console.warn('[Save] Cannot save - missing directory or filename');
      return;
    }

    try {
      console.log('[Save] Starting save operation...');
      const separator = workingDirectory.includes('\\') ? '\\' : '/';
      const csvPath = `${workingDirectory}${separator}${csvFilename}`;

      // Save CSV
      console.log('[Save] Saving CSV to:', csvPath);
      await saveCSV(csvPath, results, customCards);
      console.log('[Save] ✓ CSV saved');

      // Save state (JSON)
      console.log('[Save] Saving state...');
      await saveState(workingDirectory, currentIndex, imageList, results, qcName, csvFilename, customCards);
      console.log('[Save] ✓ State saved');

      console.log('[Save] ✓✓ All data saved successfully');
    } catch (error) {
      console.error('[Save] ✗ Error saving:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`Error saving data:\n${errorMsg}\n\nYour progress may not be saved.`);
    }
  }, [workingDirectory, csvFilename, results, customCards, currentIndex, imageList, qcName]);

  // Navigation handlers
  const canNavigate = () => {
    const currentFilename = getCurrentFilename();
    if (!currentFilename) return true; // Allow navigation if no filename

    const result = getResult(currentFilename);
    if (!result) return true; // Allow navigation if no result yet

    // Get missing fields
    const missingFields = getMissingFields(
      result['QC Decision'],
      result['QC Observations'],
      result['Retouch Quality'],
      result['Retouch Observations'],
      result['Next Action'],
      customCards,
      result
    );

    if (missingFields.length > 0) {
      alert(`Please complete mandatory fields:\n\n• ${missingFields.join('\n• ')}`);
      return false;
    }

    return true;
  };

  const handleNext = () => {
    // Only check mandatory fields when moving forward
    if (!canNavigate()) return;

    if (currentIndex < filteredImageList.length - 1) {
      // Save timing and DB record for the current image
      recordTimeForCurrentImage().catch((error) =>
        console.error('Error recording time for current image:', error)
      );
      handleSave();
      setCurrentIndex(currentIndex + 1);
      setFocusedPanel('qc'); // Reset focus to QC panel after navigation
    }
  };

  const handlePrevious = () => {
    // No mandatory field check for backward navigation
    if (currentIndex > 0) {
      handleSave();
      setCurrentIndex(currentIndex - 1);
      setFocusedPanel('qc'); // Reset focus to QC panel after navigation
    }
  };

  const handleFirst = () => {
    // No mandatory field check for backward navigation
    handleSave();
    setCurrentIndex(0);
    setFocusedPanel('qc'); // Reset focus to QC panel after navigation
  };

  const handleLast = () => {
    // No mandatory field check for backward navigation
    handleSave();
    setCurrentIndex(filteredImageList.length - 1);
    setFocusedPanel('qc'); // Reset focus to QC panel after navigation
  };

  // Auto-advance logic (currently not used with grid layout)
  // const handleAutoAdvance = useCallback(() => {
  //   const currentFilename = getCurrentFilename();
  //   if (!currentFilename) return;

  //   const result = getResult(currentFilename);
  //   if (!result) return;

  //   // Check if all mandatory fields are complete
  //   if (isRecordComplete(
  //     result['QC Decision'],
  //     result['QC Observations'],
  //     result['Retouch Quality'],
  //     result['Retouch Observations'],
  //     result['Next Action'],
  //     customCards,
  //     result
  //   )) {
  //     // Auto-advance to next image
  //     setTimeout(() => {
  //       handleNext();
  //     }, 100);
  //   }
  // }, [currentIndex, filteredImageList, results, customCards]);

  // Get current filename
  function getCurrentFilename() {
    if (filteredImageList.length === 0 || currentIndex < 0 || currentIndex >= filteredImageList.length) {
      return null;
    }
    const fullPath = filteredImageList[currentIndex];
    return getBaseFilename(fullPath);
  }

  // Handle update (called when panels change)
  const handleUpdate = useCallback(() => {
    const currentFilename = getCurrentFilename();
    if (!currentFilename || !workingDirectory) return;

    const result = getResult(currentFilename);
    if (!result) {
      // Create new result with parsed filename data
      const parsed = parseFilename(currentFilename);
      console.log('[Record] Creating new record for:', currentFilename);
      console.log('[Record] Parsed filename data:', parsed);

      const newResult: QCRecord = {
        'Week Number': String(getWeekNumber(new Date())),
        'QC Date': formatDateTime(new Date()),
        'Received Date': parsed.receivedDate || '',
        'Namespace': parsed.namespace || '',
        'Filename': currentFilename,
        'QC Name': qcName,
        'QC Decision': '',
        'QC Observations': '',
        'Retouch Quality': '',
        'Retouch Observations': '',
        'Next Action': '',
        'Next Action Comment': '',
      };

      console.log('[Record] New record created:', {
        'Week Number': newResult['Week Number'],
        'QC Date': newResult['QC Date'],
        'Received Date': newResult['Received Date'],
        'Namespace': newResult['Namespace'],
        'Filename': newResult['Filename']
      });

      updateResult(currentFilename, newResult);

      // Force save immediately after creating new record
      setTimeout(() => {
        handleSave();
      }, 100);
    }
  }, [currentIndex, workingDirectory, qcName, getResult, updateResult, handleSave]);



  const handleObservationShortcut = (shortcut: string, panelType: 'qc' | 'retouch' = 'qc') => {
    const currentFilename = getCurrentFilename();
    if (!currentFilename) return;

    const result = getResult(currentFilename);
    if (!result) return;

    // If QC Decision is Wrong, do not allow QC observations to be toggled
    if (panelType === 'qc' && result['QC Decision'] === 'Wrong') {
      return;
    }

    // Get observation based on shortcut and panel type
    const observations = panelType === 'qc' ? qcObservations : retouchObservations;
    const observation = observations.find(
      (obs) => obs.shortcut && obs.shortcut.toLowerCase() === shortcut.toLowerCase()
    );
    if (!observation) return;

    // Toggle observations for the focused panel
    const obsField = panelType === 'qc' ? 'QC Observations' : 'Retouch Observations';
    const currentObs = result[obsField] || '';
    const obsList = currentObs.split(';').filter(o => o.trim());
    let newObs: string[];

    if (obsList.includes(observation.label)) {
      newObs = obsList.filter(o => o !== observation.label);
    } else {
      newObs = [...obsList, observation.label];
    }

    const obsString = newObs.join(';');
    updateResult(currentFilename, { [obsField]: obsString });
    handleUpdate();
    checkAutoAdvanceOrFocus(currentFilename);
  };

  const handleNextActionShortcut = (action: string) => {
    const currentFilename = getCurrentFilename();
    if (!currentFilename) return;

    const result = getResult(currentFilename);
    if (!result) return;

    const current = result['Next Action'];
    const newValue = current === action ? '' : action;
    updateResult(currentFilename, { 'Next Action': newValue as "" | "Retake" | "Retouch" | "Ignore" | "Blunder" });
    handleUpdate();
    checkAutoAdvanceOrFocus(currentFilename);
  };

  const handleSaveAndExit = async () => {
    try {
      // Ensure we persist timing and DB record for the current image
      await recordTimeForCurrentImage();

      // First, save all data
      await handleSave();

      // Generate output folder name (same format as CSV)
      const outputFolderName = generateOutputFolderName(qcName);

      // Organize files based on Next Action
      const retouchFiles: string[] = [];
      const retakeFiles: string[] = [];
      const wrongFiles: string[] = [];

      // Create a map of filename -> full path
      const filenameToPath = new Map<string, string>();
      imageList.forEach(fullPath => {
        const filename = getBaseFilename(fullPath);
        filenameToPath.set(filename, fullPath);
      });

      // Categorize files
      Object.entries(results).forEach(([filename, result]) => {
        const nextAction = result['Next Action'];
        const qcDecision = result['QC Decision'];
        const fullPath = filenameToPath.get(filename) || filename;

        if (nextAction === 'Retouch' || nextAction === 'Blunder') {
          retouchFiles.push(fullPath);
        } else if (nextAction === 'Retake') {
          retakeFiles.push(fullPath);
        }

        if (qcDecision === 'Wrong') {
          wrongFiles.push(fullPath);
        }
      });

      // Call backend to organize files into a single output folder
      if (retouchFiles.length > 0 || retakeFiles.length > 0 || wrongFiles.length > 0) {
        console.log('Organizing files into folder:', outputFolderName, {
          directory: workingDirectory,
          retouchFiles,
          retakeFiles,
          wrongFiles,
        });

        try {
          const result = await invoke<string>('organize_files', {
            directory: workingDirectory,
            outputFolder: outputFolderName,
            retouchFiles: retouchFiles,
            retakeFiles: retakeFiles,
            wrongFiles: wrongFiles,
          });
          console.log('Files organized successfully:', result);
          alert(`Files organized successfully!\n${result}`);
        } catch (organizeError) {
          console.error('File organization error:', organizeError);
          alert(`Error organizing files: ${organizeError}`);
        }
      } else {
        console.log('No files to organize');
        alert('No files to organize (all files have "Ignore" action or no action selected)');
      }

      console.log('All data saved, closing application');

      // Close the application window
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (error) {
      console.error('Error in save and exit:', error);
      alert('Error saving data. Please try again.');
    }
  };

  // Check if we should auto-advance after completing all required fields
  const checkAutoAdvanceOrFocus = (filename: string) => {
    const result = getResult(filename);
    if (!result) return;

    // Only auto-advance to next image when all required fields are complete
    // User must manually switch between QC and Retouch panels using arrow keys
    if (focusedPanel === 'retouch' && result['Retouch Quality']) {
      // If typing in input field, don't process other shortcuts
      if (result['QC Decision'] && result['Next Action']) {
        setTimeout(() => {
          handleNext();
        }, 300);
      }
    }
  };

  // Apply previous image's tags to current image
  const applyPreviousTags = useCallback(() => {
    const currentFilename = getCurrentFilename();
    if (!currentFilename || currentIndex === 0) return;

    // Get previous image full path
    const previousImagePath = filteredImageList[currentIndex - 1];
    if (!previousImagePath) return;

    // Extract filename from path
    const previousFilename = getBaseFilename(previousImagePath);

    const previousResult = getResult(previousFilename);
    if (!previousResult) {
      console.log('No result found for previous image:', previousFilename);
      return;
    }

    const previousDecision = previousResult['QC Decision'] as "" | "Right" | "Wrong" | undefined;

    const tagsToApply: Partial<QCRecord> = {
      'QC Decision': previousDecision,
      // If decision is Wrong, keep QC observations empty
      'QC Observations': previousDecision === 'Wrong' ? '' : (previousResult['QC Observations'] || ''),
      'Retouch Quality': previousResult['Retouch Quality'] as "" | "Good" | "Bad" | undefined,
      'Retouch Observations': previousResult['Retouch Observations'] || '',
      'Next Action': previousResult['Next Action'] as "" | "Retake" | "Retouch" | "Ignore" | "Blunder" | undefined,
      'Next Action Comment': previousResult['Next Action Comment'] || '',
    };

    updateResult(currentFilename, tagsToApply);
    handleUpdate();
    console.log('Applied previous tags from:', previousFilename, 'to:', currentFilename);
  }, [currentIndex, filteredImageList, getCurrentFilename, getResult, updateResult, handleUpdate]);

  // Image viewer resize handler (reorganise mode only)
  const handleImageViewerResizeMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isReorganizeMode) return;

      const startY = e.clientY;
      const startHeight = imageViewerHeight;

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientY - startY;
        const next = Math.max(200, Math.min(800, startHeight + delta));
        setImageViewerHeight(next);
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [imageViewerHeight, isReorganizeMode]
  );

  // Keyboard shortcuts
  useShortcuts({
    handleSaveAndExit,
    setFocusedPanel,
    handleNext,
    handlePrevious,
    handleFirst,
    handleLast,
    handleObservationShortcut,
    focusedPanel,
    qcDecisionOptions,
    retouchDecisionOptions,
    getCurrentFilename,
    updateResult,
    handleUpdate,
    checkAutoAdvanceOrFocus,
    nextActionOptions,
    handleNextActionShortcut,
    applyPreviousTags,
  });

  if (!isInitialized && !showNameSelection) {
    return (
      <div className="app-loading">
        <p>Initializing...</p>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
        >
          Restart
        </button>
      </div>
    );
  }

  if (showNameSelection) {
    return (
      <StartupModal
        qcNames={selectableNames}
        wallpaperUrl={startupWallpaperUrl}
        wallpaper={{ mode: startupWallpaperMode }}
        onSelect={finalizeInitialization}
        onUpdateWallpaper={updateStartupWallpaper}
      />
    );
  }

  const currentFilename = getCurrentFilename();
  const currentImagePath = filteredImageList[currentIndex] || null;

  console.log('App: currentIndex:', currentIndex);
  console.log('App: filteredImageList length:', filteredImageList.length);
  console.log('App: currentImagePath:', currentImagePath);

  return (
    <div className="app-root">
      <div className="app-container">
        {/* Reorganize Mode Banner and Toolbar */}
        {isReorganizeMode && (
          <>
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '16px',
                zIndex: 1000,
                display: 'flex',
                gap: '8px',
                background: 'white',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              <button
                className="nav-btn"
                onClick={() => setIsReorganizeMode(false)}
              >
                Cancel
              </button>
              <button
                className="nav-btn"
                onClick={() => {
                  if (confirm('Reset all panels to default positions and sizes?')) {
                    layoutManagerRef.current?.resetLayout();
                  }
                }}
              >
                Reset to Default
              </button>
              <button
                className="nav-btn"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                }}
                onClick={() => {
                  layoutManagerRef.current?.saveLayout();
                  setIsReorganizeMode(false);
                }}
              >
                Save Layout
              </button>
            </div>
          </>
        )}

        <div
          className={`image-viewer-shell ${isReorganizeMode ? 'reorganize' : ''}`}
          style={{ height: `${imageViewerHeight}px`, minHeight: '200px' }}
        >
          <ImageViewer imagePath={currentImagePath} />
          <div
            className="image-viewer-resize-handle"
            onMouseDown={handleImageViewerResizeMouseDown}
          />
        </div>

        <div className="card-container" style={{ overflow: isReorganizeMode ? 'auto' : 'hidden' }}>
          <SimpleLayoutManager
            ref={layoutManagerRef}
            key={`grid-${isReorganizeMode ? 'edit' : 'view'}`}
            currentFilename={currentFilename}
            isDraggable={isReorganizeMode}
            onUpdate={handleUpdate}
            onAutoAdvance={handleNext}
            focusedPanel={focusedPanel}
          />
        </div>

        <NavigationBar
          currentIndex={currentIndex}
          totalImages={imageList.length}
          visibleImages={filteredImageList.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onFirst={handleFirst}
          onLast={handleLast}
          showIncompleteOnly={showIncompleteOnly}
          onToggleIncomplete={() => setShowIncompleteOnly(!showIncompleteOnly)}
          retouchCount={stats.retouch}
          retakeCount={stats.retake}
          wrongCount={stats.wrong}
          completedCount={stats.completed}
          currentFilename={currentFilename || ''}
          onSave={handleSaveAndExit}
          onOpenSettings={() => setShowSettings(true)}
          activeControl={showIncompleteOnly ? 'incomplete' : undefined}
        />

        {/* Unified Settings Modal */}
        {showSettings && (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            onOpenButtonEffects={() => setShowButtonEffects(true)}
            onOpenAnalyticsDashboard={() => setShowAnalytics(true)}
            onOpenShortcutsMap={() => setShowShortcutsMap(true)}
          />
        )}

        {/* Button Effects Card on main dashboard */}
        {showButtonEffects && (
          <ButtonEffectsPanel onClose={() => setShowButtonEffects(false)} />
        )}

        {showShortcutsMap && (
          <ShortcutsMap onClose={() => setShowShortcutsMap(false)} />
        )}

        {showAnalytics && (
          <AnalyticsDashboard
            baseDirectory={workingDirectory}
            onClose={() => setShowAnalytics(false)}
          />
        )}

        {showUserNames && (
          <UserNamesModal onClose={() => setShowUserNames(false)} />
        )}
      </div>
    </div>
  );
}

export default App;
