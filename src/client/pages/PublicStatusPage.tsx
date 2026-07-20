import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Globe, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface StatusSite {
  id: string;
  name: string;
  url: string;
  active: boolean;
  latestStatus: 'UP' | 'DEGRADED' | 'DOWN' | null;
  latencyMs: number | null;
  uptime30dPercent: number | null;
  lastChecked: string | null;
}

export default function PublicStatusPage() {
  const [sites, setSites] = useState<StatusSite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/public-status');
      if (res.ok) {
        const data = await res.json();
        setSites(data.sites || []);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const allUp = sites.every(s => s.latestStatus === 'UP');
  const anyDown = sites.some(s => s.latestStatus === 'DOWN');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'var(--accent)', filter: 'blur(120px)', opacity: 0.08,
          top: '-10%', left: '30%',
          animation: 'orbFloat 25s ease-in-out infinite',
        }} />
      </div>

      <header style={{
        padding: '20px 32px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={20} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Pulse</span>
          <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 4 }}>Status Page</span>
        </div>
        <a href="/" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Admin Dashboard →</a>
      </header>

      <main style={{ flex: 1, maxWidth: 800, margin: '0 auto', padding: '48px 32px', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* System status banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center', marginBottom: 48,
            padding: '24px', borderRadius: 12,
            background: allUp ? 'rgba(34,197,94,0.08)' : anyDown ? 'rgba(239,68,68,0.08)' : 'var(--bg-card)',
            border: `1px solid ${allUp ? 'rgba(34,197,94,0.2)' : anyDown ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 8,
          }}>
            {allUp ? (
              <CheckCircle2 size={24} color="var(--up)" />
            ) : anyDown ? (
              <AlertTriangle size={24} color="var(--down)" />
            ) : (
              <Clock size={24} color="var(--degraded)" />
            )}
            <span style={{
              fontSize: 20, fontWeight: 700,
              color: allUp ? 'var(--up)' : anyDown ? 'var(--down)' : 'var(--degraded)',
            }}>
              {allUp ? 'All Systems Operational' : anyDown ? 'Some Systems Experiencing Issues' : 'Monitoring in Progress'}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Last checked {loading ? '...' : 'just now'}
          </p>
        </motion.div>

        {/* Site cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            Loading status...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sites.map((site, i) => (
              <motion.div
                key={site.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ x: 4 }}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${site.latestStatus === 'DOWN' ? 'rgba(239,68,68,0.2)' : site.latestStatus === 'DEGRADED' ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`,
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Globe size={16} color="var(--text-muted)" />
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{site.name}</span>
                    {!site.active && (
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 999,
                        background: 'rgba(245,158,11,0.1)', color: 'var(--degraded)',
                      }}>Paused</span>
                    )}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 600,
                    color: site.latestStatus === 'UP' ? 'var(--up)' :
                           site.latestStatus === 'DEGRADED' ? 'var(--degraded)' :
                           site.latestStatus === 'DOWN' ? 'var(--down)' : 'var(--text-muted)',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: site.latestStatus === 'UP' ? 'var(--up)' :
                                   site.latestStatus === 'DEGRADED' ? 'var(--degraded)' :
                                   site.latestStatus === 'DOWN' ? 'var(--down)' : 'var(--text-dim)',
                      boxShadow: site.latestStatus === 'UP' ? '0 0 8px var(--up-glow)' :
                                 site.latestStatus === 'DOWN' ? '0 0 8px var(--down-glow)' : 'none',
                      animation: site.latestStatus === 'DOWN' ? 'blink 1s ease-in-out infinite' : 'none',
                    }} />
                    {site.latestStatus ?? 'Unknown'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-dim)' }}>
                  {site.latencyMs !== null && (
                    <span>Response: {site.latencyMs}ms</span>
                  )}
                  {site.uptime30dPercent !== null && (
                    <span>30d uptime: {site.uptime30dPercent}%</span>
                  )}
                  {site.lastChecked && (
                    <span>Updated: {new Date(site.lastChecked).toLocaleTimeString()}</span>
                  )}
                </div>

                {site.url && (
                  <a href={site.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    marginTop: 12, fontSize: 12, color: 'var(--accent)',
                    textDecoration: 'none',
                  }}>
                    Visit site <Globe size={12} />
                  </a>
                )}
              </motion.div>
            ))}

            {sites.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                No sites configured yet.
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={{
        textAlign: 'center', padding: '32px', color: 'var(--text-dim)', fontSize: 12,
        borderTop: '1px solid var(--border)',
      }}>
        Powered by Pulse Monitoring
      </footer>
    </motion.div>
  );
}
