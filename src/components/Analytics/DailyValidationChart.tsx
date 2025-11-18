import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AnalyticsRecord } from '../../services/databaseService';
import { format, getISOWeek, parse, startOfMonth, startOfWeek } from 'date-fns';

type Timeframe = 'day' | 'week' | 'month';

interface DailyValidationChartProps {
  records: AnalyticsRecord[];
  timeframe: Timeframe;
  periods: number;
}

interface DailyRow {
  key: string;
  label: string;
  totalValidated: number;
  baseValidated: number;
  retouchBlunder: number;
  percentage: number;
  time: number;
}

export const DailyValidationChart: React.FC<DailyValidationChartProps> = ({
  records,
  timeframe,
  periods,
}) => {
  const data: DailyRow[] = React.useMemo(() => {
    const buckets = new Map<string, DailyRow>();

    records.forEach((record) => {
      if (!record.qcDate || !record.qcDecision) return;
      const parsed = parse(record.qcDate, 'dd/MM/yyyy HH:mm:ss', new Date());
      if (Number.isNaN(parsed.getTime())) return;

      let bucketDate: Date;
      let label: string;

      if (timeframe === 'day') {
        bucketDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        label = format(bucketDate, 'dd MMM');
      } else if (timeframe === 'week') {
        bucketDate = startOfWeek(parsed, { weekStartsOn: 1 });
        const week = getISOWeek(parsed);
        label = `W${week} ${format(bucketDate, 'yyyy')}`;
      } else {
        bucketDate = startOfMonth(parsed);
        label = format(bucketDate, 'MMM yyyy');
      }

      const key = bucketDate.toISOString();
      const time = bucketDate.getTime();

      if (!buckets.has(key)) {
        buckets.set(key, {
          key,
          label,
          totalValidated: 0,
          baseValidated: 0,
          retouchBlunder: 0,
          percentage: 0,
          time,
        });
      }

      const row = buckets.get(key)!;
      row.totalValidated += 1;
      if (record.nextAction === 'Retouch' || record.nextAction === 'Blunder') {
        row.retouchBlunder += 1;
      }
    });

    const rows = Array.from(buckets.values()).sort((a, b) => a.time - b.time);
    const sliced = rows.slice(-periods);

    sliced.forEach((row) => {
      const nonRetouch = Math.max(row.totalValidated - row.retouchBlunder, 0);
      row.baseValidated = nonRetouch;
      row.percentage =
        row.totalValidated > 0 ? (row.retouchBlunder / row.totalValidated) * 100 : 0;
    });

    return sliced;
  }, [records, timeframe, periods]);

  if (data.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 16, marginTop: 16 }}>
        <h3 className="section-title">Validation & Retouch Trend</h3>
        <p>No analytics data yet.</p>
      </div>
    );
  }

  const firstLabel = data[0]?.label;
  const lastLabel = data[data.length - 1]?.label;
  const unitLabel = timeframe === 'day' ? 'Days' : timeframe === 'week' ? 'Weeks' : 'Months';

  return (
    <div className="glass-card" style={{ padding: 16, marginTop: 16, height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 className="section-title">Validation & Retouch Trend</h3>
        {firstLabel && lastLabel && (
          <span className="analytics-range-label">
            Last {data.length} {unitLabel}: {firstLabel} → {lastLabel}
          </span>
        )}
      </div>
      <div style={{ width: '100%', height: 'calc(100% - 32px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" />
            <YAxis
              yAxisId="left"
              allowDecimals={false}
              label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              label={{ value: '% Retouch+Blunder', angle: -90, position: 'insideRight' }}
            />
            <Tooltip
              formatter={(value: any, name: string) =>
                name === 'Retouch+Blunder %' ? `${(value as number).toFixed(1)}%` : value
              }
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="baseValidated"
              stackId="a"
              fill="#2196F3"
              name="Validated"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="retouchBlunder"
              stackId="a"
              fill="#FF9800"
              name="Retouch & Blunder"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="percentage"
              stroke="#F44336"
              strokeWidth={3}
              dot={{ r: 4, fill: '#F44336', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
              name="% Correction Trend"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
