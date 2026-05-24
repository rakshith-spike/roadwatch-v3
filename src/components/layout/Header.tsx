import { useState } from 'react';
import {
  Bell, Search, ChevronDown, LogOut, User, Settings, Moon, Sun, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { useTheme } from '../../store/themeStore';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../utils/cn';

export function Header() {
  const { user, logout, notifications, markNotificationRead, sidebarOpen, setSidebarOpen } = useStore();
  const { isDark, toggle } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className={cn(
      'fixed top-0 right-0 h-16 bg-surface-900/80 backdrop-blur-xl border-b border-surface-800 z-30 transition-all duration-300',
      sidebarOpen ? 'left-[260px]' : 'left-[72px]'
    )}>
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input type="text" placeholder="Search complaints, projects, roads..."
              className="w-80 pl-10 pr-4 py-2 bg-surface-800/50 border border-surface-700 rounded-lg text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors" />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-surface-700 rounded text-xs text-surface-400">⌘K</kbd>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle — actually works now */}
          <button onClick={toggle}
            className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className="relative p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 rounded-full text-xs text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-surface-800 border border-surface-700 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="p-4 border-b border-surface-700 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={() => notifications.forEach(n => markNotificationRead(n.id))}
                        className="text-xs text-primary-400 hover:text-primary-300">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <button key={n.id} onClick={() => markNotificationRead(n.id)}
                        className={cn('w-full p-4 text-left hover:bg-surface-700/50 transition-colors border-b border-surface-700/50 last:border-0',
                          !n.read && 'bg-primary-500/5')}>
                        <div className="flex items-start gap-3">
                          <div className={cn('w-2 h-2 mt-2 rounded-full flex-shrink-0',
                            n.type === 'success' && 'bg-accent-400',
                            n.type === 'warning' && 'bg-warning-400',
                            n.type === 'info' && 'bg-primary-400',
                            n.type === 'error' && 'bg-danger-400')} />
                          <div>
                            <p className="text-sm font-medium text-white">{n.title}</p>
                            <p className="text-xs text-surface-400 mt-0.5">{n.message}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative">
            <button onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              className="flex items-center gap-3 p-1.5 pr-3 hover:bg-surface-800 rounded-lg transition-colors">
              <Avatar name={user?.name || 'User'} size="sm" status="online" />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-surface-400 capitalize">{user?.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-surface-400" />
            </button>
            <AnimatePresence>
              {showProfile && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-surface-800 border border-surface-700 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="p-4 border-b border-surface-700">
                    <p className="font-medium text-white">{user?.name}</p>
                    <p className="text-sm text-surface-400">{user?.email}</p>
                    {user?.district && <p className="text-xs text-surface-500 mt-1">{user.district}, {user.state}</p>}
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-surface-300 hover:bg-surface-700 rounded-lg transition-colors">
                      <User className="w-4 h-4" />View Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-surface-300 hover:bg-surface-700 rounded-lg transition-colors">
                      <Settings className="w-4 h-4" />Settings
                    </button>
                    <button onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-danger-400 hover:bg-surface-700 rounded-lg transition-colors">
                      <LogOut className="w-4 h-4" />Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
