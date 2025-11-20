import React from 'react';
import { useAppStore } from '../../store/appStore';
import './SettingsPanel.css';

interface LayoutSettingsModalProps {
  onClose: () => void;
}

export const LayoutSettingsModal: React.FC<LayoutSettingsModalProps> = ({ onClose }) => {
  const {
    customCards,
    setIsReorganizeMode,
    resetGridLayout
  } = useAppStore();

  const handleEnterReorganizeMode = () => {
    setIsReorganizeMode(true);
    onClose();
  };

  const handleResetLayout = () => {
    if (confirm('Reset all panels to default positions and sizes?')) {
      resetGridLayout();
      alert('Layout reset to default!');
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Layout</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          <div className="layout-tab">
            <div className="layout-header">
              <h3>Layout Manager</h3>
              <div className="layout-actions">
                <button
                  className="btn-primary"
                  onClick={handleEnterReorganizeMode}
                >
                  ✨ Enter Reorganize Mode
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleResetLayout}
                >
                  🔄 Reset Default
                </button>
                <button
                  className="btn-secondary"
                  onClick={onClose}
                >
                  ✕ Exit
                </button>
              </div>
            </div>

            <div className="layout-instructions">
              <h4>How to Customize Your Layout</h4>
              <ul>
                <li><strong>Enter Reorganize Mode:</strong> Click the "Enter Reorganize Mode" button above to enable drag and resize</li>
                <li><strong>Drag panels:</strong> In reorganize mode, click and hold any panel to move it around</li>
                <li><strong>Resize panels:</strong> In reorganize mode, drag the corners to resize panels</li>
                <li><strong>Auto-save:</strong> Your layout is automatically saved as you make changes</li>
                <li><strong>Reset:</strong> Click "Reset Default" to restore the original layout</li>
              </ul>
            </div>

            <div className="layout-panel-list">
              <h4>Active Panels</h4>
              <div className="panel-items">
                <div className="panel-item">
                  <span className="panel-icon">🎨</span>
                  <span className="panel-name">QC Panel</span>
                  <span className="panel-status">Active</span>
                </div>
                <div className="panel-item">
                  <span className="panel-icon">✏️</span>
                  <span className="panel-name">Retouch Panel</span>
                  <span className="panel-status">Active</span>
                </div>
                <div className="panel-item">
                  <span className="panel-icon">▶️</span>
                  <span className="panel-name">Next Action Panel</span>
                  <span className="panel-status">Active</span>
                </div>
                {customCards.map((card) => (
                  <div key={card.id} className="panel-item">
                    <span className="panel-icon">📋</span>
                    <span className="panel-name">{card.title}</span>
                    <span className="panel-status">Custom</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
