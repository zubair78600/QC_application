import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { CustomCard } from '../../types';
import './CustomCardPanel.css';

interface CustomCardPanelProps {
  card: CustomCard;
  currentFilename: string | null;
  onUpdate: () => void;
}

const isCommentLabel = (label: string) => label.toLowerCase().includes('comment');

export const CustomCardPanel: React.FC<CustomCardPanelProps> = ({
  card,
  currentFilename,
  onUpdate,
}) => {
  const { getResult, updateResult } = useAppStore();

  // Generic text/select/multiselect state
  const [textValue, setTextValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [selectComment, setSelectComment] = useState('');
  const [selectCommentMode, setSelectCommentMode] = useState(false);

  // Decision + observations state
  const [decision, setDecision] = useState('');
  const [obsSelected, setObsSelected] = useState<string[]>([]);
  const [obsComment, setObsComment] = useState('');

  const commentOption =
    card.options?.find((opt) => isCommentLabel(opt)) || null;

  const observationCommentOptions =
    card.observationOptions?.filter((opt) => isCommentLabel(opt)) || [];

  const getObsFieldName = () =>
    card.observationFieldName || `${card.fieldName}_Observations`;

  // Load state from current record
  useEffect(() => {
    if (!currentFilename) {
      setTextValue('');
      setSelectValue('');
      setMultiSelected([]);
      setSelectComment('');
      setSelectCommentMode(false);
      setDecision('');
      setObsSelected([]);
      setObsComment('');
      return;
    }

    const result = getResult(currentFilename);
    if (!result) {
      setTextValue('');
      setSelectValue('');
      setMultiSelected([]);
      setSelectComment('');
      setSelectCommentMode(false);
      setDecision('');
      setObsSelected([]);
      setObsComment('');
      return;
    }

    const raw = result[card.fieldName] || '';

    if (card.type === 'text') {
      setTextValue(raw);
      return;
    }

    if (card.type === 'select') {
      if (card.options && card.options.includes(raw)) {
        setSelectValue(raw);
        setSelectComment('');
        setSelectCommentMode(false);
      } else {
        setSelectValue('');
        setSelectComment(raw);
        setSelectCommentMode(!!raw);
      }
      return;
    }

    if (card.type === 'multiselect') {
      const parts = raw.split(';').filter(Boolean);
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
        setMultiSelected(opts);
        if (comments.length > 0) {
          setSelectComment(comments.join('; '));
          setSelectCommentMode(true);
        } else {
          setSelectComment('');
          setSelectCommentMode(false);
        }
      } else {
        setMultiSelected(parts);
        setSelectComment('');
        setSelectCommentMode(false);
      }
      return;
    }

    if (card.type === 'decision_observation') {
      setDecision(raw);
      const obsField = getObsFieldName();
      const obsRaw = result[obsField] || '';
      const parts = obsRaw.split(';').filter(Boolean);

      if (card.observationOptions && card.observationOptions.length > 0) {
        const optionSet = new Set(card.observationOptions);
        const opts: string[] = [];
        const comments: string[] = [];
        parts.forEach((p) => {
          if (optionSet.has(p)) {
            opts.push(p);
          } else {
            comments.push(p);
          }
        });
        setObsSelected(opts);
        setObsComment(comments.join('; '));
      } else {
        setObsSelected(parts);
        setObsComment('');
      }
    }
  }, [
    currentFilename,
    card.fieldName,
    card.type,
    card.options,
    card.observationOptions,
    card.observationFieldName,
    getResult,
  ]);

  const savePatch = (patch: Record<string, string>) => {
    if (!currentFilename) return;
    const result = getResult(currentFilename);
    if (!result) return;
    updateResult(currentFilename, patch);
    onUpdate();
  };

  // Handlers for basic types
  const handleTextChange = (newValue: string) => {
    setTextValue(newValue);
    savePatch({ [card.fieldName]: newValue });
  };

  const handleSelectChange = (option: string) => {
    const isComment = commentOption !== null && option === commentOption;

    if (isComment) {
      const newMode = !selectCommentMode;
      setSelectCommentMode(newMode);
      setSelectValue('');
      if (!newMode) {
        setSelectComment('');
        savePatch({ [card.fieldName]: '' });
      } else {
        savePatch({ [card.fieldName]: selectComment });
      }
    } else {
      setSelectCommentMode(false);
      setSelectComment('');
      const newValue = selectValue === option ? '' : option;
      setSelectValue(newValue);
      savePatch({ [card.fieldName]: newValue });
    }
  };

  const handleMultiToggle = (option: string) => {
    const isComment = commentOption !== null && option === commentOption;
    let next = multiSelected;

    if (isComment) {
      const newMode = !selectCommentMode;
      setSelectCommentMode(newMode);
      if (!newMode) {
        setSelectComment('');
      }
    } else {
      if (multiSelected.includes(option)) {
        next = multiSelected.filter((o) => o !== option);
      } else {
        next = [...multiSelected, option];
      }
      setMultiSelected(next);
    }

    const parts: string[] = [...next];
    if (selectCommentMode && selectComment.trim()) {
      parts.push(selectComment.trim());
    }
    savePatch({ [card.fieldName]: parts.join(';') });
  };

  // Handlers for decision + observations
  const saveDecisionAndObs = (newDecision: string, obsVals: string[], comment: string) => {
    const obsField = getObsFieldName();
    const parts: string[] = [...obsVals];
    if (comment.trim()) {
      parts.push(comment.trim());
    }
    savePatch({
      [card.fieldName]: newDecision,
      [obsField]: parts.join(';'),
    });
  };

  const handleDecisionClick = (option: string) => {
    const newDecision = decision === option ? '' : option;
    setDecision(newDecision);
    saveDecisionAndObs(newDecision, obsSelected, obsComment);
  };

  const handleObsToggle = (label: string) => {
    const isComment = observationCommentOptions.includes(label);
    let next = obsSelected;

    if (isComment) {
      if (obsSelected.includes(label)) {
        next = obsSelected.filter((o) => o !== label);
      } else {
        // ensure only one comment flag
        next = [...obsSelected.filter((o) => !observationCommentOptions.includes(o)), label];
      }
    } else {
      if (obsSelected.includes(label)) {
        next = obsSelected.filter((o) => o !== label);
      } else {
        next = [...obsSelected, label];
      }
    }

    setObsSelected(next);
    saveDecisionAndObs(decision, next, obsComment);
  };

  const handleObsCommentChange = (value: string) => {
    setObsComment(value);
    saveDecisionAndObs(decision, obsSelected, value);
  };

  const showObsComment =
    obsComment.trim().length > 0 ||
    obsSelected.some((o) => observationCommentOptions.includes(o));

  return (
    <div
      className="glass-card qc-panel"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div
        className="panel-title"
        style={{ padding: '5px 12px', fontWeight: 600, fontSize: '14px' }}
      >
        {card.title}: {card.mandatory && (
          <span style={{ color: '#c62828', fontSize: '12px' }}>*</span>
        )}
      </div>

      <div
        className="panel-content"
        style={{ padding: '10px 20px 20px 20px', flex: 1, overflow: 'hidden' }}
      >
        {/* Text input */}
        {card.type === 'text' && (
          <>
            {card.title.toLowerCase().includes('comment') ? (
              <textarea
                value={textValue}
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
                }}
              />
            ) : (
              <input
                type="text"
                value={textValue}
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
                }}
              />
            )}
          </>
        )}

        {/* Single select */}
        {card.type === 'select' && card.options && (
          <>
            <div className="qc-options">
              {card.options.map((option) => (
                <button
                  key={option}
                  className={`qc-btn ${
                    selectValue === option ||
                    (selectCommentMode && commentOption !== null && option === commentOption)
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() => handleSelectChange(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            {selectCommentMode && commentOption && (
              <div style={{ marginTop: '8px' }}>
                <input
                  type="text"
                  placeholder={`Enter ${commentOption.toLowerCase()}...`}
                  value={selectComment}
                  onChange={(e) => {
                    const newComment = e.target.value;
                    setSelectComment(newComment);
                    savePatch({ [card.fieldName]: newComment });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* Multi select */}
        {card.type === 'multiselect' && card.options && (
          <>
            <div
              className="qc-options"
              style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}
            >
              {card.options.map((option) => (
                <button
                  key={option}
                  className={`qc-btn ${
                    multiSelected.includes(option) ||
                    (selectCommentMode && commentOption !== null && option === commentOption)
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() => handleMultiToggle(option)}
                  style={{ minWidth: 'auto', flex: '0 1 auto' }}
                >
                  {option}
                </button>
              ))}
            </div>

            {selectCommentMode && commentOption && (
              <div style={{ marginTop: '8px' }}>
                <input
                  type="text"
                  placeholder={`Enter ${commentOption.toLowerCase()}...`}
                  value={selectComment}
                  onChange={(e) => {
                    const newComment = e.target.value;
                    setSelectComment(newComment);
                    const parts: string[] = [...multiSelected];
                    if (newComment.trim()) {
                      parts.push(newComment.trim());
                    }
                    savePatch({ [card.fieldName]: parts.join(';') });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* Decision + Observations card */}
        {card.type === 'decision_observation' && (
          <>
            <div className="card-section">
              <h3 className="section-title">Decision:</h3>
              <div className="button-group">
                {card.options?.map((option) => (
                  <button
                    key={option}
                    className={`btn-option ${decision === option ? 'btn-active' : ''}`}
                    onClick={() => handleDecisionClick(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-section" style={{ marginTop: '12px' }}>
              <h3 className="section-title">Observations:</h3>
              <div className="observation-grid">
                {card.observationOptions?.map((label) => {
                  const isSelected = obsSelected.includes(label);
                  return (
                    <button
                      key={label}
                      className={`obs-btn ${isSelected ? 'obs-active' : ''}`}
                      onClick={() => handleObsToggle(label)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {showObsComment && (
                <div style={{ width: '100%', marginTop: '8px' }}>
                  <input
                    type="text"
                    placeholder="Enter observations comment..."
                    value={obsComment}
                    onChange={(e) => handleObsCommentChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
