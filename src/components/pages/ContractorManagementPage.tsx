import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Star, TrendingUp, Briefcase, CheckCircle, AlertTriangle,
  Phone, Mail, MapPin, Shield, XCircle, Eye, BarChart3, Users,
  Award, Clock, Wallet, Filter
} from 'lucide-react';
import { Card, StatCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress, CircularProgress } from '../ui/Progress';
import { Modal } from '../ui/Modal';
import { useStore } from '../../store/useStore';

export function ContractorManagementPage() {
  const { contractors, projects, suspendContractor, activateContractor, updateSystemUser, user } = useStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSpec, setFilterSpec] = useState('all');
  const [selectedContractor, setSelectedContractor] = useState<string | null>(null);

  const isSuperAdmin = user?.role === 'superadmin';

  const allSpecializations = Array.from(new Set(contractors.flatMap(c => c.specialization)));

  const filtered = contractors.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterSpec !== 'all' && !c.specialization.includes(filterSpec)) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.company.toLowerCase().includes(search.toLowerCase()) &&
        !c.license.toLowerCase().includes(search.toLowerCase()) &&
        !c.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = contractors.filter(c => c.status === 'active').length;
  const suspended = contractors.filter(c => c.status === 'suspended').length;
  const avgRating = contractors.reduce((a, c) => a + c.rating, 0) / contractors.length;
  const totalBudget = contractors.reduce((a, c) => a + c.totalBudget, 0);

  const selected = contractors.find(c => c.id === selectedContractor);
  const contractorProjects = selected ? projects.filter(p => p.contractor === selected.id) : [];

  function ratingColor(r: number) {
    if (r >= 4.5) return 'text-green-400';
    if (r >= 3.5) return 'text-warning-400';
    return 'text-danger-400';
  }

  function perfColor(s: number) {
    if (s >= 85) return 'success';
    if (s >= 70) return 'warning';
    return 'danger';
  }

  async function suspendAndReflect(id: string) {
    await suspendContractor(id);
  }

  async function activateAndReflect(id: string) {
    await activateContractor(id);
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Contractor Management</h1>
          <p className="text-surface-400">Monitor performance, ratings and manage contractor accounts</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Active Contractors', value: activeCount, icon: <Users className="w-5 h-5 text-white" />, bg: 'from-primary-500 to-primary-600', change: `${suspended} suspended` },
          { title: 'Avg Rating', value: avgRating.toFixed(1), icon: <Star className="w-5 h-5 text-white" />, bg: 'from-warning-500 to-warning-600', change: 'Out of 5.0' },
          { title: 'Total Budget Managed', value: `₹${(totalBudget / 10000000).toFixed(1)}Cr`, icon: <Wallet className="w-5 h-5 text-white" />, bg: 'from-accent-500 to-accent-600', change: 'All contractors' },
          { title: 'Total Projects', value: contractors.reduce((a, c) => a + c.completedProjects + c.activeProjects, 0), icon: <Briefcase className="w-5 h-5 text-white" />, bg: 'from-purple-500 to-purple-600', change: 'Completed + Active' }
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
            <StatCard {...s} changeType="neutral" />
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card variant="gradient">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, company, or license…"
              className="w-full bg-surface-800/50 border border-surface-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-surface-500 focus:outline-none focus:border-primary-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'active', 'suspended', 'pending'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? 'bg-primary-500 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {allSpecializations.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="text-sm text-surface-400 self-center">Specialization:</span>
            {['all', ...allSpecializations].map(s => (
              <button key={s} onClick={() => setFilterSpec(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterSpec === s ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30' : 'bg-surface-800 text-surface-500 hover:text-surface-300'}`}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Contractor Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((contractor, idx) => {
          const cProjects = projects.filter(p => p.contractor === contractor.id);
          return (
            <motion.div key={contractor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card variant="gradient" hover padding="none">
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary-400">{contractor.name[0]}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{contractor.name}</h3>
                        <p className="text-sm text-surface-400">{contractor.company}</p>
                        <p className="text-xs text-surface-500 font-mono">{contractor.license}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={contractor.status === 'active' ? 'success' : contractor.status === 'suspended' ? 'danger' : 'warning'} dot>
                        {contractor.status.charAt(0).toUpperCase() + contractor.status.slice(1)}
                      </Badge>
                      <span className={`text-lg font-bold ${ratingColor(contractor.rating)}`}>
                        ★ {contractor.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="flex flex-wrap gap-3 text-xs text-surface-400 mb-4">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{contractor.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contractor.phone}</span>
                  </div>

                  {/* Regions & Specializations */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {contractor.regions.map(r => (
                      <span key={r} className="text-xs bg-primary-500/10 text-primary-400 border border-primary-500/20 px-2 py-0.5 rounded-full">{r}</span>
                    ))}
                    {contractor.specialization.map(s => (
                      <span key={s} className="text-xs bg-surface-700 text-surface-300 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>

                  {/* Performance */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-surface-400">Performance Score</span>
                      <span className="text-white font-medium">{contractor.performanceScore}%</span>
                    </div>
                    <Progress value={contractor.performanceScore} variant={perfColor(contractor.performanceScore) as any} />
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Active', value: contractor.activeProjects, icon: <Clock className="w-3.5 h-3.5" /> },
                      { label: 'Completed', value: contractor.completedProjects, icon: <CheckCircle className="w-3.5 h-3.5" /> },
                      { label: 'Budget', value: `₹${(contractor.totalBudget / 10000000).toFixed(1)}Cr`, icon: <Wallet className="w-3.5 h-3.5" /> }
                    ].map(s => (
                      <div key={s.label} className="bg-surface-800/50 rounded-lg p-2.5 text-center">
                        <div className="flex justify-center text-surface-400 mb-1">{s.icon}</div>
                        <p className="text-sm font-bold text-white">{s.value}</p>
                        <p className="text-xs text-surface-500">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedContractor(contractor.id)} className="flex-1">
                      View Profile
                    </Button>
                    {isSuperAdmin && (
                      contractor.status === 'active'
                        ? <Button variant="danger" size="sm" icon={<XCircle className="w-3.5 h-3.5" />}
                            onClick={() => suspendAndReflect(contractor.id)}>Suspend</Button>
                        : <Button variant="secondary" size="sm" icon={<CheckCircle className="w-3.5 h-3.5" />}
                            onClick={() => activateAndReflect(contractor.id)}>{contractor.status === 'pending' ? 'Accept' : 'Activate'}</Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Contractor Profile Modal */}
      <Modal isOpen={!!selectedContractor} onClose={() => setSelectedContractor(null)} title="Contractor Profile" size="lg">
        {selected && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-400">{selected.name[0]}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{selected.name}</h3>
                <p className="text-surface-300">{selected.company}</p>
                <p className="text-sm text-surface-500 font-mono">{selected.license}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={selected.status === 'active' ? 'success' : 'danger'} dot>{selected.status}</Badge>
                  <span className={`font-bold ${ratingColor(selected.rating)}`}>★ {selected.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-800/50 rounded-lg p-3">
                <p className="text-xs text-surface-400 mb-1">Email</p>
                <p className="text-sm text-white">{selected.email}</p>
              </div>
              <div className="bg-surface-800/50 rounded-lg p-3">
                <p className="text-xs text-surface-400 mb-1">Phone</p>
                <p className="text-sm text-white">{selected.phone}</p>
              </div>
            </div>

            {/* Performance Metrics */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Performance Breakdown</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Overall Score', value: selected.performanceScore },
                  { label: 'Quality', value: 92 },
                  { label: 'Timeliness', value: 85 },
                  { label: 'Cost Efficiency', value: Math.round(selected.performanceScore * 0.95) }
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-surface-400">{m.label}</span>
                      <span className="text-white">{m.value}%</span>
                    </div>
                    <Progress value={m.value} size="sm" variant={perfColor(m.value) as any} />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Projects */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Projects ({contractorProjects.length})</h4>
              {contractorProjects.length === 0 ? (
                <p className="text-sm text-surface-400">No projects assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {contractorProjects.map(p => (
                    <div key={p.id} className="flex items-center gap-3 bg-surface-800/50 rounded-lg p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{p.title}</p>
                        <p className="text-xs text-surface-400">{p.location.address}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={p.status === 'completed' ? 'success' : p.status === 'in_progress' ? 'info' : 'default'}>
                          {p.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-xs text-surface-400 mt-1">{p.progress}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isSuperAdmin && (
              <div className="flex gap-3 pt-2 border-t border-surface-700">
                {selected.status === 'active'
                  ? <Button variant="danger" icon={<XCircle className="w-4 h-4" />}
                      onClick={() => { suspendAndReflect(selected.id); setSelectedContractor(null); }}>
                      Suspend Contractor
                    </Button>
                  : <Button variant="secondary" icon={<CheckCircle className="w-4 h-4" />}
                      onClick={() => { activateAndReflect(selected.id); setSelectedContractor(null); }}>
                      {selected.status === 'pending' ? 'Accept Contractor' : 'Reactivate Contractor'}
                    </Button>
                }
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
