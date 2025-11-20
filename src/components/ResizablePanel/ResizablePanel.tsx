import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import './ResizablePanel.css';

interface ResizablePanelProps {
  id: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number | string; height: number | string };
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  enableResizing?: boolean;
  enableDragging?: boolean;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  id,
  children,
  defaultPosition = { x: 0, y: 0 },
  defaultSize = { width: 400, height: 300 },
  minWidth = 300,
  minHeight = 200,
  maxWidth,
  maxHeight,
  className = '',
  enableResizing = true,
  enableDragging = true
}) => {
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem(`panel_${id}_position`);
    return saved ? JSON.parse(saved) : defaultPosition;
  });

  const [size, setSize] = useState(() => {
    const saved = localStorage.getItem(`panel_${id}_size`);
    return saved ? JSON.parse(saved) : defaultSize;
  });

  const handleDragStop = (_e: any, d: { x: number; y: number }) => {
    const newPosition = { x: d.x, y: d.y };
    setPosition(newPosition);
    localStorage.setItem(`panel_${id}_position`, JSON.stringify(newPosition));
  };

  const handleResizeStop = (
    _e: any,
    _direction: any,
    ref: HTMLElement,
    _delta: any,
    position: { x: number; y: number }
  ) => {
    const newSize = {
      width: ref.style.width,
      height: ref.style.height
    };
    const newPosition = { x: position.x, y: position.y };

    setSize(newSize);
    setPosition(newPosition);

    localStorage.setItem(`panel_${id}_size`, JSON.stringify(newSize));
    localStorage.setItem(`panel_${id}_position`, JSON.stringify(newPosition));
  };

  return (
    <Rnd
      size={size}
      position={position}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      minWidth={minWidth}
      minHeight={minHeight}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      disableDragging={!enableDragging}
      enableResizing={enableResizing ? {
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true
      } : false}
      className={`resizable-panel ${className}`}
      dragHandleClassName="drag-handle"
      bounds="parent"
    >
      <div className="panel-content">
        {children}
      </div>
    </Rnd>
  );
};
