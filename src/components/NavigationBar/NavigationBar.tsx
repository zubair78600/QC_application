import React from 'react';
import './NavigationBar.css';

interface NavigationBarProps {
  currentIndex: number;
  totalImages: number;      // total across all images (for progress)
  visibleImages: number;    // images in current view (all vs incomplete)
  onPrevious: () => void;
  onNext: () => void;
  onFirst: () => void;
  onLast: () => void;
  showIncompleteOnly: boolean;
  onToggleIncomplete: () => void;
  retouchCount: number;
  retakeCount: number;
  wrongCount: number;
  completedCount: number;
  currentFilename: string;
  onSave: () => void;
  onOpenSettings?: () => void;
  activeControl?: string; // 'incomplete' when incomplete filter is active
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  currentIndex,
  totalImages,
  visibleImages,
  onPrevious,
  onNext,
  onFirst,
  onLast,
  showIncompleteOnly,
  onToggleIncomplete,
  retouchCount,
  retakeCount,
  wrongCount,
  completedCount,
  currentFilename,
  onSave,
  onOpenSettings,
  activeControl
}) => {
  const progress = totalImages > 0 ? (completedCount / totalImages) * 100 : 0;

  return (
    <div className="navigation-bar glass-card">
      {/* Row 1: Navigation Controls + Stats (left) + Progress (center) + Save (right) */}
      <div className="nav-top-row">
        <div className="nav-left-group">
          <button className="nav-btn nav-icon-btn" onClick={onFirst} disabled={currentIndex === 0} title="First">
            ⏮
          </button>
          <button className="nav-btn nav-icon-btn" onClick={onPrevious} disabled={currentIndex === 0} title="Previous">
            ◀
          </button>
          <span className="nav-counter">
            {visibleImages > 0 ? currentIndex + 1 : 0} / {visibleImages}
          </span>
          <button
            className="nav-btn nav-icon-btn"
            onClick={onNext}
            disabled={currentIndex >= visibleImages - 1}
            title="Next"
          >
            ▶
          </button>
          <button
            className="nav-btn nav-icon-btn"
            onClick={onLast}
            disabled={currentIndex >= visibleImages - 1}
            title="Last"
          >
            ⏭
          </button>
          <button
            className={`nav-btn incomplete-btn ${activeControl === 'incomplete' ? 'active' : ''}`}
            onClick={onToggleIncomplete}
          >
            {showIncompleteOnly ? 'All' : 'Incomplete'}
          </button>

          <div className="stats-group">
            <span className="stat-chip">Retouch: {retouchCount}</span>
            <span className="stat-chip">Retake: {retakeCount}</span>
            <span className="stat-chip">Wrong: {wrongCount}</span>
          </div>

          {/* Settings Icon */}
          <button
            className="nav-btn settings-icon-btn"
            onClick={onOpenSettings}
            title="Settings"
          >
            ⚙️
          </button>
        </div>

        {/* Progress centered between controls and Save */}
        <div className="nav-section progress-section nav-progress-inline">
          <div className="progress-container-compact">
            <div
              className="progress-bar"
              style={{
                width: `${progress}%`
              }}
            ></div>
            <div
              className="progress-pill-label"
              style={{
                left: `${Math.min(Math.max(progress, 4), 96)}%`,
              }}
            >
              {progress.toFixed(0)}%
            </div>
          </div>
          <span className="progress-text">
            {progress.toFixed(0)}% ({completedCount}/{totalImages})
          </span>
        </div>

        {/* Save Button - Positioned on far right */}
        <button className="nav-btn save-btn-compact" onClick={onSave}>
          💾 Save
        </button>
      </div>

      {/* Row 2: Filename */}
      <div className="nav-progress-row">
        <span className="filename-text">{currentFilename || 'No file'}</span>
      </div>
    </div>
  );
};
