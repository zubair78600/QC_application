import React, { useState, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Command } from '@tauri-apps/plugin-shell';
import './ImageViewer.css';

interface ImageViewerProps {
  imagePath: string | null;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ imagePath }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (imagePath) {
      console.log('ImageViewer: Raw imagePath:', imagePath);
      const src = convertFileSrc(imagePath);
      console.log('ImageViewer: Converted src:', src);
      setImageSrc(src);
      // Force re-render of TransformWrapper to reset zoom/pan on image change
      setImageKey(prev => prev + 1);
    } else {
      setImageSrc(null);
    }
  }, [imagePath]);

  // Reset zoom when container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Force TransformWrapper to recalculate on resize
      setImageKey(prev => prev + 1);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (imagePath) {
      console.log('ImageViewer: Right-click detected, opening in system viewer');
      openInDefaultViewer(imagePath);
    }
  };

  const openInDefaultViewer = async (path: string) => {
    try {
      console.log('ImageViewer: Opening file in system viewer:', path);

      // Platform-specific open command
      let command;
      if (process.platform === 'darwin') {
        // macOS
        command = Command.create('open', [path]);
      } else if (process.platform === 'win32') {
        // Windows - use explorer.exe which handles spaces better
        command = Command.create('explorer', [path]);
      } else {
        // Linux
        command = Command.create('xdg-open', [path]);
      }

      const result = await command.execute();
      console.log('ImageViewer: System viewer opened successfully', result);
    } catch (error) {
      console.error('ImageViewer: Error opening image in system viewer:', error);
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
    <div className="image-viewer-container glass-card" ref={containerRef}>
      <TransformWrapper
        key={imageKey}
        initialScale={1}
        minScale={0.1}
        maxScale={5}
        centerOnInit={true}
        limitToBounds={false}
        doubleClick={{
          disabled: true, // Disable built-in double-click to use custom handler
        }}
      >
        {({ resetTransform }) => (
          <>
            <div className="image-controls">
              <button className="control-btn reset-btn" onClick={() => resetTransform()} title="Reset Zoom (or scroll to zoom)">
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
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  resetTransform();
                }}
                onContextMenu={handleContextMenu}
                onError={(e) => {
                  console.error('ImageViewer: Failed to load image', imageSrc);
                  console.error('ImageViewer: Error event:', e);
                }}
                onLoad={() => {
                  console.log('ImageViewer: Image loaded successfully!');
                }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};
