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
    title: '',
    fieldName: '',
    type: 'text' as 'text' | 'select' | 'multiselect',
    options: '',
    mandatory: false,
  });

  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title,
        fieldName: card.fieldName,
        type: card.type,
        options: card.options?.join(', ') || '',
        mandatory: card.mandatory,
      });
    } else {
      setFormData({
        title: '',
        fieldName: '',
        type: 'text',
        options: '',
        mandatory: false,
      });
    }
  }, [card]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCard: CustomCard = {
      id: card?.id || `custom_${Date.now()}`,
      title: formData.title,
      fieldName: formData.fieldName,
      type: formData.type,
      options:
        formData.type !== 'text'
          ? formData.options
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean)
          : undefined,
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
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Image Quality"
                required
              />
            </div>

            <div className="form-group">
              <label>Field Name *</label>
              <input
                type="text"
                value={formData.fieldName}
                onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                placeholder="e.g., Image_Quality"
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
                    type: e.target.value as 'text' | 'select' | 'multiselect',
                  })
                }
              >
                <option value="text">Text Input</option>
                <option value="select">Single Select</option>
                <option value="multiselect">Multi Select</option>
              </select>
            </div>

            {(formData.type === 'select' || formData.type === 'multiselect') && (
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

