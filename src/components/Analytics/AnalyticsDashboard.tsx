import React from 'react';
import { useAppStore } from '../../store/appStore';
import {
  AnalyticsRecord,
  AnalyticsSummary,
  getAnalyticsData,
  getAnalyticsRecords,
  loadAppSettings,
  saveAppSetting,
} from '../../services/databaseService';
import { Rnd } from 'react-rnd';
import { DailyValidationChart } from './DailyValidationChart';
import { ValidationSpeedChart } from './ValidationSpeedChart';
import { NextActionDistribution } from './NextActionDistribution';
import { ObservationPatterns } from './ObservationPatterns';
import { SessionStats } from './SessionStats';

interface AnalyticsDashboardProps {
  baseDirectory: string | null;
  onClose: () => void;
}

type PanelId = 'stats' | 'daily' | 'speed' | 'nextAction' | 'observations';

interface AnalyticsPanelPosition {
  id: PanelId;
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_ANALYTICS_LAYOUT: AnalyticsPanelPosition[] = [
  { id: 'stats', x: 7, y: 301, width: 557, height: 160 },
  { id: 'nextAction', x: 929, y: 291, width: 260, height: 260 },
  { id: 'daily', x: 8, y: 0, width: 556, height: 272 },
  { id: 'observations', x: 578, y: 289, width: 339, height: 265 },
  { id: 'speed', x: 581, y: 0, width: 604, height: 274 },
];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ baseDirectory, onClose }) => {
  const { qcName } = useAppStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<AnalyticsSummary | null>(null);
  const [records, setRecords] = React.useState<AnalyticsRecord[]>([]);
  const [positions, setPositions] = React.useState<AnalyticsPanelPosition[]>(DEFAULT_ANALYTICS_LAYOUT);
  const [isReorganizeMode, setIsReorganizeMode] = React.useState(false);
  const [selectedPanelId, setSelectedPanelId] = React.useState<PanelId | null>(null);
  const [timeframe, setTimeframe] = React.useState<'day' | 'week' | 'month'>('day');
  const [periodCount, setPeriodCount] = React.useState<number>(4);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!baseDirectory || !qcName) return;
      setIsLoading(true);
      setError(null);
      try {
        const [summaryData, recordsData] = await Promise.all([
          getAnalyticsData(baseDirectory, qcName),
          getAnalyticsRecords(baseDirectory, qcName),
        ]);
        setSummary(summaryData);
        setRecords(recordsData);
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [baseDirectory, qcName]);

  // Load saved analytics layout from database
  React.useEffect(() => {
    const loadLayout = async () => {
      if (!baseDirectory) return;
      try {
        const settings = await loadAppSettings();
        const saved = settings.analyticsLayout as AnalyticsPanelPosition[] | undefined;
        if (saved && Array.isArray(saved)) {
          setPositions(saved);
        }
      } catch (err) {
        console.error('Error loading analytics layout:', err);
      }
    };
    loadLayout();
  }, [baseDirectory]);

  const updatePosition = (id: PanelId, updates: Partial<AnalyticsPanelPosition>) => {
    setPositions((prev) => {
      const next = prev.map((pos) => (pos.id === id ? { ...pos, ...updates } : pos));
      // Persist layout to database
      saveAppSetting('analyticsLayout', next).catch((error) =>
        console.error('Error saving analytics layout to database:', error)
      );
      return next;
    });
  };

  const renderPanel = (id: PanelId, tf?: 'day' | 'week' | 'month', periods?: number) => {
    if (!summary) return null;
    switch (id) {
      case 'stats':
        return <SessionStats summary={summary} />;
      case 'daily':
        return (
          <DailyValidationChart
            records={records}
            timeframe={tf ?? 'day'}
            periods={periods ?? 4}
          />
        );
      case 'speed':
        return <ValidationSpeedChart records={records} />;
      case 'nextAction':
        return <NextActionDistribution records={records} />;
      case 'observations':
        return <ObservationPatterns records={records} />;
      default:
        return null;
    }
  };

  return (
    <div className="analytics-overlay">
      <div className="glass-card analytics-dashboard-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <h2 className="startup-title" style={{ marginBottom: 0, color: 'black' }}>
            Analytics Dashboard
          </h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className={`analytics-reorg-toggle ${isReorganizeMode ? 'active' : ''}`}
              onClick={() => setIsReorganizeMode((prev) => !prev)}
              title={isReorganizeMode ? 'Exit Reorganise Mode' : 'Reorganise & Resize Cards'}
            >
              ⤢
            </button>
            <button className="button-effects-close" onClick={onClose} title="Close analytics">
              ✕
            </button>
          </div>
        </div>

        {isLoading && <p>Loading analytics...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!isLoading && !error && (
          <div className="analytics-filters">
            <div className="analytics-timeframe-toggle">
              <button
                className={`analytics-tf-btn ${timeframe === 'day' ? 'active' : ''}`}
                onClick={() => setTimeframe('day')}
              >
                D
              </button>
              <button
                className={`analytics-tf-btn ${timeframe === 'week' ? 'active' : ''}`}
                onClick={() => setTimeframe('week')}
              >
                W
              </button>
              <button
                className={`analytics-tf-btn ${timeframe === 'month' ? 'active' : ''}`}
                onClick={() => setTimeframe('month')}
              >
                M
              </button>
            </div>
            <select
              className="analytics-period-select"
              value={periodCount}
              onChange={(e) => setPeriodCount(parseInt(e.target.value, 10))}
            >
              {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isLoading && !error && summary && (
          <div className="analytics-layout-container">
            {positions.map((panel) => (
              <Rnd
                key={panel.id}
                size={{ width: panel.width, height: panel.height }}
                position={{ x: panel.x, y: panel.y }}
                bounds="parent"
                disableDragging={!isReorganizeMode}
                enableResizing={isReorganizeMode}
                minWidth={260}
                minHeight={140}
                onDragStop={(_e, data) => {
                  updatePosition(panel.id, { x: data.x, y: data.y });
                }}
                onResizeStop={(_e, _dir, ref, _delta, pos) => {
                  updatePosition(panel.id, {
                    width: parseInt(ref.style.width, 10),
                    height: parseInt(ref.style.height, 10),
                    x: pos.x,
                    y: pos.y,
                  });
                }}
                onMouseDown={() => setSelectedPanelId(panel.id)}
              >
                <div
                  className={
                    'analytics-panel' +
                    (isReorganizeMode && selectedPanelId === panel.id ? ' analytics-panel-selected' : '')
                  }
                >
                  {panel.id === 'daily'
                    ? renderPanel('daily', timeframe, periodCount)
                    : renderPanel(panel.id)}
                </div>
              </Rnd>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
