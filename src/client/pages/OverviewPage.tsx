import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { FadeIn, StaggerContainer } from '../components/FadeIn';
import { StatCard } from '../components/StatCard';
import { SiteCardComponent } from '../components/SiteCardComponent';
import { getOverview } from '../api';
import type { ApiOverviewResponse } from '../types';
import { RefreshCw, Zap } from 'lucide-react';

export default function OverviewPage() {
  const [data, setData] = useState<ApiOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const result = await getOverview();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

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
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading dashboard...</p>
          </div>
        </FadeIn>
      </Layout>
    );
  }

  const stats = data?.stats;
  const sites = data?.sites || [];

  return (
    <Layout>
      {/* Header */}
      <FadeIn>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 32,
        }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
              Overview
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Real-time monitoring status for all your projects
            </p>
          </div>
          <motion.button
            onClick={handleRefresh}
            disabled={refreshing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              background: refreshing ? 'var(--bg-elevated)' : 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: refreshing ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 13, fontWeight: 500, cursor: refreshing ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={14} style={{
              transform: refreshing ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.4s',
            }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </motion.button>
        </div>
      </FadeIn>

      {/* Stats */}
      <StaggerContainer gap={16}>
        <FadeIn delay={0}>
          <StatCard
            label="Sites Monitored"
            value={String(stats?.sitesMonitored ?? 0)}
            sub="All active"
            delay={0}
          />
        </FadeIn>
        <FadeIn delay={80}>
          <StatCard
            label="30-Day Uptime"
            value={stats?.uptime30dPercent !== null ? `${stats.uptime30dPercent}%` : '—'}
            sub={stats?.uptime30dPercent !== null && stats.uptime30dPercent >= 99 ? 'Excellent' : stats?.uptime30dPercent !== null ? 'Needs attention' : 'Collecting data'}
            color={stats?.uptime30dPercent !== null && stats.uptime30dPercent >= 99 ? 'up' : stats?.uptime30dPercent !== null && stats.uptime30dPercent < 95 ? 'down' : 'default'}
            delay={80}
          />
        </FadeIn>
        <FadeIn delay={160}>
          <StatCard
            label="Avg Response"
            value={stats?.avgResponseMs !== null ? `${stats.avgResponseMs}ms` : '—'}
            sub="Across all sites"
            color={stats?.avgResponseMs !== null && stats.avgResponseMs < 300 ? 'up' : 'default'}
            delay={160}
          />
        </FadeIn>
        <FadeIn delay={240}>
          <StatCard
            label="Active Incidents"
            value={String(stats?.activeIncidents ?? 0)}
            sub={stats?.activeIncidents === 0 ? 'All systems healthy' : 'Requires attention'}
            color={stats?.activeIncidents === 0 ? 'up' : 'down'}
            delay={240}
          />
        </FadeIn>
      </StaggerContainer>

      {/* Sites */}
      <div style={{ marginTop: 40 }}>
        <FadeIn delay={320}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 16, fontWeight: 600, marginBottom: 16,
          }}>
            <Zap size={18} color="var(--accent)" />
            Monitored Sites
            <span style={{
              fontSize: 12, fontWeight: 500, color: 'var(--text-muted)',
              background: 'var(--bg-elevated)', padding: '2px 10px',
              borderRadius: 999,
            }}>
              {sites.length}
            </span>
          </div>
        </FadeIn>

        <StaggerContainer gap={12}>
          {sites.map((site, i) => (
            <FadeIn key={site.id} delay={400 + i * 80}>
              <SiteCardComponent card={site} delay={400 + i * 80} />
            </FadeIn>
          ))}
          {sites.length === 0 && (
            <FadeIn delay={400}>
              <div style={{
                background: 'var(--bg-card)', border: '1px dashed var(--border)',
                borderRadius: 12, padding: 40, textAlign: 'center',
                color: 'var(--text-muted)', fontSize: 14,
              }}>
                No sites yet. Add your first one in <a href="/settings" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Settings</a>.
              </div>
            </FadeIn>
          )}
        </StaggerContainer>
      </div>
    </Layout>
  );
}
