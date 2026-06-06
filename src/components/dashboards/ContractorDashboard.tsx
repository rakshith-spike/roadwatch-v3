import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Calendar,
  MapPin,
  Camera,
  FileText,
  Users,
  ArrowUpRight,
  Bot,
  Target
} from 'lucide-react';
import { Card, StatCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/Badge';
import { Progress, CircularProgress } from '../ui/Progress';
import { LineChartComponent } from '../charts/Charts';
import { Modal } from '../ui/Modal';
import { useStore, Project } from '../../store/useStore';
import { api } from '../../services/api';
import { mapApiProject } from '../../utils/projectMapper';

export function ContractorDashboard() {
  const { user, setCurrentView } = useStore();
  const [backendProjects, setBackendProjects] = useState<Project[]>([]);
  const [progressModal, setProgressModal] = useState<string | null>(null);
  const [newProgress, setNewProgress] = useState('0');
  const [saving, setSaving] = useState(false);

  async function loadProjects() {
    if (user?.role !== 'contractor') return;
    const response = await api.getProjects();
    setBackendProjects(response.projects.map((project: any) => mapApiProject(project, user?.name)));
  }

  useEffect(() => {
    let mounted = true;
    if (user?.role !== 'contractor') return;
    api.getProjects()
      .then((response) => {
        if (mounted) setBackendProjects(response.projects.map((project: any) => mapApiProject(project, user?.name)));
      })
      .catch((error) => {
        console.error('Failed to load contractor projects:', error);
        if (mounted) setBackendProjects([]);
      });
    return () => { mounted = false; };
  }, [user?.role, user?.name]);

  const visibleProjects = backendProjects;

  const assignedProjects = visibleProjects.filter(p => p.status === 'planned' || p.status === 'in_progress');
  const activeProjects = visibleProjects.filter(p => p.status === 'in_progress');
  const completedProjects = visibleProjects.filter(p => p.status === 'completed');
  const totalBudget = visibleProjects.reduce((acc, p) => acc + p.budget, 0);
  const totalSpent = visibleProjects.reduce((acc, p) => acc + p.spent, 0);
  const allWorkLogs = visibleProjects.flatMap(p => p.workLogs || []);
  const progressPhotoCount = allWorkLogs.reduce((sum, log) => sum + (log.photos?.length || 0), 0);
  const averageCompletionTime = completedProjects.length ? 5.2 : 6.8;
  const successRate = visibleProjects.length ? Math.round((completedProjects.length / visibleProjects.length) * 100) : 0;

  const budgetData = [
    { name: 'Jan', allocated: 500000, spent: 420000 },
    { name: 'Feb', allocated: 650000, spent: 580000 },
    { name: 'Mar', allocated: 800000, spent: 720000 },
    { name: 'Apr', allocated: 550000, spent: 490000 },
    { name: 'May', allocated: 700000, spent: 600000 },
    { name: 'Jun', allocated: 900000, spent: 650000 },
  ];

  const performanceData = [
    { name: 'Completion', value: successRate },
    { name: 'Progress', value: visibleProjects.length ? Math.round(visibleProjects.reduce((sum, p) => sum + p.progress, 0) / visibleProjects.length) : 0 },
    { name: 'Budget Used', value: totalBudget ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0 },
    { name: 'Evidence Logs', value: visibleProjects.length ? Math.min(100, allWorkLogs.length * 20) : 0 },
  ];

  const upcomingDeadlines = assignedProjects
    .map((project) => ({
      project: project.title,
      daysLeft: Math.max(0, Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86400000)),
      progress: project.progress
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);

  const aiRecommendations = [
    { type: 'warning', message: 'Street Light project may need additional resources to meet deadline', action: 'View Details' },
    { type: 'info', message: 'Weather forecast shows rain next week - consider adjusting schedule', action: 'Reschedule' },
    { type: 'success', message: 'MG Road project is ahead of schedule - great work!', action: 'View Report' },
  ];

  async function updateProjectProgress(projectId: string, progress: number) {
    const status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'planned';
    setSaving(true);
    try {
      await api.updateProject(projectId, {
        progress,
        status,
        spent: status === 'completed' ? visibleProjects.find(p => p.id === projectId)?.budget : undefined
      });
      await loadProjects();
      setProgressModal(null);
    } catch (error) {
      console.error('Failed to update project progress:', error);
      alert('Could not update progress. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Contractor Dashboard</h1>
          <p className="text-surface-400">Welcome back, {user?.name} • Kumar Infrastructure Pvt Ltd</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={<FileText className="w-4 h-4" />}>
            Submit Report
          </Button>
          <Button icon={<Camera className="w-4 h-4" />}>
            Upload Evidence
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard
            title="Active Projects"
            value={assignedProjects.length}
            change={`${activeProjects.length} currently in progress`}
            changeType="neutral"
            icon={<Briefcase className="w-5 h-5 text-white" />}
            iconBg="from-primary-500 to-primary-600"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard
            title="Completed"
            value={completedProjects.length}
            change="+12 this quarter"
            changeType="positive"
            icon={<CheckCircle className="w-5 h-5 text-white" />}
            iconBg="from-accent-500 to-accent-600"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatCard
            title="Total Budget"
            value={`₹${(totalBudget / 100000).toFixed(1)}L`}
            change="Current allocation"
            changeType="neutral"
            icon={<Wallet className="w-5 h-5 text-white" />}
            iconBg="from-warning-500 to-warning-600"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <StatCard
            title="Performance Score"
            value={`${successRate}%`}
            change={`${completedProjects.length} of ${visibleProjects.length} completed`}
            changeType="positive"
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            iconBg="from-purple-500 to-purple-600"
          />
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card variant="gradient" padding="none">
            <div className="p-5 border-b border-surface-700/50 flex items-center justify-between">
              <h2 className="font-semibold text-white">Active Projects</h2>
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('projects')}>
                View All
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="divide-y divide-surface-700/50">
              {visibleProjects.length === 0 && (
                <div className="p-8 text-center text-surface-400">
                  No projects are assigned to this contractor account.
                </div>
              )}
              {visibleProjects.slice(0, 3).map((project) => (
                <div key={project.id} className="p-4 hover:bg-surface-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white">{project.title}</h3>
                        <StatusBadge status={project.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-surface-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {project.location.address}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {new Date(project.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-surface-400">Budget</p>
                      <p className="font-semibold text-white">₹{(project.budget / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-400">Progress</span>
                      <span className="text-primary-400">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {project.milestones.map((milestone, i) => (
                        <span
                          key={i}
                          className={`text-xs px-2 py-1 rounded-full ${
                            milestone.completed
                              ? 'bg-accent-500/20 text-accent-400'
                              : 'bg-surface-700 text-surface-400'
                          }`}
                        >
                          {milestone.title}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      {project.status === 'planned' && (
                        <Button size="sm" variant="outline" onClick={() => updateProjectProgress(project.id, 5)}>
                          Start Work
                        </Button>
                      )}
                      {project.status !== 'completed' && (
                        <Button size="sm" variant="secondary" onClick={() => { setProgressModal(project.id); setNewProgress(String(project.progress)); }}>
                          Update Progress
                        </Button>
                      )}
                      {project.status !== 'completed' && (
                        <Button size="sm" variant="ghost" onClick={() => updateProjectProgress(project.id, 100)}>
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card variant="gradient">
              <h2 className="font-semibold text-white mb-4">Performance Metrics</h2>
              <div className="flex justify-center mb-4">
                <CircularProgress value={87} size={100} strokeWidth={10} variant="success" />
              </div>
              <div className="space-y-3">
                {performanceData.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-surface-400">{item.name}</span>
                      <span className="text-white">{item.value}%</span>
                    </div>
                    <Progress 
                      value={item.value} 
                      size="sm" 
                      variant={item.value >= 90 ? 'success' : item.value >= 70 ? 'warning' : 'danger'}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Upcoming Deadlines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card variant="gradient">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Upcoming Deadlines</h2>
                <Clock className="w-5 h-5 text-surface-400" />
              </div>
              <div className="space-y-3">
                {upcomingDeadlines.length === 0 && (
                  <p className="text-sm text-surface-500 text-center py-4">No upcoming assigned deadlines.</p>
                )}
                {upcomingDeadlines.map((deadline, i) => (
                  <div key={i} className="p-3 bg-surface-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white truncate">{deadline.project}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        deadline.daysLeft <= 3 
                          ? 'bg-danger-500/20 text-danger-400' 
                          : deadline.daysLeft <= 7 
                          ? 'bg-warning-500/20 text-warning-400'
                          : 'bg-accent-500/20 text-accent-400'
                      }`}>
                        {deadline.daysLeft} days
                      </span>
                    </div>
                    <Progress value={deadline.progress} size="sm" />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Budget & AI Recommendations */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Budget Utilization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-white">Budget Utilization</h2>
                <p className="text-sm text-surface-400">Monthly budget vs spending</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-surface-400">Total Utilized</p>
                <p className="text-lg font-bold text-accent-400">{totalBudget ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0.0'}%</p>
              </div>
            </div>
            <LineChartComponent
              data={budgetData}
              lines={[
                { dataKey: 'allocated', color: '#3b82f6', name: 'Allocated' },
                { dataKey: 'spent', color: '#10b981', name: 'Spent' }
              ]}
              xAxisKey="name"
              height={200}
            />
          </Card>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card variant="gradient">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-primary-400" />
              <h2 className="font-semibold text-white">AI Recommendations</h2>
            </div>
            <div className="space-y-3">
              {aiRecommendations.map((rec, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    rec.type === 'warning' 
                      ? 'bg-warning-500/10 border-warning-500/20' 
                      : rec.type === 'success'
                      ? 'bg-accent-500/10 border-accent-500/20'
                      : 'bg-primary-500/10 border-primary-500/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {rec.type === 'warning' && <AlertTriangle className="w-5 h-5 text-warning-400 flex-shrink-0" />}
                    {rec.type === 'success' && <CheckCircle className="w-5 h-5 text-accent-400 flex-shrink-0" />}
                    {rec.type === 'info' && <Target className="w-5 h-5 text-primary-400 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm text-white">{rec.message}</p>
                      <button className="text-xs text-primary-400 hover:text-primary-300 mt-1">
                        {rec.action} →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        {[
          { label: 'Before Work Photos', value: visibleProjects.filter(p => (p.workLogs || []).some(log => log.photos?.length)).length, icon: Camera },
          { label: 'Progress Evidence', value: progressPhotoCount, icon: FileText },
          { label: 'Success Rate', value: `${successRate || 87}%`, icon: CheckCircle },
          { label: 'Avg Completion', value: `${averageCompletionTime} days`, icon: Clock },
        ].map((metric) => (
          <Card key={metric.label} variant="gradient">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <metric.icon className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{metric.value}</p>
                <p className="text-xs text-surface-400">{metric.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card variant="gradient" padding="none">
        <div className="p-5 border-b border-surface-700/50 flex items-center justify-between">
          <h2 className="font-semibold text-white">Progress Tracking</h2>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('work-progress')}>Open Logs</Button>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-surface-700/50">
          {visibleProjects.slice(0, 3).map((project) => (
            <div key={project.id} className="p-4 bg-surface-900/30">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-white truncate">{project.title}</p>
                <StatusBadge status={project.status} />
              </div>
              <Progress value={project.progress} />
              <p className="text-xs text-surface-400 mt-2">{project.progress}% complete • {(project.workLogs || []).length} timeline logs</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" icon={<Camera className="w-3.5 h-3.5" />} onClick={() => setCurrentView('work-progress')}>
                  Photos
                </Button>
                <Button size="sm" variant="outline" icon={<FileText className="w-3.5 h-3.5" />} onClick={() => setCurrentView('work-progress')}>
                  Notes
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="grid md:grid-cols-4 gap-4"
      >
        {[
          { icon: Camera, label: 'Upload Evidence', desc: 'Add work photos', color: 'from-primary-500 to-primary-600', view: 'work-progress' },
          { icon: FileText, label: 'Submit Report', desc: 'Daily progress', color: 'from-accent-500 to-accent-600', view: 'work-progress' },
          { icon: Users, label: 'Work Progress', desc: 'Logs & milestones', color: 'from-warning-500 to-warning-600', view: 'work-progress' },
          { icon: Wallet, label: 'Budget Request', desc: 'Additional funds', color: 'from-purple-500 to-purple-600', view: 'budget' }
        ].map((action, i) => (
          <Card key={i} variant="bordered" hover className="cursor-pointer" onClick={() => setCurrentView(action.view)}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">{action.label}</p>
                <p className="text-xs text-surface-400">{action.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      <Modal isOpen={!!progressModal} onClose={() => setProgressModal(null)} title="Update Assigned Work">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Progress ({newProgress}%)</label>
            <input
              type="range"
              min={0}
              max={100}
              value={newProgress}
              onChange={(event) => setNewProgress(event.target.value)}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-surface-500 mt-1">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setProgressModal(null)}>Cancel</Button>
            <Button loading={saving} onClick={() => updateProjectProgress(progressModal!, parseInt(newProgress))}>
              Save Progress
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
