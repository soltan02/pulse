import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
  radius?: string | number;
}

export function Skeleton({ 
  className = '', 
  style,
  width,
  height = '1em',
  radius = 'var(--radius-sm)'
}: SkeletonProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.7, 0.5] }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity, 
        repeatType: 'reverse',
        ease: 'easeInOut'
      }}
      style={{
        background: 'var(--bg-elevated)',
        borderRadius: radius,
        width: width || '100%',
        height: height,
        ...style
      }}
    />
  );
}

// Pre-built skeleton variants
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i}
          height="12px"
          radius="var(--radius-xs)"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)'
    }}>
      <Skeleton height="12px" width="40%" radius="var(--radius-xs)" />
      <Skeleton height="32px" width="60%" radius="var(--radius-xs)" />
      <Skeleton height="12px" width="80%" radius="var(--radius-xs)" />
    </div>
  );
}

export function SkeletonSiteCard() {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Skeleton height="16px" width="16px" radius="50%" />
          <Skeleton height="14px" width="120px" radius="var(--radius-xs)" />
        </div>
        <Skeleton height="12px" width="80px" radius="var(--radius-xs)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
        <Skeleton height="36px" radius="var(--radius-sm)" />
        <Skeleton height="36px" radius="var(--radius-sm)" />
        <Skeleton height="36px" radius="var(--radius-sm)" />
      </div>
    </div>
  );
}
