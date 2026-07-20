import { motion } from 'framer-motion';
import { CheckStatus, Layer } from '@prisma/client';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: 'default' | 'up' | 'down' | 'accent';
  delay?: number;
}

export function StatCard({ label, value, sub, color = 'default', delay = 0 }: StatCardProps) {
  const gradientMap = {
    default: 'linear-gradient(135deg, var(--text), var(--text-muted))',
    up: 'linear-gradient(135deg, var(--up), #4ade80)',
    down: 'linear-gradient(135deg, var(--down), #f87171)',
    accent: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
  };

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-hover)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      <div style={{
        fontSize: 12, fontWeight: 500, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em',
        background: gradientMap[color],
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{sub}</div>
      )}
    </motion.div>
  );
}
