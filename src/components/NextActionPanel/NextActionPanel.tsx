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
  const [comment, setComment] = useState<string>('');
  const [showComment, setShowComment] = useState(false);

  const isCommentLabel = (label: string) =>
    label.toLowerCase().includes('comment');

  useEffect(() => {
    if (currentFilename) {
      const result = getResult(currentFilename);
      if (result) {
        setNextAction(result['Next Action'] || '');
        const commentValue = result['Next Action Comment'] || '';
        setComment(commentValue);
        const hasCommentOption = nextActionOptions.some((opt) =>
          isCommentLabel(opt.label)
        );
        setShowComment(hasCommentOption && (!!commentValue || showComment));
      } else {
        setNextAction('');
        setComment('');
        setShowComment(false);
      }
    } else {
      setNextAction('');
      setComment('');
      setShowComment(false);
    }
  }, [currentFilename, results, nextActionOptions]);

  const handleActionClick = (action: string, isComment?: boolean) => {
    if (isComment) {
      setShowComment((prev) => !prev);
      return;
    }

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

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newComment = e.target.value;
    setComment(newComment);

    if (currentFilename) {
      const result = getResult(currentFilename);
      if (result) {
        updateResult(currentFilename, {
          'Next Action Comment': newComment,
        });
        onUpdate();
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
          {nextActionOptions
            .filter((option) => option.label && option.label.trim())
            .map((option) => {
              const isComment = isCommentLabel(option.label);
              const isSelected = nextAction === option.label;
              const isCommentSelected = isComment && showComment;

              return (
                <button
                  key={option.id}
                  className={`next-action-btn ${
                    isComment
                      ? isCommentSelected
                        ? 'active'
                        : ''
                      : isSelected
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => handleActionClick(option.label, isComment)}
                >
                  [{option.shortcut}]: {option.label}
                </button>
              );
            })}
        </div>
        {nextActionOptions.some((opt) => isCommentLabel(opt.label)) && showComment && (
          <div style={{ marginTop: '12px' }}>
            <input
              type="text"
              placeholder="Enter next action comment..."
              value={comment}
              onChange={handleCommentChange}
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
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
