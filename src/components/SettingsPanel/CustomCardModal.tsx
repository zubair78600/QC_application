import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { CustomCard } from '../../types';
import './SettingsPanel.css';

interface CustomCardModalProps {
  card?: CustomCard | null;
  onClose: () => void;
}

export const CustomCardModal: React.FC<CustomCardModalProps> = ({ card, onClose }) => {
  const { customCards, addCustomCard, updateCustomCard } = useAppStore();

  const [formData, setFormData] = useState({
    name: '',
    type: 'text' as 'text' | 'select' | 'multiselect' | 'decision_observation',
    options: '',
    observationOptions: '',
    mandatory: false,
  });

  useEffect(() => {
    if (card) {
      setFormData({
        name: card.title,
        type: card.type,
        options: card.options?.join(', ') || '',
        observationOptions: card.observationOptions?.join(', ') || '',
        mandatory: card.mandatory,
      });
    } else {
      setFormData({
        name: '',
        type: 'text',
        options: '',
        observationOptions: '',
        mandatory: false,
      });
    }
  }, [card]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const title = formData.name.trim();
    const generatedFieldName =
      card?.fieldName ||
      title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

    const newCard: CustomCard = {
      id: card?.id || `custom_${Date.now()}`,
      title,
      fieldName: generatedFieldName || `field_${Date.now()}`,
      type: formData.type,
      options:
        formData.type === 'text'
          ? undefined
          : formData.options
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean),
      observationOptions:
        formData.type === 'decision_observation'
          ? formData.observationOptions
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean)
          : undefined,
      observationFieldName:
        formData.type === 'decision_observation'
          ? `${generatedFieldName || `field_${Date.now()}`}_Observations`
          : card?.observationFieldName,
      mandatory: formData.mandatory,
      order: card?.order ?? customCards.length,
    };

    if (card) {
      updateCustomCard(card.id, newCard);
    } else {
      addCustomCard(newCard);
    }

    onClose();
  };

  return (
    <div className="panel-config-overlay">
      <div className="panel-config-card glass-card">
        <div className="panel-config-header">
          <h2>{card ? 'Edit Custom Card' : 'Add Custom Card'}</h2>
          <button className="panel-config-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="panel-config-section">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Image Quality"
                required
              />
            </div>

            <div className="form-group">
              <label>Type *</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as
                      | 'text'
                      | 'select'
                      | 'multiselect'
                      | 'decision_observation',
                  })
                }
              >
                <option value="text">Text Input</option>
                <option value="select">Single Select</option>
                <option value="multiselect">Multi Select</option>
                <option value="decision_observation">Decision + Observations</option>
              </select>
            </div>

            {(formData.type === 'select' ||
              formData.type === 'multiselect' ||
              formData.type === 'decision_observation') && (
              <div className="form-group">
                <label>Options *</label>
                <textarea
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  placeholder="Excellent, Good, Average, Poor"
                  rows={3}
                  required
                />
              </div>
            )}

            {formData.type === 'decision_observation' && (
              <div className="form-group">
                <label>Observation Options *</label>
                <textarea
                  value={formData.observationOptions}
                  onChange={(e) =>
                    setFormData({ ...formData, observationOptions: e.target.value })
                  }
                  placeholder="Outline, Shadow, Comment"
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.mandatory}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mandatory: e.target.checked,
                    })
                  }
                />
                <span>Mandatory Field</span>
              </label>
            </div>
          </div>

          <div className="panel-config-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {card ? 'Save' : 'Add Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
