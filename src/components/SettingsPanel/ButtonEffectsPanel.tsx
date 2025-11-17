import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import './SettingsPanel.css';

interface ButtonEffectsPanelProps {
  onClose: () => void;
}

export const ButtonEffectsPanel: React.FC<ButtonEffectsPanelProps> = ({ onClose }) => {
  const { colorSettings, updateColorSettings } = useAppStore();
  const [initialSettings] = useState(colorSettings);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Initial placement near bottom center
  useEffect(() => {
    const approximateWidth = 360;
    const approximateHeight = 180;
    const left = Math.max(20, (window.innerWidth - approximateWidth) / 2);
    const top = Math.max(20, window.innerHeight - approximateHeight - 40);
    setPosition({ top, left });
  }, []);

  // Drag handling
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      const newLeft = event.clientX - dragOffset.x;
      const newTop = event.clientY - dragOffset.y;

      setPosition({
        top: Math.max(10, Math.min(window.innerHeight - 120, newTop)),
        left: Math.max(10, Math.min(window.innerWidth - 260, newLeft)),
      });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset.x, dragOffset.y]);

  const handleHeaderMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    // Do not start drag when clicking the close button
    if (target.closest('.button-effects-close')) {
      return;
    }

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    setIsDragging(true);
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handleExit = () => {
    updateColorSettings(initialSettings);
    onClose();
  };

  const handleSave = () => {
    onClose();
  };

  return (
    <div className="button-effects-overlay">
      <div
        ref={cardRef}
        className="button-effects-card glass-card"
        style={{ top: position.top, left: position.left }}
      >
        <div className="button-effects-header" onMouseDown={handleHeaderMouseDown}>
          <span className="button-effects-title">Button Effects</span>
          <button className="button-effects-close" onClick={handleExit} title="Exit without saving">
            ✕
          </button>
        </div>

        <div className="button-effects-body">
          <div className="shadow-control">
            <label>Opacity: {Math.round(colorSettings.shadowOpacity * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={colorSettings.shadowOpacity}
              onChange={(e) => updateColorSettings({ shadowOpacity: parseFloat(e.target.value) })}
              className="shadow-slider"
            />
          </div>

          <div className="shadow-control">
            <label>Blur: {colorSettings.shadowBlur}px</label>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={colorSettings.shadowBlur}
              onChange={(e) => updateColorSettings({ shadowBlur: parseInt(e.target.value, 10) })}
              className="shadow-slider"
            />
          </div>

          <div className="shadow-control">
            <label>Angle: {colorSettings.shadowAngle}°</label>
            <input
              type="range"
              min="0"
              max="360"
              step="15"
              value={colorSettings.shadowAngle}
              onChange={(e) => updateColorSettings({ shadowAngle: parseInt(e.target.value, 10) })}
              className="shadow-slider"
            />
          </div>

          <div className="shadow-control">
            <label>Card Corner Radius: {colorSettings.cardRadius}px</label>
            <input
              type="range"
              min="4"
              max="32"
              step="1"
              value={colorSettings.cardRadius}
              onChange={(e) => updateColorSettings({ cardRadius: parseInt(e.target.value, 10) })}
              className="shadow-slider"
            />
          </div>
        </div>

        <div className="button-effects-actions">
          <button className="button-effects-btn secondary" onClick={handleExit}>
            Exit
          </button>
          <button className="button-effects-btn primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
