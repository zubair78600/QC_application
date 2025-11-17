import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import './NextActionPanel.css';

interface NextActionPanelProps {
  currentFilename: string | null;
  onUpdate: () => void;
  onAutoAdvance: () => void;
}

export const NextActionPanel: React.FC<NextActionPanelProps> = ({
  currentFilename,
  onUpdate,
  onAutoAdvance
}) => {
  const { getResult, updateResult, nextActionOptions, results } = useAppStore();
  const [nextAction, setNextAction] = useState<string>('');

  useEffect(() => {
    if (currentFilename) {
      const result = getResult(currentFilename);
      if (result) {
        setNextAction(result['Next Action'] || '');
      } else {
        setNextAction('');
      }
    } else {
      setNextAction('');
    }
  }, [currentFilename, results]);

  const handleActionClick = (action: string) => {
    const newAction = nextAction === action ? '' : action;
    setNextAction(newAction);

    if (currentFilename) {
      updateResult(currentFilename, { 'Next Action': newAction as "" | "Retake" | "Retouch" | "Ignore" | "Blunder" });
      onUpdate();

      // Auto-advance after selecting Next Action if all fields complete
      if (newAction) {
        setTimeout(() => {
          onAutoAdvance();
        }, 100);
      }
    }
  };

  return (
    <div className="glass-card next-action-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-title" style={{ padding: '5px 12px', fontWeight: 600, fontSize: '14px' }}>
        Next Action:
      </div>
      <div className="panel-content" style={{ padding: '10px 20px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="action-grid" style={{ display: 'flex', flexDirection: 'row', gap: '12px', flexWrap: 'wrap' }}>
          {nextActionOptions.map((option) => (
            <button
              key={option.id}
              className={`next-action-btn ${nextAction === option.label ? 'active' : ''}`}
              onClick={() => handleActionClick(option.label)}
            >
              [{option.shortcut}]: {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
