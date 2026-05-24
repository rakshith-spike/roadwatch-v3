import { motion } from 'framer-motion';
import {
  Globe,
  Users,
  Shield,
  Activity,
  Server,
  Cpu,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  MapPin,
  BarChart3,
  Settings,
  FileText,
  Bot,
  Lock,
  Eye,
  Zap
} from 'lucide-react';
import { Card, StatCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress, CircularProgress } from '../ui/Progress';
import { LineChartComponent, BarChartComponent, DonutChartComponent } from '../charts/Charts';
import { useStore } from '../../store/useStore';

export function SuperAdminDashboard() {
  const { setCurrentView } = useStore();

  const systemHealth = {
    cpu: 45,
    memory: 62,
    disk: 38,
    network: 85
  };

  const nationalStats = [
    { state: 'Karnataka', complaints: 12450, resolved: 10230, contractors: 145, budget: 450 },
    { state: 'Maharashtra', complaints: 18920, resolved: 15680, contractors: 210, budget: 680 },
    { state: 'Tamil Nadu', complaints: 14560, resolved: 12340, contractors: 165, budget: 520 },
    { state: 'Gujarat', complaints: 9870, resolved: 8450, contractors: 98, budget: 380 },
    { state: 'Rajasthan', complaints: 11230, resolved: 9120, contractors: 112, budget: 420 }
  ];

  const userGrowth = [
    { name: 'Jan', citizens: 45000, contractors: 120, admins: 45 },
    { name: 'Feb', citizens: 52000, contractors: 135, admins: 48 },
    { name: 'Mar', citizens: 61000, contractors: 148, admins: 52 },
    { name: 'Apr', citizens: 78000, contractors: 165, admins: 58 },
    { name: 'May', citizens: 89000, contractors: 182, admins: 62 },
    { name: 'Jun', citizens: 105000, contractors: 198, admins: 68 }
  ];

  const platformMetrics = [
    { name: 'API Requests', value: '2.4M', change: '+12%', status: 'healthy' },
    { name: 'Avg Response Time', value: '124ms', change: '-8%', status: 'healthy' },
    { name: 'Error Rate', value: '0.02%', change: '-15%', status: 'healthy' },
    { name: 'Active Sessions', value: '12,450', change: '+23%', status: 'healthy' }
  ];

  const recentAuditLogs = [
    { action: 'User Role Updated', user: 'admin@karnataka.gov.in', target: 'user_2345', time: '2 mins ago', type: 'info' },
    { action: 'Bulk Complaint Assignment', user: 'admin@maharashtra.gov.in', target: '45 complaints', time: '15 mins ago', type: 'info' },
    { action: 'Budget Approval', user: 'super@roadwatch.gov.in', target: '₹5Cr for Karnataka', time: '1 hour ago', type: 'success' },
    { action: 'Failed Login Attempt', user: 'unknown', target: 'admin@gujarat.gov.in', time: '2 hours ago', type: 'warning' },
    { action: 'AI Model Updated', user: 'system', target: 'severity_predictor_v2.3', time: '4 hours ago', type: 'info' }
  ];

  const aiGovernance = [
    { model: 'Complaint Classifier', accuracy: 98.2, status: 'active', lastTrained: '2 days ago' },
    { model: 'Severity Predictor', accuracy: 94.5, status: 'active', lastTrained: '1 week ago' },
    { model: 'Duplicate Detector', accuracy: 96.8, status: 'active', lastTrained: '3 days ago' },
    { model: 'Cost Estimator', accuracy: 89.3, status: 'training', lastTrained: 'In progress' }
  ];

  const regionDistribution = [
    { name: 'North', value: 28 },
    { name: 'South', value: 35 },
    { name: 'East', value: 18 },
    { name: 'West', value: 19 }
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
          <h1 className="text-2xl font-bold text-white">Super Admin Control Center</h1>
          <p className="text-surface-400">National Infrastructure Management • All Regions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={<Settings className="w-4 h-4" />}>
            System Settings
          </Button>
          <Button variant="outline" icon={<Shield className="w-4 h-4" />}>
            Security
          </Button>
          <Button icon={<Globe className="w-4 h-4" />} onClick={() => setCurrentView('national')}>
            National View
          </Button>
        </div>
      </motion.div>

      {/* National Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard
            title="Total Complaints (India)"
            value="2.4M"
            change="+18% this quarter"
            changeType="neutral"
            icon={<AlertTriangle className="w-5 h-5 text-white" />}
            iconBg="from-primary-500 to-primary-600"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard
            title="Active Users"
            value="892K"
            change="+45K this month"
            changeType="positive"
            icon={<Users className="w-5 h-5 text-white" />}
            iconBg="from-accent-500 to-accent-600"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard
            title="Resolution Rate"
            value="84.2%"
            change="+3.5% improvement"
            changeType="positive"
            icon={<CheckCircle className="w-5 h-5 text-white" />}
            iconBg="from-green-500 to-green-600"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <StatCard
            title="Total Budget"
            value="₹2,450Cr"
            change="FY 2024-25"
            changeType="neutral"
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            iconBg="from-warning-500 to-warning-600"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatCard
            title="Active Regions"
            value="28"
            change="States & UTs"
            changeType="neutral"
            icon={<MapPin className="w-5 h-5 text-white" />}
            iconBg="from-purple-500 to-purple-600"
          />
        </motion.div>
      </div>

      {/* System Health & Platform Metrics */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="gradient">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-accent-400" />
              <h2 className="font-semibold text-white">System Health</h2>
            </div>
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CircularProgress value={92} size={100} strokeWidth={10} variant="success" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-accent-400" />
                </div>
              </div>
            </div>
            <p className="text-center text-accent-400 font-medium mb-4">All Systems Operational</p>
            <div className="space-y-3">
              {Object.entries(systemHealth).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-surface-400 capitalize flex items-center gap-2">
                      {key === 'cpu' && <Cpu className="w-4 h-4" />}
                      {key === 'memory' && <Server className="w-4 h-4" />}
                      {key === 'disk' && <HardDrive className="w-4 h-4" />}
                      {key === 'network' && <Activity className="w-4 h-4" />}
                      {key}
                    </span>
                    <span className="text-white">{value}%</span>
                  </div>
                  <Progress value={value} size="sm" variant={value > 80 ? 'warning' : 'success'} />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Platform Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-3"
        >
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Platform Performance</h2>
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('system')}>
                <Eye className="w-4 h-4" />
                Details
              </Button>
            </div>
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              {platformMetrics.map((metric, i) => (
                <div key={i} className="p-4 bg-surface-800/50 rounded-xl">
                  <p className="text-xs text-surface-400">{metric.name}</p>
                  <p className="text-xl font-bold text-white mt-1">{metric.value}</p>
                  <p className="text-xs text-accent-400 mt-0.5">{metric.change}</p>
                </div>
              ))}
            </div>
            <LineChartComponent
              data={userGrowth}
              lines={[
                { dataKey: 'citizens', color: '#3b82f6', name: 'Citizens' }
              ]}
              xAxisKey="name"
              height={180}
            />
          </Card>
        </motion.div>
      </div>

      {/* State Performance & Region Distribution */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* State Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">State-wise Performance</h2>
              <Button variant="ghost" size="sm">
                <BarChart3 className="w-4 h-4" />
                Export
              </Button>
            </div>
            <BarChartComponent
              data={nationalStats}
              dataKey="complaints"
              xAxisKey="state"
              barColor="#3b82f6"
              height={250}
            />
          </Card>
        </motion.div>

        {/* Region Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card variant="gradient">
            <h2 className="font-semibold text-white mb-4">Region Distribution</h2>
            <DonutChartComponent
              data={regionDistribution}
              dataKey="value"
              nameKey="name"
              centerValue="28"
              centerLabel="States"
              height={250}
            />
          </Card>
        </motion.div>
      </div>

      {/* AI Governance & Audit Logs */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI Governance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary-400" />
                <h2 className="font-semibold text-white">AI Models Governance</h2>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
                Configure
              </Button>
            </div>
            <div className="space-y-3">
              {aiGovernance.map((model, i) => (
                <div key={i} className="p-3 bg-surface-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        model.status === 'active' ? 'bg-accent-400' : 'bg-warning-400 animate-pulse'
                      }`} />
                      <p className="font-medium text-white">{model.model}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      model.status === 'active' 
                        ? 'bg-accent-500/20 text-accent-400' 
                        : 'bg-warning-500/20 text-warning-400'
                    }`}>
                      {model.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-surface-400">Accuracy: <span className="text-white">{model.accuracy}%</span></span>
                    <span className="text-surface-500">{model.lastTrained}</span>
                  </div>
                  <Progress value={model.accuracy} size="sm" variant="success" className="mt-2" />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Audit Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-surface-400" />
                <h2 className="font-semibold text-white">Recent Audit Logs</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('audit')}>
                View All
              </Button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentAuditLogs.map((log, i) => (
                <div key={i} className="p-3 bg-surface-800/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      log.type === 'success' ? 'bg-accent-500/20' :
                      log.type === 'warning' ? 'bg-warning-500/20' : 'bg-primary-500/20'
                    }`}>
                      {log.type === 'success' && <CheckCircle className="w-4 h-4 text-accent-400" />}
                      {log.type === 'warning' && <AlertTriangle className="w-4 h-4 text-warning-400" />}
                      {log.type === 'info' && <Activity className="w-4 h-4 text-primary-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{log.action}</p>
                      <p className="text-xs text-surface-400 truncate">by {log.user}</p>
                      <p className="text-xs text-surface-500">Target: {log.target}</p>
                    </div>
                    <span className="text-xs text-surface-500 flex-shrink-0">{log.time}</span>
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
        className="grid md:grid-cols-5 gap-4"
      >
        {[
          { icon: Users, label: 'User Management', desc: 'Manage roles', view: 'users' },
          { icon: MapPin, label: 'Region Config', desc: 'Add/edit regions', view: 'regions' },
          { icon: Bot, label: 'AI Settings', desc: 'Model configs', view: 'assistant' },
          { icon: Lock, label: 'Security', desc: 'Access control', view: 'settings' },
          { icon: Zap, label: 'Alerts Config', desc: 'Notification rules', view: 'alerts' }
        ].map((action, i) => (
          <Card key={i} variant="bordered" hover onClick={() => setCurrentView(action.view)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <action.icon className="w-5 h-5 text-primary-400" />
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
