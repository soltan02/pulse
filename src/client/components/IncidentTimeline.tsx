import { motion } from 'framer-motion';
import type { IncidentItem } from '../types';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface IncidentTimelineProps {
  incidents: IncidentItem[];
  maxHeight?: number;
}

export function IncidentTimeline({ incidents, maxHeight = 400 }: IncidentTimelineProps) {
  if (incidents.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 'var(--space-10)',
        color: 'var(--text-muted)'
      }}>
        <CheckCircle2 size={40} color="var(--up)" style={{ margin: '0 auto 16px' }} />
        <p>No incidents recorded</p>
      </div>
    );
  }

  // Group by date
  const grouped = incidents.reduce((acc, incident) => {
    const date = new Date(incident.startedAt).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(incident);
    return acc;
  }, {} as Record<string, IncidentItem[]>);

  const dates = Object.keys(grouped);

  return (
    <div style={{
      position: 'relative',
      paddingLeft: 'var(--space-6)',
      maxHeight: maxHeight,
      overflowY: 'auto',
      paddingRight: 'var(--space-2)'
    }}>
      {/* Timeline line */}
      <div style={{
        position: 'absolute',
        left: 8,
        top: 0,
        bottom: 0,
        width: 2,
        background: 'linear-gradient(to bottom, var(--accent), var(--border))',
        borderRadius: 1
      }} />

      {dates.map((date, dateIdx) => (
        <div key={date} style={{ marginBottom: 'var(--space-6)' }}>
          {/* Date header */}
          <div style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-3)',
            position: 'relative',
            marginLeft: '-24px'
          }}>
            <span style={{
              position: 'absolute',
              left: -16,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '2px solid var(--accent)',
              zIndex: 1
            }} />
            {date}
          </div>

          {/* Incidents for this date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {grouped[date].map((incident, i) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: dateIdx * 0.1 + i * 0.05 }}
                style={{
                  position: 'relative',
                  padding: 'var(--space-4)',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `3px solid ${incident.status === 'open' ? 'var(--down)' : 'var(--up)'}`,
                }}
              >
                {/* Dot on timeline */}
                <div style={{
                  position: 'absolute',
                  left: '-31px',
                  top: 'var(--space-4)',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: incident.status === 'open' ? 'var(--down)' : 'var(--up)',
                  boxShadow: `0 0 8px ${incident.status === 'open' ? 'var(--down-glow)' : 'var(--up-glow)'}`,
                  border: '2px solid var(--bg-card)'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {incident.status === 'open' ? (
                      <AlertTriangle size={14} color="var(--down)" />
                    ) : (
                      <CheckCircle2 size={14} color="var(--up)" />
                    )}
                    <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
                      {incident.siteName}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-semibold)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: incident.status === 'open' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                    color: incident.status === 'open' ? 'var(--down)' : 'var(--up)',
                  }}>
                    {incident.status === 'open' ? 'Open' : 'Resolved'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginBottom: 'var(--space-2)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} />
                    {new Date(incident.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--mono)',
                    background: 'var(--bg-card)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-xs)',
                  }}>
                    {incident.layer}
                  </span>
                  {incident.resolvedAt && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={10} color="var(--up)" />
                      Resolved {new Date(incident.resolvedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {incident.firstError && (
                  <div style={{
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--mono)',
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    {incident.firstError}
                  </div>
                )}

                {incident.aiDiagnosis && (
                  <div style={{
                    marginTop: 'var(--space-2)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'rgba(99, 102, 241, 0.05)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(99, 102, 241, 0.1)'
                  }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 'var(--font-medium)' }}>AI Diagnosis:</span>{' '}
                    {incident.aiDiagnosis}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// For use in SiteDetailPage
export function CompactIncidentTimeline({ incidents }: { incidents: IncidentItem[] }) {
  return (
    <IncidentTimeline 
      incidents={incidents.slice(0, 10)} 
      maxHeight={300}
    />
  );
}
