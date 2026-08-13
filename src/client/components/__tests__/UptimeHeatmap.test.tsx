import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UptimeHeatmap } from '../UptimeHeatmap';
import type { SiteHistoryLayer } from '../../types';

describe('UptimeHeatmap', () => {
  const mockHistory: SiteHistoryLayer = {
    layer: 'FRONTEND',
    checks: Array.from({ length: 30 * 24 }, (_, i) => ({
      status: i % 10 === 0 ? 'DOWN' : i % 5 === 0 ? 'DEGRADED' : 'UP',
      latencyMs: 100 + Math.random() * 200,
      errorMessage: null,
      timestamp: new Date(Date.now() - (30 - i) * 60 * 1000).toISOString()
    }))
  };

  it('renders title', () => {
    render(<UptimeHeatmap history={mockHistory} title="Test Heatmap" />);
    expect(screen.getByText('Test Heatmap')).toBeInTheDocument();
  });

  it('shows 30-day average', () => {
    render(<UptimeHeatmap history={mockHistory} title="Test Heatmap" />);
    expect(screen.getByText(/30-day avg/)).toBeInTheDocument();
  });

  it('displays legend', () => {
    render(<UptimeHeatmap history={mockHistory} title="Test Heatmap" />);
    expect(screen.getByText('100% Uptime')).toBeInTheDocument();
    expect(screen.getByText('95-99%')).toBeInTheDocument();
    expect(screen.getByText('<95%')).toBeInTheDocument();
  });
});
