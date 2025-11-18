import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import './UserNamesModal.css';

interface UserNamesModalProps {
  onClose: () => void;
}

export const UserNamesModal: React.FC<UserNamesModalProps> = ({ onClose }) => {
  const { qcNames, addQCName, deleteQCName, resetQCNames } = useAppStore();
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addQCName(trimmed);
    setNewName('');
  };

  const handleDelete = (name: string) => {
    if (confirm(`Remove "${name}" from user names?`)) {
      deleteQCName(name);
    }
  };

  const handleReset = () => {
    if (confirm('Reset user names to default list?')) {
      resetQCNames();
    }
  };

  return (
    <div className="usernames-overlay">
      <div className="glass-card usernames-card">
        <div className="usernames-header">
          <h2 className="startup-title" style={{ marginBottom: 0 }}>
            User Names
          </h2>
          <button
            className="button-effects-close"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        <p className="usernames-info">
          Add, remove, or reset the list of QC user names used when starting a session.
        </p>

        <div className="usernames-list">
          {qcNames.length === 0 && (
            <div className="usernames-empty">No names yet. Add a new name below.</div>
          )}
          {qcNames.map((name) => (
            <div key={name} className="usernames-item">
              <span className="usernames-item-label">{name}</span>
              <button
                className="usernames-delete-btn"
                onClick={() => handleDelete(name)}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        <div className="usernames-add-row">
          <input
            type="text"
            className="usernames-input"
            placeholder="Add new user name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <button className="btn-primary" type="button" onClick={handleAdd}>
            Add
          </button>
        </div>

        <div className="usernames-footer">
          <button className="btn-secondary" type="button" onClick={handleReset}>
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

