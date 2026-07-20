import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { FadeIn } from '../components/FadeIn';
import { getAllSites, addSite, updateSite, deleteSite, toggleSite, changePassword } from '../api';
import { Plus, Edit2, Trash2, Play, Pause, Key, Save, Eye, EyeOff } from 'lucide-react';

interface Site {
  id: string;
  name: string;
  url: string;
  healthUrl: string | null;
  checkIntervalSeconds: number;
  active: boolean;
}

export default function SettingsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const data = await getAllSites();
      setSites(data || []);
    } catch (err) {
      console.error('Failed to fetch sites:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await addSite({
        name: fd.get('name') as string,
        url: fd.get('url') as string,
        healthUrl: (fd.get('healthUrl') as string) || undefined,
        authToken: (fd.get('authToken') as string) || undefined,
        checkIntervalSeconds: Number(fd.get('checkIntervalSeconds')) || 60,
      });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to add site:', err);
    }
  };

  const handleEdit = async (id: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await updateSite(id, {
        name: fd.get('name') as string,
        url: fd.get('url') as string,
        healthUrl: (fd.get('healthUrl') as string) || undefined,
        authToken: (fd.get('authToken') as string) || undefined,
        checkIntervalSeconds: Number(fd.get('checkIntervalSeconds')) || 60,
      });
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update site:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this site? This removes all its history.')) return;
    try {
      await deleteSite(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete site:', err);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleSite(id);
      fetchData();
    } catch (err) {
      console.error('Failed to toggle site:', err);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const oldPwd = fd.get('oldPassword') as string;
    const newPwd = fd.get('newPassword') as string;
    try {
      await changePassword(oldPwd, newPwd);
      setPasswordMsg('Password changed successfully.');
      setShowPasswordForm(false);
      form.reset();
    } catch {
      setPasswordMsg('Failed to change password. Check old password.');
    }
  };

  if (loading) {
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

  return (
    <Layout>
      <FadeIn>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Settings
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Manage monitored sites and security
          </p>
        </div>
      </FadeIn>

      {/* Sites list */}
      <FadeIn delay={100}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 20, marginBottom: 24,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Monitored Sites</h2>
            {!showAddForm && (
              <motion.button
                onClick={() => setShowAddForm(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8,
                  background: 'var(--accent)', color: 'white',
                  border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Add Site
              </motion.button>
            )}
          </div>

          {sites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>
              No sites yet — add your first one above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sites.map((site, i) => (
                <SiteRow
                  key={site.id}
                  site={site}
                  isEditing={editingId === site.id}
                  onEdit={() => setEditingId(site.id)}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => handleDelete(site.id)}
                  onToggle={() => handleToggle(site.id)}
                />
              ))}
            </div>
          )}

          {/* Add form */}
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleAdd}
              style={{
                marginTop: 16, padding: 16, background: 'var(--bg-elevated)',
                borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10,
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Add New Site</h3>
              <input name="name" placeholder="Site name" required style={inputStyle} />
              <input name="url" type="url" placeholder="https://example.com" required style={inputStyle} />
              <input name="healthUrl" type="url" placeholder="Health URL (optional)" style={inputStyle} />
              <input name="authToken" type="text" placeholder="Auth token (optional)" style={inputStyle} />
              <input name="checkIntervalSeconds" type="number" defaultValue="60" min="10" style={inputStyle} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ ...btnPrimary, flex: 1 }}>Add Site</button>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ ...btnSecondary, flex: 1 }}>Cancel</button>
              </div>
            </motion.form>
          )}
        </div>
      </FadeIn>

      {/* Password change */}
      <FadeIn delay={200}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 20,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: showPasswordForm ? 16 : 0,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={16} /> Dashboard Password
            </h2>
            {!showPasswordForm && (
              <motion.button
                onClick={() => setShowPasswordForm(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8,
                  background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                  border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer',
                }}
              >
                Change Password
              </motion.button>
            )}
          </div>

          {showPasswordForm && (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handlePasswordChange}
              style={{
                display: 'flex', flexDirection: 'column', gap: 10,
              }}
            >
              <input name="oldPassword" type="password" placeholder="Current password" required style={inputStyle} />
              <input name="newPassword" type="password" placeholder="New password" required minLength={4} style={inputStyle} />
              {passwordMsg && (
                <p style={{ fontSize: 13, color: passwordMsg.includes('success') ? 'var(--up)' : 'var(--down)' }}>
                  {passwordMsg}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ ...btnPrimary, flex: 1 }}>Save</button>
                <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordMsg(''); }} style={{ ...btnSecondary, flex: 1 }}>Cancel</button>
              </div>
            </motion.form>
          )}
        </div>
      </FadeIn>
    </Layout>
  );
}

function SiteRow({ site, isEditing, onEdit, onCancel, onDelete, onToggle }: {
  site: Site;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  if (isEditing) {
    return (
      <motion.form
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={(e) => { e.preventDefault(); /* handled by parent */ }}
        style={{
          padding: 16, background: 'var(--bg-elevated)', borderRadius: 8,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}
      >
        <input name="name" defaultValue={site.name} required style={inputStyle} />
        <input name="url" type="url" defaultValue={site.url} required style={inputStyle} />
        <input name="healthUrl" type="url" defaultValue={site.healthUrl || ''} placeholder="Health URL (optional)" style={inputStyle} />
        <input name="checkIntervalSeconds" type="number" defaultValue={site.checkIntervalSeconds} min="10" style={inputStyle} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" style={{ ...btnPrimary, flex: 1 }}>Save</button>
          <button type="button" onClick={onCancel} style={{ ...btnSecondary, flex: 1 }}>Cancel</button>
        </div>
      </motion.form>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ background: 'rgba(255,255,255,0.02)' }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: 12, borderRadius: 8,
        border: '1px solid var(--border)',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
          {site.name}
          <span style={{
            marginLeft: 8, fontSize: 11, fontWeight: 500,
            padding: '1px 8px', borderRadius: 999,
            background: site.active ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
            color: site.active ? 'var(--up)' : 'var(--degraded)',
          }}>
            {site.active ? 'Active' : 'Paused'}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {site.url} · every {site.checkIntervalSeconds}s
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <motion.button type="button" onClick={onEdit} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={iconBtn}>
          <Edit2 size={14} />
        </motion.button>
        <motion.button type="button" onClick={onToggle} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{
          ...iconBtn, color: site.active ? 'var(--degraded)' : 'var(--up)',
        }}>
          {site.active ? <Pause size={14} /> : <Play size={14} />}
        </motion.button>
        <motion.button type="button" onClick={onDelete} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ ...iconBtn, color: 'var(--down)' }}>
          <Trash2 size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', background: 'var(--bg-input)',
  border: '1px solid var(--border)', borderRadius: 8,
  fontSize: 14, color: 'var(--text)', outline: 'none',
};
const btnPrimary: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 8,
  background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
  color: 'white', fontSize: 13, fontWeight: 600,
  border: 'none', cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 8,
  background: 'var(--bg-elevated)', color: 'var(--text-muted)',
  border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer',
};
const iconBtn: React.CSSProperties = {
  padding: 6, borderRadius: 6, background: 'transparent',
  border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
