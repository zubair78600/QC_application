import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Panel, AutoField } from '../../types';
import { PanelBuilder } from '../PanelBuilder/PanelBuilder';
import { NewStructureWizard } from '../NewStructureWizard/NewStructureWizard';
import './SettingsPanelNew.css';

interface SettingsPanelNewProps {
  onClose: () => void;
}

export const SettingsPanelNew: React.FC<SettingsPanelNewProps> = ({ onClose }) => {
  const {
    panels,
    autoFields,
    colorSettings,
    createPanel,
    updatePanel,
    deletePanel,
    updateAutoFields,
    resetStructure,
    updateColorSettings,
  } = useAppStore();

  const [showPanelBuilder, setShowPanelBuilder] = useState(false);
  const [showNewStructureWizard, setShowNewStructureWizard] = useState(false);
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null);
  const [activeTab, setActiveTab] = useState<'panels' | 'appearance'>('panels');

  const handleEditPanel = (panel: Panel) => {
    setEditingPanel(panel);
    setShowPanelBuilder(true);
  };

  const handleAddNewPanel = () => {
    setEditingPanel(null);
    setShowPanelBuilder(true);
  };

  const handleSavePanel = (panel: Panel) => {
    if (editingPanel) {
      updatePanel(panel.id, panel);
    } else {
      createPanel(panel);
    }
    setEditingPanel(null);
  };

  const handleDeletePanel = (panelId: string) => {
    if (confirm('Are you sure you want to delete this panel?')) {
      deletePanel(panelId);
    }
  };

  const handleNewStructure = (selectedFields: AutoField[]) => {
    // Update enabled auto fields
    const updatedFields = autoFields.map(field => ({
      ...field,
      enabled: selectedFields.some(f => f.key === field.key),
    }));
    updateAutoFields(updatedFields);

    // Reset structure (delete all panels)
    resetStructure();
  };

  // Render panel preview card
  const renderPanelPreview = (panel: Panel) => {
    return (
      <div key={panel.id} className="panel-preview-card">
        <div className="panel-preview-header">
          <h3>{panel.name}</h3>
          <div className="panel-badges">
            {panel.mandatory && <span className="badge mandatory-badge">Mandatory</span>}
            <span className="badge type-badge">{panel.type}</span>
          </div>
        </div>

        <div className="panel-preview-content">
          {panel.type === 'text' ? (
            <div className="text-input-preview">Text Input</div>
          ) : (
            <div className="options-preview">
              {panel.options.slice(0, 4).map((option) => (
                <div key={option.id} className="option-preview">
                  <span className="option-label">{option.label}</span>
                  <span className="option-shortcut">{option.shortcut}</span>
                  {option.hasSubOptions && (
                    <span className="suboptions-indicator">
                      +{option.subOptions?.length || 0} sub
                    </span>
                  )}
                </div>
              ))}
              {panel.options.length > 4 && (
                <div className="more-options">
                  +{panel.options.length - 4} more
                </div>
              )}
            </div>
          )}
        </div>

        <div className="panel-preview-footer">
          <span className="csv-column-label">CSV: {panel.csvColumn}</span>
          <div className="panel-actions">
            <button
              className="action-btn edit-btn"
              onClick={() => handleEditPanel(panel)}
              title="Edit panel"
            >
              ✏️ Edit
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => handleDeletePanel(panel.id)}
              title="Delete panel"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="settings-overlay" onClick={onClose}>
        <div className="settings-dialog-new" onClick={(e) => e.stopPropagation()}>
          <div className="settings-header">
            <h2>Settings</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

          {/* Tabs */}
          <div className="settings-tabs">
            <button
              className={`tab-btn ${activeTab === 'panels' ? 'active' : ''}`}
              onClick={() => setActiveTab('panels')}
            >
              Panels & Structure
            </button>
            <button
              className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              Appearance
            </button>
          </div>

          <div className="settings-content">
            {activeTab === 'panels' && (
              <>
                {/* Action Buttons */}
                <div className="action-bar">
                  <button
                    className="primary-btn new-structure-btn"
                    onClick={() => setShowNewStructureWizard(true)}
                  >
                    🔄 New Structure
                  </button>
                  <button
                    className="primary-btn add-panel-btn"
                    onClick={handleAddNewPanel}
                  >
                    ➕ Add New Panel
                  </button>
                </div>

                {/* Auto Fields Summary */}
                <div className="auto-fields-summary">
                  <h3>Auto-Generated Fields</h3>
                  <div className="fields-chips">
                    {autoFields
                      .filter(f => f.enabled)
                      .map(field => (
                        <span key={field.key} className="field-chip">
                          {field.label}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Panel Grid (2x2) */}
                <div className="panels-section">
                  <h3>Custom Panels ({panels.length})</h3>
                  {panels.length === 0 ? (
                    <div className="empty-state">
                      <p>No panels configured yet.</p>
                      <p>Click "Add New Panel" to create your first panel.</p>
                    </div>
                  ) : (
                    <div className="panels-grid">
                      {panels.map(renderPanelPreview)}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'appearance' && (
              <div className="appearance-section">
                <h3>Color Settings</h3>

                <div className="color-controls">
                  <div className="color-control">
                    <label>Primary Color</label>
                    <input
                      type="color"
                      value={colorSettings.primaryColor}
                      onChange={(e) => updateColorSettings({ primaryColor: e.target.value })}
                    />
                    <span className="color-value">{colorSettings.primaryColor}</span>
                  </div>

                  <div className="color-control">
                    <label>Active Color</label>
                    <input
                      type="color"
                      value={colorSettings.activeColor}
                      onChange={(e) => updateColorSettings({ activeColor: e.target.value })}
                    />
                    <span className="color-value">{colorSettings.activeColor}</span>
                  </div>

                  <div className="color-control">
                    <label>Background Color</label>
                    <input
                      type="color"
                      value={colorSettings.backgroundColor}
                      onChange={(e) => updateColorSettings({ backgroundColor: e.target.value })}
                    />
                    <span className="color-value">{colorSettings.backgroundColor}</span>
                  </div>

                  <div className="color-control">
                    <label>Glass Color</label>
                    <input
                      type="color"
                      value={colorSettings.glassColor}
                      onChange={(e) => updateColorSettings({ glassColor: e.target.value })}
                    />
                    <span className="color-value">{colorSettings.glassColor}</span>
                  </div>
                </div>

                <h3>Card Settings</h3>

                <div className="slider-controls">
                  <div className="slider-control">
                    <label>Card Radius: {colorSettings.cardRadius}px</label>
                    <input
                      type="range"
                      min="0"
                      max="32"
                      value={colorSettings.cardRadius}
                      onChange={(e) => updateColorSettings({ cardRadius: Number(e.target.value) })}
                    />
                  </div>

                  <div className="slider-control">
                    <label>Shadow Opacity: {(colorSettings.shadowOpacity * 100).toFixed(0)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={colorSettings.shadowOpacity}
                      onChange={(e) => updateColorSettings({ shadowOpacity: Number(e.target.value) })}
                    />
                  </div>

                  <div className="slider-control">
                    <label>Shadow Blur: {colorSettings.shadowBlur}px</label>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={colorSettings.shadowBlur}
                      onChange={(e) => updateColorSettings({ shadowBlur: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <PanelBuilder
        isOpen={showPanelBuilder}
        onClose={() => {
          setShowPanelBuilder(false);
          setEditingPanel(null);
        }}
        onSave={handleSavePanel}
        editingPanel={editingPanel}
      />

      <NewStructureWizard
        isOpen={showNewStructureWizard}
        onClose={() => setShowNewStructureWizard(false)}
        onConfirm={handleNewStructure}
        availableFields={autoFields}
      />
    </>
  );
};
