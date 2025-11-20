import React from 'react';
import './StatusBar.css';

interface StatusBarProps {
  completedCount: number;
  totalCount: number;
  currentFilename: string;
  onSave: () => void;
  onSaveAndExit: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  completedCount,
  totalCount,
  currentFilename,
  onSave,
  onSaveAndExit
}) => {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="status-bar glass-card">
      <div className="status-info">
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="status-text">
          Completed {completedCount} out of {totalCount} images ({progress.toFixed(1)}%)
        </span>
      </div>

      <div className="filename-info">
        <span>{currentFilename || 'No image selected'}</span>
      </div>

      <div className="action-buttons">
        <button className="save-btn" onClick={onSave}>
          Save (Ctrl+S)
        </button>
        <button className="save-btn save-exit-btn" onClick={onSaveAndExit}>
          Save & Exit (Ctrl+Shift+S)
        </button>
      </div>
    </div>
  );
};
