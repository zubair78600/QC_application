import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { CustomCard } from '../../types';
import './CustomCardPanel.css';

interface CustomCardPanelProps {
  card: CustomCard;
  currentFilename: string | null;
  onUpdate: () => void;
}

export const CustomCardPanel: React.FC<CustomCardPanelProps> = ({
  card,
  currentFilename,
  onUpdate
}) => {
  const { getResult, updateResult } = useAppStore();
  const [value, setValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isCommentMode, setIsCommentMode] = useState(false);

  const isCommentLabel = (label: string) => label.toLowerCase().includes('comment');
  const commentOption =
    card.options?.find((opt) => isCommentLabel(opt)) || null;

  // Load current value when filename changes
  useEffect(() => {
    if (currentFilename) {
      const result = getResult(currentFilename);
      if (result && result[card.fieldName]) {
        const savedValue = result[card.fieldName];
        if (card.type === 'multiselect') {
          const parts = savedValue.split(';').filter(Boolean);
          if (card.options && card.options.length > 0) {
            const optionSet = new Set(card.options);
            const opts: string[] = [];
            const comments: string[] = [];
            parts.forEach((p) => {
              if (optionSet.has(p)) {
                opts.push(p);
              } else {
                comments.push(p);
              }
            });
            setSelectedOptions(opts);
            if (comments.length > 0) {
              setIsCommentMode(true);
              setCommentText(comments.join('; '));
            } else {
              setIsCommentMode(false);
              setCommentText('');
            }
          } else {
            setSelectedOptions(parts);
            setIsCommentMode(false);
            setCommentText('');
          }
        } else {
          if (card.options && card.options.length > 0) {
            const optionSet = new Set(card.options);
            if (optionSet.has(savedValue)) {
              setValue(savedValue);
              setIsCommentMode(false);
              setCommentText('');
            } else {
              setValue('');
              setIsCommentMode(true);
              setCommentText(savedValue);
            }
          } else {
            setValue(savedValue);
            setIsCommentMode(false);
            setCommentText('');
          }
        }
      } else {
        setValue('');
        setSelectedOptions([]);
        setCommentText('');
        setIsCommentMode(false);
      }
    }
  }, [currentFilename, card.fieldName, card.type, card.options]);

  const saveFieldValue = (newValue: string) => {
    if (!currentFilename) return;
    const result = getResult(currentFilename);
    if (!result) return;
    updateResult(currentFilename, {
      ...result,
      [card.fieldName]: newValue,
    });
    onUpdate();
  };

  const handleTextChange = (newValue: string) => {
    setValue(newValue);
    saveFieldValue(newValue);
  };

  const handleSelectChange = (option: string) => {
    const isCommentOption = commentOption !== null && option === commentOption;

    if (isCommentOption) {
      setIsCommentMode(true);
      setValue('');
      if (!commentText) {
        saveFieldValue('');
      } else {
        saveFieldValue(commentText);
      }
    } else {
      setIsCommentMode(false);
      setCommentText('');
      setValue(option);
      saveFieldValue(option);
    }
  };

  const handleMultiSelectToggle = (option: string) => {
    const isCommentOption = commentOption !== null && option === commentOption;

    let newSelected: string[] = selectedOptions;
    if (isCommentOption) {
      setIsCommentMode((prev) => !prev);
    } else {
      if (selectedOptions.includes(option)) {
        newSelected = selectedOptions.filter((o) => o !== option);
      } else {
        newSelected = [...selectedOptions, option];
      }
      setSelectedOptions(newSelected);
    }

    const parts: string[] = [...newSelected];
    if (isCommentMode && commentText.trim()) {
      parts.push(commentText.trim());
    }
    saveFieldValue(parts.join(';'));
  };

  return (
    <div className="glass-card qc-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-title" style={{ padding: '5px 12px', fontWeight: 600, fontSize: '14px' }}>
        {card.title}: {card.mandatory && <span style={{ color: '#c62828', fontSize: '12px' }}>*</span>}
      </div>

      <div className="panel-content" style={{ padding: '10px 20px 20px 20px', flex: 1, overflow: 'hidden' }}>
        {card.type === 'text' && (
          <>
            {card.title.toLowerCase().includes('comment') ? (
              <textarea
                value={value}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={`Enter ${card.title.toLowerCase()}...`}
                className="custom-text-input"
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical',
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
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={`Enter ${card.title.toLowerCase()}...`}
                className="custom-text-input"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
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
            )}
          </>
        )}

        {card.type === 'select' && card.options && (
          <div className="qc-options">
            {card.options.map((option) => (
              <button
                key={option}
                className={`qc-btn ${
                  value === option ||
                  (isCommentMode && commentOption !== null && option === commentOption)
                    ? 'selected'
                    : ''
                }`}
                onClick={() => handleSelectChange(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {card.type === 'multiselect' && card.options && (
          <div className="qc-options" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {card.options.map((option) => (
              <button
                key={option}
                className={`qc-btn ${
                  selectedOptions.includes(option) ||
                  (isCommentMode && commentOption !== null && option === commentOption)
                    ? 'selected'
                    : ''
                }`}
                onClick={() => handleMultiSelectToggle(option)}
                style={{ minWidth: 'auto', flex: '0 1 auto' }}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {value && card.type === 'text' && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>
            Current: {value}
          </div>
        )}

        {selectedOptions.length > 0 && card.type === 'multiselect' && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>
            Selected: {selectedOptions.join(', ')}
          </div>
        )}

        {isCommentMode && commentOption && card.type !== 'text' && (
          <div style={{ marginTop: '8px' }}>
            <input
              type="text"
              placeholder={`Enter ${commentOption.toLowerCase()}...`}
              value={commentText}
              onChange={(e) => {
                const newComment = e.target.value;
                setCommentText(newComment);
                if (card.type === 'select') {
                  saveFieldValue(newComment);
                } else if (card.type === 'multiselect') {
                  const parts: string[] = [...selectedOptions];
                  if (newComment.trim()) {
                    parts.push(newComment.trim());
                  }
                  saveFieldValue(parts.join(';'));
                }
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
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
                `,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
