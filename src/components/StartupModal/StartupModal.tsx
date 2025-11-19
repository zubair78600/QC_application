import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import './StartupModal.css';

interface StartupModalProps {
  qcNames: string[];
  wallpaper?: {
    mode?: string;
    source?: string | null;
  };
  wallpaperUrl?: string;
  onSelect: (name: string) => void;
  onUpdateWallpaper?: (mode: 'default' | 'image' | 'video', source: string | null) => void;
}

export const StartupModal: React.FC<StartupModalProps> = ({
  qcNames,
  wallpaper,
  wallpaperUrl,
  onSelect,
  onUpdateWallpaper,
}) => {
  const [selectedName, setSelectedName] = React.useState(qcNames[0] || '');

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

      onUpdateWallpaper(isVideo ? 'video' : 'image', path);
    } catch (error) {
      console.error('Error selecting wallpaper:', error);
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

      {/* Wallpaper Settings Icon */}
      {onUpdateWallpaper && (
        <button
          className="startup-settings-btn"
          onClick={handleWallpaperChange}
          title="Change Wallpaper"
        >
          ⚙️
        </button>
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
