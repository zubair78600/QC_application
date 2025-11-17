import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { CustomCard, ObservationOption } from '../../types';
import { QCPanel } from '../QCPanel/QCPanel';
import { RetouchPanel } from '../RetouchPanel/RetouchPanel';
import { NextActionPanel } from '../NextActionPanel/NextActionPanel';
import { CustomCardPanel } from '../CustomCardPanel/CustomCardPanel';
import { PanelConfigModal } from './PanelConfigModal';
import { CustomCardModal } from './CustomCardModal';
import './SettingsPanel.css';

interface SettingsPanelProps {
  onClose: () => void;
  onOpenButtonEffects?: () => void;
  onOpenAnalyticsDashboard?: () => void;
}

type CardType = 'custom' | 'qc-obs' | 'retouch-obs';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onClose,
  onOpenButtonEffects,
  onOpenAnalyticsDashboard,
}) => {
  const {
    customCards,
    qcObservations,
    retouchObservations,
    colorSettings,
    setIsReorganizeMode,
    deleteCustomCard,
    addQCObservation,
    updateQCObservation,
    deleteQCObservation,
    addRetouchObservation,
    updateRetouchObservation,
    deleteRetouchObservation,
    updateColorSettings,
  } = useAppStore();

  const [cardType, setCardType] = useState<CardType>('custom');
  const [editingObs, setEditingObs] = useState<ObservationOption | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number }>({
    top: 40,
    left: 40,
  });
  const [activeTab, setActiveTab] = useState<'panels' | 'colors'>('panels');
  const [activePanelModal, setActivePanelModal] = useState<'qc' | 'retouch' | 'nextAction' | null>(
    null
  );
  const [editingCustomCard, setEditingCustomCard] = useState<CustomCard | null | undefined>(
    undefined
  );

  useEffect(() => {
    const approximateWidth = 900;
    const approximateHeight = 600;

    const centeredTop = Math.max(20, (window.innerHeight - approximateHeight) / 2);
    const centeredLeft = Math.max(20, (window.innerWidth - approximateWidth) / 2);

    setPanelPosition({
      top: centeredTop,
      left: centeredLeft,
    });
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      const newLeft = event.clientX - dragOffset.x;
      const newTop = event.clientY - dragOffset.y;

      setPanelPosition({
        top: Math.max(10, Math.min(window.innerHeight - 100, newTop)),
        left: Math.max(10, Math.min(window.innerWidth - 100, newLeft)),
      });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset.x, dragOffset.y]);

  const handleHeaderMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const panel = (event.currentTarget.parentElement as HTMLElement) || null;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    setIsDragging(true);
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  // Observation form (used for both QC and Retouch)
  const [obsFormData, setObsFormData] = useState({
    id: '',
    label: '',
    shortcut: '',
  });

  const handleSubmitObservation = (e: React.FormEvent) => {
    e.preventDefault();
    const newObs: ObservationOption = {
      id: editingObs?.id || obsFormData.id.toLowerCase().replace(/\s+/g, '_'),
      label: obsFormData.label,
      shortcut: obsFormData.shortcut,
    };

    if (cardType === 'qc-obs') {
      if (editingObs) {
        updateQCObservation(editingObs.id, newObs);
      } else {
        addQCObservation(newObs);
      }
    } else if (cardType === 'retouch-obs') {
      if (editingObs) {
        updateRetouchObservation(editingObs.id, newObs);
      } else {
        addRetouchObservation(newObs);
      }
    }
    resetObsForm();
  };

  const resetObsForm = () => {
    setObsFormData({
      id: '',
      label: '',
      shortcut: '',
    });
    setEditingObs(null);
  };

  const handleEditCard = (card: CustomCard) => {
    setCardType('custom');
    setEditingCustomCard(card);
  };

  const handleEditObs = (obs: ObservationOption, type: 'qc-obs' | 'retouch-obs') => {
    setCardType(type);
    setEditingObs(obs);
    setObsFormData({
      id: obs.id,
      label: obs.label,
      shortcut: obs.shortcut,
    });
  };

  const handleDeleteCard = (id: string) => {
    if (confirm('Delete this custom card?')) {
      deleteCustomCard(id);
    }
  };

  const handleDeleteObs = (id: string, type: 'qc-obs' | 'retouch-obs') => {
    if (confirm('Delete this observation?')) {
      if (type === 'qc-obs') {
        deleteQCObservation(id);
      } else {
        deleteRetouchObservation(id);
      }
    }
  };

  return (
    <div className="settings-overlay">
      <div
        className="settings-panel"
        style={{ top: `${panelPosition.top}px`, left: `${panelPosition.left}px` }}
      >
        <div className="settings-header" onMouseDown={handleHeaderMouseDown}>
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === 'panels' ? 'active' : ''}`}
            onClick={() => setActiveTab('panels')}
          >
            Panels & Tags
          </button>
          <button
            className={`tab-btn ${activeTab === 'colors' ? 'active' : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            Colors & Effects
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'panels' && (
            <>
          {/* 2x2 grid of live panel previews */}
          <div className="settings-preview-grid">
            <div className="settings-preview-cell">
              <div className="settings-preview-title-row">
                <h3 className="settings-preview-title">QC Panel Preview</h3>
                <div className="settings-preview-actions">
                  <button
                    className="settings-preview-icon-btn"
                    title="Edit QC panel decisions and observations"
                    onClick={() => setActivePanelModal('qc')}
                  >
                    ✏️
                  </button>
                </div>
              </div>
              <div className="settings-preview-panel">
                <QCPanel currentFilename={null} onUpdate={() => {}} isFocused />
              </div>
            </div>

            <div className="settings-preview-cell">
              <div className="settings-preview-title-row">
                <h3 className="settings-preview-title">Retouch Panel Preview</h3>
                <div className="settings-preview-actions">
                  <button
                    className="settings-preview-icon-btn"
                    title="Edit Retouch panel decisions and observations"
                    onClick={() => setActivePanelModal('retouch')}
                  >
                    ✏️
                  </button>
                </div>
              </div>
              <div className="settings-preview-panel">
                <RetouchPanel
                  currentFilename={null}
                  onUpdate={() => {}}
                  onAutoAdvance={() => {}}
                  isFocused
                />
              </div>
            </div>

            <div className="settings-preview-cell">
              <div className="settings-preview-title-row">
                <h3 className="settings-preview-title">Next Action Panel Preview</h3>
                <div className="settings-preview-actions">
                  <button
                    className="settings-preview-icon-btn"
                    title="Edit Next Action shortcuts"
                    onClick={() => setActivePanelModal('nextAction')}
                  >
                    ✏️
                  </button>
                </div>
              </div>
              <div className="settings-preview-panel">
                <NextActionPanel
                  currentFilename={null}
                  onUpdate={() => {}}
                  onAutoAdvance={() => {}}
                />
              </div>
            </div>

            <div className="settings-preview-cell">
              <div className="settings-preview-title-row">
                <h3 className="settings-preview-title">Custom Card Preview</h3>
                <div className="settings-preview-actions">
                  <button
                    className="settings-preview-icon-btn"
                    title="Add new custom panel"
                    onClick={() => {
                      setEditingCustomCard(null);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="settings-preview-panel">
                {customCards.length > 0 ? (
                  <div className="custom-preview-grid">
                    {customCards.map((card) => (
                      <div key={card.id} className="custom-preview-item">
                        <CustomCardPanel
                          card={card}
                          currentFilename={null}
                          onUpdate={() => {}}
                        />
                      </div>
                    ))}
                    <button
                      className="custom-preview-add-tile"
                      onClick={() => {
                        setEditingCustomCard(null);
                      }}
                      title="Add new custom panel"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    className="custom-preview-add-tile"
                    onClick={() => {
                      setEditingCustomCard(null);
                    }}
                  >
                    + Add custom card
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cards & observations configuration */}
          <div className="cards-tab">
            <div className="card-type-selector">
              <button
                className={`type-btn ${cardType === 'custom' ? 'active' : ''}`}
                onClick={() => {
                  setCardType('custom');
                  resetObsForm();
                }}
              >
                Custom Cards ({customCards.length})
              </button>
              <button
                className={`type-btn ${cardType === 'qc-obs' ? 'active' : ''}`}
                onClick={() => {
                  setCardType('qc-obs');
                  resetObsForm();
                }}
              >
                QC Observations ({qcObservations.length})
              </button>
              <button
                className={`type-btn ${cardType === 'retouch-obs' ? 'active' : ''}`}
                onClick={() => {
                  setCardType('retouch-obs');
                  resetObsForm();
                }}
              >
                Retouch Observations ({retouchObservations.length})
              </button>
            </div>

            <div className="cards-content-grid">
              {/* Form section */}
              <div className="form-section glass-card">
                {cardType === 'custom' ? (
                  <>
                    <h3>Custom Cards</h3>
                    <p className="info-text">
                      Use the + tiles in the preview above to add or edit custom panels.
                    </p>
                  </>
                ) : (
                  <>
                    <h3>{editingObs ? 'Edit Observation' : 'Add Observation'}</h3>
                    <form onSubmit={handleSubmitObservation}>
                      <div className="form-group">
                        <label>Label *</label>
                        <input
                          type="text"
                          value={obsFormData.label}
                          onChange={(e) =>
                            setObsFormData({ ...obsFormData, label: e.target.value })
                          }
                          placeholder="e.g., Wheel Alignment"
                          required
                        />
                      </div>

                      {!editingObs && (
                        <div className="form-group">
                          <label>ID * (lowercase, no spaces)</label>
                          <input
                            type="text"
                            value={obsFormData.id}
                            onChange={(e) =>
                              setObsFormData({ ...obsFormData, id: e.target.value })
                            }
                            placeholder="e.g., wheel_alignment"
                            required
                          />
                        </div>
                      )}

                      <div className="form-group">
                        <label>Keyboard Shortcut *</label>
                        <input
                          type="text"
                          maxLength={1}
                          value={obsFormData.shortcut}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setObsFormData({ ...obsFormData, shortcut: value });
                          }}
                          placeholder="e.g., 7"
                          required
                        />
                      </div>

                      <div className="form-actions">
                        <button type="submit" className="btn-primary">
                          {editingObs ? 'Update' : 'Add'} Observation
                        </button>
                        {editingObs && (
                          <button type="button" className="btn-secondary" onClick={resetObsForm}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </>
                )}
              </div>

              {/* Existing items list */}
              <div className="cards-list-section glass-card">
                <h3>
                  {cardType === 'custom' && `Custom Cards (${customCards.length})`}
                  {cardType === 'qc-obs' && `QC Observations (${qcObservations.length})`}
                  {cardType === 'retouch-obs' &&
                    `Retouch Observations (${retouchObservations.length})`}
                </h3>

                <div className="cards-list">
                  {cardType === 'custom' && customCards.length === 0 && (
                    <p className="empty-state">No custom cards yet.</p>
                  )}
                  {cardType === 'custom' &&
                    customCards.map((card) => (
                      <div key={card.id} className="card-item">
                        <div className="card-info">
                          <h4>{card.title}</h4>
                          <p className="card-meta">
                            <span className="field-name">{card.fieldName}</span>
                            <span className="card-type">{card.type}</span>
                            {card.mandatory && <span className="mandatory-badge">Mandatory</span>}
                          </p>
                          {card.options && (
                            <p className="card-options">Options: {card.options.join(', ')}</p>
                          )}
                        </div>
                        <div className="card-actions">
                          <button
                            className="btn-icon"
                            onClick={() => handleEditCard(card)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDeleteCard(card.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}

                  {cardType === 'qc-obs' &&
                    qcObservations.map((obs) => (
                      <div key={obs.id} className="card-item">
                        <div className="card-info">
                          <h4>{obs.label}</h4>
                          <p className="card-meta">
                            <span className="field-name">ID: {obs.id}</span>
                            <span className="shortcut-badge">Key: {obs.shortcut}</span>
                          </p>
                        </div>
                        <div className="card-actions">
                          <button
                            className="btn-icon"
                            onClick={() => handleEditObs(obs, 'qc-obs')}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDeleteObs(obs.id, 'qc-obs')}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}

                  {cardType === 'retouch-obs' &&
                    retouchObservations.map((obs) => (
                      <div key={obs.id} className="card-item">
                        <div className="card-info">
                          <h4>{obs.label}</h4>
                          <p className="card-meta">
                            <span className="field-name">ID: {obs.id}</span>
                            <span className="shortcut-badge">Key: {obs.shortcut}</span>
                          </p>
                        </div>
                        <div className="card-actions">
                          <button
                            className="btn-icon"
                            onClick={() => handleEditObs(obs, 'retouch-obs')}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDeleteObs(obs.id, 'retouch-obs')}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
          </div>
            </>
          )}

          {activeTab === 'colors' && (
          <div className="colors-tab">
            <h3>Colors & Effects</h3>

            <div className="effects-actions">
              <button
                className="effect-btn"
                onClick={() => {
                  setIsReorganizeMode(true);
                  onClose();
                }}
              >
                Reorganise Cards
              </button>
              <button
                className="effect-btn"
                onClick={() => {
                  if (onOpenAnalyticsDashboard) {
                    onOpenAnalyticsDashboard();
                  }
                  onClose();
                }}
              >
                View Analytics Dashboard
              </button>
              <button
                className="effect-btn"
                onClick={() => {
                  if (onOpenButtonEffects) {
                    onOpenButtonEffects();
                  }
                  onClose();
                }}
              >
                Button Effects
              </button>
            </div>

            <p className="info-text">
              Adjust colors and effects. Changes are applied immediately.
            </p>

            <div className="color-settings-grid">
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

            <div className="color-presets">
              <h4>Color Presets</h4>
              <div className="preset-buttons">
                <button
                  className="preset-btn"
                  onClick={() =>
                    updateColorSettings({
                      activeColor: '#ffae0c',
                      backgroundColor: '#ece9e9',
                      glassColor: '#8e8e8e',
                    })
                  }
                >
                  Default
                </button>
                <button
                  className="preset-btn"
                  onClick={() =>
                    updateColorSettings({
                      activeColor: '#FF9800',
                      backgroundColor: '#f5f5f5',
                      glassColor: '#9E9E9E',
                    })
                  }
                >
                  Green
                </button>
                <button
                  className="preset-btn"
                  onClick={() =>
                    updateColorSettings({
                      activeColor: '#FF5722',
                      backgroundColor: '#e3f2fd',
                      glassColor: '#90CAF9',
                    })
                  }
                >
                  Blue
                </button>
                <button
                  className="preset-btn"
                  onClick={() =>
                    updateColorSettings({
                      activeColor: '#FFC107',
                      backgroundColor: '#f3e5f5',
                      glassColor: '#CE93D8',
                    })
                  }
                >
                  Purple
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
        {activePanelModal && (
          <PanelConfigModal type={activePanelModal} onClose={() => setActivePanelModal(null)} />
        )}
        {editingCustomCard !== undefined && (
          <CustomCardModal
            card={editingCustomCard || undefined}
            onClose={() => setEditingCustomCard(undefined)}
          />
        )}
      </div>
    </div>
  );
};

// Export as UnifiedSettingsModal for backward compatibility and clarity
export const UnifiedSettingsModal = SettingsPanel;
