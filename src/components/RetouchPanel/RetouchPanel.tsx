import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';

interface RetouchPanelProps {
  currentFilename: string | null;
  onUpdate: () => void;
  onAutoAdvance: () => void;
  isFocused?: boolean;
}

export const RetouchPanel: React.FC<RetouchPanelProps> = ({ currentFilename, onUpdate, onAutoAdvance, isFocused = false }) => {
  const { getResult, updateResult, retouchObservations, retouchDecisionOptions, results } = useAppStore();

  const [retouchQuality, setRetouchQuality] = useState<string>('');
  const [selectedObs, setSelectedObs] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const isCommentLabel = (label: string) =>
    label.toLowerCase().includes('comment');

  const standardObservationLabels = retouchObservations
    .map((obs) => obs.label)
    .filter((label) => !isCommentLabel(label));

  const commentObservationLabels = retouchObservations
    .map((obs) => obs.label)
    .filter((label) => isCommentLabel(label));

  useEffect(() => {
    if (currentFilename) {
      const result = getResult(currentFilename);
      if (result) {
        setRetouchQuality(result['Retouch Quality'] || '');
        const obs = result['Retouch Observations'] || '';
        const obsList = obs.split(';').filter((o) => o.trim());

        const standardObs = obsList.filter((o) =>
          standardObservationLabels.includes(o)
        );

        const commentLabels =
          commentObservationLabels.length > 0 ? commentObservationLabels : ['Comment'];

        const hasCommentFlag = obsList.some((o) => commentLabels.includes(o));

        const commentText = obsList
          .filter(
            (o) =>
              !standardObservationLabels.includes(o) && !commentLabels.includes(o)
          )
          .join('; ');

        const nextSelected = [...standardObs];
        if (hasCommentFlag || commentText.trim()) {
          nextSelected.push(commentLabels[0]);
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
    setRetouchQuality('');
    setSelectedObs([]);
    setComment('');
  };

  const handleQualityClick = (quality: string) => {
    const newQuality = retouchQuality === quality ? '' : quality;
    setRetouchQuality(newQuality);

    if (currentFilename) {
      updateResult(currentFilename, { 'Retouch Quality': newQuality as "" | "Good" | "Bad" });

      // Auto-behavior: Good quality sets Next Action to Ignore
      if (newQuality === 'Good') {
        updateResult(currentFilename, { 'Next Action': 'Ignore' });
        // Trigger auto-advance after a short delay
        setTimeout(() => {
          onAutoAdvance();
        }, 100);
      }

      onUpdate();
    }
  };

  const handleObservationClick = (obs: string) => {
    const commentLabels =
      commentObservationLabels.length > 0 ? commentObservationLabels : ['Comment'];
    const isComment = commentLabels.includes(obs);

    let newObs: string[];
    if (selectedObs.includes(obs)) {
      newObs = selectedObs.filter((o) => o !== obs);
    } else {
      if (isComment) {
        newObs = [
          ...selectedObs.filter((o) => !commentLabels.includes(o)),
          obs,
        ];
      } else {
        newObs = [...selectedObs, obs];
      }
    }
    setSelectedObs(newObs);

    if (currentFilename) {
      const obsString = newObs.join(';');
      updateResult(currentFilename, { 'Retouch Observations': obsString });
      onUpdate();
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newComment = e.target.value;
    setComment(newComment);

    if (currentFilename) {
      const commentLabels =
        commentObservationLabels.length > 0 ? commentObservationLabels : ['Comment'];

      const standardObs = selectedObs.filter(
        (o) => !commentLabels.includes(o)
      );

      const allObs = [...standardObs];

      if (selectedObs.some((o) => commentLabels.includes(o))) {
        allObs.push(commentLabels[0]);
      }

      if (newComment.trim()) {
        allObs.push(newComment);
      }

      const obsString = allObs.join(';');
      updateResult(currentFilename, { 'Retouch Observations': obsString });
      onUpdate();
    }
  };

  const commentLabels =
    commentObservationLabels.length > 0 ? commentObservationLabels : ['Comment'];
  const showComment = selectedObs.some((o) => commentLabels.includes(o));

  return (
    <div className="glass-card retouch-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-title" style={{ 
        padding: '5px 12px', 
        fontWeight: 600, 
        fontSize: '14px',
        color: isFocused ? '#4CAF50' : '#333',
        background: isFocused ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
        transition: 'all 0.2s ease'
      }}>
        Retouch Quality: {isFocused && '← FOCUSED'}
      </div>
      <div className="panel-content" style={{ padding: '10px 20px 20px 20px', flex: 1, overflow: 'hidden' }}>
        <div className="card-section">
          <div className="button-group">
            {retouchDecisionOptions.map((option) => (
              <button
                key={option.id}
                className={`btn-option ${retouchQuality === option.id ? 'btn-active' : ''}`}
                onClick={() => handleQualityClick(option.id)}
              >
                [{option.shortcut}]: {option.label}
              </button>
            ))}
          </div>
        </div>

      <div className="card-section">
        <h3 className="section-title">Retouch Observations:</h3>
        <div className="observation-grid">
          {retouchObservations.map((obs) => {
            const isComment = isCommentLabel(obs.label);
            const isSelected = selectedObs.includes(obs.label);

            if (isComment && showComment && isSelected) {
              return (
                <div key={obs.id} style={{ width: '100%', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Enter comment..."
                    value={comment}
                    onChange={handleCommentChange}
                    onBlur={() => {
                      if (!comment.trim()) {
                        const remaining = selectedObs.filter(
                          (o) => !commentLabels.includes(o)
                        );
                        setSelectedObs(remaining);
                        setComment('');
                        if (currentFilename) {
                          const obsString = remaining.join(';');
                          updateResult(currentFilename, { 'Retouch Observations': obsString });
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
              );
            }

            return (
              <button
                key={obs.id}
                className={`obs-btn ${isSelected ? 'obs-active' : ''}`}
                onClick={() => handleObservationClick(obs.label)}
              >
                [{obs.shortcut}]: {obs.label}
              </button>
            );
          })}
          {showComment && !retouchObservations.some((obs) => isCommentLabel(obs.label)) && (
            <div style={{ width: '100%', position: 'relative' }}>
              <input
                type="text"
                placeholder="Enter comment..."
                value={comment}
                onChange={handleCommentChange}
                onBlur={() => {
                  // Only remove Comment if input is empty after blur
                  if (!comment.trim()) {
                    const standardObs = selectedObs.filter(
                      (o) => !commentLabels.includes(o)
                    );
                    setSelectedObs(standardObs);
                    setComment('');
                    if (currentFilename) {
                      const obsString = standardObs.join(';');
                      updateResult(currentFilename, { 'Retouch Observations': obsString });
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
