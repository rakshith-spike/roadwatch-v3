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
import { useStore } from '../../store/useStore';

export function ContractorDashboard() {
  const { projects, user, setCurrentView } = useStore();

  const activeProjects = projects.filter(p => p.status === 'in_progress');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalSpent = projects.reduce((acc, p) => acc + p.spent, 0);

  const budgetData = [
    { name: 'Jan', allocated: 500000, spent: 420000 },
    { name: 'Feb', allocated: 650000, spent: 580000 },
    { name: 'Mar', allocated: 800000, spent: 720000 },
    { name: 'Apr', allocated: 550000, spent: 490000 },
    { name: 'May', allocated: 700000, spent: 600000 },
    { name: 'Jun', allocated: 900000, spent: 650000 },
  ];

  const performanceData = [
    { name: 'Quality', value: 92 },
    { name: 'Timeliness', value: 85 },
    { name: 'Budget', value: 88 },
    { name: 'Safety', value: 95 },
  ];

  const upcomingDeadlines = [
    { project: 'MG Road Pothole Repair', deadline: '2024-01-25', daysLeft: 5, progress: 65 },
    { project: 'Street Light Restoration', deadline: '2024-01-22', daysLeft: 2, progress: 30 },
    { project: 'HSR Layout Crack Repair', deadline: '2024-02-01', daysLeft: 12, progress: 15 },
  ];

  const aiRecommendations = [
    { type: 'warning', message: 'Street Light project may need additional resources to meet deadline', action: 'View Details' },
    { type: 'info', message: 'Weather forecast shows rain next week - consider adjusting schedule', action: 'Reschedule' },
    { type: 'success', message: 'MG Road project is ahead of schedule - great work!', action: 'View Report' },
  ];

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
            value={activeProjects.length}
            change="2 assigned this week"
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
            value="87%"
            change="+5% from last month"
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
              {projects.slice(0, 3).map((project) => (
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
                <p className="text-lg font-bold text-accent-400">{((totalSpent / totalBudget) * 100).toFixed(1)}%</p>
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
    </div>
  );
}
