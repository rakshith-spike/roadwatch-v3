import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Plus,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  Bell,
  Eye,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { Card, StatCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge, SeverityBadge } from '../ui/Badge';
import { AreaChartComponent } from '../charts/Charts';
import { useStore } from '../../store/useStore';
import { Progress } from '../ui/Progress';

export function CitizenDashboard() {
  const { complaints, user, setCurrentView } = useStore();
  
  const myComplaints = complaints.filter(c =>
    user?.id ? c.reportedBy === user.id || c.reportedBy === 'user1' : c.reportedBy === 'user1'
  );
  const resolvedCount = myComplaints.filter(c => c.status === 'resolved').length;
  const pendingCount = myComplaints.filter(c => c.status === 'pending').length;
  const inProgressCount = myComplaints.filter(c => c.status === 'in_progress').length;

  function getComplaintProgress(complaint: typeof complaints[number]) {
    if (typeof complaint.progressPercentage === 'number') return complaint.progressPercentage;
    if (complaint.status === 'resolved' || complaint.status === 'closed') return 100;
    return 0;
  }

  const chartData = [
    { name: 'Jan', complaints: 12, resolved: 10 },
    { name: 'Feb', complaints: 19, resolved: 15 },
    { name: 'Mar', complaints: 15, resolved: 14 },
    { name: 'Apr', complaints: 22, resolved: 18 },
    { name: 'May', complaints: 18, resolved: 17 },
    { name: 'Jun', complaints: 25, resolved: 20 },
  ];

  const nearbyIssues = [
    { id: 1, title: 'Pothole on Main Street', distance: '0.5 km', severity: 'high', votes: 45 },
    { id: 2, title: 'Street Light Out', distance: '0.8 km', severity: 'medium', votes: 23 },
    { id: 3, title: 'Drainage Issue', distance: '1.2 km', severity: 'critical', votes: 89 },
  ];

  const recentUpdates = [
    { id: 1, complaint: 'Pothole on MG Road', update: 'Work started by contractor', time: '2 hours ago', type: 'progress' },
    { id: 2, complaint: 'Street Light Repair', update: 'Issue resolved and verified', time: '5 hours ago', type: 'resolved' },
    { id: 3, complaint: 'Road Crack', update: 'Contractor assigned', time: '1 day ago', type: 'assigned' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-surface-400">Track your complaints and community issues</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={<Bell className="w-4 h-4" />}>
            Alerts
          </Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCurrentView('complaints')}>
            Report Issue
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard
            title="My Complaints"
            value={myComplaints.length}
            change="+2 this month"
            changeType="neutral"
            icon={<AlertCircle className="w-5 h-5 text-white" />}
            iconBg="from-primary-500 to-primary-600"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard
            title="Resolved"
            value={resolvedCount}
            change="80% resolution rate"
            changeType="positive"
            icon={<CheckCircle className="w-5 h-5 text-white" />}
            iconBg="from-accent-500 to-accent-600"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatCard
            title="In Progress"
            value={inProgressCount}
            change="2 updated today"
            changeType="neutral"
            icon={<Clock className="w-5 h-5 text-white" />}
            iconBg="from-warning-500 to-warning-600"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <StatCard
            title="Pending"
            value={pendingCount}
            change="Avg. 3 days to verify"
            changeType="neutral"
            icon={<Clock className="w-5 h-5 text-white" />}
            iconBg="from-purple-500 to-purple-600"
          />
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Complaints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card variant="gradient" padding="none">
            <div className="p-5 border-b border-surface-700/50 flex items-center justify-between">
              <h2 className="font-semibold text-white">My Recent Complaints</h2>
              <Button variant="ghost" size="sm" icon={<Filter className="w-4 h-4" />}>
                Filter
              </Button>
            </div>
            <div className="divide-y divide-surface-700/50">
              {myComplaints.slice(0, 4).map((complaint) => (
                <div key={complaint.id} className="p-4 hover:bg-surface-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white truncate">{complaint.title}</h3>
                        <StatusBadge status={complaint.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-surface-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {complaint.location.address}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(complaint.reportedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {complaint.status === 'in_progress' && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-surface-400">
                              {getComplaintProgress(complaint) > 0 ? 'Contractor Progress' : 'Waiting for contractor update'}
                            </span>
                            <span className="text-primary-400">{getComplaintProgress(complaint)}%</span>
                          </div>
                          <Progress value={getComplaintProgress(complaint)} size="sm" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-surface-400">
                      <div className="flex items-center gap-1 text-sm">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{complaint.votes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <MessageSquare className="w-4 h-4" />
                        <span>{complaint.comments}</span>
                      </div>
                      <SeverityBadge severity={complaint.severity} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-surface-700/50">
              <Button variant="ghost" className="w-full" onClick={() => setCurrentView('complaints')}>
                View All Complaints
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Nearby Issues */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card variant="gradient">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Nearby Issues</h2>
                <Button variant="ghost" size="sm" onClick={() => setCurrentView('map')}>
                  <Eye className="w-4 h-4" />
                  Map
                </Button>
              </div>
              <div className="space-y-3">
                {nearbyIssues.map((issue) => (
                  <div key={issue.id} className="p-3 bg-surface-800/50 rounded-lg hover:bg-surface-800 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{issue.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-surface-400">
                          <MapPin className="w-3 h-3" />
                          <span>{issue.distance} away</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={issue.severity} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-surface-400">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{issue.votes} votes</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" size="sm" onClick={() => setCurrentView('map')}>
                View All on Map
              </Button>
            </Card>
          </motion.div>

          {/* Recent Updates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card variant="gradient">
              <h2 className="font-semibold text-white mb-4">Recent Updates</h2>
              <div className="space-y-3">
                {recentUpdates.map((update) => (
                  <div key={update.id} className="flex gap-3">
                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                      update.type === 'resolved' ? 'bg-accent-400' :
                      update.type === 'progress' ? 'bg-warning-400' : 'bg-primary-400'
                    }`} />
                    <div>
                      <p className="text-sm text-white">{update.complaint}</p>
                      <p className="text-xs text-surface-400">{update.update}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{update.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card variant="gradient">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-white">Complaint Activity</h2>
              <p className="text-sm text-surface-400">Monthly trend of complaints vs resolutions</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-500" />
                <span className="text-surface-400">Complaints</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent-500" />
                <span className="text-surface-400">Resolved</span>
              </div>
            </div>
          </div>
          <AreaChartComponent
            data={chartData}
            dataKey="complaints"
            xAxisKey="name"
            height={250}
          />
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="grid md:grid-cols-3 gap-4"
      >
        <Card variant="bordered" hover className="cursor-pointer" onClick={() => setCurrentView('complaints')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Report New Issue</h3>
              <p className="text-sm text-surface-400">File a complaint with AI assistance</p>
            </div>
          </div>
        </Card>
        
        <Card variant="bordered" hover className="cursor-pointer" onClick={() => setCurrentView('transparency')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Transparency Reports</h3>
              <p className="text-sm text-surface-400">View government spending</p>
            </div>
          </div>
        </Card>
        
        <Card variant="bordered" hover className="cursor-pointer" onClick={() => setCurrentView('assistant')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">AI Assistant</h3>
              <p className="text-sm text-surface-400">Get help with your complaints</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
