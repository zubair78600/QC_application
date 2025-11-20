import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import './SettingsPanel.css';

type PanelConfigType = 'qc' | 'retouch' | 'nextAction';

interface PanelConfigModalProps {
  type: PanelConfigType;
  onClose: () => void;
}

export const PanelConfigModal: React.FC<PanelConfigModalProps> = ({ type, onClose }) => {
  const {
    qcDecisionOptions,
    retouchDecisionOptions,
    updateQCDecisionOption,
    updateRetouchDecisionOption,
    qcObservations,
    retouchObservations,
    addQCObservation,
    updateQCObservation,
    deleteQCObservation,
    addRetouchObservation,
    updateRetouchObservation,
    deleteRetouchObservation,
    nextActionOptions,
    addNextActionOption,
    updateNextActionOption,
    deleteNextActionOption,
  } = useAppStore();

  const [newObs, setNewObs] = useState({ label: '', shortcut: '' });
  const [newAction, setNewAction] = useState({ label: '', shortcut: '' });

  const handleAddObservation = () => {
    if (!newObs.label.trim() || !newObs.shortcut.trim()) return;

    const idBase = newObs.label.trim().toLowerCase().replace(/\s+/g, '_');
    const obs = {
      id: idBase || `obs_${Date.now()}`,
      label: newObs.label.trim(),
      shortcut: newObs.shortcut.trim(),
    };

    if (type === 'qc') {
      addQCObservation(obs);
    } else if (type === 'retouch') {
      addRetouchObservation(obs);
    }

    setNewObs({ label: '', shortcut: '' });
  };

  const renderDecisionSettings = () => {
    if (type === 'qc') {
      return (
        <div className="panel-config-section">
          <h3>QC Decision Buttons</h3>
          <p className="info-text">
            Change the labels and keyboard shortcuts for QC decisions. Underlying values remain
            Right/Wrong for exports and analytics.
          </p>
          <div className="panel-config-list">
            {qcDecisionOptions.map((option) => (
              <div key={option.id} className="panel-config-row">
                <input
                  type="text"
                  className="panel-config-label-input"
                  value={option.label}
                  onChange={(e) =>
                    updateQCDecisionOption(option.id, { label: e.target.value })
                  }
                />
                <input
                  type="text"
                  maxLength={1}
                  className="panel-config-shortcut-input"
                  value={option.shortcut}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
                    updateQCDecisionOption(option.id, { shortcut: value });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'retouch') {
      return (
        <div className="panel-config-section">
          <h3>Retouch Quality Buttons</h3>
          <p className="info-text">
            Change the labels and keyboard shortcuts for Retouch Quality. Underlying values remain
            Good/Bad so existing rules keep working.
          </p>
          <div className="panel-config-list">
            {retouchDecisionOptions.map((option) => (
              <div key={option.id} className="panel-config-row">
                <input
                  type="text"
                  className="panel-config-label-input"
                  value={option.label}
                  onChange={(e) =>
                    updateRetouchDecisionOption(option.id, { label: e.target.value })
                  }
                />
                <input
                  type="text"
                  maxLength={1}
                  className="panel-config-shortcut-input"
                  value={option.shortcut}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
                    updateRetouchDecisionOption(option.id, { shortcut: value });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // No decision settings for Next Action
    return null;
  };

  const renderObservationSettings = () => {
    if (type !== 'qc' && type !== 'retouch') return null;

    const allObservations = type === 'qc' ? qcObservations : retouchObservations;
    const commentObservation = allObservations.find(
      (obs) => obs.id === 'comment' || obs.label === 'Comment'
    );
    const observations = allObservations.filter((obs) => obs !== commentObservation);
    const updateFn = type === 'qc' ? updateQCObservation : updateRetouchObservation;
    const deleteFn = type === 'qc' ? deleteQCObservation : deleteRetouchObservation;

    return (
      <div className="panel-config-section">
        <h3>{type === 'qc' ? 'QC Observations' : 'Retouch Observations'}</h3>
        <div className="panel-config-list">
          {observations.map((obs) => (
            <div key={obs.id} className="panel-config-row">
              <input
                type="text"
                className="panel-config-label-input"
                value={obs.label}
                onChange={(e) => updateFn(obs.id, { label: e.target.value })}
              />
              <input
                type="text"
                maxLength={1}
                className="panel-config-shortcut-input"
                value={obs.shortcut}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  updateFn(obs.id, { shortcut: value });
                }}
              />
              <button
                className="panel-config-delete"
                onClick={() => deleteFn(obs.id)}
                title="Delete observation"
              >
                🗑️
              </button>
            </div>
          ))}

          {commentObservation && (
            <div className="panel-config-row">
              <input
                type="text"
                className="panel-config-label-input"
                value={commentObservation.label}
                disabled
              />
              <input
                type="text"
                maxLength={1}
                className="panel-config-shortcut-input"
                value={commentObservation.shortcut}
                disabled
              />
            </div>
          )}

          <div className="panel-config-row panel-config-row-new">
            <input
              type="text"
              className="panel-config-label-input"
              placeholder="New observation label"
              value={newObs.label}
              onChange={(e) => setNewObs({ ...newObs, label: e.target.value })}
            />
            <input
              type="text"
              maxLength={1}
              className="panel-config-shortcut-input"
              placeholder="1"
              value={newObs.shortcut}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setNewObs({ ...newObs, shortcut: value });
              }}
            />
            <button className="panel-config-add" onClick={handleAddObservation}>
              +
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderNextActionSettings = () => {
    if (type !== 'nextAction') return null;

    return (
      <div className="panel-config-section">
        <h3>Next Action Options</h3>
        <p className="info-text">
          Add, rename, delete and re-key Next Action buttons. Any non-empty label is accepted.
        </p>
        <div className="panel-config-list">
          {nextActionOptions.map((option) => (
            <div key={option.id} className="panel-config-row">
              <input
                type="text"
                className="panel-config-label-input"
                value={option.label}
                onChange={(e) =>
                  updateNextActionOption(option.id, { label: e.target.value })
                }
              />
              <input
                type="text"
                maxLength={1}
                className="panel-config-shortcut-input"
                value={option.shortcut}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
                  updateNextActionOption(option.id, { shortcut: value });
                }}
              />
              <button
                className="panel-config-delete"
                onClick={() => deleteNextActionOption(option.id)}
                title="Delete action"
              >
                🗑️
              </button>
            </div>
          ))}
          <div className="panel-config-row panel-config-row-new">
            <input
              type="text"
              className="panel-config-label-input"
              placeholder="New action label"
              value={newAction.label}
              onChange={(e) => setNewAction({ ...newAction, label: e.target.value })}
            />
            <input
              type="text"
              maxLength={1}
              className="panel-config-shortcut-input"
              placeholder="A"
              value={newAction.shortcut}
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
                setNewAction({ ...newAction, shortcut: value });
              }}
            />
            <button
              className="panel-config-add"
              onClick={() => {
                if (!newAction.label.trim() || !newAction.shortcut.trim()) return;
                const idBase = newAction.label.trim().toLowerCase().replace(/\s+/g, '_');
                addNextActionOption({
                  id: idBase || `action_${Date.now()}`,
                  label: newAction.label.trim(),
                  shortcut: newAction.shortcut.trim(),
                });
                setNewAction({ label: '', shortcut: '' });
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  };

  const title =
    type === 'qc'
      ? 'QC Panel Settings'
      : type === 'retouch'
      ? 'Retouch Panel Settings'
      : 'Next Action Panel Settings';

  return (
    <div className="panel-config-overlay">
      <div className="panel-config-card glass-card">
        <div className="panel-config-header">
          <h2>{title}</h2>
          <button className="panel-config-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {renderDecisionSettings()}
        {renderObservationSettings()}
        {renderNextActionSettings()}

        <div className="panel-config-footer">
          <button className="btn-secondary" onClick={onClose}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
