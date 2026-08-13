import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { FadeIn } from '../components/FadeIn';
import { getSiteDetail } from '../api';
import type { SiteDetailResponse } from '../types';
import { ArrowLeft, Globe, Clock, Activity, AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react';
import { PerformanceChart } from '../components/PerformanceChart';
import { CompactUptimeHeatmap } from '../components/UptimeHeatmap';
import { CompactIncidentTimeline } from '../components/IncidentTimeline';

export default function SiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SiteDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const result = await getSiteDetail(id);
      setData(result);
    } catch (err) {
      console.error('Failed to fetch site detail:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <Layout>
        <FadeIn>
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </FadeIn>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <FadeIn>
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            Site not found.
          </div>
        </FadeIn>
      </Layout>
    );
  }

  const { site, history, incidents } = data;

  return (
    <Layout>
      {/* Back button */}
      <FadeIn>
        <motion.button
          onClick={() => navigate(-1)}
          whileHover={{ x: -4 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: 14, cursor: 'pointer', marginBottom: 24,
          }}
        >
          <ArrowLeft size={16} /> Back
        </motion.button>
      </FadeIn>

      {/* Site header */}
      <FadeIn delay={100}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{site.name}</h1>
            {!site.active && (
              <span style={{
                fontSize: 12, padding: '3px 10px', borderRadius: 999,
                background: 'rgba(245,158,11,0.1)', color: 'var(--degraded)',
              }}>Paused</span>
            )}
          </div>
          {site.url && (
            <a href={site.url} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 14, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {site.url} <Globe size={14} />
            </a>
          )}
        </div>
      </FadeIn>

      {/* Uptime Heatmap */}
      <FadeIn delay={100}>
        <div style={{ marginBottom: 24 }}>
          <CompactUptimeHeatmap 
            history={history.find(h => h.layer === 'FRONTEND') || { layer: 'FRONTEND', checks: [] }}
            title="Uptime History"
          />
        </div>
      </FadeIn>

      {/* Performance charts per layer */}
      {history.map((layerData) => (
        <FadeIn key={layerData.layer} delay={200}>
          <PerformanceChart
            history={layerData}
            title={`${layerData.layer} Performance`}
            showThreshold={layerData.layer !== 'SSL'}
            thresholdMs={layerData.layer === 'DATABASE' ? 100 : 500}
          />
        </FadeIn>
      ))}

      {/* Incident timeline */}
      <FadeIn delay={400}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 20,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="var(--accent)" />
            Incident History
            {incidents.length > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 500, color: 'var(--text-muted)',
                background: 'var(--bg-elevated)', padding: '2px 10px', borderRadius: 999
              }}>
                {incidents.length} total
              </span>
            )}
          </h3>
          <CompactIncidentTimeline incidents={incidents} />
        </div>
      </FadeIn>
    </Layout>
  );
}
