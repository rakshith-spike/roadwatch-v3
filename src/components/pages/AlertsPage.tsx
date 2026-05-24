import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, AlertTriangle, AlertCircle, CheckCircle, Info,
  Droplets, Zap, Clock, MapPin, Volume2, VolumeX, Eye,
  ChevronRight, ArrowRight, X
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useStore } from '../../store/useStore';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  location?: string;
  time: string;
  read: boolean;
  // who this alert targets
  audience: ('citizen' | 'contractor' | 'government' | 'superadmin')[];
  // only gov/admin can take action; citizen/contractor get info-only
  govAction?: string;       // label for gov button
  contractorAction?: string;// label shown to contractor (navigate only)
  citizenNote?: string;     // read-only note for citizens
}

const ALL_ALERTS: Alert[] = [
  {
    id: 'a1', type: 'critical',
    title: 'Flood Risk Alert — Whitefield',
    message: 'Heavy rainfall predicted. 3 drainage complaints in critical zone. Infrastructure team notified.',
    location: 'Whitefield, Bangalore', time: '5 mins ago', read: false,
    audience: ['citizen', 'contractor', 'government', 'superadmin'],
    govAction: 'Issue Emergency Order',
    contractorAction: 'View Project',
    citizenNote: 'Avoid low-lying roads in this area.',
  },
  {
    id: 'a2', type: 'warning',
    title: 'SLA Breach Warning — C003',
    message: 'Complaint C003 (Road Crack, HSR Layout) is approaching SLA deadline. Only 6 hours remaining.',
    time: '15 mins ago', read: false,
    audience: ['government', 'superadmin'],
    govAction: 'Escalate Complaint',
  },
  {
    id: 'a3', type: 'warning',
    title: 'Project Delay — MG Road',
    message: 'MG Road repair project is behind schedule by 2 days. Resource reallocation recommended.',
    location: 'MG Road, Bangalore', time: '1 hr ago', read: false,
    audience: ['contractor', 'government', 'superadmin'],
    govAction: 'Issue Warning to Contractor',
    contractorAction: 'Update Progress',
  },
  {
    id: 'a4', type: 'info',
    title: 'New Hotspot Detected — Koramangala',
    message: 'AI identified Koramangala 4th Block as emerging hotspot with 12 new complaints in 24 hours.',
    location: 'Koramangala, Bangalore', time: '2 hrs ago', read: true,
    audience: ['government', 'superadmin'],
    govAction: 'View Hotspot Analysis',
  },
  {
    id: 'a5', type: 'success',
    title: 'Road Repair Completed — HSR Layout',
    message: 'HSR Layout road repair project completed successfully. Quality inspection passed. Score: 94%.',
    location: 'HSR Layout, Bangalore', time: '3 hrs ago', read: true,
    audience: ['citizen', 'contractor', 'government', 'superadmin'],
    citizenNote: 'Road is now fully operational.',
  },
  {
    id: 'a6', type: 'info',
    title: 'Budget Sanction — Q2 Approved',
    message: '₹5 Crore budget sanctioned for road infrastructure Q2. Projects can now be initiated.',
    time: '5 hrs ago', read: true,
    audience: ['government', 'superadmin'],
    govAction: 'Allocate to Projects',
  },
  {
    id: 'a7', type: 'warning',
    title: 'High Accident Zone — Silk Board',
    message: 'Multiple accidents reported near Silk Board junction due to poor road condition.',
    location: 'Silk Board, Bangalore', time: '6 hrs ago', read: true,
    audience: ['citizen', 'government', 'superadmin'],
    govAction: 'Prioritise Complaint',
    citizenNote: 'Exercise caution while driving in this area.',
  },
  {
    id: 'a8', type: 'critical',
    title: 'Emergency Road Closure — Ring Road',
    message: 'Ring Road section closed due to major crack. Diversion in effect. Urgent repair needed.',
    location: 'Ring Road, Bangalore', time: '8 hrs ago', read: true,
    audience: ['citizen', 'contractor', 'government', 'superadmin'],
    govAction: 'Assign Emergency Contractor',
    contractorAction: 'Accept Assignment',
    citizenNote: 'Use alternate route via Outer Ring Road.',
  },
  {
    id: 'a9', type: 'info',
    title: 'Your Complaint C004 Updated',
    message: 'The drainage overflow complaint you reported on Whitefield Main Road has been verified and assigned.',
    time: '10 hrs ago', read: false,
    audience: ['citizen'],
    citizenNote: 'Track your complaint in the Complaints section.',
  },
  {
    id: 'a10', type: 'success',
    title: 'Work Log Submitted Successfully',
    message: 'Your work log entry for MG Road Pothole Repair project has been recorded for 18 Jan 2024.',
    time: '12 hrs ago', read: true,
    audience: ['contractor'],
    contractorAction: 'View Project',
  },
];

