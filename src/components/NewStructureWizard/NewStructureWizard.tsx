import React, { useState } from 'react';
import { AutoField } from '../../types';
import './NewStructureWizard.css';

interface NewStructureWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedFields: AutoField[]) => void;
  availableFields: AutoField[];
}

export const NewStructureWizard: React.FC<NewStructureWizardProps> = ({
  isOpen,
  onClose,
  onConfirm,
  availableFields,
}) => {
  const [selectedFields, setSelectedFields] = useState<AutoField[]>(
    // Pre-select always-included fields
    availableFields.filter(f => f.alwaysIncluded)
  );

  const handleToggleField = (field: AutoField) => {
    // Cannot toggle always-included fields
    if (field.alwaysIncluded) return;

    const isSelected = selectedFields.some(f => f.key === field.key);

    if (isSelected) {
      setSelectedFields(selectedFields.filter(f => f.key !== field.key));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const handleConfirm = () => {
    if (selectedFields.length === 0) {
      alert('Please select at least one field');
      return;
    }

    onConfirm(selectedFields);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="wizard-overlay">
      <div className="wizard-dialog">
        <div className="wizard-header">
          <h2>Create New Structure</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="wizard-content">
          <div className="warning-box">
            <span className="warning-icon">⚠️</span>
            <div>
              <strong>Warning:</strong> This will DELETE all existing panels and start fresh.
              You will need to create all panels from scratch.
            </div>
          </div>

          <div className="field-selection-section">
            <h3>Select Auto-Generated Fields</h3>
            <p className="section-description">
              These fields will be automatically included in your CSV export.
              Required fields (marked with *) cannot be disabled.
            </p>

            <div className="fields-list">
              {availableFields.map((field) => {
                const isSelected = selectedFields.some(f => f.key === field.key);
                const isDisabled = field.alwaysIncluded;

                return (
                  <label
                    key={field.key}
                    className={`field-checkbox ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => handleToggleField(field)}
                    />
                    <span className="field-label">
                      {field.label}
                      {field.alwaysIncluded && <span className="required-badge">*</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="next-steps-box">
            <h4>Next Steps:</h4>
            <ol>
              <li>After confirming, all existing panels will be deleted</li>
              <li>Use the "Add New Panel" button to create your custom panels</li>
              <li>Configure each panel with options, shortcuts, and sub-options</li>
              <li>Arrange panels using the settings interface</li>
            </ol>
          </div>
        </div>

        <div className="wizard-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-btn" onClick={handleConfirm}>
            Confirm & Delete All Panels
          </button>
        </div>
      </div>
    </div>
  );
};
