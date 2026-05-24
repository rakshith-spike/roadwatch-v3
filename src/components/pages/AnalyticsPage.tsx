import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Download,
  RefreshCw,
  Target,
  Truck,
  Wallet,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Card, StatCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';
import { 
  AreaChartComponent, 
  LineChartComponent, 
  DonutChartComponent,
  MultiBarChartComponent 
} from '../charts/Charts';

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('month');
  const [region, setRegion] = useState('all');

  const complaintTrend = [
    { name: 'Jan', complaints: 234, resolved: 198, avgTime: 4.2 },
    { name: 'Feb', complaints: 298, resolved: 256, avgTime: 3.8 },
    { name: 'Mar', complaints: 312, resolved: 287, avgTime: 3.5 },
    { name: 'Apr', complaints: 278, resolved: 245, avgTime: 4.1 },
    { name: 'May', complaints: 345, resolved: 312, avgTime: 3.2 },
    { name: 'Jun', complaints: 389, resolved: 356, avgTime: 2.9 }
  ];

  const categoryData = [
    { name: 'Pothole', value: 42 },
    { name: 'Street Light', value: 23 },
    { name: 'Drainage', value: 18 },
    { name: 'Crack', value: 10 },
    { name: 'Other', value: 7 }
  ];

  const districtPerformance = [
    { name: 'Bangalore Urban', resolved: 89, pending: 45, budget: 120 },
    { name: 'Bangalore Rural', resolved: 67, pending: 32, budget: 80 },
    { name: 'Mysore', resolved: 78, pending: 28, budget: 95 },
    { name: 'Hubli', resolved: 56, pending: 42, budget: 70 },
    { name: 'Mangalore', resolved: 72, pending: 35, budget: 85 }
  ];

  const contractorMetrics = [
    { name: 'Kumar Infra', quality: 92, timeliness: 88, cost: 85 },
    { name: 'Sharma Const', quality: 95, timeliness: 82, cost: 90 },
    { name: 'Ali Roads', quality: 78, timeliness: 92, cost: 88 },
    { name: 'Patel Works', quality: 85, timeliness: 79, cost: 92 }
  ];

  const monthlyBudget = [
    { name: 'Jan', allocated: 50, utilized: 42 },
    { name: 'Feb', allocated: 65, utilized: 58 },
    { name: 'Mar', allocated: 80, utilized: 72 },
    { name: 'Apr', allocated: 55, utilized: 48 },
    { name: 'May', allocated: 70, utilized: 65 },
    { name: 'Jun', allocated: 90, utilized: 78 }
  ];

  const severityTrend = [
    { name: 'Week 1', critical: 12, high: 28, medium: 45, low: 67 },
    { name: 'Week 2', critical: 15, high: 32, medium: 52, low: 71 },
    { name: 'Week 3', critical: 8, high: 25, medium: 48, low: 65 },
    { name: 'Week 4', critical: 10, high: 30, medium: 55, low: 72 }
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
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-surface-400">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            options={[
              { value: 'week', label: 'Last 7 Days' },
              { value: 'month', label: 'Last 30 Days' },
              { value: 'quarter', label: 'Last Quarter' },
              { value: 'year', label: 'This Year' }
            ]}
          />
          <Select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            options={[
              { value: 'all', label: 'All Regions' },
              { value: 'north', label: 'North' },
              { value: 'south', label: 'South' },
              { value: 'east', label: 'East' },
              { value: 'west', label: 'West' }
            ]}
          />
          <Button variant="outline" icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button icon={<Download className="w-4 h-4" />}>
            Export
          </Button>
        </div>
      </motion.div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard
            title="Total Complaints"
            value="1,856"
            change="+12.5% vs last period"
            changeType="negative"
            icon={<AlertCircle className="w-5 h-5 text-white" />}
            iconBg="from-primary-500 to-primary-600"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard
            title="Resolution Rate"
            value="86.4%"
            change="+3.2% improvement"
            changeType="positive"
            icon={<CheckCircle className="w-5 h-5 text-white" />}
            iconBg="from-accent-500 to-accent-600"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatCard
            title="Avg Response Time"
            value="3.2 days"
            change="-1.1 days faster"
            changeType="positive"
            icon={<Clock className="w-5 h-5 text-white" />}
            iconBg="from-warning-500 to-warning-600"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <StatCard
            title="Budget Utilized"
            value="₹4.2Cr"
            change="78% of allocation"
            changeType="neutral"
            icon={<Wallet className="w-5 h-5 text-white" />}
            iconBg="from-purple-500 to-purple-600"
          />
        </motion.div>
      </div>

      {/* Main Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Complaint Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">Complaint Trend</h3>
                <p className="text-sm text-surface-400">Monthly complaints vs resolutions</p>
              </div>
              <Activity className="w-5 h-5 text-surface-400" />
            </div>
            <LineChartComponent
              data={complaintTrend}
              lines={[
                { dataKey: 'complaints', color: '#f59e0b', name: 'Complaints' },
                { dataKey: 'resolved', color: '#10b981', name: 'Resolved' }
              ]}
              xAxisKey="name"
              height={280}
            />
          </Card>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">Category Distribution</h3>
                <p className="text-sm text-surface-400">Complaints by type</p>
              </div>
              <PieChart className="w-5 h-5 text-surface-400" />
            </div>
            <DonutChartComponent
              data={categoryData}
              dataKey="value"
              nameKey="name"
              centerValue="100%"
              centerLabel="Total"
              height={280}
            />
          </Card>
        </motion.div>
      </div>

      {/* District & Contractor Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* District Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">District Performance</h3>
                <p className="text-sm text-surface-400">Resolved vs pending complaints</p>
              </div>
              <BarChart3 className="w-5 h-5 text-surface-400" />
            </div>
            <MultiBarChartComponent
              data={districtPerformance}
              dataKeys={[
                { key: 'resolved', color: '#10b981', name: 'Resolved' },
                { key: 'pending', color: '#f59e0b', name: 'Pending' }
              ]}
              xAxisKey="name"
              height={280}
            />
          </Card>
        </motion.div>

        {/* Budget Utilization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">Budget Utilization</h3>
                <p className="text-sm text-surface-400">Allocated vs utilized (in Lakhs)</p>
              </div>
              <Wallet className="w-5 h-5 text-surface-400" />
            </div>
            <AreaChartComponent
              data={monthlyBudget}
              dataKey="utilized"
              xAxisKey="name"
              gradient={true}
              height={280}
            />
          </Card>
        </motion.div>
      </div>

      {/* Contractor Metrics & Severity Trend */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Contractor Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">Contractor Performance</h3>
                <p className="text-sm text-surface-400">Quality, timeliness, and cost efficiency</p>
              </div>
              <Truck className="w-5 h-5 text-surface-400" />
            </div>
            <div className="space-y-4">
              {contractorMetrics.map((contractor, i) => (
                <div key={i} className="p-3 bg-surface-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{contractor.name}</span>
                    <span className="text-sm text-accent-400">
                      {Math.round((contractor.quality + contractor.timeliness + contractor.cost) / 3)}% avg
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-surface-400">Quality</span>
                        <span className="text-white">{contractor.quality}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-500 rounded-full" 
                          style={{ width: `${contractor.quality}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-surface-400">Timeliness</span>
                        <span className="text-white">{contractor.timeliness}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent-500 rounded-full" 
                          style={{ width: `${contractor.timeliness}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-surface-400">Cost</span>
                        <span className="text-white">{contractor.cost}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-warning-500 rounded-full" 
                          style={{ width: `${contractor.cost}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Severity Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">Severity Trend</h3>
                <p className="text-sm text-surface-400">Weekly severity distribution</p>
              </div>
              <Target className="w-5 h-5 text-surface-400" />
            </div>
            <MultiBarChartComponent
              data={severityTrend}
              dataKeys={[
                { key: 'critical', color: '#ef4444', name: 'Critical' },
                { key: 'high', color: '#f59e0b', name: 'High' },
                { key: 'medium', color: '#3b82f6', name: 'Medium' },
                { key: 'low', color: '#10b981', name: 'Low' }
              ]}
              xAxisKey="name"
              height={280}
            />
          </Card>
        </motion.div>
      </div>

      {/* AI Predictions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <Card variant="gradient" className="bg-gradient-to-r from-primary-900/30 to-accent-900/30 border-primary-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Predictions & Insights</h3>
              <p className="text-sm text-surface-400">Machine learning powered forecasts</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-surface-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-danger-400" />
                <span className="text-sm font-medium text-white">Complaint Forecast</span>
              </div>
              <p className="text-2xl font-bold text-white">+15%</p>
              <p className="text-xs text-surface-400 mt-1">Expected increase in complaints next month due to monsoon season</p>
            </div>
            
            <div className="p-4 bg-surface-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-warning-400" />
                <span className="text-sm font-medium text-white">High Risk Zones</span>
              </div>
              <p className="text-2xl font-bold text-white">8 Areas</p>
              <p className="text-xs text-surface-400 mt-1">Identified for preventive maintenance in the next 2 weeks</p>
            </div>
            
            <div className="p-4 bg-surface-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-accent-400" />
                <span className="text-sm font-medium text-white">Cost Optimization</span>
              </div>
              <p className="text-2xl font-bold text-white">₹12.5L</p>
              <p className="text-xs text-surface-400 mt-1">Potential savings through bulk repair recommendations</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
