import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import type { SiteHistoryLayer } from '../types';

interface PerformanceChartProps {
  history: SiteHistoryLayer;
  title: string;
  showThreshold?: boolean;
  thresholdMs?: number;
}

interface ChartDataPoint {
  time: string;
  latency: number;
  status: string;
  index: number;
}

export function PerformanceChart({ history, title, showThreshold = false, thresholdMs = 500 }: PerformanceChartProps) {
  // Prepare data
  const data: ChartDataPoint[] = history.checks.map((check, i) => ({
    time: new Date(check.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    latency: check.latencyMs ?? 0,
    status: check.status,
    index: i
  }));

  if (data.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-6)',
        textAlign: 'center',
        color: 'var(--text-muted)'
      }}>
        No check data available
      </div>
    );
  }

  // Calculate stats
  const latencies = data.map(d => d.latency).filter(v => v > 0);
  const avg = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const max = latencies.length > 0 ? Math.max(...latencies) : 0;
  const min = latencies.length > 0 ? Math.min(...latencies) : 0;
  const p95 = latencies.length > 0 
    ? latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)] 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-5)',
      }}
    >
      {/* Header with stats */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 'var(--space-4)'
      }}>
        <div>
          <h3 style={{ 
            fontSize: 'var(--text-lg)', 
            fontWeight: 'var(--font-semibold)',
            marginBottom: 'var(--space-1)'
          }}>
            {title}
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            Last 24 hours • {data.length} checks
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: 'var(--text-xs)' }}>Average</div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 'var(--font-semibold)', color: 'var(--text)' }}>
              {avg.toFixed(0)}ms
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: 'var(--text-xs)' }}>P95</div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 'var(--font-semibold)', color: 'var(--accent)' }}>
              {p95.toFixed(0)}ms
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: 'var(--text-xs)' }}>Max</div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 'var(--font-semibold)', color: max > thresholdMs ? 'var(--down)' : 'var(--up)' }}>
              {max.toFixed(0)}ms
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`perf-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10, fill: 'var(--text-dim)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            hide
            domain={[0, Math.max(max * 1.2, thresholdMs || 0)]}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-xs)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(0)}ms`,
              'Latency'
            ]}
            labelFormatter={(label) => `Time: ${label}`}
          />
          
          {/* Threshold line */}
          {showThreshold && thresholdMs && (
            <ReferenceLine 
              y={thresholdMs} 
              stroke="var(--degraded)" 
              strokeDasharray="3 3"
              label={{ 
                value: 'Threshold', 
                position: 'right', 
                fontSize: 10, 
                fill: 'var(--degraded)' 
              }}
            />
          )}
          
          <Area
            type="monotone"
            dataKey="latency"
            stroke="var(--accent)"
            fill={`url(#perf-${title.replace(/\s+/g, '-')})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ 
              r: 4, 
              stroke: 'var(--accent)', 
              strokeWidth: 2, 
              fill: 'var(--bg-card)' 
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Status indicators */}
      <div style={{ 
        display: 'flex', 
        gap: 'var(--space-4)', 
        marginTop: 'var(--space-3)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--up)' }} />
          Healthy (&lt;{thresholdMs}ms)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--degraded)' }} />
          Degraded
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--down)' }} />
          Down
        </span>
      </div>
    </motion.div>
  );
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-2) var(--space-3)',
      }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: 12, fontFamily: 'var(--mono)' }}>
          Latency: <span style={{ color: 'var(--accent)', fontWeight: 'var(--font-semibold)' }}>{data.latency}ms</span>
        </p>
        <p style={{ margin: 0, fontSize: 12 }}>
          Status: <span style={{ 
            color: data.status === 'UP' ? 'var(--up)' : 
                   data.status === 'DEGRADED' ? 'var(--degraded)' : 'var(--down)'
          }}>{data.status}</span>
        </p>
      </div>
    );
  }
  return null;
}
