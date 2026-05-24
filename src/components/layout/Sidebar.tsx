import { 
  LayoutDashboard, AlertCircle, MapPin, BarChart3, Settings, HelpCircle,
  Users, Briefcase, FileText, Bell, Shield, Bot, Building, TrendingUp,
  Wallet, ClipboardList, Truck, Activity, Globe, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore, UserRole } from '../../store/useStore';
import { motion } from 'framer-motion';

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  view: string;
  roles: UserRole[];
  badge?: number;
  section?: string;
}

const navItems: NavItem[] = [
  // Common
  { icon: LayoutDashboard, label: 'Dashboard',       view: 'dashboard',    roles: ['citizen', 'contractor', 'government', 'superadmin'], section: 'main' },
  { icon: AlertCircle,     label: 'Complaints',      view: 'complaints',   roles: ['citizen', 'government', 'superadmin'],               section: 'main' },
  { icon: MapPin,          label: 'Map View',        view: 'map',          roles: ['citizen', 'contractor', 'government', 'superadmin'], section: 'main' },
  { icon: Bot,             label: 'AI Assistant',    view: 'assistant',    roles: ['citizen', 'contractor', 'government', 'superadmin'], section: 'main' },
  { icon: Bell,            label: 'Alerts',          view: 'alerts',       roles: ['citizen', 'contractor', 'government', 'superadmin'], section: 'main', badge: 3 },

  // Contractor-specific
  { icon: ClipboardList,   label: 'My Projects',     view: 'projects',     roles: ['contractor'],                                        section: 'work' },
  { icon: Truck,           label: 'Work Progress',   view: 'work-progress',roles: ['contractor'],                                        section: 'work' },
  { icon: Wallet,          label: 'Budget',          view: 'budget',       roles: ['contractor'],                                        section: 'work' },

  // Government admin
  { icon: AlertCircle,     label: 'Complaints',      view: 'complaints',   roles: [],  section: 'govern' }, // already listed above
  { icon: ClipboardList,   label: 'Projects',        view: 'projects',     roles: ['government'],                                        section: 'govern' },
  { icon: Truck,           label: 'Work Progress',   view: 'work-progress',roles: ['government'],                                        section: 'govern' },
  { icon: Briefcase,       label: 'Contractors',     view: 'contractors',  roles: ['government', 'superadmin'],                          section: 'govern' },
  { icon: Wallet,          label: 'Budget',          view: 'budget',       roles: ['government', 'superadmin'],                          section: 'govern' },
  { icon: BarChart3,       label: 'Analytics',       view: 'analytics',    roles: ['government', 'superadmin'],                          section: 'govern' },
  { icon: FileText,        label: 'Reports',         view: 'reports',      roles: ['government', 'superadmin'],                          section: 'govern' },
  { icon: TrendingUp,      label: 'Transparency',    view: 'transparency', roles: ['citizen', 'government', 'superadmin'],               section: 'govern' },

  // Super admin only
  { icon: Users,           label: 'User Management', view: 'users',        roles: ['superadmin'],                                        section: 'admin' },
  { icon: Building,        label: 'Regions',         view: 'regions',      roles: ['superadmin'],                                        section: 'admin' },
  { icon: Globe,           label: 'National View',   view: 'national',     roles: ['superadmin'],                                        section: 'admin' },
  { icon: Activity,        label: 'System Health',   view: 'system',       roles: ['superadmin'],                                        section: 'admin' },
  { icon: Shield,          label: 'Audit Logs',      view: 'audit',        roles: ['superadmin'],                                        section: 'admin' },
];

const bottomItems: NavItem[] = [
  { icon: Settings,   label: 'Settings',    view: 'settings', roles: ['citizen', 'contractor', 'government', 'superadmin'] },
  { icon: HelpCircle, label: 'Help Center', view: 'help',     roles: ['citizen', 'contractor', 'government', 'superadmin'] },
];

// De-dupe by view+role so the same view doesn't appear twice
function getNavForRole(role: UserRole): NavItem[] {
  const seen = new Set<string>();
  return navItems.filter(item => {
    if (!item.roles.includes(role)) return false;
    if (seen.has(item.view)) return false;
    seen.add(item.view);
    return true;
  });
}

const roleLabels: Record<string, string> = {
  citizen: 'Citizen Portal',
  contractor: 'Contractor Portal',
  government: 'Gov Admin Portal',
  superadmin: 'Super Admin'
};

const sectionLabels: Record<string, string> = {
  work: 'My Work',
  govern: 'Administration',
  admin: 'System Admin'
};

export function Sidebar() {
  const { user, currentView, setCurrentView, sidebarOpen, setSidebarOpen } = useStore();
  
  const filteredNav = getNavForRole(user?.role || null);
  const filteredBottom = bottomItems.filter(item => item.roles.includes(user?.role || null));

  // Group items
  const mainItems = filteredNav.filter(i => i.section === 'main');
  const workItems = filteredNav.filter(i => i.section === 'work');
  const governItems = filteredNav.filter(i => i.section === 'govern');
  const adminItems = filteredNav.filter(i => i.section === 'admin');

  const groups = [
    { items: mainItems, label: '' },
    { items: workItems, label: 'My Work' },
    { items: governItems, label: 'Administration' },
    { items: adminItems, label: 'System Admin' }
  ].filter(g => g.items.length > 0);

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 260 : 72 }}
      className="fixed left-0 top-0 h-full bg-surface-900 border-r border-surface-800 z-40 flex flex-col"
    >
      {/* Logo */}
      <div className="p-4 border-b border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="font-display font-bold text-white">ROAD-WATCH</h1>
              <p className="text-xs text-surface-500">{roleLabels[user?.role || ''] || 'Smart Governance'}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* User chip */}
      {sidebarOpen && user && (
        <div className="px-4 py-3 border-b border-surface-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary-400">{user.name[0]}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-surface-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav Groups */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto dark-scrollbar">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && sidebarOpen && (
              <p className="text-xs text-surface-600 font-semibold uppercase tracking-wider px-3 pt-3 pb-1.5">
                {group.label}
              </p>
            )}
            {group.label && !sidebarOpen && gi > 0 && (
              <div className="h-px bg-surface-800 mx-2 my-2" />
            )}
            {group.items.map((item) => (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'hover:bg-surface-800 group relative',
                  currentView === item.view
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                    : 'text-surface-400'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5 flex-shrink-0',
                  currentView === item.view ? 'text-primary-400' : 'text-surface-500 group-hover:text-surface-300'
                )} />
                {sidebarOpen && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-danger-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-surface-800 rounded text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="p-3 border-t border-surface-800 space-y-1">
        {filteredBottom.map((item) => (
          <button
            key={item.view}
            onClick={() => setCurrentView(item.view)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
              'hover:bg-surface-800 group',
              currentView === item.view ? 'text-primary-400' : 'text-surface-400'
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-3 top-20 w-6 h-6 bg-surface-800 border border-surface-700 rounded-full flex items-center justify-center text-surface-400 hover:text-white hover:border-primary-500 transition-colors"
      >
        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}
