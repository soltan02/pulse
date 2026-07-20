import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { FadeIn } from '../components/FadeIn';
import { getSiteDetail } from '../api';
import type { SiteDetailResponse } from '../types';
import { ArrowLeft, Globe, Clock, Activity, AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

      {/* Uptime charts per layer */}
      {history.map((layerData) => (
        <FadeIn key={layerData.layer} delay={200}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 20, marginBottom: 16,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 16, fontSize: 14, fontWeight: 600,
            }}>
              <Activity size={16} color="var(--text-muted)" />
              {layerData.layer}
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-dim)' }}>
                {layerData.checks.length} checks in 24h
              </span>
            </div>

            {layerData.checks.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={layerData.checks.map((c, i) => ({
                  time: i,
                  latency: c.latencyMs ?? 0,
                  status: c.status,
                }))}>
                  <defs>
                    <linearGradient id={`grad-${layerData.layer}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 8, fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}ms`, 'Latency'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="latency"
                    stroke="var(--accent)"
                    fill={`url(#grad-${layerData.layer})`}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)', fontSize: 13 }}>
                No check data yet.
              </div>
            )}

            {layerData.checks[layerData.checks.length - 1]?.errorMessage && (
              <div style={{
                marginTop: 8, fontSize: 12, fontFamily: 'var(--mono)',
                color: 'var(--down)', padding: '6px 10px',
                background: 'rgba(239,68,68,0.05)', borderRadius: 6,
              }}>
                {layerData.checks[layerData.checks.length - 1].errorMessage}
              </div>
            )}
          </div>
        </FadeIn>
      ))}

      {/* Incident history */}
      <FadeIn delay={400}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 20,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Incident History</h3>
          {incidents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
              <CheckCircle2 size={24} color="var(--up)" style={{ margin: '0 auto 8px' }} />
              No incidents recorded.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {incidents.map((inc, i) => (
                <motion.div
                  key={inc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    padding: 12, background: 'var(--bg-elevated)',
                    borderRadius: 8, borderLeft: `3px solid ${inc.status === 'open' ? 'var(--down)' : 'var(--up)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {inc.status === 'open' ? (
                      <AlertTriangle size={14} color="var(--down)" />
                    ) : (
                      <CheckCircle2 size={14} color="var(--up)" />
                    )}
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(inc.startedAt).toLocaleString()}
                    </span>
                    <span style={{
                      marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 999,
                      background: inc.status === 'open' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                      color: inc.status === 'open' ? 'var(--down)' : 'var(--up)',
                    }}>
                      {inc.status === 'open' ? 'Open' : 'Resolved'}
                    </span>
                  </div>
                  {inc.firstError && (
                    <div style={{
                      fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-dim)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {inc.firstError}
                    </div>
                  )}
                  {inc.aiDiagnosis && (
                    <div style={{
                      marginTop: 6, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
                      padding: '6px 10px', background: 'var(--bg-card)', borderRadius: 6,
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <MessageSquare size={12} color="var(--accent)" /> AI Diagnosis
                      </span>
                      {inc.aiDiagnosis}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </FadeIn>
    </Layout>
  );
}
