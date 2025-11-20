import React, { useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import './ShortcutsMap.css';

interface ShortcutsMapProps {
    onClose: () => void;
}

export const ShortcutsMap: React.FC<ShortcutsMapProps> = ({ onClose }) => {
    const {
        qcDecisionOptions,
        retouchDecisionOptions,
        nextActionOptions,
    } = useAppStore();

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="shortcuts-overlay" onClick={onClose}>
            <div className="glass-card shortcuts-card" onClick={(e) => e.stopPropagation()}>
                <div className="shortcuts-header">
                    <h2 className="shortcuts-title">Keyboard Shortcuts</h2>
                    <button className="shortcuts-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="shortcuts-grid">
                    {/* Navigation */}
                    <div className="shortcuts-section">
                        <h3 className="shortcuts-section-title">Navigation</h3>
                        <div className="shortcut-item">
                            <span className="shortcut-desc">Next Image</span>
                            <div className="shortcut-keys">
                                <kbd className="kbd">→</kbd>
                                <span style={{ alignSelf: 'center', fontSize: '12px', opacity: 0.6 }}>or</span>
                                <kbd className="kbd">Tab</kbd>
                            </div>
                        </div>
                        <div className="shortcut-item">
                            <span className="shortcut-desc">Previous Image</span>
                            <div className="shortcut-keys">
                                <kbd className="kbd">←</kbd>
                            </div>
                        </div>
                        <div className="shortcut-item">
                            <span className="shortcut-desc">First Image</span>
                            <div className="shortcut-keys">
                                <kbd className="kbd">Home</kbd>
                            </div>
                        </div>
                        <div className="shortcut-item">
                            <span className="shortcut-desc">Last Image</span>
                            <div className="shortcut-keys">
                                <kbd className="kbd">End</kbd>
                            </div>
                        </div>
                        <div className="shortcut-item">
                            <span className="shortcut-desc">Focus QC Panel</span>
                            <div className="shortcut-keys">
                                <kbd className="kbd">↑</kbd>
                            </div>
                        </div>
                        <div className="shortcut-item">
                            <span className="shortcut-desc">Focus Retouch Panel</span>
                            <div className="shortcut-keys">
                                <kbd className="kbd">↓</kbd>
                            </div>
                        </div>
                    </div>

                    {/* QC Decisions */}
                    <div className="shortcuts-section">
                        <h3 className="shortcuts-section-title">QC Decisions</h3>
                        {qcDecisionOptions.map((option) => (
                            <div className="shortcut-item" key={option.id}>
                                <span className="shortcut-desc">{option.label}</span>
                                <div className="shortcut-keys">
                                    <kbd className="kbd">{option.shortcut}</kbd>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Retouch Decisions */}
                    <div className="shortcuts-section">
                        <h3 className="shortcuts-section-title">Retouch Decisions</h3>
                        {retouchDecisionOptions.map((option) => (
                            <div className="shortcut-item" key={option.id}>
                                <span className="shortcut-desc">{option.label}</span>
                                <div className="shortcut-keys">
                                    <kbd className="kbd">{option.shortcut}</kbd>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Next Actions */}
                    <div className="shortcuts-section">
                        <h3 className="shortcuts-section-title">Next Actions</h3>
                        {nextActionOptions.map((option) => (
                            <div className="shortcut-item" key={option.id}>
                                <span className="shortcut-desc">{option.label}</span>
                                <div className="shortcut-keys">
                                    <kbd className="kbd">{option.shortcut}</kbd>
                                </div>
                            </div>
                        ))}
                        <div className="shortcut-item">
                            <span className="shortcut-desc">Copy Previous Tags</span>
                            <div className="shortcut-keys">
                                <kbd className="kbd">E</kbd>
                            </div>
                        </div>
                    </div>

                    {/* Observations (Dynamic based on panel) */}
                    <div className="shortcuts-section">
                        <h3 className="shortcuts-section-title">Observations</h3>
                        <div className="shortcut-item">
                            <span className="shortcut-desc">Toggle Observation</span>
                            <div className="shortcut-keys">
                                <kbd className="kbd">1</kbd>
                                <span style={{ alignSelf: 'center' }}>-</span>
                                <kbd className="kbd">9</kbd>
                            </div>
                        </div>
                        <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
                            * Observation shortcuts apply to the currently focused panel (QC or Retouch).
                        </p>
                    </div>

                    {/* General */}
                    <div className="shortcuts-section">
                        <h3 className="shortcuts-section-title">General</h3>
                        <div className="shortcut-item">
                            <span className="shortcut-desc">Save & Exit</span>
                            <div className="shortcut-keys">
                                <kbd className="kbd">Ctrl</kbd>
                                <span style={{ alignSelf: 'center' }}>+</span>
                                <kbd className="kbd">S</kbd>
                            </div>
                        </div>
                        <div className="shortcut-item">
                            <span className="shortcut-desc">Show Shortcuts</span>
                            <div className="shortcut-keys">
                                <kbd className="kbd">?</kbd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
