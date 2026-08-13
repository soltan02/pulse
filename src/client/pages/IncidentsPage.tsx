import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { FadeIn } from '../components/FadeIn';
import { SkeletonCard } from '../components/Skeleton';
import { IncidentTimeline } from '../components/IncidentTimeline';
import { getIncidents } from '../api';
import type { ApiIncidentsResponse } from '../types';
import { AlertTriangle, CheckCircle2, Clock, MessageSquare } from 'lucide-react';

export default function IncidentsPage() {
  const [data, setData] = useState<ApiIncidentsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await getIncidents();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) {
    return (
      <Layout>
        <FadeIn>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
              Incidents
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              History of outages and recoveries
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </div>
        </FadeIn>
      </Layout>
    );
  }

  const incidents = data?.incidents || [];
  const openCount = incidents.filter(i => i.status === 'open').length;

  return (
    <Layout>
      <FadeIn>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Incidents
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            History of outages and recoveries
            {openCount > 0 && (
              <span style={{ color: 'var(--down)', marginLeft: 8 }}>
                ({openCount} active)
              </span>
            )}
          </p>
        </div>
      </FadeIn>

      {incidents.length === 0 ? (
        <FadeIn>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 48, textAlign: 'center',
          }}>
            <CheckCircle2 size={40} color="var(--up)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No incidents recorded</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              All systems have been running smoothly!
            </p>
          </div>
        </FadeIn>
      ) : (
        <IncidentTimeline incidents={incidents} />
      )}
    </Layout>
  );
}


