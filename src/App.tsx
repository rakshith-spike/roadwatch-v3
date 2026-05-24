import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { AuthPage } from './components/pages/AuthPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { CitizenDashboard } from './components/dashboards/CitizenDashboard';
import { ContractorDashboard } from './components/dashboards/ContractorDashboard';
import { GovernmentDashboard } from './components/dashboards/GovernmentDashboard';
import { SuperAdminDashboard } from './components/dashboards/SuperAdminDashboard';
import { ComplaintsPage } from './components/pages/ComplaintsPage';
import { MapViewPage } from './components/pages/MapViewPage';
import { AIAssistantPage } from './components/pages/AIAssistantPage';
import { AnalyticsPage } from './components/pages/AnalyticsPage';
import { AlertsPage } from './components/pages/AlertsPage';
import { ProjectManagementPage } from './components/pages/ProjectManagementPage';
import { ContractorManagementPage } from './components/pages/ContractorManagementPage';
import { BudgetPage } from './components/pages/BudgetPage';
import { UserManagementPage } from './components/pages/UserManagementPage';
import { WorkProgressPage } from './components/pages/WorkProgressPage';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './services/api';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
          <span className="text-4xl">🚧</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-surface-400">This module is under development</p>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user, currentView } = useStore();
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        switch (user?.role) {
          case 'citizen':    return <CitizenDashboard />;
          case 'contractor': return <ContractorDashboard />;
          case 'government': return <GovernmentDashboard />;
          case 'superadmin': return <SuperAdminDashboard />;
          default:           return <CitizenDashboard />;
        }
      case 'complaints':    return <ComplaintsPage />;
      case 'map':           return <MapViewPage />;
      case 'assistant':     return <AIAssistantPage />;
      case 'analytics':     return <AnalyticsPage />;
      case 'alerts':        return <AlertsPage />;
      case 'projects':      return <ProjectManagementPage />;
      case 'contractors':   return <ContractorManagementPage />;
      case 'work-progress': return <WorkProgressPage />;
      case 'budget':        return <BudgetPage />;
      case 'users':         return <UserManagementPage />;
      case 'reports':       return <PlaceholderPage title="Reports & Documents" />;
      case 'regions':       return <PlaceholderPage title="Region Configuration" />;
      case 'national':      return <PlaceholderPage title="National Overview" />;
      case 'transparency':  return <PlaceholderPage title="Transparency Portal" />;
      case 'system':        return <PlaceholderPage title="System Health Monitor" />;
      case 'audit':         return <PlaceholderPage title="Audit Logs" />;
      case 'settings':      return <PlaceholderPage title="Settings" />;
      case 'help':          return <PlaceholderPage title="Help Center" />;
      default:              return <CitizenDashboard />;
    }
  };
  return (
    <AnimatePresence mode="wait">
      <motion.div key={currentView} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        exit={{ opacity:0, y:-10 }} transition={{ duration:0.18 }}>
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const { isAuthenticated, setUser } = useStore();

  // Re-hydrate session from stored token on page load
  useEffect(() => {
    const token = localStorage.getItem('roadwatch_token');
    if (token && !isAuthenticated) {
      api.getMe()
        .then(user => {
          setUser({
            id: user._id || user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            district: user.district,
            state: user.state,
            phone: user.phone,
          });
        })
        .catch(() => {
          localStorage.removeItem('roadwatch_token');
        });
    }
  }, []);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
