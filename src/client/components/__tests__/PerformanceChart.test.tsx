import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceChart } from '../PerformanceChart';
import type { SiteHistoryLayer } from '../../types';

describe('PerformanceChart', () => {
  const mockHistory: SiteHistoryLayer = {
    layer: 'FRONTEND',
    checks: [
      { status: 'UP', latencyMs: 120, errorMessage: null, timestamp: '2024-01-01T10:00:00Z' },
      { status: 'UP', latencyMs: 150, errorMessage: null, timestamp: '2024-01-01T10:01:00Z' },
      { status: 'DEGRADED', latencyMs: 450, errorMessage: 'Slow response', timestamp: '2024-01-01T10:02:00Z' },
      { status: 'UP', latencyMs: 130, errorMessage: null, timestamp: '2024-01-01T10:03:00Z' },
    ]
  };

  it('renders chart title', () => {
    render(<PerformanceChart history={mockHistory} title="Test Chart" />);
    expect(screen.getByText('Test Chart')).toBeInTheDocument();
  });

  it('shows stats when data is available', () => {
    render(<PerformanceChart history={mockHistory} title="Test Chart" />);
    expect(screen.getByText(/Average/)).toBeInTheDocument();
    expect(screen.getByText(/P95/)).toBeInTheDocument();
    expect(screen.getByText(/Max/)).toBeInTheDocument();
  });

  it('shows "No check data available" when data is empty', () => {
    const emptyHistory: SiteHistoryLayer = {
      layer: 'FRONTEND',
      checks: []
    };
    render(<PerformanceChart history={emptyHistory} title="Empty Chart" />);
    expect(screen.getByText('No check data available')).toBeInTheDocument();
  });
});
