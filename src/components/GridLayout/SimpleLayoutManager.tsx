import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Rnd } from 'react-rnd';
import { useAppStore } from '../../store/appStore';
import { QCPanel } from '../QCPanel/QCPanel';
import { RetouchPanel } from '../RetouchPanel/RetouchPanel';
import { NextActionPanel } from '../NextActionPanel/NextActionPanel';
import { CustomCardPanel } from '../CustomCardPanel/CustomCardPanel';
import './SimpleLayoutManager.css';

interface PanelPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

interface SimpleLayoutManagerProps {
  currentFilename: string | null;
  isDraggable: boolean;
  onUpdate: () => void;
  onAutoAdvance: () => void;
  focusedPanel?: 'qc' | 'retouch';
  onSaveLayout?: () => void;
  onResetLayout?: () => void;
}

// Expose layout functions
export interface LayoutManagerRef {
  saveLayout: () => void;
  resetLayout: () => void;
}

const SimpleLayoutManager = forwardRef<LayoutManagerRef, SimpleLayoutManagerProps>(({
  currentFilename,
  isDraggable,
  onUpdate,
  onAutoAdvance,
  focusedPanel = 'qc',
}, ref) => {
  const { customCards } = useAppStore();
  const [positions, setPositions] = useState<PanelPosition[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(1);

  // Initialize positions from localStorage or defaults
  useEffect(() => {
    const getDefaultPositions = (): PanelPosition[] => [
      {
        id: 'qc-panel',
        x: 20,
        y: 20,
        width: 350,
        height: 460,
        zIndex: 1,
      },
      {
        id: 'retouch-panel',
        x: 390,
        y: 20,
        width: 350,
        height: 460,
        zIndex: 1,
      },
      {
        id: 'next-action-panel',
        x: 760,
        y: 20,
        width: 300,
        height: 200,
        zIndex: 1,
      },
    ];

    const defaultPositions = getDefaultPositions();

    // Add custom cards
    customCards.forEach((card, index) => {
      defaultPositions.push({
        id: card.id,
        x: 20 + (index % 2) * 380,  // 2 columns instead of 3
        y: 440 + Math.floor(index / 2) * 220,  // Adjusted for 2 columns
        width: 350,
        height: 200,
        zIndex: 1,
      });
    });

    // Try to load saved positions
    const savedPositions = localStorage.getItem('qc-layout-positions');
    if (savedPositions) {
      try {
        const parsed = JSON.parse(savedPositions);
        // Merge saved positions with defaults for any missing panels
        const mergedPositions = defaultPositions.map(defaultPos => {
          const saved = parsed.find((p: PanelPosition) => p.id === defaultPos.id);
          return saved || defaultPos;
        });
        setPositions(mergedPositions);
      } catch (error) {
        console.warn('Failed to parse saved layout positions:', error);
        setPositions(defaultPositions);
      }
    } else {
      setPositions(defaultPositions);
    }
  }, [customCards]);

  const updatePosition = (id: string, updates: Partial<PanelPosition>) => {
    setPositions(prev => {
      const newPositions = prev.map(pos =>
        pos.id === id ? { ...pos, ...updates } : pos
      );
      // Auto-save positions when they change
      localStorage.setItem('qc-layout-positions', JSON.stringify(newPositions));
      return newPositions;
    });
  };

  const saveLayout = () => {
    localStorage.setItem('qc-layout-positions', JSON.stringify(positions));
  };

  const resetLayout = () => {
    localStorage.removeItem('qc-layout-positions');
    // Trigger re-initialization with defaults
    const defaultPositions: PanelPosition[] = [
      {
        id: 'qc-panel',
        x: 20,
        y: 20,
        width: 350,
        height: 460,
        zIndex: 1,
      },
      {
        id: 'retouch-panel',
        x: 390,
        y: 20,
        width: 350,
        height: 460,
        zIndex: 1,
      },
      {
        id: 'next-action-panel',
        x: 760,
        y: 20,
        width: 300,
        height: 200,
        zIndex: 1,
      },
    ];

    // Add custom cards
    customCards.forEach((card, index) => {
      defaultPositions.push({
        id: card.id,
        x: 20 + (index % 2) * 380,  // 2 columns instead of 3
        y: 440 + Math.floor(index / 2) * 220,  // Adjusted for 2 columns
        width: 350,
        height: 200,
        zIndex: 1,
      });
    });

    setPositions(defaultPositions);
  };

  const bringToFront = (id: string) => {
    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);
    updatePosition(id, { zIndex: newZIndex });
  };

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    saveLayout,
    resetLayout,
  }));

  const renderComponent = (id: string) => {
    switch (id) {
      case 'qc-panel':
        return <QCPanel currentFilename={currentFilename} onUpdate={onUpdate} isFocused={focusedPanel === 'qc'} />;
      case 'retouch-panel':
        return <RetouchPanel currentFilename={currentFilename} onUpdate={onUpdate} onAutoAdvance={onAutoAdvance} isFocused={focusedPanel === 'retouch'} />;
      case 'next-action-panel':
        return <NextActionPanel currentFilename={currentFilename} onUpdate={onUpdate} onAutoAdvance={onAutoAdvance} />;
      default:
        const customCard = customCards.find(card => card.id === id);
        if (customCard) {
          return <CustomCardPanel card={customCard} currentFilename={currentFilename} onUpdate={onUpdate} />;
        }
        return null;
    }
  };

  return (
    <div className="simple-layout-container">
      {positions.map((position) => (
        <Rnd
          key={position.id}
          size={{ width: position.width, height: position.height }}
          position={{ x: position.x, y: position.y }}
          onDragStop={(_e, d) => {
            updatePosition(position.id, { x: d.x, y: d.y });
          }}
          onResizeStop={(_e, _direction, ref, _delta, newPosition) => {
            updatePosition(position.id, {
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height),
              x: newPosition.x,
              y: newPosition.y,
            });
          }}
          onMouseDown={() => bringToFront(position.id)}
          disableDragging={!isDraggable}
          enableResizing={isDraggable ? {
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true,
          } : false}
          dragHandleClassName={isDraggable ? 'panel-title' : ''}
          minWidth={100}
          minHeight={80}
          bounds="parent"
          className={`simple-panel ${isDraggable ? 'draggable' : ''}`}
          style={{
            zIndex: position.zIndex,
            // Ensure shadow is visible even when dragging/resizing
            overflow: 'visible'
          }}
        >
          <div className="simple-panel-wrapper">
            <div className="simple-panel-content">
              {renderComponent(position.id)}
            </div>
          </div>
        </Rnd>
      ))}
    </div>
  );
});

SimpleLayoutManager.displayName = 'SimpleLayoutManager';

export default SimpleLayoutManager;
