import React, { useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Command } from '@tauri-apps/plugin-shell';
import './ImageViewer.css';

interface ImageViewerProps {
  imagePath: string | null;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ imagePath }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (imagePath) {
      console.log('ImageViewer: Raw imagePath:', imagePath);
      const src = convertFileSrc(imagePath);
      console.log('ImageViewer: Converted src:', src);
      setImageSrc(src);

      // Preload next image for performance (will implement in App.tsx)
    } else {
      setImageSrc(null);
    }
  }, [imagePath]);

  const handleImageClick = () => {
    setClickCount((prev) => prev + 1);

    if (clickTimer) {
      clearTimeout(clickTimer);
    }

    const timer = setTimeout(() => {
      if (clickCount + 1 === 3 && imagePath) {
        // Triple click: Open in default viewer
        openInDefaultViewer(imagePath);
      }
      setClickCount(0);
    }, 400);

    setClickTimer(timer);
  };

  const openInDefaultViewer = async (path: string) => {
    try {
      // Platform-specific open command
      const command = process.platform === 'darwin'
        ? Command.create('open', [path])
        : process.platform === 'win32'
        ? Command.create('cmd', ['/c', 'start', '', path])
        : Command.create('xdg-open', [path]);

      await command.execute();
    } catch (error) {
      console.error('Error opening image:', error);
    }
  };

  if (!imageSrc) {
    return (
      <div className="image-viewer-container glass-card">
        <div className="image-viewer-placeholder">
          <p>No image selected</p>
          <p className="placeholder-hint">Select a directory to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="image-viewer-container glass-card">
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={5}
        centerOnInit={true}
        doubleClick={{
          disabled: false,
          mode: 'reset',
        }}
      >
        {({ resetTransform }) => (
          <>
            <div className="image-controls">
              <button className="control-btn reset-btn" onClick={() => resetTransform()} title="Reset Zoom">
                ⟲
              </button>
            </div>
            <TransformComponent
              wrapperClass="transform-wrapper"
              contentClass="transform-content"
            >
              <img
                src={imageSrc}
                alt="QC Image"
                className="qc-image"
                onClick={handleImageClick}
                onError={(e) => {
                  console.error('ImageViewer: Failed to load image', imageSrc);
                  console.error('ImageViewer: Error event:', e);
                }}
                onLoad={() => {
                  console.log('ImageViewer: Image loaded successfully!');
                }}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};
