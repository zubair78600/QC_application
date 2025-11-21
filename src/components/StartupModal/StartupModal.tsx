import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import './StartupModal.css';

interface StartupModalProps {
  qcNames: string[];
  wallpaper?: {
    mode?: string;
    source?: string | null;
    scale?: number;
    fit?: boolean;
  };
  wallpaperUrl?: string;
  onSelect: (name: string) => void;
  onUpdateWallpaper?: (
    mode: 'default' | 'image' | 'video',
    source: string | null,
    scale?: number,
    fit?: boolean
  ) => void;
}

export const StartupModal: React.FC<StartupModalProps> = ({
  qcNames,
  wallpaper,
  wallpaperUrl,
  onSelect,
  onUpdateWallpaper,
}) => {
  const [selectedName, setSelectedName] = React.useState(qcNames[0] || '');
  const [showSettings, setShowSettings] = React.useState(false);

  // Local state for immediate UI feedback
  const [localScale, setLocalScale] = React.useState(wallpaper?.scale ?? 100);
  const [localFit, setLocalFit] = React.useState(wallpaper?.fit ?? true);

  // Sync local state with props when they change (e.g. on init)
  React.useEffect(() => {
    if (wallpaper?.scale !== undefined) setLocalScale(wallpaper.scale);
    if (wallpaper?.fit !== undefined) setLocalFit(wallpaper.fit);
  }, [wallpaper?.scale, wallpaper?.fit]);

  const handleConfirm = () => {
    if (selectedName) {
      onSelect(selectedName);
    }
  };

  const handleWallpaperChange = async () => {
    if (!onUpdateWallpaper) return;

    try {
      const selected = await open({
        multiple: false,
        title: 'Select Wallpaper Image or Video',
        filters: [
          {
            name: 'Media',
            extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'mp4', 'mov', 'webm'],
          },
        ],
      });

      if (!selected) return;

      const path = selected as string;
      const lower = path.toLowerCase();
      const isVideo = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm');

      onUpdateWallpaper(isVideo ? 'video' : 'image', path, localScale, localFit);
    } catch (error) {
      console.error('Error selecting wallpaper:', error);
    }
  };

  const commitSettings = (s: number, f: boolean) => {
    if (onUpdateWallpaper) {
      onUpdateWallpaper(
        (wallpaper?.mode || 'default') as 'default' | 'image' | 'video',
        wallpaper?.source || null,
        s,
        f
      );
    }
  };

  const handleFitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFit = e.target.checked;
    setLocalFit(newFit);
    commitSettings(localScale, newFit);
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = Number(e.target.value);
    setLocalScale(newScale);
  };

  const handleScaleCommit = () => {
    commitSettings(localScale, localFit);
  };

  const isVideoFile = wallpaperUrl?.toLowerCase().endsWith('.mp4') || wallpaperUrl?.toLowerCase().endsWith('.mov') || wallpaperUrl?.toLowerCase().endsWith('.webm');
  const isVideo = (wallpaper?.mode === 'video' || (wallpaper?.mode === 'default' && isVideoFile)) && wallpaperUrl;
  const isImage = wallpaperUrl && !isVideo;

  const mediaStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: localFit ? 'fill' : 'cover',
    transform: localFit ? 'none' : `scale(${localScale / 100})`,
    zIndex: -1,
    transition: 'transform 0.1s ease-out',
  };

  return (
    <div className="startup-overlay">
      {isImage && (
        <img
          src={wallpaperUrl}
          alt="Wallpaper"
          style={mediaStyle}
        />
      )}

      {isVideo && (
        <video
          src={wallpaperUrl}
          autoPlay
          loop
          muted
          playsInline
          className="startup-wallpaper-video"
          style={mediaStyle}
        />
      )}

      {/* Wallpaper Settings Icon */}
      {onUpdateWallpaper && (
        <div className="startup-settings-container">
          <button
            className={`startup-settings-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Wallpaper Settings"
          >
            ⚙️
          </button>

          {showSettings && (
            <div className="startup-settings-panel glass-card">
              <h4>Wallpaper Settings</h4>

              <div className="setting-row">
                <label>
                  <input
                    type="checkbox"
                    checked={localFit}
                    onChange={handleFitChange}
                  />
                  Fit to Screen
                </label>
              </div>

              <div className={`setting-row ${localFit ? 'disabled' : ''}`}>
                <label>Zoom: {localScale}%</label>
                <input
                  type="range"
                  min="100"
                  max="200"
                  value={localScale}
                  disabled={localFit}
                  onChange={handleScaleChange}
                  onMouseUp={handleScaleCommit}
                  onTouchEnd={handleScaleCommit}
                />
              </div>

              <button className="btn-secondary" onClick={handleWallpaperChange}>
                Choose Wallpaper
              </button>
            </div>
          )}
        </div>
      )}

      {!showSettings && (
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
      )}
    </div>
  );
};
