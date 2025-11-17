import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';

interface QCPanelProps {
  currentFilename: string | null;
  onUpdate: () => void;
  isFocused?: boolean;
}

export const QCPanel: React.FC<QCPanelProps> = ({ currentFilename, onUpdate, isFocused = false }) => {
  const { getResult, updateResult, qcObservations, results } = useAppStore();

  const [qcDecision, setQCDecision] = useState<string>('');
  const [selectedObs, setSelectedObs] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  // Load existing data when filename changes
  useEffect(() => {
    if (currentFilename) {
      const result = getResult(currentFilename);
      if (result) {
        setQCDecision(result['QC Decision'] || '');
        const obs = result['QC Observations'] || '';
        const obsList = obs.split(';').filter(o => o.trim());

        // Separate standard observations from custom comment
        const standardObs = obsList.filter(o =>
          ['Outline', 'Shadow', 'Perspective', 'License Plate', 'Background'].includes(o)
        );

        const hasCommentFlag = obsList.includes('Comment');

        // Extract comment text (anything that's not a standard observation or 'Comment' flag)
        const commentText = obsList.filter(
          o => !['Outline', 'Shadow', 'Perspective', 'License Plate', 'Background', 'Comment'].includes(o)
        ).join('; ');

        // Keep Comment field open if user selected Comment or there is existing text
        const nextSelected = [...standardObs];
        if (hasCommentFlag || commentText.trim()) {
          nextSelected.push('Comment');
        }
        setSelectedObs(nextSelected);

        setComment(commentText);
      } else {
        resetState();
      }
    } else {
      resetState();
    }
  }, [currentFilename, results]);

  const resetState = () => {
    setQCDecision('');
    setSelectedObs([]);
    setComment('');
  };

  const handleDecisionClick = (decision: string) => {
    const newDecision = qcDecision === decision ? '' : decision;
    setQCDecision(newDecision);

    if (currentFilename) {
      const update: { 'QC Decision': "" | "Right" | "Wrong"; 'QC Observations'?: string } = {
        'QC Decision': newDecision as "" | "Right" | "Wrong",
      };

      // If decision is Wrong, clear all QC observations and comment
      if (newDecision === 'Wrong') {
        setSelectedObs([]);
        setComment('');
        update['QC Observations'] = '';
      }

      updateResult(currentFilename, update);
      onUpdate();
    }
  };

  const handleObservationClick = (obs: string) => {
    // When QC Decision is Wrong, do not allow selecting observations
    if (qcDecision === 'Wrong') return;

    let newObs: string[];
    if (selectedObs.includes(obs)) {
      newObs = selectedObs.filter(o => o !== obs);
    } else {
      newObs = [...selectedObs, obs];
    }
    setSelectedObs(newObs);

    if (currentFilename) {
      const obsString = newObs.join(';');
      updateResult(currentFilename, { 'QC Observations': obsString });
      onUpdate();
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newComment = e.target.value;
    setComment(newComment);

    if (currentFilename) {
      // Keep only standard observations (not Comment flag or old comment text)
      const standardObs = selectedObs.filter(o =>
        ['Outline', 'Shadow', 'Perspective', 'License Plate', 'Background', 'Comment'].includes(o)
      );

      // Start with standard observations
      const allObs = [...standardObs];

      // Add the actual comment text if it has content
      if (newComment.trim()) {
        allObs.push(newComment);
      }

      const obsString = allObs.join(';');
      updateResult(currentFilename, { 'QC Observations': obsString });
      onUpdate();
    }
  };

  const showComment = selectedObs.includes('Comment');

  return (
    <div className="glass-card qc-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-title" style={{ 
        padding: '5px 12px', 
        fontWeight: 600, 
        fontSize: '14px',
        color: isFocused ? '#4CAF50' : '#333',
        background: isFocused ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
        transition: 'all 0.2s ease'
      }}>
        QC Decision: {isFocused && '← FOCUSED'}
      </div>
      <div className="panel-content" style={{ padding: '10px 20px 20px 20px', flex: 1, overflow: 'hidden' }}>
        <div className="card-section">
        <div className="button-group">
          <button
            className={`btn-option ${qcDecision === 'Right' ? 'btn-active' : ''}`}
            onClick={() => handleDecisionClick('Right')}
          >
            [Q]: Right
          </button>
          <button
            className={`btn-option ${qcDecision === 'Wrong' ? 'btn-active' : ''}`}
            onClick={() => handleDecisionClick('Wrong')}
          >
            [W]: Wrong
          </button>
        </div>
      </div>

      <div className="card-section">
        <h3 className="section-title">QC Observations:</h3>
        <div className="observation-grid">
          {qcObservations.slice(0, 5).map((obs) => (
            <button
              key={obs.id}
              className={`obs-btn ${selectedObs.includes(obs.label) ? 'obs-active' : ''}`}
              disabled={qcDecision === 'Wrong'}
              onClick={() => handleObservationClick(obs.label)}
            >
              [{obs.shortcut}]: {obs.label}
            </button>
          ))}
          {!showComment ? (
            <button
              className="obs-btn"
              disabled={qcDecision === 'Wrong'}
              onClick={() => handleObservationClick('Comment')}
            >
              [6]: Comment
            </button>
          ) : (
            <div style={{ width: '100%', position: 'relative' }}>
              <input
                type="text"
                placeholder="Enter comment..."
                value={comment}
                onChange={handleCommentChange}
                onBlur={() => {
                  // Only remove Comment if input is empty after blur
                  if (!comment.trim()) {
                    const standardObs = selectedObs.filter(o =>
                      ['Outline', 'Shadow', 'Perspective', 'License Plate', 'Background'].includes(o)
                    );
                    setSelectedObs(standardObs);
                    setComment('');
                    if (currentFilename) {
                      const obsString = standardObs.join(';');
                      updateResult(currentFilename, { 'QC Observations': obsString });
                      onUpdate();
                    }
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'color-mix(in srgb, var(--c-glass) 12%, transparent)',
                  backdropFilter: 'blur(8px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(8px) saturate(150%)',
                  color: '#333',
                  fontFamily: '"DM Sans", sans-serif',
                  boxShadow: `
                    inset 0 0 0 1px color-mix(in srgb, var(--c-light) 10%, transparent),
                    inset 1.8px 3px 0px -2px color-mix(in srgb, var(--c-light) 90%, transparent),
                    inset -2px -2px 0px -2px color-mix(in srgb, var(--c-light) 80%, transparent),
                    inset -3px -8px 1px -6px color-mix(in srgb, var(--c-light) 60%, transparent),
                    0px 1px 5px 0px color-mix(in srgb, var(--c-dark) 10%, transparent)
                  `
                }}
              />
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};
