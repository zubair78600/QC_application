import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AnalyticsRecord } from '../../services/databaseService';

interface ObservationPatternsProps {
  records: AnalyticsRecord[];
}

interface ObservationRow {
  name: string;
  count: number;
}

export const ObservationPatterns: React.FC<ObservationPatternsProps> = ({ records }) => {
  const data: ObservationRow[] = React.useMemo(() => {
    const counts = new Map<string, number>();

    records.forEach((record) => {
      if (!record.qcObservations) return;
      const parts = record.qcObservations.split(';').map((p) => p.trim()).filter(Boolean);
      for (const obs of parts) {
        if (obs === 'Comment') continue;
        counts.set(obs, (counts.get(obs) || 0) + 1);
      }
    });

    const rows = Array.from(counts.entries()).map(([name, count]) => ({ name, count }));

    // Show top 10 most common observations
    rows.sort((a, b) => b.count - a.count);
    return rows.slice(0, 10);
  }, [records]);

  if (data.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 16, marginTop: 16 }}>
        <h3 className="section-title">Observation Patterns</h3>
        <p>No observations recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 16, marginTop: 16, height: '100%', boxSizing: 'border-box' }}>
      <h3 className="section-title">Most Common QC Observations</h3>
      <div style={{ width: '100%', height: 'calc(100% - 32px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip />
            <Bar dataKey="count" fill="#9C27B0" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
