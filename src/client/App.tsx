import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import IncidentsPage from './pages/IncidentsPage';
import SiteDetailPage from './pages/SiteDetailPage';
import SettingsPage from './pages/SettingsPage';
import PublicStatusPage from './pages/PublicStatusPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authed, loading } = useAuth();
  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
            margin: '0 auto 16px', animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 13 }}>Loading…</p>
        </div>
      </Layout>
    );
  }
  return authed ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><OverviewPage /></ProtectedRoute>} />
        <Route path="/incidents" element={<ProtectedRoute><IncidentsPage /></ProtectedRoute>} />
        <Route path="/site/:id" element={<ProtectedRoute><SiteDetailPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/settings/sites/:id/edit" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/status" element={<PublicStatusPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}
