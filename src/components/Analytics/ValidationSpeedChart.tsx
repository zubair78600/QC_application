import React from 'react';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AnalyticsRecord } from '../../services/databaseService';
import { parse } from 'date-fns';

interface ValidationSpeedChartProps {
  records: AnalyticsRecord[];
}

interface SpeedRow {
  date: string;
  avgTimeSeconds: number;
}

export const ValidationSpeedChart: React.FC<ValidationSpeedChartProps> = ({ records }) => {
  const data: SpeedRow[] = React.useMemo(() => {
    const byDate = new Map<string, { sum: number; count: number }>();

    records.forEach((record) => {
      if (!record.qcDate || record.timeSpentSeconds == null) return;
      // Exclude breaks > 60 seconds
      if (record.timeSpentSeconds > 60) return;

      const parsed = parse(record.qcDate, 'dd/MM/yyyy HH:mm:ss', new Date());
      if (Number.isNaN(parsed.getTime())) return;
      const key = parsed.toISOString().slice(0, 10); // YYYY-MM-DD

      const bucket = byDate.get(key) || { sum: 0, count: 0 };
      bucket.sum += record.timeSpentSeconds;
      bucket.count += 1;
      byDate.set(key, bucket);
    });

    return Array.from(byDate.entries())
      .map(([date, { sum, count }]) => ({
        date,
        avgTimeSeconds: count > 0 ? sum / count : 0,
      }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [records]);

  if (data.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 16, marginTop: 16 }}>
        <h3 className="section-title">Validation Speed</h3>
        <p>No timing data yet.</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 16, marginTop: 16, height: '100%', boxSizing: 'border-box' }}>
      <h3 className="section-title">Average Time per Image (≤ 60s)</h3>
      <div style={{ width: '100%', height: 'calc(100% - 32px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="avgTimeSeconds" stroke="#2196F3" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
