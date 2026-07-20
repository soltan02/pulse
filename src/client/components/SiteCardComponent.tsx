import { motion } from 'framer-motion';
import { ExternalLink, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { SiteCard as SiteCardType } from '../types';

interface SiteCardComponentProps {
  card: SiteCardType;
  delay?: number;
}

export function SiteCardComponent({ card, delay = 0 }: SiteCardComponentProps) {
  const statusColor = card.hasActiveIncident ? 'var(--down)' : 'var(--up)';
  const borderColor = card.hasActiveIncident ? 'rgba(239,68,68,0.3)' : 'var(--border)';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ x: 4 }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {card.hasActiveIncident && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: 'var(--down)', borderRadius: '3px 0 0 3px',
          animation: 'incidentPulse 2s ease-in-out infinite',
        }} />
      )}
      <style>{`@keyframes incidentPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {card.hasActiveIncident ? (
            <AlertTriangle size={16} color="var(--down)" />
          ) : (
            <CheckCircle2 size={16} color="var(--up)" />
          )}
          <span style={{ fontSize: 15, fontWeight: 600 }}>{card.name}</span>
        </div>
        <a
          href={card.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          {new URL(card.url).hostname} <ExternalLink size={12} />
        </a>
      </div>

      {/* Layer tiles */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 8,
      }}>
        {card.layers.map((layer) => (
          <LayerTile key={layer.layer} tile={layer} />
        ))}
      </div>
    </motion.div>
  );
}

function LayerTile({ tile }: { tile: { layer: string; status: string; latencyMs: number | null; errorMessage: string | null } }) {
  const dotColor = tile.status === 'UP' ? 'var(--up)' :
    tile.status === 'DEGRADED' ? 'var(--degraded)' : 'var(--down)';
  const glow = tile.status === 'UP' ? 'var(--up-glow)' :
    tile.status === 'DEGRADED' ? 'var(--degraded-glow)' : 'var(--down-glow)';
  const isDown = tile.status === 'DOWN';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 12px', borderRadius: 8,
      background: 'var(--bg-elevated)',
      border: '1px solid transparent',
      transition: 'all 0.2s',
    }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent';
      }}
    >
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: dotColor, boxShadow: `0 0 8px ${glow}`,
        animation: isDown ? 'blink 1s ease-in-out infinite' : 'none',
      }} />
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', flex: 1 }}>{tile.layer}</span>
      {tile.latencyMs !== null && (
        <span style={{
          fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-dim)',
        }}>
          {tile.latencyMs}ms
        </span>
      )}
    </div>
  );
}
