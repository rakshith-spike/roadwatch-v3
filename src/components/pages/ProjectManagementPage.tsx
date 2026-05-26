import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Calendar, MapPin, Wallet, TrendingUp,
  CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp,
  Camera, FileText, X, Edit2, Users, BarChart3, PlayCircle, PauseCircle
} from 'lucide-react';
import { Card, StatCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge, StatusBadge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Modal } from '../ui/Modal';
import { Input, Textarea, Select } from '../ui/Input';
import { useStore } from '../../store/useStore';

function statusColor(status: string) {
  switch (status) {
    case 'completed': return 'success';
    case 'in_progress': return 'info';
    case 'delayed': return 'danger';
    case 'on_hold': return 'warning';
    default: return 'default';
  }
}

function statusLabel(status: string) {
  return status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function ProjectManagementPage() {
  const { projects, contractors, complaints, user, updateProject, addProject, addWorkLog, updateMilestone, addBudgetEntry } = useStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [workLogModal, setWorkLogModal] = useState<string | null>(null);
  const [progressModal, setProgressModal] = useState<string | null>(null);

  // Work log form
  const [wlDesc, setWlDesc] = useState('');
  const [wlWorkers, setWlWorkers] = useState('');
  const [wlMaterials, setWlMaterials] = useState('');

  // Create project form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newContractor, setNewContractor] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newRoadType, setNewRoadType] = useState<'NH' | 'SH' | 'MDR' | 'ODR' | 'Urban Arterial' | 'Ward Road' | 'Expressway'>('MDR');
  const [newLastRelayingDate, setNewLastRelayingDate] = useState('');
  const [newAuthority, setNewAuthority] = useState('BBMP Road Infrastructure Division');
  const [newEngineer, setNewEngineer] = useState('');
  const [newBudgetSource, setNewBudgetSource] = useState('BBMP Ward Infrastructure Grant FY 2024-25');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newDistrict, setNewDistrict] = useState('Bangalore Urban');
  const [newComplaints, setNewComplaints] = useState<string[]>([]);

  // Progress edit
  const [newProgress, setNewProgress] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState('');

  const isContractor = user?.role === 'contractor';
  const isGovOrAdmin = user?.role === 'government' || user?.role === 'superadmin';

  const myContractorId = isContractor ? 'contractor1' : null;
  const visibleProjects = projects.filter(p => {
    if (isContractor && myContractorId && p.contractor !== myContractorId) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
        !p.location.address.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalBudget = visibleProjects.reduce((a, p) => a + p.budget, 0);
  const totalSpent = visibleProjects.reduce((a, p) => a + p.spent, 0);
  const activeCount = visibleProjects.filter(p => p.status === 'in_progress').length;
  const completedCount = visibleProjects.filter(p => p.status === 'completed').length;

  function handleCreateProject() {
    if (!newTitle || !newContractor || !newBudget) return;
    const contractor = contractors.find(c => c.id === newContractor);
    const id = `P${String(Date.now()).slice(-4)}`;
    const budget = parseInt(newBudget);
    addProject({
      id, title: newTitle, description: newDesc,
      roadType: newRoadType,
      lastRelayingDate: newLastRelayingDate || newStart || new Date().toISOString().split('T')[0],
      responsibleAuthority: newAuthority,
      executiveEngineer: newEngineer || 'Executive Engineer - Road Works',
      budgetSource: newBudgetSource,
      qualityScore: 70,
      contractor: newContractor, contractorName: contractor?.company,
      budget, spent: 0, startDate: newStart, endDate: newEnd,
      status: 'planned', progress: 0,
      location: { lat: 12.97, lng: 77.59, address: newAddress, district: newDistrict },
      complaints: newComplaints, milestones: [], workLogs: [],
      approvedBy: user?.name
    });
    addBudgetEntry({
      id: `B${Date.now()}`, projectId: id, projectTitle: newTitle,
      contractor: contractor?.company || newContractor, amount: budget,
      type: 'allocation', status: 'approved',
      requestedAt: new Date().toISOString().split('T')[0],
      approvedAt: new Date().toISOString().split('T')[0],
      approvedBy: user?.name,
      district: newDistrict,
      source: newBudgetSource,
      sanctionReference: `RW/${newDistrict.replace(/\s+/g, '').toUpperCase()}/${String(Date.now()).slice(-5)}`
    });
    // mark complaints as assigned
    newComplaints.forEach(cid => {
      useStore.getState().updateComplaint(cid, { status: 'assigned', assignedTo: newContractor });
    });
    setCreateModal(false);
    setNewTitle(''); setNewDesc(''); setNewContractor(''); setNewBudget('');
    setNewRoadType('MDR'); setNewLastRelayingDate(''); setNewAuthority('BBMP Road Infrastructure Division'); setNewEngineer(''); setNewBudgetSource('BBMP Ward Infrastructure Grant FY 2024-25');
    setNewStart(''); setNewEnd(''); setNewAddress(''); setNewComplaints([]);
  }

  function handleAddWorkLog(projectId: string) {
    if (!wlDesc) return;
    addWorkLog(projectId, {
      id: `wl${Date.now()}`, date: new Date().toISOString().split('T')[0],
      description: wlDesc, workersCount: parseInt(wlWorkers) || 0,
      materialsUsed: wlMaterials.split(',').map(s => s.trim()).filter(Boolean),
      photos: [], addedBy: user?.name || 'Contractor'
    });
    setWorkLogModal(null); setWlDesc(''); setWlWorkers(''); setWlMaterials('');
  }

  function handleUpdateProgress(projectId: string) {
    const p = parseInt(newProgress);
    if (isNaN(p) || p < 0 || p > 100) return;
    updateProject(projectId, {
      progress: p,
      status: (newProjectStatus as any) || undefined,
      spent: newProjectStatus === 'completed' ? projects.find(pr => pr.id === projectId)?.budget : undefined
    });
    setProgressModal(null);
  }

  function handleMarkComplete(projectId: string) {
    const project = projects.find(pr => pr.id === projectId);
    if (!project) return;
    updateProject(projectId, {
      progress: 100,
      status: 'completed',
      spent: project.budget,
      milestones: project.milestones.map((milestone) => ({ ...milestone, completed: true })),
      notes: `${project.notes ? `${project.notes}\n` : ''}Completed and ready for final quality verification.`
    } as any);
  }

  const unverifiedComplaints = complaints.filter(c => c.status === 'verified' || c.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isContractor ? 'My Projects' : 'Project Management'}
          </h1>
          <p className="text-surface-400">
            {isContractor ? 'Track your assigned work and update progress' : 'Create, assign and monitor all infrastructure projects'}
          </p>
        </div>
        {isGovOrAdmin && (
          <Button onClick={() => setCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
            Create Project
          </Button>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Projects', value: visibleProjects.length, icon: <BarChart3 className="w-5 h-5 text-white" />, bg: 'from-primary-500 to-primary-600', change: 'All time' },
          { title: 'Active', value: activeCount, icon: <PlayCircle className="w-5 h-5 text-white" />, bg: 'from-accent-500 to-accent-600', change: 'In progress' },
          { title: 'Completed', value: completedCount, icon: <CheckCircle className="w-5 h-5 text-white" />, bg: 'from-green-500 to-green-600', change: 'This quarter' },
          { title: 'Budget Used', value: `₹${(totalSpent / 100000).toFixed(1)}L`, icon: <Wallet className="w-5 h-5 text-white" />, bg: 'from-warning-500 to-warning-600', change: `of ₹${(totalBudget / 100000).toFixed(1)}L allocated` }
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
            <StatCard title={s.title} value={s.value} change={s.change} changeType="neutral" icon={s.icon} iconBg={s.bg} />
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card variant="gradient">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…"
              className="w-full bg-surface-800/50 border border-surface-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-surface-500 focus:outline-none focus:border-primary-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'planned', 'in_progress', 'completed', 'delayed', 'on_hold'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? 'bg-primary-500 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
                {s === 'all' ? 'All' : statusLabel(s)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Project List */}
      <div className="space-y-4">
        {visibleProjects.length === 0 && (
          <Card variant="gradient">
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-surface-600 mx-auto mb-3" />
              <p className="text-surface-400">No projects found</p>
            </div>
          </Card>
        )}
        {visibleProjects.map((project, idx) => {
          const isExpanded = expandedId === project.id;
          const contractor = contractors.find(c => c.id === project.contractor);
          const daysLeft = project.endDate
            ? Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86400000)
            : null;
          const isOverdue = daysLeft !== null && daysLeft < 0 && project.status !== 'completed';

          return (
            <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card variant="gradient" padding="none">
                {/* Project Header */}
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-surface-500 font-mono">{project.id}</span>
                        <h3 className="font-semibold text-white">{project.title}</h3>
                        <Badge variant={statusColor(project.status) as any} dot>
                          {statusLabel(project.status)}
                        </Badge>
                        <Badge variant="outline">{project.roadType}</Badge>
                        {isOverdue && <Badge variant="danger" pulse dot>Overdue</Badge>}
                      </div>
                      <p className="text-sm text-surface-400 mb-3">{project.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-surface-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{project.location.address}</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{project.contractorName || contractor?.company}</span>
                        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />Last relayed: {project.lastRelayingDate}</span>
                        {project.endDate && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-danger-400' : daysLeft !== null && daysLeft <= 5 ? 'text-warning-400' : ''}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            Due: {new Date(project.endDate).toLocaleDateString('en-IN')}
                            {daysLeft !== null && project.status !== 'completed' && (
                              <span className="ml-1">({isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`})</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 md:min-w-[140px]">
                      <div className="text-right">
                        <p className="text-xs text-surface-400">Budget</p>
                        <p className="font-bold text-white">₹{(project.budget / 100000).toFixed(1)}L</p>
                        <p className="text-xs text-accent-400">Spent: ₹{(project.spent / 100000).toFixed(1)}L</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-surface-400">Overall Progress</span>
                      <span className="text-primary-400 font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress}
                      variant={project.progress === 100 ? 'success' : isOverdue ? 'danger' : 'default'} />
                  </div>

                  {/* Milestones preview */}
                  {project.milestones.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {project.milestones.map((m, i) => (
                        <button key={i}
                          onClick={() => isContractor && updateMilestone(project.id, i, !m.completed)}
                          className={`text-xs px-2 py-1 rounded-full transition-colors ${m.completed ? 'bg-accent-500/20 text-accent-400' : 'bg-surface-700 text-surface-400 hover:bg-surface-600'} ${isContractor ? 'cursor-pointer' : 'cursor-default'}`}>
                          {m.completed ? '✓ ' : ''}{m.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <button onClick={() => setExpandedId(isExpanded ? null : project.id)}
                      className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isExpanded ? 'Hide' : 'View'} Details
                    </button>
                    {isContractor && (
                      <>
                        <Button variant="outline" size="sm" icon={<Camera className="w-3.5 h-3.5" />}
                          onClick={() => { setWorkLogModal(project.id); setWlDesc(''); setWlWorkers(''); setWlMaterials(''); }}>
                          Add Work Log
                        </Button>
                        <Button variant="ghost" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />}
                          onClick={() => { setProgressModal(project.id); setNewProgress(String(project.progress)); setNewProjectStatus(project.status); }}>
                          Update Progress
                        </Button>
                      </>
                    )}
                    {isGovOrAdmin && (
                      <>
                        <Button variant="ghost" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />}
                          onClick={() => { setProgressModal(project.id); setNewProgress(String(project.progress)); setNewProjectStatus(project.status); }}>
                          Update Status
                        </Button>
                        {project.status !== 'completed' && (
                          <Button variant="secondary" size="sm" icon={<CheckCircle className="w-3.5 h-3.5" />}
                            onClick={() => handleMarkComplete(project.id)}>
                            Mark Complete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-surface-700/50">
                      <div className="p-5 grid md:grid-cols-2 gap-6">
                        {/* Work Logs */}
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary-400" /> Work Logs ({project.workLogs?.length || 0})
                          </h4>
                          {(!project.workLogs || project.workLogs.length === 0) ? (
                            <p className="text-sm text-surface-500">No work logs yet.</p>
                          ) : (
                            <div className="space-y-3">
                              {(project.workLogs || []).map(log => (
                                <div key={log.id} className="bg-surface-800/50 rounded-lg p-3">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-xs text-surface-400">{log.date}</span>
                                    <span className="text-xs text-surface-500">{log.addedBy}</span>
                                  </div>
                                  <p className="text-sm text-white">{log.description}</p>
                                  {log.workersCount > 0 && <p className="text-xs text-surface-400 mt-1">Workers: {log.workersCount}</p>}
                                  {log.materialsUsed.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {log.materialsUsed.map((m, i) => (
                                        <span key={i} className="text-xs bg-surface-700 text-surface-300 px-2 py-0.5 rounded">{m}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Milestones detail + meta */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-accent-400" /> Milestones
                            </h4>
                            {project.milestones.length === 0 ? (
                              <p className="text-sm text-surface-500">No milestones defined.</p>
                            ) : (
                              <div className="space-y-2">
                                {project.milestones.map((m, i) => (
                                  <div key={i} className="flex items-center gap-3">
                                    <button onClick={() => isContractor && updateMilestone(project.id, i, !m.completed)}
                                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${m.completed ? 'border-accent-500 bg-accent-500' : 'border-surface-600'} ${isContractor ? 'cursor-pointer' : 'cursor-default'}`}>
                                      {m.completed && <CheckCircle className="w-3 h-3 text-white" />}
                                    </button>
                                    <div className="flex-1">
                                      <p className={`text-sm ${m.completed ? 'text-white line-through opacity-60' : 'text-white'}`}>{m.title}</p>
                                      <p className="text-xs text-surface-500">{new Date(m.date).toLocaleDateString('en-IN')}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {project.approvedBy && (
                            <div className="bg-surface-800/50 rounded-lg p-3">
                              <p className="text-xs text-surface-400">Approved by</p>
                              <p className="text-sm text-white">{project.approvedBy}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-surface-800/50 rounded-lg p-3">
                              <p className="text-xs text-surface-400">Road Type</p>
                              <p className="text-sm text-white">{project.roadType}</p>
                            </div>
                            <div className="bg-surface-800/50 rounded-lg p-3">
                              <p className="text-xs text-surface-400">Last Relaying Date</p>
                              <p className="text-sm text-white">{project.lastRelayingDate}</p>
                            </div>
                            <div className="bg-surface-800/50 rounded-lg p-3">
                              <p className="text-xs text-surface-400">Responsible Authority</p>
                              <p className="text-sm text-white">{project.responsibleAuthority}</p>
                            </div>
                            <div className="bg-surface-800/50 rounded-lg p-3">
                              <p className="text-xs text-surface-400">Executive Engineer</p>
                              <p className="text-sm text-white">{project.executiveEngineer}</p>
                            </div>
                            <div className="bg-surface-800/50 rounded-lg p-3 col-span-2">
                              <p className="text-xs text-surface-400">Budget Source</p>
                              <p className="text-sm text-white">{project.budgetSource}</p>
                            </div>
                          </div>
                          {project.notes && (
                            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3">
                              <p className="text-xs text-primary-400 mb-1">Notes</p>
                              <p className="text-sm text-white">{project.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Create Project Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create New Project" size="lg">
        <div className="space-y-4">
          <Input label="Project Title *" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. MG Road Resurfacing Phase 2" />
          <Textarea label="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Detailed description of work to be done…" />
          <Select label="Assign Contractor *" value={newContractor} onChange={e => setNewContractor(e.target.value)}
            options={[{ value: '', label: 'Select contractor…' }, ...contractors.filter(c => c.status === 'active').map(c => ({ value: c.id, label: `${c.company} — ${c.name}` }))]} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Road Type *" value={newRoadType} onChange={e => setNewRoadType(e.target.value as any)}
              options={['NH', 'SH', 'MDR', 'ODR', 'Urban Arterial', 'Ward Road', 'Expressway'].map(type => ({ value: type, label: type }))} />
            <Input label="Last Relaying Date" type="date" value={newLastRelayingDate} onChange={e => setNewLastRelayingDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Budget (₹) *" type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder="500000" />
            <Select label="District" value={newDistrict} onChange={e => setNewDistrict(e.target.value)}
              options={['Bangalore Urban', 'Bangalore Rural', 'Mysore', 'Hubli', 'Mangalore'].map(d => ({ value: d, label: d }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Responsible Authority *" value={newAuthority} onChange={e => setNewAuthority(e.target.value)} placeholder="BBMP / PWD / NHAI division" />
            <Input label="Executive Engineer *" value={newEngineer} onChange={e => setNewEngineer(e.target.value)} placeholder="Er. Name, Zone" />
          </div>
          <Input label="Budget Source *" value={newBudgetSource} onChange={e => setNewBudgetSource(e.target.value)} placeholder="Scheme / grant / sanction source" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={newStart} onChange={e => setNewStart(e.target.value)} />
            <Input label="End Date" type="date" value={newEnd} onChange={e => setNewEnd(e.target.value)} />
          </div>
          <Input label="Site Address" value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="e.g. MG Road, Bangalore" />
          <div>
            <p className="text-sm font-medium text-surface-300 mb-2">Link Complaints (optional)</p>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {complaints.filter(c => c.status !== 'resolved').map(c => (
                <label key={c.id} className="flex items-center gap-3 p-2 bg-surface-800/50 rounded-lg cursor-pointer hover:bg-surface-700/50">
                  <input type="checkbox" checked={newComplaints.includes(c.id)}
                    onChange={e => setNewComplaints(e.target.checked ? [...newComplaints, c.id] : newComplaints.filter(id => id !== c.id))}
                    className="accent-primary-500" />
                  <div>
                    <p className="text-sm text-white">{c.id}: {c.title}</p>
                    <p className="text-xs text-surface-400">{c.location.address} • {c.severity}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} disabled={!newTitle || !newContractor || !newBudget}>
              Create Project
            </Button>
          </div>
        </div>
      </Modal>

      {/* Work Log Modal */}
      <Modal isOpen={!!workLogModal} onClose={() => setWorkLogModal(null)} title="Add Work Log Entry">
        <div className="space-y-4">
          <Textarea label="Work Description *" value={wlDesc} onChange={e => setWlDesc(e.target.value)}
            placeholder="Describe work done today…" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Workers on Site" type="number" value={wlWorkers} onChange={e => setWlWorkers(e.target.value)} placeholder="12" />
            <Input label="Materials Used" value={wlMaterials} onChange={e => setWlMaterials(e.target.value)}
              placeholder="Bitumen 200kg, Gravel 1t" />
          </div>
          <p className="text-xs text-surface-500">Separate multiple materials with commas</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setWorkLogModal(null)}>Cancel</Button>
            <Button onClick={() => handleAddWorkLog(workLogModal!)} disabled={!wlDesc}>Submit Log</Button>
          </div>
        </div>
      </Modal>

      {/* Progress Update Modal */}
      <Modal isOpen={!!progressModal} onClose={() => setProgressModal(null)} title="Update Project Progress">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Progress ({newProgress}%)</label>
            <input type="range" min={0} max={100} value={newProgress}
              onChange={e => { setNewProgress(e.target.value); if (e.target.value === '100') setNewProjectStatus('completed'); }}
              className="w-full accent-primary-500" />
            <div className="flex justify-between text-xs text-surface-500 mt-1"><span>0%</span><span>50%</span><span>100%</span></div>
          </div>
          <Select label="Project Status" value={newProjectStatus} onChange={e => setNewProjectStatus(e.target.value)}
            options={[
              { value: 'planned', label: 'Planned' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'on_hold', label: 'On Hold' },
              { value: 'delayed', label: 'Delayed' },
              { value: 'completed', label: 'Completed' }
            ]} />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setProgressModal(null)}>Cancel</Button>
            <Button onClick={() => handleUpdateProgress(progressModal!)}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
