import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { CustomCard } from '../../types';
import './SettingsPanel.css';

interface SettingsPanelProps {
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { customCards, addCustomCard, updateCustomCard, deleteCustomCard } = useAppStore();
  const [activeTab, setActiveTab] = useState<'custom-cards' | 'layout' | 'colors'>('custom-cards');
  const [editingCard, setEditingCard] = useState<CustomCard | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    fieldName: '',
    type: 'text' as 'text' | 'select' | 'multiselect',
    options: '',
    mandatory: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCard: CustomCard = {
      id: editingCard?.id || `custom_${Date.now()}`,
      title: formData.title,
      fieldName: formData.fieldName,
      type: formData.type,
      options: formData.type !== 'text' ? formData.options.split(',').map(o => o.trim()).filter(Boolean) : undefined,
      mandatory: formData.mandatory,
      order: editingCard?.order || customCards.length
    };

    if (editingCard) {
      updateCustomCard(editingCard.id, newCard);
    } else {
      addCustomCard(newCard);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      fieldName: '',
      type: 'text',
      options: '',
      mandatory: false
    });
    setEditingCard(null);
  };

  const handleEdit = (card: CustomCard) => {
    setEditingCard(card);
    setFormData({
      title: card.title,
      fieldName: card.fieldName,
      type: card.type,
      options: card.options?.join(', ') || '',
      mandatory: card.mandatory
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this custom card?')) {
      deleteCustomCard(id);
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === 'custom-cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom-cards')}
          >
            Custom Cards
          </button>
          <button
            className={`tab-btn ${activeTab === 'layout' ? 'active' : ''}`}
            onClick={() => setActiveTab('layout')}
          >
            Layout
          </button>
          <button
            className={`tab-btn ${activeTab === 'colors' ? 'active' : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            Colors
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'custom-cards' && (
            <div className="custom-cards-tab">
              <div className="form-section">
                <h3>{editingCard ? 'Edit Custom Card' : 'Add New Custom Card'}</h3>
                <form onSubmit={handleSubmit}>
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
                      placeholder="e.g., Image_Quality (no spaces)"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    >
                      <option value="text">Text Input</option>
                      <option value="select">Single Select</option>
                      <option value="multiselect">Multi Select</option>
                    </select>
                  </div>

                  {(formData.type === 'select' || formData.type === 'multiselect') && (
                    <div className="form-group">
                      <label>Options (comma-separated) *</label>
                      <textarea
                        value={formData.options}
                        onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                        placeholder="e.g., Excellent, Good, Average, Poor"
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
                        onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
                      />
                      <span>Mandatory Field</span>
                    </label>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      {editingCard ? 'Update Card' : 'Add Card'}
                    </button>
                    {editingCard && (
                      <button type="button" className="btn-secondary" onClick={resetForm}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="cards-list-section">
                <h3>Existing Custom Cards ({customCards.length})</h3>
                {customCards.length === 0 ? (
                  <p className="empty-state">No custom cards yet. Add one above!</p>
                ) : (
                  <div className="cards-list">
                    {customCards.map((card) => (
                      <div key={card.id} className="card-item">
                        <div className="card-info">
                          <h4>{card.title}</h4>
                          <p className="card-meta">
                            <span className="field-name">{card.fieldName}</span>
                            <span className="card-type">{card.type}</span>
                            {card.mandatory && <span className="mandatory-badge">Mandatory</span>}
                          </p>
                          {card.options && (
                            <p className="card-options">
                              Options: {card.options.join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="card-actions">
                          <button
                            className="btn-icon"
                            onClick={() => handleEdit(card)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(card.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="layout-tab">
              <h3>Layout Settings</h3>
              <p className="info-text">
                You can drag and resize panels directly in the main view.
                Your layout is automatically saved.
              </p>
              <button
                className="btn-primary"
                onClick={() => {
                  if (confirm('Reset all panels to default positions and sizes?')) {
                    // Clear all panel layout data from localStorage
                    Object.keys(localStorage)
                      .filter(key => key.startsWith('panel_'))
                      .forEach(key => localStorage.removeItem(key));
                    window.location.reload();
                  }
                }}
              >
                Reset Layout to Default
              </button>
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="colors-tab">
              <h3>Color Settings</h3>
              <p className="info-text">
                Observation color customization coming soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
