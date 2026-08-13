import { motion } from 'framer-motion';
import type { SiteHistoryLayer } from '../types';
import { useState } from 'react';

interface UptimeHeatmapProps {
  history: SiteHistoryLayer;
  days?: number;
  title?: string;
}

interface DayData {
  date: Date;
  uptime: number | null;
  checks: number;
  status: 'UP' | 'DEGRADED' | 'DOWN' | 'NO_DATA';
}

export function UptimeHeatmap({ history, days = 30, title }: UptimeHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  // Prepare data for heatmap
  const daysData: DayData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    
    const dayChecks = history.checks.filter(c => 
      new Date(c.timestamp).toDateString() === dateStr
    );
    
    let uptime: number | null = null;
    let status: DayData['status'] = 'NO_DATA';
    
    if (dayChecks.length > 0) {
      const upChecks = dayChecks.filter(c => c.status === 'UP').length;
      const degradedChecks = dayChecks.filter(c => c.status === 'DEGRADED').length;
      uptime = (upChecks / dayChecks.length) * 100;
      
      if (uptime === 100) status = 'UP';
      else if (uptime >= 95) status = 'DEGRADED';
      else status = 'DOWN';
    }
    
    daysData.push({
      date,
      uptime,
      checks: dayChecks.length,
      status
    });
  }

  // Group by weeks for display
  const weeks: DayData[][] = [];
  for (let i = 0; i < daysData.length; i += 7) {
    weeks.push(daysData.slice(i, i + 7));
  }

  const avgUptime = daysData.filter(d => d.uptime !== null).reduce((acc, d) => acc + (d.uptime || 0), 0) / 
                    daysData.filter(d => d.uptime !== null).length;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-5)',
    }}>
      {title && (
        <h3 style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--font-semibold)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)'
        }}>
          {title}
        </h3>
      )}

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-6)',
        marginBottom: 'var(--space-4)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)',
      }}>
        <span>
          <span style={{ color: 'var(--text)' }}>30-day avg:</span>{' '}
          <span style={{ fontFamily: 'var(--mono)', color: avgUptime === 100 ? 'var(--up)' : avgUptime >= 95 ? 'var(--degraded)' : 'var(--down)' }}>
            {avgUptime?.toFixed(1) || 'N/A'}%
          </span>
        </span>
        <span>
          <span style={{ color: 'var(--text)' }}>Checks:</span>{' '}
          <span style={{ fontFamily: 'var(--mono)' }}>
            {daysData.reduce((acc, d) => acc + d.checks, 0)}
          </span>
        </span>
      </div>

      {/* Heatmap */}
      <div style={{ overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-1)', minWidth: 'fit-content' }}>
          {/* Day labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginRight: 'var(--space-2)', justifyContent: 'space-around', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', minWidth: 20 }}>
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
            <span>S</span>
          </div>

          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {week.map((day, dayIdx) => {
                const bgColor = day.status === 'UP' ? 'var(--up)' :
                               day.status === 'DEGRADED' ? 'var(--degraded)' :
                               day.status === 'DOWN' ? 'var(--down)' :
                               'var(--bg-elevated)';
                
                const glow = day.status === 'UP' ? 'var(--up-glow)' :
                            day.status === 'DEGRADED' ? 'var(--degraded-glow)' :
                            day.status === 'DOWN' ? 'var(--down-glow)' : 'transparent';

                return (
                  <motion.div
                    key={day.date.toISOString()}
                    whileHover={{ scale: 1.5, zIndex: 10 }}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: bgColor,
                      boxShadow: day.status !== 'NO_DATA' ? `0 0 6px ${glow}` : 'none',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    title={`${day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${day.uptime?.toFixed(1) || 'No data'}% uptime (${day.checks} checks)`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        marginTop: 'var(--space-4)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)',
        flexWrap: 'wrap'
      }}>
        <span>Legend:</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--up)' }} />
          100% Uptime
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--degraded)' }} />
          95-99%
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--down)' }} />
          &lt;95%
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--bg-elevated)' }} />
          No data
        </span>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          style={{
            position: 'absolute',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-2) var(--space-3)',
            fontSize: 'var(--text-xs)',
            pointerEvents: 'none',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            marginTop: 'var(--space-2)'
          }}
        >
          <div style={{ fontWeight: 'var(--font-semibold)', marginBottom: 2 }}>
            {hoveredDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            Uptime: <span style={{ 
              color: hoveredDay.status === 'UP' ? 'var(--up)' : 
                     hoveredDay.status === 'DEGRADED' ? 'var(--degraded)' : 
                     hoveredDay.status === 'DOWN' ? 'var(--down)' : 'var(--text-muted)',
              fontFamily: 'var(--mono)'
            }}>
              {hoveredDay.uptime?.toFixed(1) || 'N/A'}%
            </span>
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            Checks: <span style={{ fontFamily: 'var(--mono)' }}>{hoveredDay.checks}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Export for use in components
export const CompactUptimeHeatmap = (props: Omit<UptimeHeatmapProps, 'days'>) => (
  <UptimeHeatmap {...props} days={14} />
);
