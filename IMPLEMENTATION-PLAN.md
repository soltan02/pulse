# Pulse - Implementation Plan

## Phase 1: Critical Fixes (Do These First)

### 1.1 Add Design Tokens to globals.css

**File:** `src/client/globals.css`

Add at the top (after existing variables):

```css
/* Spacing Scale */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;

/* Border Radius */
--radius-xs: 6px;
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-full: 9999px;

/* Font Sizes */
--text-xs: 11px;
--text-sm: 12px;
--text-base: 14px;
--text-md: 15px;
--text-lg: 16px;
--text-xl: 18px;
--text-2xl: 20px;
--text-3xl: 24px;
--text-4xl: 28px;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.2;
--leading-normal: 1.4;
--leading-relaxed: 1.6;

/* Z-Index Scale */
--z-dropdown: 100;
--z-sticky: 200;
--z-fixed: 300;
--z-modal: 500;
--z-tooltip: 700;

/* Animation Durations */
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;
--duration-slower: 500ms;
```

### 1.2 Add Reduced Motion Support

Add to end of `globals.css`:

```css
/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 1.3 Fix Animation Performance

**File:** `src/client/components/Layout.tsx`

Change `transition: 'all 0.2s'` to specific properties:

```typescript
// Line ~80 - nav items hover
whileHover={{ background: 'rgba(255,255,255,0.08)' }}
// Remove: transition: 'all 0.2s'
```

```typescript
// Line ~100 - button hover
whileHover={{ background: 'rgba(239,68,68,0.15)' }}
// Remove: transition: 'all 0.2s'
```

**File:** `src/client/components/SiteCardComponent.tsx`

```typescript
// Line ~55 - LayerTile hover
onMouseEnter={(e) => {
  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
}}
onMouseLeave={(e) => {
  (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent';
}}
// Add explicit transition
style={{
  // ... existing styles
  transition: 'border-color 200ms ease-out'
}}
```

### 1.4 Add React.memo to Expensive Components

**File:** `src/client/components/StatCard.tsx`

Wrap export:
```typescript
export const StatCard = React.memo(function StatCard({...}) {
  // ... existing code
});
```

**File:** `src/client/components/SiteCardComponent.tsx`

Wrap export:
```typescript
export const SiteCardComponent = React.memo(function SiteCardComponent({...}) {
  // ... existing code
});
```

Wrap LayerTile:
```typescript
function LayerTile({ tile }: { tile: {...} }) {
  // ... existing code
}
export const MemoizedLayerTile = React.memo(LayerTile);
// Update usage to use MemoizedLayerTile
```

---

## Phase 2: UX Improvements

### 2.1 Add Error Boundary

**New file:** `src/client/components/ErrorBoundary.tsx`

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: 40,
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: 12,
          border: '1px solid var(--border)'
        }}>
          <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Update:** `src/client/App.tsx`

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

// Wrap AppRoutes
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

### 2.2 Add Skeleton Loading States

**New file:** `src/client/components/Skeleton.tsx`

```typescript
import { motion } from 'framer-motion';

export function Skeleton({ 
  className = '', 
  style 
}: { 
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.7, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={className}
      style={{
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-sm)',
        ...style
      }}
    />
  );
}
```

**Usage example in OverviewPage:**
```typescript
{loading && !data ? (
  <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
    <Skeleton style={{ height: 100 }} />
    <Skeleton style={{ height: 100 }} />
    <Skeleton style={{ height: 100 }} />
    <Skeleton style={{ height: 100 }} />
  </div>
) : (
  // ... existing stats
)}
```

### 2.3 Improve Incident Timeline Visualization

**New file:** `src/client/components/IncidentTimeline.tsx`

```typescript
import { motion } from 'framer-motion';
import type { IncidentItem } from '../types';

interface IncidentTimelineProps {
  incidents: IncidentItem[];
}

export function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  // Group by date
  const grouped = incidents.reduce((acc, incident) => {
    const date = new Date(incident.startedAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(incident);
    return acc;
  }, {} as Record<string, IncidentItem[]>);

  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      {/* Timeline line */}
      <div style={{
        position: 'absolute',
        left: 8,
        top: 0,
        bottom: 0,
        width: 2,
        background: 'var(--border)',
      }} />

      {Object.entries(grouped).map(([date, dayIncidents]) => (
        <div key={date} style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: 8,
            position: 'relative',
            marginLeft: -24
          }}>
            <span style={{
              position: 'absolute',
              left: -16,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '2px solid var(--accent)'
            }} />
            {date}
          </div>
          
          {dayIncidents.map((incident) => (
            <IncidentDot key={incident.id} incident={incident} />
          ))}
        </div>
      ))}
    </div>
  );
}

