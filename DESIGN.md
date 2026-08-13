# Pulse Design System

## Visual Identity

### Colors
```css
--bg: #0a0a0f;              /* Main background */
--bg-elevated: #12121a;     /* Cards, panels */
--bg-card: #16161f;         /* Elevated cards */
--bg-input: #1c1c27;        /* Form inputs */
--border: rgba(255,255,255,0.06);
--border-hover: rgba(255,255,255,0.12);

--text: #e4e4e7;            /* Primary text */
--text-muted: #71717a;      /* Secondary text */
--text-dim: #52525b;        /* Tertiary text */

--up: #22c55e;              /* Success/healthy */
--up-glow: rgba(34,197,94,0.15);
--degraded: #f59e0b;        /* Warning */
--degraded-glow: rgba(245,158,11,0.15);
--down: #ef4444;            /* Error/down */
--down-glow: rgba(239,68,68,0.15);
--accent: #6366f1;          /* Primary accent */
--accent-glow: rgba(99,102,241,0.15);
```

### Typography
- **Font:** Inter (primary), JetBrains Mono (code)
- **Scale:** 12px, 13px, 14px, 15px, 16px, 18px, 20px, 24px, 28px
- **Weights:** 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold)
- **Line height:** 1.4 for body, 1.2 for headings

### Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128
- Grid: 8px baseline

### Border Radius
- xs: 6px
- sm: 8px
- md: 12px
- lg: 16px
- full: 9999px

### Shadows
- Card: `0 4px 24px rgba(0,0,0,0.2)`
- Elevated: `0 8px 32px rgba(0,0,0,0.3)`
- Glow: Use CSS custom properties for colored glows

## Components

### Status Indicators
- **Dot:** 8px circle with glow effect
- **Label:** Uppercase, 11px, monospace for technical details
- **Badge:** Pill-shaped with semantic colors

### Cards
- Background: `var(--bg-card)`
- Border: 1px solid `var(--border)`
- Padding: 20px
- Radius: 12px
- Hover: Border color to `var(--border-hover)`, subtle shadow

### Buttons
- Primary: Gradient background, white text
- Secondary: Elevated background, muted text
- Icon: Transparent, muted text, hover scale
- Sizes: 13px font, 8-14px padding

### Forms
- Input: Elevated background, border, focus accent color
- Label: Muted, uppercase, 12px, 8px margin bottom
- Error: Red text, red background tint

### Navigation
- Active state: Elevated background, text color
- Inactive: Transparent, muted color
- Hover: Slight background brighten
- Icon + label layout, 16px icons

### Loading States
- Spinner: 40px, border with accent top
- Skeleton: Elevated background, subtle animation
- Text: Muted, centered

## Animation Guidelines

### Principles
- Duration: 200-400ms for UI interactions
- Easing: Custom cubic-bezier, not ease-in
- Transform and opacity only (GPU accelerated)
- Respect reduced-motion preference

### Patterns
- **Fade in:** opacity 0→1, y: 20→0, 400ms
- **Slide:** x: -20→0, 400ms
- **Scale:** 0.95→1, 200ms (button press)
- **Stagger:** 80ms delay between items
- **Pulse:** opacity 1→0.3→1, 2s infinite (incidents)
- **Blink:** opacity 1→0.3→1, 1s infinite (down status)

### Do's and Don'ts
✅ Use Framer Motion for complex animations
✅ Animate transforms and opacity
✅ Use spring physics for natural motion
✅ Skip animation for keyboard interactions
❌ Don't animate color changes
❌ Don't use keyframes for interruptible animations
❌ Don't animate layout properties (width, height, margin)
❌ Don't use ease-in for UI transitions

## Accessibility

### Contrast
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text and UI components
- Test with color blindness simulators

### Focus States
- Visible outline on all interactive elements
- 2px solid accent color
- 2px offset from element edge

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Keyboard Navigation
- Tab order: Logical flow through page
- Focus visible: Custom focus ring
- Skip links: Main content, navigation
- ARIA labels: Descriptive for icons and buttons

## Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
- Wide: > 1280px

## Public Status Page
- No navigation, minimal header
- Large status indicators
- Clear incident timeline
- Contact/support links
- RSS feed for updates

## Brand Consistency
- Logo: Activity icon with gradient
- Name: "Pulse" in bold, tight letter-spacing
- Tagline: "Self-hosted, zero-cost infrastructure monitoring"
- Consistent use of accent gradient (indigo to purple)
