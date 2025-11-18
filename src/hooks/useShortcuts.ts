import { useEffect } from 'react';
import { QCRecord } from '../types';

interface UseShortcutsProps {
    handleSaveAndExit: () => void;
    setFocusedPanel: (panel: 'qc' | 'retouch') => void;
    handleNext: () => void;
    handlePrevious: () => void;
    handleFirst: () => void;
    handleLast: () => void;
    handleObservationShortcut: (key: string, panel: 'qc' | 'retouch') => void;
    focusedPanel: 'qc' | 'retouch';
    qcDecisionOptions: any[];
    retouchDecisionOptions: any[];
    getCurrentFilename: () => string | null;
    updateResult: (filename: string, result: Partial<QCRecord>) => void;
    handleUpdate: () => void;
    checkAutoAdvanceOrFocus: (filename: string) => void;
    nextActionOptions: any[];
    handleNextActionShortcut: (action: string) => void;
    applyPreviousTags: () => void;
}

export function useShortcuts({
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
}: UseShortcutsProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            console.log('Key pressed:', e.key, 'Code:', e.code); // Debug log
            const target = e.target as HTMLElement;
            const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            // Save and Exit shortcut (Ctrl+S) - works even in input fields
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSaveAndExit();
                return;
            }

            // If typing in input field, don't process other shortcuts
            if (isInputField && e.key !== 'Escape') {
                return;
            }

            const key = e.key.toLowerCase();

            // Panel focus navigation (Up/Down arrows)
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedPanel('qc');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedPanel('retouch');
            }
            // Image navigation shortcuts
            else if (e.key === 'ArrowRight' || e.key === 'Tab') {
                e.preventDefault();
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrevious();
            } else if (e.key === 'Home') {
                e.preventDefault();
                handleFirst();
            } else if (e.key === 'End') {
                e.preventDefault();
                handleLast();
            }
            // Observation shortcuts (numeric) - use configured shortcuts for focused panel
            else if (key >= '0' && key <= '9') {
                e.preventDefault();
                handleObservationShortcut(key, focusedPanel);
            }
            // Decision / quality shortcuts and Next Action shortcuts - using configured keys
            else if (!e.ctrlKey && !e.metaKey) {
                const qcDecisionMatch = qcDecisionOptions.find(
                    (option) => option.shortcut && option.shortcut.toLowerCase() === key
                );
                const retouchDecisionMatch = retouchDecisionOptions.find(
                    (option) => option.shortcut && option.shortcut.toLowerCase() === key
                );

                if (qcDecisionMatch || retouchDecisionMatch) {
                    e.preventDefault();
                    const currentFilename = getCurrentFilename();
                    if (currentFilename) {
                        if (focusedPanel === 'qc' && qcDecisionMatch) {
                            const update: { 'QC Decision': '' | 'Right' | 'Wrong'; 'QC Observations'?: string } =
                            {
                                'QC Decision': qcDecisionMatch.id as '' | 'Right' | 'Wrong',
                            };
                            if (qcDecisionMatch.id === 'Wrong') {
                                update['QC Observations'] = '';
                            }
                            updateResult(currentFilename, update);
                        } else if (focusedPanel === 'retouch' && retouchDecisionMatch) {
                            const newQuality = retouchDecisionMatch.id as '' | 'Good' | 'Bad';
                            updateResult(currentFilename, { 'Retouch Quality': newQuality });

                            // Preserve auto-behaviour: Good quality sets Next Action to Ignore and may auto-advance
                            if (newQuality === 'Good') {
                                updateResult(currentFilename, { 'Next Action': 'Ignore' });
                            }
                        }
                        handleUpdate();
                        if (currentFilename) {
                            checkAutoAdvanceOrFocus(currentFilename);
                        }
                    }
                } else {
                    // Next Action shortcuts
                    const matchedAction = nextActionOptions.find(
                        (option) =>
                            option.label &&
                            option.label.trim() &&
                            !option.label.toLowerCase().includes('comment') &&
                            option.shortcut &&
                            option.shortcut.toLowerCase() === key
                    );
                    if (matchedAction) {
                        e.preventDefault();
                        handleNextActionShortcut(
                            matchedAction.label as '' | 'Retake' | 'Retouch' | 'Ignore' | 'Blunder'
                        );
                    } else if (key === 'e') {
                        e.preventDefault();
                        // Apply previous image's tags to current image
                        applyPreviousTags();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        handleNext,
        handlePrevious,
        handleFirst,
        handleLast,
        updateResult,
        handleUpdate,
        getCurrentFilename,
        handleNextActionShortcut,
        handleObservationShortcut,
        handleSaveAndExit,
        focusedPanel,
        checkAutoAdvanceOrFocus,
        applyPreviousTags,
        nextActionOptions,
        qcDecisionOptions,
        retouchDecisionOptions,
        setFocusedPanel
    ]);
}
