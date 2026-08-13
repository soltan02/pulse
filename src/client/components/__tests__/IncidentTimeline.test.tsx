import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncidentTimeline } from '../IncidentTimeline';
import type { IncidentItem } from '../../types';

describe('IncidentTimeline', () => {
  const mockIncidents: IncidentItem[] = [
    {
      id: '1',
      siteName: 'Test Site',
      layer: 'FRONTEND',
      status: 'open',
      startedAt: '2024-01-01T10:00:00Z',
      resolvedAt: null,
      firstError: 'Connection timeout',
      aiDiagnosis: 'Network issue detected'
    },
    {
      id: '2',
      siteName: 'Test Site 2',
      layer: 'BACKEND',
      status: 'resolved',
      startedAt: '2024-01-01T09:00:00Z',
      resolvedAt: '2024-01-01T09:30:00Z',
      firstError: '500 Internal Server Error',
      aiDiagnosis: 'Database connection pool exhausted'
    }
  ];

  it('renders timeline with incidents', () => {
    render(<IncidentTimeline incidents={mockIncidents} />);
    expect(screen.getByText('Test Site')).toBeInTheDocument();
    expect(screen.getByText('Test Site 2')).toBeInTheDocument();
  });

  it('shows "No incidents recorded" when empty', () => {
    render(<IncidentTimeline incidents={[]} />);
    expect(screen.getByText('No incidents recorded')).toBeInTheDocument();
  });

  it('displays incident status', () => {
    render(<IncidentTimeline incidents={mockIncidents} />);
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('shows AI diagnosis when available', () => {
    render(<IncidentTimeline incidents={mockIncidents} />);
    expect(screen.getByText(/Network issue detected/)).toBeInTheDocument();
    expect(screen.getByText(/Database connection pool exhausted/)).toBeInTheDocument();
  });
});
