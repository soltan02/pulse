# Pulse Monitoring - Improvement Recommendations

## Overview
Based on comprehensive research of best practices in AI coding, design systems, and agent prompting (2026), here are specific recommendations to improve Pulse.

---

## 🔥 High Priority Improvements

### 1. **Performance Optimizations**

**Current Issues:**
- No debouncing on rapid API calls
- Missing `React.memo` for expensive components
- Framer Motion animations on non-GPU properties in some places
- No pagination for large incident lists

**Recommended Fixes:**

```typescript
// Add debounced API calls
import { useCallback, useRef } from 'react';

function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]) as T;
}
```

```typescript
// Memoize expensive components
export const StatCard = React.memo(function StatCard({...}) {
  // component implementation
});

export const SiteCardComponent = React.memo(function SiteCardComponent({...}) {
  // component implementation
});
```

### 2. **Design System Consistency**

**Current Issues:**
- Inconsistent spacing (mix of 16px, 20px, 24px)
- Hardcoded colors in some components
- Missing design tokens for states

**Recommended Fixes:**

Update `globals.css` with complete design tokens:

```css
:root {
  /* Spacing */
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
  --space-20: 80px;
  --space-24: 96px;
  
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
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
}
```

Use these tokens consistently across all components:

```typescript
// Before
<div style={{ padding: '20px 16px', borderRadius: 12 }}>

// After
<div style={{ 
  padding: 'var(--space-5) var(--space-4)', 
  borderRadius: 'var(--radius-md)' 
}}>
```

### 3. **Animation Improvements**

**Current Issues:**
- Some animations use `all` property (bad for performance)
- Missing reduced-motion support
- Inconsistent animation durations

**Recommended Fixes:**

Add reduced-motion support to `globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Fix animation properties in components:

```typescript
// Before (bad)
<button style={{ transition: 'all 0.2s' }}>

// After (good)
<button style={{ 
  transition: 'transform 200ms ease-out, background-color 200ms ease-out' 
}}>
```

Use consistent animation durations:
- UI interactions: 200ms
- Page transitions: 400ms
- Entrance animations: 400-500ms
- Background orbs: 20-30s

---

## 📊 Medium Priority Improvements

### 4. **Type Safety Enhancements**

**Current Issues:**
- Some `any` types in API calls
- Missing error type definitions
- Incomplete Prisma type usage

**Recommended Fixes:**

```typescript
// Create proper error types
export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

// Use in API client
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw {
      status: res.status,
      message: text || `HTTP ${res.status}`,
      code: res.status.toString()
    } satisfies ApiError;
  }
  
  return res.json() as Promise<T>;
}
```

### 5. **Error Handling Improvements**

**Current Issues:**
- Generic error messages
- No user feedback for failures
- Missing error boundaries

**Recommended Fixes:**

Create an error boundary component:

```typescript
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p style={{ color: 'var(--text-muted)' }}>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

Wrap your app in `App.tsx`:

```typescript
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

### 6. **Accessibility Improvements**

**Current Issues:**
- Missing ARIA labels on icons
- No skip links
- Color-only status indicators

**Recommended Fixes:**

Add ARIA labels:

```typescript
// Before
<Activity size={16} color="var(--text-muted)" />

// After
<Activity size={16} color="var(--text-muted)" aria-label="Activity icon" />

// Better - screen reader only text
<span className="sr-only">Activity</span>
<Activity size={16} aria-hidden="true" />
```

Add skip link to layout:

```typescript
// In Layout.tsx
<a 
  href="#main-content"
  style={{
    position: 'absolute',
    top: '-40px',
    left: '0',
    background: 'var(--accent)',
    color: 'white',
    padding: '8px 16px',
    zIndex: 1000,
    transition: 'top 0.2s'
  }}
  onFocus={(e) => (e.currentTarget.style.top = '0')}
  onBlur={(e) => (e.currentTarget.style.top = '-40px')}
>
  Skip to main content
</a>
```

---

## 🎨 Design-Specific Improvements

### 7. **Visual Hierarchy Enhancement**

**Current Issues:**
- Stats cards have similar visual weight
- Layer tiles lack clear hierarchy
- Incident rows could be more scannable

**Recommended Fixes:**

Improve stat card differentiation:

```typescript
// Add size variation based on importance
const sizeClasses = {
  large: 'col-span-2 row-span-2',
  medium: 'col-span-1 row-span-1',
  small: 'col-span-1 row-span-1'
};

