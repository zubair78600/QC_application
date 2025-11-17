import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AnalyticsRecord } from '../../services/databaseService';

interface NextActionDistributionProps {
  records: AnalyticsRecord[];
}

const COLORS = ['#FFC107', '#03A9F4', '#8BC34A', '#FF5722'];

export const NextActionDistribution: React.FC<NextActionDistributionProps> = ({ records }) => {
  const data = React.useMemo(() => {
    const counts = new Map<string, number>();

    records.forEach((record) => {
      const action = record.nextAction || 'None';
      counts.set(action, (counts.get(action) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [records]);

  if (data.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 16, marginTop: 16 }}>
        <h3 className="section-title">Next Action Distribution</h3>
        <p>No data yet.</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 16, marginTop: 16, height: '100%', boxSizing: 'border-box' }}>
      <h3 className="section-title">Next Action Distribution</h3>
      <div style={{ width: '100%', height: 'calc(100% - 32px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
