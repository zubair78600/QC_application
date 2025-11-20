import React from 'react';
import { AnalyticsSummary } from '../../services/databaseService';

interface SessionStatsProps {
  summary: AnalyticsSummary;
}

export const SessionStats: React.FC<SessionStatsProps> = ({ summary }) => {
  const efficiency = summary.totalImages > 0 ? (summary.totalRight / summary.totalImages) * 100 : 0;

  return (
    <div className="cards-content-grid" style={{ marginBottom: 16 }}>
      <div className="glass-card" style={{ padding: 16 }}>
        <h3 className="section-title">Total Images</h3>
        <p style={{ fontSize: 24, fontWeight: 600 }}>{summary.totalImages}</p>
      </div>
      <div className="glass-card" style={{ padding: 16 }}>
        <h3 className="section-title">Right / Wrong</h3>
        <p style={{ fontSize: 20, fontWeight: 500 }}>
          {summary.totalRight} Right / {summary.totalWrong} Wrong
        </p>
      </div>
      <div className="glass-card" style={{ padding: 16 }}>
        <h3 className="section-title">Avg Time (≤ 60s)</h3>
        <p style={{ fontSize: 20, fontWeight: 500 }}>
          {summary.averageTimeSeconds != null ? `${summary.averageTimeSeconds.toFixed(1)}s` : 'N/A'}
        </p>
      </div>
      <div className="glass-card" style={{ padding: 16 }}>
        <h3 className="section-title">Efficiency</h3>
        <p style={{ fontSize: 20, fontWeight: 500 }}>{efficiency.toFixed(1)}%</p>
      </div>
    </div>
  );
};

