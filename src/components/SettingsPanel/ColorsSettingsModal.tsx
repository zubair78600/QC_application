import React from 'react';
import { useAppStore } from '../../store/appStore';
import './SettingsPanel.css';

interface ColorsSettingsModalProps {
  onClose: () => void;
}

export const ColorsSettingsModal: React.FC<ColorsSettingsModalProps> = ({ onClose }) => {
  const { colorSettings, updateColorSettings } = useAppStore();

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Colors</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          <div className="colors-tab">
            <h3>Color Settings</h3>
            <p className="info-text">
              Customize the color scheme of the application. Changes are applied immediately.
            </p>

            <div className="color-settings-grid">
              <div className="color-setting">
                <label>Primary Color (Headers & Buttons)</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={colorSettings.primaryColor}
                    onChange={(e) => updateColorSettings({ primaryColor: e.target.value })}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={colorSettings.primaryColor}
                    onChange={(e) => updateColorSettings({ primaryColor: e.target.value })}
                    className="color-text-input"
                    placeholder="#667eea"
                  />
                </div>
              </div>

              <div className="color-setting">
                <label>Active Color (Selected Items)</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={colorSettings.activeColor}
                    onChange={(e) => updateColorSettings({ activeColor: e.target.value })}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={colorSettings.activeColor}
                    onChange={(e) => updateColorSettings({ activeColor: e.target.value })}
                    className="color-text-input"
                    placeholder="#ffae0c"
                  />
                </div>
              </div>

              <div className="color-setting">
                <label>Background Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={colorSettings.backgroundColor}
                    onChange={(e) => updateColorSettings({ backgroundColor: e.target.value })}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={colorSettings.backgroundColor}
                    onChange={(e) => updateColorSettings({ backgroundColor: e.target.value })}
                    className="color-text-input"
                    placeholder="#ece9e9"
                  />
                </div>
              </div>

              <div className="color-setting">
                <label>Glass Effect Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={colorSettings.glassColor}
                    onChange={(e) => updateColorSettings({ glassColor: e.target.value })}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={colorSettings.glassColor}
                    onChange={(e) => updateColorSettings({ glassColor: e.target.value })}
                    className="color-text-input"
                    placeholder="#8e8e8e"
                  />
                </div>
              </div>
            </div>

            <div className="shadow-settings">
              <h4>Shadow Settings</h4>
              <div className="shadow-controls">
                <div className="shadow-control">
                  <label>Opacity: {Math.round(colorSettings.shadowOpacity * 100)}%</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={colorSettings.shadowOpacity}
                    onChange={(e) => updateColorSettings({ shadowOpacity: parseFloat(e.target.value) })}
                    className="shadow-slider"
                  />
                </div>

                <div className="shadow-control">
                  <label>Blur: {colorSettings.shadowBlur}px</label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={colorSettings.shadowBlur}
                    onChange={(e) => updateColorSettings({ shadowBlur: parseInt(e.target.value) })}
                    className="shadow-slider"
                  />
                </div>

                <div className="shadow-control">
                  <label>Angle: {colorSettings.shadowAngle}°</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={colorSettings.shadowAngle}
                    onChange={(e) => updateColorSettings({ shadowAngle: parseInt(e.target.value) })}
                    className="shadow-slider"
                  />
                </div>
              </div>
            </div>

            <div className="color-presets">
              <h4>Color Presets</h4>
              <div className="preset-buttons">
                <button
                  className="preset-btn"
                  onClick={() => updateColorSettings({
                    primaryColor: '#667eea',
                    activeColor: '#ffae0c',
                    backgroundColor: '#ece9e9',
                    glassColor: '#8e8e8e',
                    shadowOpacity: 0.15,
                    shadowBlur: 12,
                    shadowAngle: 0,
                  })}
                >
                  Default
                </button>
                <button
                  className="preset-btn"
                  onClick={() => updateColorSettings({
                    primaryColor: '#4CAF50',
                    activeColor: '#FF9800',
                    backgroundColor: '#f5f5f5',
                    glassColor: '#9E9E9E',
                    shadowOpacity: 0.2,
                    shadowBlur: 15,
                    shadowAngle: 45,
                  })}
                >
                  Green
                </button>
                <button
                  className="preset-btn"
                  onClick={() => updateColorSettings({
                    primaryColor: '#2196F3',
                    activeColor: '#FF5722',
                    backgroundColor: '#e3f2fd',
                    glassColor: '#90CAF9',
                    shadowOpacity: 0.1,
                    shadowBlur: 8,
                    shadowAngle: 90,
                  })}
                >
                  Blue
                </button>
                <button
                  className="preset-btn"
                  onClick={() => updateColorSettings({
                    primaryColor: '#9C27B0',
                    activeColor: '#FFC107',
                    backgroundColor: '#f3e5f5',
                    glassColor: '#CE93D8',
                    shadowOpacity: 0.25,
                    shadowBlur: 20,
                    shadowAngle: 135,
                  })}
                >
                  Purple
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
