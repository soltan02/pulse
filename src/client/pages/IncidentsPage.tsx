import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { FadeIn } from '../components/FadeIn';
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
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading incidents...</p>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {incidents.map((incident, i) => (
            <FadeIn key={incident.id} delay={i * 60}>
              <IncidentRow incident={incident} />
            </FadeIn>
          ))}
        </div>
      )}
    </Layout>
  );
}

function IncidentRow({ incident }: { incident: ApiIncidentsResponse['incidents'][number] }) {
  const isOpen = incident.status === 'open';

  return (
    <motion.div
      whileHover={{ x: 4 }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isOpen ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
        borderLeft: `3px solid ${isOpen ? 'var(--down)' : 'var(--up)'}`,
        borderRadius: 12,
        padding: 16,
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        {isOpen ? (
          <AlertTriangle size={16} color="var(--down)" />
        ) : (
          <CheckCircle2 size={16} color="var(--up)" />
        )}
        <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{incident.siteName}</span>
        <span style={{
          fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)',
          background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4,
        }}>
          {incident.layer}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
          background: isOpen ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          color: isOpen ? 'var(--down)' : 'var(--up)',
        }}>
          {isOpen ? 'Open' : 'Resolved'}
        </span>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-dim)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} />
          {new Date(incident.startedAt).toLocaleString()}
        </span>
        {incident.resolvedAt && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={12} />
            Resolved {new Date(incident.resolvedAt).toLocaleString()}
          </span>
        )}
      </div>

      {incident.firstError && (
        <div style={{
          fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--down)',
          marginTop: 8, padding: '6px 10px', background: 'rgba(239,68,68,0.05)',
          borderRadius: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {incident.firstError}
        </div>
      )}

      {incident.aiDiagnosis && (
        <div style={{
          fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6,
          padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <MessageSquare size={12} color="var(--accent)" />
            <strong style={{ color: 'var(--text)' }}>AI Diagnosis</strong>
          </span>
          {incident.aiDiagnosis}
        </div>
      )}
    </motion.div>
  );
}