function IncidentDot({ incident }: { incident: IncidentItem }) {
  const isOpen = incident.status === 'open';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        position: 'relative',
        paddingLeft: 16,
        marginBottom: 8,
        padding: '12px',
        background: 'var(--bg-elevated)',
        borderRadius: 8,
        borderLeft: `3px solid ${isOpen ? 'var(--down)' : 'var(--up)'}`,
      }}
    >
      <div style={{
        position: 'absolute',
        left: -28,
        top: 16,
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: isOpen ? 'var(--down)' : 'var(--up)',
        boxShadow: `0 0 8px ${isOpen ? 'var(--down-glow)' : 'var(--up-glow)'}`
      }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{incident.siteName}</span>
        <span style={{
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 999,
          background: isOpen ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          color: isOpen ? 'var(--down)' : 'var(--up)',
        }}>
          {isOpen ? 'Open' : 'Resolved'}
        </span>
      </div>
      
      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
        {incident.layer} • {new Date(incident.startedAt).toLocaleTimeString()}
      </div>
      
      {incident.firstError && (
        <div style={{
          fontSize: 11,
          fontFamily: 'var(--mono)',
          color: 'var(--text-muted)',
          marginTop: 4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {incident.firstError}
        </div>
      )}
    </motion.div>
  );
}
```

---

## Phase 3: Advanced Features

### 3.1 Add Uptime Heatmap

**New file:** `src/client/components/UptimeHeatmap.tsx`

```typescript
import { motion } from 'framer-motion';
import type { SiteHistoryLayer } from '../types';

interface UptimeHeatmapProps {
  history: SiteHistoryLayer;
  days: number = 30;
}

export function UptimeHeatmap({ history, days = 30 }: UptimeHeatmapProps) {
  // Prepare data for heatmap
  const weeks = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayChecks = history.checks.filter(c => 
      new Date(c.timestamp).toDateString() === date.toDateString()
    );
    
    const uptime = dayChecks.length > 0
      ? (dayChecks.filter(c => c.status === 'UP').length / dayChecks.length) * 100
      : null;
      
    weeks.push({
      date,
      uptime,
      checks: dayChecks.length
    });
  }
  
  // Group by weeks for display
  const weekGroups = [];
  for (let i = 0; i < weeks.length; i += 7) {
    weekGroups.push(weeks.slice(i, i + 7));
  }
  
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 2, minWidth: 'fit-content' }}>
        {weekGroups.map((week, weekIdx) => (
          <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {week.map((day, dayIdx) => (
              <motion.div
                key={day.date.toISOString()}
                whileHover={{ scale: 1.2, zIndex: 10 }}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: day.uptime === null ? 'var(--bg-elevated)' :
                             day.uptime === 100 ? 'var(--up)' :
                             day.uptime >= 95 ? 'var(--degraded)' : 'var(--down)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                title={`${day.date.toLocaleDateString()}: ${day.uptime?.toFixed(1) ?? 'N/A'}% uptime (${day.checks} checks)`}
              />
            ))}
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
```

### 3.2 Add Performance Benchmarks

**New file:** `src/client/components/PerformanceChart.tsx`

```typescript
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface PerformanceChartProps {
  data: Array<{ time: string; latency: number; status: string }>;
  title: string;
}

export function PerformanceChart({ data, title }: PerformanceChartProps) {
  // Calculate stats
  const avg = data.length > 0
    ? data.reduce((a, b) => a + b.latency, 0) / data.length
    : 0;
  
  const max = data.length > 0
    ? Math.max(...data.map(d => d.latency))
    : 0;
  
  const p95 = data.length > 0
    ? [...data].sort((a, b) => a.latency - b.latency)[Math.floor(data.length * 0.95)]?.latency
    : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600 }}>{title}</h3>
        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
          <span>
            <span style={{ color: 'var(--text-dim)' }}>Avg: </span>
            <span style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{avg.toFixed(0)}ms</span>
          </span>
          <span>
            <span style={{ color: 'var(--text-dim)' }}>P95: </span>
            <span style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{p95.toFixed(0)}ms</span>
          </span>
          <span>
            <span style={{ color: 'var(--text-dim)' }}>Max: </span>
            <span style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{max.toFixed(0)}ms</span>
          </span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`perf-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10, fill: 'var(--text-dim)' }}
            tickLine={false}
          />
          <YAxis 
            hide
            domain={[0, (max * 1.1)]}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12
            }}
            formatter={(value: number) => [`${value.toFixed(0)}ms`, 'Latency']}
          />
          <Area
            type="monotone"
            dataKey="latency"
            stroke="var(--accent)"
            fill={`url(#perf-${title})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
```

---

## Testing Checklist

### Unit Tests to Add

1. **Status Mapping Logic**
   - Test HTTP status codes → status mapping
   - Test timeout handling
   - Test error message parsing

2. **Uptime Calculations**
   - Test 30-day uptime percentage
   - Test P95 latency calculation
   - Test anomaly detection

3. **Alert Logic**
   - Test incident creation
   - Test incident resolution
   - Test alert deduplication

### Integration Tests

1. **API Endpoints**
   - Test auth flow
   - Test CRUD operations
   - Test error responses

2. **Database Queries**
   - Test performance with large datasets
   - Test index usage
   - Test connection pooling

---

## Deployment Checklist

- [ ] Run `npm run build` successfully
- [ ] Run `npm test` - all tests pass
- [ ] Check TypeScript compilation: `npx tsc --noEmit`
- [ ] Test on mobile devices
- [ ] Verify accessibility with screen reader
- [ ] Check Lighthouse scores
- [ ] Test with reduced motion preference
- [ ] Verify error boundaries work
- [ ] Test all alert channels
- [ ] Check database migrations

---

## Quick Wins (Do These First)

### Immediate (1-2 hours)
1. Add reduced-motion support to CSS
2. Add React.memo to StatCard and SiteCard
3. Fix animation transitions (avoid 'all')
4. Add basic error boundary

### Short-term (1-2 days)
1. Implement skeleton loaders
2. Add incident timeline visualization
3. Create uptime heatmap
4. Add performance statistics to charts

### Medium-term (1 week)
1. Full accessibility audit
2. Performance optimization
3. Advanced alerting features
4. Mobile responsiveness improvements

---

## Resources

- **Design System Reference:** [NVIDIA DESIGN.md](https://nvidia.github.io/elements/DESIGN.md)
- **Animation Guidelines:** [Emil Kowalski's Skills](https://github.com/emilkowalski/skills)
- **UI Patterns:** [Shadcn UI Blocks](https://ui.shadcn.com/blocks)
- **Best Practices:** [AI Coding Prompting Patterns 2026](https://baeseokjae.github.io/posts/ai-coding-prompting-patterns-2026/)

---

*Implementation plan generated using 2026 AI coding and design best practices*
