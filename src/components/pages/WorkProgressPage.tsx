import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Truck, Camera, CheckCircle, Clock, AlertTriangle, MapPin,
  Calendar, TrendingUp, BarChart3, FileText, Plus, Edit2,
  Users, Package, ChevronDown, ChevronUp, Activity
} from 'lucide-react';
import { Card, StatCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { useStore } from '../../store/useStore';

export function WorkProgressPage() {
  const { projects, user, addWorkLog, updateMilestone, updateProject } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [workLogModal, setWorkLogModal] = useState<string | null>(null);
  const [wlDesc, setWlDesc] = useState('');
  const [wlWorkers, setWlWorkers] = useState('');
  const [wlMaterials, setWlMaterials] = useState('');
  const [filter, setFilter] = useState('all');

  // For contractor: only show their projects
  const isContractor = user?.role === 'contractor';
  const myProjects = isContractor
    ? projects.filter(p => p.contractor === 'contractor1')
    : projects;

  const filtered = filter === 'all' ? myProjects : myProjects.filter(p => p.status === filter);

  const active = myProjects.filter(p => p.status === 'in_progress').length;
  const planned = myProjects.filter(p => p.status === 'planned').length;
  const completed = myProjects.filter(p => p.status === 'completed').length;
  const delayed = myProjects.filter(p => p.status === 'delayed').length;
  const avgProgress = myProjects.length > 0
    ? Math.round(myProjects.reduce((a, p) => a + p.progress, 0) / myProjects.length)
    : 0;

  function handleAddWorkLog(projectId: string) {
    if (!wlDesc) return;
    addWorkLog(projectId, {
      id: `wl${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: wlDesc,
      workersCount: parseInt(wlWorkers) || 0,
      materialsUsed: wlMaterials.split(',').map(s => s.trim()).filter(Boolean),
      photos: [],
      addedBy: user?.name || 'Contractor'
    });
    setWorkLogModal(null); setWlDesc(''); setWlWorkers(''); setWlMaterials('');
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'delayed': return 'danger';
      case 'on_hold': return 'warning';
      default: return 'default';
    }
  }

  function getDaysLeft(endDate: string) {
    const d = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    return d;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Work Progress Tracker</h1>
          <p className="text-surface-400">
            {isContractor ? 'Log your daily work and update milestone progress' : 'Monitor real-time work progress across all projects'}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: 'Active', value: active, icon: <Activity className="w-5 h-5 text-white" />, bg: 'from-primary-500 to-primary-600' },
          { title: 'Planned', value: planned, icon: <Clock className="w-5 h-5 text-white" />, bg: 'from-surface-600 to-surface-700' },
          { title: 'Completed', value: completed, icon: <CheckCircle className="w-5 h-5 text-white" />, bg: 'from-accent-500 to-accent-600' },
          { title: 'Delayed', value: delayed, icon: <AlertTriangle className="w-5 h-5 text-white" />, bg: 'from-danger-500 to-danger-600' },
          { title: 'Avg Progress', value: `${avgProgress}%`, icon: <TrendingUp className="w-5 h-5 text-white" />, bg: 'from-purple-500 to-purple-600' }
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}>
            <StatCard title={s.title} value={s.value} icon={s.icon} iconBg={s.bg} changeType="neutral" />
          </motion.div>
        ))}
      </div>

      {/* Overall progress ring visual */}
      <div className="grid md:grid-cols-3 gap-4">
        {myProjects.filter(p => p.status === 'in_progress').slice(0, 3).map(project => {
          const daysLeft = project.endDate ? getDaysLeft(project.endDate) : null;
          const isOverdue = daysLeft !== null && daysLeft < 0;
          const completedMilestones = project.milestones.filter(m => m.completed).length;
          return (
            <Card key={project.id} variant="gradient">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white text-sm">{project.title}</h3>
                  <p className="text-xs text-surface-400">{project.contractorName} • {project.roadType}</p>
                </div>
                <Badge variant={isOverdue ? 'danger' : daysLeft !== null && daysLeft <= 3 ? 'warning' : 'info'} dot>
                  {isOverdue ? `${Math.abs(daysLeft!)}d overdue` : daysLeft !== null ? `${daysLeft}d left` : 'Active'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(30,41,59)" strokeWidth="3.5" />
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke={isOverdue ? 'rgb(239,68,68)' : project.progress >= 80 ? 'rgb(16,185,129)' : 'rgb(59,130,246)'}
                      strokeWidth="3.5" strokeDasharray={`${project.progress} ${100 - project.progress}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{project.progress}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-surface-400 mb-1">Milestones</p>
                  <p className="text-sm text-white font-medium">{completedMilestones}/{project.milestones.length} done</p>
                  <p className="text-xs text-surface-400">Budget: ₹{(project.spent / 1000).toFixed(0)}K / ₹{(project.budget / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-surface-500">Last relayed: {project.lastRelayingDate}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {isContractor && (
                  <Button variant="outline" size="sm" icon={<Plus className="w-3 h-3" />}
                    onClick={() => { setWorkLogModal(project.id); setWlDesc(''); setWlWorkers(''); setWlMaterials(''); }} className="flex-1">
                    Log Work
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setExpandedId(expandedId === project.id ? null : project.id)} className="flex-1">
                  Details
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'planned', 'in_progress', 'completed', 'delayed', 'on_hold'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === s ? 'bg-primary-500 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
            {s === 'all' ? 'All Projects' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Project list with work logs */}
      <div className="space-y-4">
        {filtered.map((project, idx) => {
          const isExpanded = expandedId === project.id;
          const daysLeft = project.endDate ? getDaysLeft(project.endDate) : null;
          const isOverdue = daysLeft !== null && daysLeft < 0 && project.status !== 'completed';
          return (
            <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
              <Card variant="gradient" padding="none">
                <div className="p-5">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-surface-500 font-mono">{project.id}</span>
                        <h3 className="font-semibold text-white">{project.title}</h3>
                        <Badge variant={getStatusColor(project.status) as any} dot>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">{project.roadType}</Badge>
                        {isOverdue && <Badge variant="danger" pulse>Overdue</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-surface-400 mb-3">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{project.contractorName}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{project.location.address}</span>
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{project.responsibleAuthority}</span>
                        {project.endDate && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-danger-400' : ''}`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(project.endDate).toLocaleDateString('en-IN')}
                            {daysLeft !== null && project.status !== 'completed' && (
                              <span>({isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`})</span>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-surface-400">Progress</span>
                          <span className="text-primary-400">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} variant={isOverdue ? 'danger' : project.progress === 100 ? 'success' : 'default'} />
                      </div>
                      {/* Milestones */}
                      <div className="flex flex-wrap gap-2">
                        {project.milestones.map((m, i) => (
                          <button key={i}
                            onClick={() => isContractor && updateMilestone(project.id, i, !m.completed)}
                            className={`text-xs px-2 py-1 rounded-full transition-colors ${m.completed ? 'bg-accent-500/20 text-accent-400 border border-accent-500/20' : 'bg-surface-700 text-surface-400'} ${isContractor ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}>
                            {m.completed ? '✓ ' : '○ '}{m.title}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-xs text-surface-400">Budget</p>
                        <p className="font-bold text-white">₹{(project.budget / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-accent-400">Spent: ₹{(project.spent / 1000).toFixed(0)}K</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {isContractor && project.status === 'in_progress' && (
                          <Button variant="outline" size="sm" icon={<Camera className="w-3.5 h-3.5" />}
                            onClick={() => { setWorkLogModal(project.id); setWlDesc(''); setWlWorkers(''); setWlMaterials(''); }}>
                            Log Work
                          </Button>
                        )}
                        <button onClick={() => setExpandedId(isExpanded ? null : project.id)}
                          className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          Work Logs ({project.workLogs?.length || 0})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Work Logs Expanded */}
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="border-t border-surface-700/50">
                    <div className="p-5">
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-400" />
                        Work Logs
                      </h4>
                      {(!project.workLogs || project.workLogs.length === 0) ? (
                        <p className="text-sm text-surface-500 text-center py-4">No work logs yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {(project.workLogs || []).map(log => (
                            <div key={log.id} className="bg-surface-800/50 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-surface-400" />
                                  <span className="text-sm font-medium text-white">{log.date}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-surface-400">
                                  {log.workersCount > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />{log.workersCount} workers
                                    </span>
                                  )}
                                  <span>{log.addedBy}</span>
                                </div>
                              </div>
                              <p className="text-sm text-surface-200">{log.description}</p>
                              {log.materialsUsed.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {log.materialsUsed.map((m, i) => (
                                    <span key={i} className="text-xs bg-primary-500/10 text-primary-300 border border-primary-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Package className="w-2.5 h-2.5" />{m}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Work Log Modal */}
      <Modal isOpen={!!workLogModal} onClose={() => setWorkLogModal(null)} title="Add Work Log Entry">
        <div className="space-y-4">
          <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3">
            <p className="text-sm text-primary-300">
              {workLogModal && projects.find(p => p.id === workLogModal)?.title}
            </p>
            <p className="text-xs text-surface-400">{new Date().toLocaleDateString('en-IN')}</p>
          </div>
          <Textarea label="Work Description *" value={wlDesc} onChange={e => setWlDesc(e.target.value)}
            placeholder="What work was done today? Be specific — include areas covered, techniques used, issues faced…" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Workers on Site" type="number" value={wlWorkers} onChange={e => setWlWorkers(e.target.value)} placeholder="12" />
            <Input label="Materials Used (comma-separated)" value={wlMaterials} onChange={e => setWlMaterials(e.target.value)}
              placeholder="Bitumen 200kg, Gravel 1t" />
          </div>
          <div className="bg-surface-800/50 rounded-lg p-3">
            <p className="text-xs text-surface-400 mb-2">Tip: You can also update milestone progress by clicking on the milestone buttons in the project card.</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setWorkLogModal(null)}>Cancel</Button>
            <Button onClick={() => handleAddWorkLog(workLogModal!)} disabled={!wlDesc} icon={<FileText className="w-4 h-4" />}>
              Submit Log
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