// Make uptime more prominent
<StatCard
  label="30-Day Uptime"
  value={`${stats.uptime30dPercent}%`}
  size="large"  // New prop
  sub={stats.uptime30dPercent >= 99 ? 'Excellent' : 'Needs attention'}
  delay={80}
/>
```

### 8. **Micro-interactions**

**Current Issues:**
- Limited hover states
- No tactile feedback
- Missing loading states for actions

**Recommended Fixes:**

Add button press feedback:

```typescript
// In global styles or button component
.button-press {
  transform: scale(0.97);
  transition: transform 160ms ease-out;
}

.button-press:active {
  transform: scale(0.97);
}
```

Add skeleton loading states:

```typescript
// Create Skeleton component
export function Skeleton({ className }: { className?: string }) {
  return (
    <div 
      className={`skeleton ${className || ''}`}
      style={{
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-sm)',
        animation: 'pulse 2s ease-in-out infinite'
      }}
    />
  );
}
```

### 9. **Data Visualization Improvements**

**Current Issues:**
- Charts are basic line plots
- No status indicators on charts
- Missing trend analysis

**Recommended Fixes:**

Add status-colored areas to charts:

```typescript
// In SiteDetailPage.tsx
<AreaChart data={layerData.checks}>
  <defs>
    <linearGradient id={`grad-${layerData.layer}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="var(--up)" stopOpacity={0.3} />
      <stop offset="95%" stopColor="var(--up)" stopOpacity={0} />
    </linearGradient>
  </defs>
  <Area
    type="monotone"
    dataKey="latency"
    stroke="var(--up)"
    fill={`url(#grad-${layerData.layer})`}
    strokeWidth={2}
  />
</AreaChart>
```

Add status indicators as colored dots on the chart:

```typescript
{layerData.checks.map((check, i) => (
  <Circle
    key={i}
    cx={i}
    cy={check.latencyMs ?? 0}
    r={4}
    fill={check.status === 'DOWN' ? 'var(--down)' : 
          check.status === 'DEGRADED' ? 'var(--degraded)' : 'var(--up)'}
  />
))}
```

---

## 🚀 Feature Suggestions

### 10. **New Features to Consider**

**Uptime Heatmap:**
- Show 30-day uptime as a grid (like GitHub contributions)
- Green for UP, yellow for DEGRADED, red for DOWN
- Hover for details

**Incident Timeline:**
- Visual timeline of all incidents
- Color-coded by layer
- Click to filter by date/range

**Performance Trends:**
- Show average latency trends over time
- Identify degradation before incidents
- Compare against historical averages

**Alert Rules:**
- Customizable alert thresholds
- Different notification channels per layer
- Quiet hours configuration

**Team Collaboration:**
- Multiple admin accounts
- Role-based access (view-only, editor, admin)
- Incident assignment and notes

---

## 📋 Implementation Priority

### Week 1: Foundation
- [ ] Add CSS design tokens
- [ ] Implement reduced-motion support
- [ ] Add error boundaries
- [ ] Memoize expensive components

### Week 2: Polish
- [ ] Fix animation performance
- [ ] Add accessibility improvements
- [ ] Implement skeleton loaders
- [ ] Improve error handling

### Week 3: Features
- [ ] Add uptime heatmap
- [ ] Implement incident timeline
- [ ] Add performance trends
- [ ] Create alert rules UI

### Week 4: Testing & Deployment
- [ ] Run accessibility audit
- [ ] Test on multiple devices
- [ ] Performance profiling
- [ ] Deploy to production

---

## 📚 References

- [Emil Kowalski's Design Engineering Philosophy](https://github.com/emilkowalski/skills)
- [NVIDIA DESIGN.md](https://nvidia.github.io/elements/DESIGN.md)
- [Sebastian Software UI Design Skill](https://github.com/sebastian-software/effective-ui-design-skill)
- [Refactoring UI Principles](https://github.com/jaywilburn/refactoring-ui-skill)
- [Framer Motion Best Practices](https://www.framer.com/motion/)

---

*Generated using 2026 AI coding and design best practices research*
