import React, { useState } from 'react';
import './StartupModal.css';

interface StartupModalProps {
  qcNames: string[];
  wallpaper?: {
    mode?: string;
    source?: string | null;
  };
  wallpaperUrl?: string;
  onSelect: (name: string) => void;
}

export const StartupModal: React.FC<StartupModalProps> = ({
  qcNames,
  wallpaper,
  wallpaperUrl,
  onSelect,
}) => {
  const [selectedName, setSelectedName] = useState(qcNames[0] || '');

  const handleConfirm = () => {
    if (selectedName) {
      onSelect(selectedName);
    }
  };

  const isVideo = wallpaper?.mode === 'video' && wallpaperUrl;
  const isImage = wallpaperUrl && (!wallpaper?.mode || wallpaper.mode === 'image');

  return (
    <div 
      className="startup-overlay"
      style={isImage ? { backgroundImage: `url(${wallpaperUrl})` } : undefined}
    >
      {isVideo && (
        <video
          src={wallpaperUrl}
          autoPlay
          loop
          muted
          playsInline
          className="startup-wallpaper-video"
        />
      )}
      
      <div className="glass-card startup-card">
        <h3 className="startup-title">Select Your Name</h3>
        
        <select 
          className="glass-select startup-select"
          value={selectedName}
          onChange={(e) => setSelectedName(e.target.value)}
        >
          {qcNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <button 
          className="btn-option btn-active startup-button"
          onClick={handleConfirm}
        >
          OK
        </button>
      </div>
    </div>
  );
};