export function AlertsPage() {
  const { user, setCurrentView } = useStore();
  const role = user?.role ?? 'citizen';

  const myAlerts = ALL_ALERTS.filter(a => a.audience.includes(role as any));

  const [alerts, setAlerts] = useState(myAlerts);
  const [filter, setFilter] = useState('all');
  const [muted, setMuted] = useState(false);

  const filtered = alerts.filter(a => filter === 'all' || a.type === filter);
  const unread = alerts.filter(a => !a.read).length;

  const markRead = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  const markAllRead = () => setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  const dismiss = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));

  const isGov = role === 'government' || role === 'superadmin';
  const isContractor = role === 'contractor';
  const isCitizen = role === 'citizen';

  const alertIcon = (type: string) => {
    switch (type) {
      case 'critical': return AlertTriangle;
      case 'warning':  return AlertCircle;
      case 'success':  return CheckCircle;
      default:         return Info;
    }
  };

  const alertStyle = (type: string) => {
    switch (type) {
      case 'critical': return { card: 'border-l-danger-500',  icon: 'bg-danger-500/10 text-danger-400',   badge: 'danger' as const };
      case 'warning':  return { card: 'border-l-warning-500', icon: 'bg-warning-500/10 text-warning-400', badge: 'warning' as const };
      case 'success':  return { card: 'border-l-accent-500',  icon: 'bg-accent-500/10 text-accent-400',   badge: 'success' as const };
      default:         return { card: 'border-l-primary-500', icon: 'bg-primary-500/10 text-primary-400', badge: 'info' as const };
    }
  };

  const categories = ['all','critical','warning','info','success'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning-500 to-danger-500 flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 rounded-full text-xs text-white flex items-center justify-center">{unread}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Alerts & Notifications</h1>
            <p className="text-surface-400">
              {unread > 0 ? `${unread} unread` : 'All caught up'} •{' '}
              {isCitizen ? 'Updates about your area & complaints' :
               isContractor ? 'Project & work updates' :
               'System alerts requiring your attention'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            onClick={() => setMuted(!muted)}>
            {muted ? 'Unmute' : 'Mute'}
          </Button>
          {unread > 0 && <Button variant="outline" onClick={markAllRead}>Mark All Read</Button>}
        </div>
      </motion.div>

      {/* Filter tabs */}
      <Card variant="gradient" className="p-2">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const count = cat === 'all' ? alerts.length : alerts.filter(a => a.type === cat).length;
            return (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${filter === cat ? 'bg-primary-500 text-white' : 'text-surface-400 hover:bg-surface-800 hover:text-white'}`}>
                {cat}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === cat ? 'bg-white/20' : 'bg-surface-700 text-surface-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Alert List */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {filtered.length === 0 && (
              <Card variant="bordered" className="text-center py-12">
                <Bell className="w-12 h-12 text-surface-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-white mb-1">No alerts</p>
                <p className="text-surface-400">You're all caught up!</p>
              </Card>
            )}
            {filtered.map((alert, i) => {
              const Icon = alertIcon(alert.type);
              const s = alertStyle(alert.type);
              return (
                <motion.div key={alert.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -80 }} transition={{ delay: i * 0.04 }}>
                  <Card variant="gradient" hover
                    className={`relative overflow-hidden ${!alert.read ? `border-l-4 ${s.card}` : ''}`}
                    onClick={() => markRead(alert.id)}>
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.icon}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-semibold ${!alert.read ? 'text-white' : 'text-surface-300'}`}>
                            {alert.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant={s.badge}>{alert.type}</Badge>
                            {!alert.read && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
                          </div>
                        </div>
                        <p className="text-sm text-surface-400 mb-2">{alert.message}</p>

                        {/* Citizen-specific note */}
                        {isCitizen && alert.citizenNote && (
                          <div className="flex items-start gap-2 mt-2 p-2 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                            <Info className="w-3.5 h-3.5 text-primary-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-primary-300">{alert.citizenNote}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-surface-500 mt-2">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{alert.time}</span>
                          {alert.location && (
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{alert.location}</span>
                          )}
                        </div>
                      </div>

                      {/* Dismiss for citizen/contractor (non-destructive) */}
                      {(isCitizen || isContractor) && (
                        <button onClick={e => { e.stopPropagation(); dismiss(alert.id); }}
                          className="p-1 text-surface-600 hover:text-surface-300 self-start rounded transition-colors" title="Dismiss">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Role-based action buttons */}
                    {isGov && alert.govAction && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-surface-700/50">
                        <Button size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}
                          onClick={e => { e.stopPropagation(); markRead(alert.id); setCurrentView('complaints'); }}>
                          {alert.govAction}
                        </Button>
                        <Button size="sm" variant="ghost"
                          onClick={e => { e.stopPropagation(); markRead(alert.id); }}>
                          Acknowledge
                        </Button>
                      </div>
                    )}

                    {isContractor && alert.contractorAction && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-surface-700/50">
                        <Button size="sm" variant="outline" icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={e => { e.stopPropagation(); markRead(alert.id); setCurrentView('projects'); }}>
                          {alert.contractorAction}
                        </Button>
                      </div>
                    )}

                    {isCitizen && alert.type !== 'success' && alert.location && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-surface-700/50">
                        <Button size="sm" variant="ghost" icon={<MapPin className="w-3.5 h-3.5" />}
                          onClick={e => { e.stopPropagation(); markRead(alert.id); setCurrentView('map'); }}>
                          View on Map
                        </Button>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Role note */}
          <Card variant="gradient">
            <div className={`p-3 rounded-lg mb-3 ${
              isCitizen    ? 'bg-primary-500/10 border border-primary-500/20' :
              isContractor ? 'bg-accent-500/10 border border-accent-500/20' :
                             'bg-warning-500/10 border border-warning-500/20'
            }`}>
              <p className={`text-xs font-semibold mb-1 ${
                isCitizen ? 'text-primary-400' : isContractor ? 'text-accent-400' : 'text-warning-400'
              }`}>
                {isCitizen ? '👤 Citizen View' : isContractor ? '🔧 Contractor View' : '🏛️ Admin View'}
              </p>
              <p className="text-xs text-surface-400">
                {isCitizen    ? 'You receive area updates & complaint status. You can view on map or dismiss.' :
                 isContractor ? 'You receive project & work updates. Navigate to relevant sections.' :
                                'You can take official action on alerts — assign, escalate, or acknowledge.'}
              </p>
            </div>

            <h3 className="font-semibold text-white mb-4">Alert Types</h3>
            <div className="space-y-3">
              {[
                { icon: AlertTriangle, bg: 'bg-danger-500/20', ic: 'text-danger-400', label: 'Critical', desc: 'Immediate attention required' },
                { icon: AlertCircle,   bg: 'bg-warning-500/20', ic: 'text-warning-400', label: 'Warning',  desc: 'Action needed soon' },
                { icon: Info,          bg: 'bg-primary-500/20', ic: 'text-primary-400', label: 'Info',     desc: 'General updates' },
                { icon: CheckCircle,   bg: 'bg-accent-500/20',  ic: 'text-accent-400',  label: 'Success',  desc: 'Completed actions' },
              ].map(t => (
                <div key={t.label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${t.bg} flex items-center justify-center`}>
                    <t.icon className={`w-4 h-4 ${t.ic}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.label}</p>
                    <p className="text-xs text-surface-400">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="gradient">
            <h3 className="font-semibold text-white mb-4">Alert Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Alerts', value: alerts.length },
                { label: 'Unread',       value: unread },
                { label: 'Critical',     value: alerts.filter(a => a.type === 'critical').length },
                { label: 'This Area',    value: alerts.filter(a => !!a.location).length },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-surface-400 text-sm">{s.label}</span>
                  <span className="text-white font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="gradient">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-warning-400" />
              <h3 className="font-semibold text-white">Live Monitoring</h3>
            </div>
            <div className="space-y-3">
              {[
                { icon: Droplets,      color: 'text-primary-400', label: 'Flood Zones' },
                { icon: AlertTriangle, color: 'text-warning-400', label: 'High Risk Roads' },
                { icon: Clock,         color: 'text-danger-400',  label: 'SLA Deadlines' },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between p-2 bg-surface-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                    <span className="text-sm text-surface-300">{m.label}</span>
                  </div>
                  <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
