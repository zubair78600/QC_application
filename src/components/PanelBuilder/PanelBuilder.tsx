import React, { useState, useEffect } from 'react';
import { Panel, PanelOption, SubOption } from '../../types';
import './PanelBuilder.css';

interface PanelBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (panel: Panel) => void;
  editingPanel?: Panel | null;
}

export const PanelBuilder: React.FC<PanelBuilderProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPanel,
}) => {
  const [panelName, setPanelName] = useState('');
  const [panelType, setPanelType] = useState<'decision' | 'single' | 'multi' | 'text'>('single');
  const [csvColumn, setCsvColumn] = useState('');
  const [mandatory, setMandatory] = useState(false);
  const [options, setOptions] = useState<PanelOption[]>([]);

  // Initialize form with editing panel data
  useEffect(() => {
    if (editingPanel) {
      setPanelName(editingPanel.name);
      setPanelType(editingPanel.type);
      setCsvColumn(editingPanel.csvColumn);
      setMandatory(editingPanel.mandatory);
      setOptions(editingPanel.options || []);
    } else {
      // Reset form
      setPanelName('');
      setPanelType('single');
      setCsvColumn('');
      setMandatory(false);
      setOptions([]);
    }
  }, [editingPanel, isOpen]);

  const handleAddOption = () => {
    const newOption: PanelOption = {
      id: `option-${Date.now()}`,
      label: '',
      shortcut: '',
      hasSubOptions: false,
      subOptions: [],
      subOptionType: 'single',
    };
    setOptions([...options, newOption]);
  };

  const handleUpdateOption = (index: number, updates: Partial<PanelOption>) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    setOptions(newOptions);
  };

  const handleDeleteOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleAddSubOption = (optionIndex: number) => {
    const newOptions = [...options];
    const option = newOptions[optionIndex];

    if (!option.subOptions) {
      option.subOptions = [];
    }

    const newSubOption: SubOption = {
      id: `suboption-${Date.now()}`,
      label: '',
      shortcut: '',
    };

    option.subOptions.push(newSubOption);
    option.hasSubOptions = true;
    setOptions(newOptions);
  };

  const handleUpdateSubOption = (optionIndex: number, subIndex: number, updates: Partial<SubOption>) => {
    const newOptions = [...options];
    if (newOptions[optionIndex].subOptions) {
      newOptions[optionIndex].subOptions![subIndex] = {
        ...newOptions[optionIndex].subOptions![subIndex],
        ...updates,
      };
    }
    setOptions(newOptions);
  };

  const handleDeleteSubOption = (optionIndex: number, subIndex: number) => {
    const newOptions = [...options];
    if (newOptions[optionIndex].subOptions) {
      newOptions[optionIndex].subOptions = newOptions[optionIndex].subOptions!.filter((_, i) => i !== subIndex);

      // If no sub-options left, disable hasSubOptions
      if (newOptions[optionIndex].subOptions!.length === 0) {
        newOptions[optionIndex].hasSubOptions = false;
      }
    }
    setOptions(newOptions);
  };

  const handleSave = () => {
    // Validation
    if (!panelName.trim()) {
      alert('Please enter a panel name');
      return;
    }

    if (!csvColumn.trim()) {
      alert('Please enter a CSV column name');
      return;
    }

    if (panelType !== 'text' && options.length === 0) {
      alert('Please add at least one option');
      return;
    }

    // Validate shortcuts are unique
    const shortcuts = options.map(opt => opt.shortcut.toLowerCase()).filter(s => s);
    const duplicates = shortcuts.filter((s, i) => shortcuts.indexOf(s) !== i);
    if (duplicates.length > 0) {
      alert(`Duplicate shortcuts found: ${duplicates.join(', ')}`);
      return;
    }

    const panel: Panel = {
      id: editingPanel?.id || `panel-${Date.now()}`,
      name: panelName,
      type: panelType,
      mandatory,
      csvColumn,
      options: panelType === 'text' ? [] : options,
      order: editingPanel?.order || Date.now(),
    };

    onSave(panel);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="panel-builder-overlay">
      <div className="panel-builder-dialog">
        <div className="panel-builder-header">
          <h2>{editingPanel ? 'Edit Panel' : 'Create New Panel'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="panel-builder-content">
          {/* Basic Panel Info */}
          <div className="form-group">
            <label>Panel Name</label>
            <input
              type="text"
              value={panelName}
              onChange={(e) => setPanelName(e.target.value)}
              placeholder="e.g., QC Decision"
            />
          </div>

          <div className="form-group">
            <label>CSV Column Name</label>
            <input
              type="text"
              value={csvColumn}
              onChange={(e) => setCsvColumn(e.target.value)}
              placeholder="e.g., QC Decision"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Panel Type</label>
              <select value={panelType} onChange={(e) => setPanelType(e.target.value as any)}>
                <option value="decision">Decision (Right/Wrong, Good/Bad)</option>
                <option value="single">Single Select</option>
                <option value="multi">Multi Select</option>
                <option value="text">Text Input</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={mandatory}
                  onChange={(e) => setMandatory(e.target.checked)}
                />
                Mandatory Field
              </label>
            </div>
          </div>

          {/* Options (not for text type) */}
          {panelType !== 'text' && (
            <div className="options-section">
              <div className="section-header">
                <h3>Options</h3>
                <button className="add-btn" onClick={handleAddOption}>+ Add Option</button>
              </div>

              {options.map((option, optionIndex) => (
                <div key={option.id} className="option-card">
                  <div className="option-header">
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => handleUpdateOption(optionIndex, { label: e.target.value })}
                      placeholder="Option label"
                      className="option-label-input"
                    />
                    <input
                      type="text"
                      value={option.shortcut}
                      onChange={(e) => handleUpdateOption(optionIndex, { shortcut: e.target.value.toUpperCase() })}
                      placeholder="Key"
                      className="shortcut-input"
                      maxLength={1}
                    />
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteOption(optionIndex)}
                      title="Delete option"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Sub-options toggle */}
                  <div className="suboptions-controls">
                    <label>
                      <input
                        type="checkbox"
                        checked={option.hasSubOptions}
                        onChange={(e) => handleUpdateOption(optionIndex, { hasSubOptions: e.target.checked })}
                      />
                      Has Sub-options
                    </label>

                    {option.hasSubOptions && (
                      <>
                        <select
                          value={option.subOptionType || 'single'}
                          onChange={(e) => handleUpdateOption(optionIndex, { subOptionType: e.target.value as 'single' | 'multi' })}
                          className="suboption-type-select"
                        >
                          <option value="single">Single Select</option>
                          <option value="multi">Multi Select</option>
                        </select>

                        <button
                          className="add-suboption-btn"
                          onClick={() => handleAddSubOption(optionIndex)}
                        >
                          + Add Sub-option
                        </button>
                      </>
                    )}
                  </div>

                  {/* Sub-options list */}
                  {option.hasSubOptions && option.subOptions && option.subOptions.length > 0 && (
                    <div className="suboptions-list">
                      {option.subOptions.map((subOption, subIndex) => (
                        <div key={subOption.id} className="suboption-row">
                          <input
                            type="text"
                            value={subOption.label}
                            onChange={(e) => handleUpdateSubOption(optionIndex, subIndex, { label: e.target.value })}
                            placeholder="Sub-option label"
                            className="suboption-input"
                          />
                          <input
                            type="text"
                            value={subOption.shortcut}
                            onChange={(e) => handleUpdateSubOption(optionIndex, subIndex, { shortcut: e.target.value.toUpperCase() })}
                            placeholder="Key"
                            className="shortcut-input"
                            maxLength={1}
                          />
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteSubOption(optionIndex, subIndex)}
                            title="Delete sub-option"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel-builder-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>
            {editingPanel ? 'Save Changes' : 'Create Panel'}
          </button>
        </div>
      </div>
    </div>
  );
};
