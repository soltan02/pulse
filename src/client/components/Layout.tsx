import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Activity, AlertTriangle, Settings, LogOut, ChevronRight } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview', icon: Activity },
  { path: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* Background mesh */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'var(--accent)', filter: 'blur(120px)', opacity: 0.12,
          top: '-10%', left: '-5%',
          animation: 'orbFloat1 25s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: '#8b5cf6', filter: 'blur(120px)', opacity: 0.1,
          bottom: '-10%', right: '-5%',
          animation: 'orbFloat2 20s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: '#06b6d4', filter: 'blur(120px)', opacity: 0.08,
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          animation: 'orbFloat3 30s ease-in-out infinite',
        }} />
        <style>{`
          @keyframes orbFloat1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(60px,-40px)} }
          @keyframes orbFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-50px,30px)} }
          @keyframes orbFloat3 { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-40%,-60%) scale(1.2)} }
        `}</style>
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 32px',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(10,10,15,0.85)',
      }}>
        <motion.a
          href="/"
          className="brand-link"
          whileHover={{ scale: 1.02 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em',
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px var(--accent-glow)',
          }}>
            <Activity size={18} color="white" strokeWidth={2.5} />
          </div>
          Pulse
        </motion.a>

        <nav style={{ display: 'flex', gap: 4 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/' && location.pathname !== '/login' && !location.pathname.startsWith('/site/') && !location.pathname.startsWith('/incidents') && !location.pathname.startsWith('/settings'));
            const Icon = item.icon;
            return (
              <motion.a
                key={item.path}
                href={item.path}
                whileHover={{ background: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  fontSize: 14, fontWeight: 500,
                  color: isActive ? 'var(--text)' : 'var(--text-muted)',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 6,
                  textDecoration: 'none', transition: 'all 0.2s',
                }}
              >
                <Icon size={16} />
                {item.label}
              </motion.a>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button
            onClick={() => logout()}
            whileHover={{ background: 'rgba(239,68,68,0.15)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              fontSize: 13, fontWeight: 500, color: 'var(--text-muted)',
              background: 'transparent', border: 'none',
              transition: 'all 0.2s',
            }}
          >
            <LogOut size={16} />
            Logout
          </motion.button>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1200, margin: '0 auto', padding: '32px', width: '100%',
      }}>
        {children}
      </main>

      <footer style={{
        textAlign: 'center', padding: '40px 32px',
        color: 'var(--text-dim)', fontSize: 12,
        borderTop: '1px solid var(--border)', marginTop: 'auto',
        position: 'relative', zIndex: 1,
      }}>
        Pulse Monitoring — Self-hosted, zero-cost infrastructure monitoring
      </footer>
    </motion.div>
  );
}
