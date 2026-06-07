import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, CheckCircle, Clock, MapPin, TrendingUp, TrendingDown,
  Users, Truck, Wallet, Shield, BarChart3, Target, AlertTriangle,
  Eye, Calendar, ArrowUpRight, Bot, Activity, Zap, XCircle,
  Plus, FileText, ChevronRight, Banknote, ClipboardCheck, Star
} from 'lucide-react';
import { Card, StatCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { StatusBadge, SeverityBadge } from '../ui/Badge';
import { Progress, CircularProgress } from '../ui/Progress';
import { Modal } from '../ui/Modal';
import { Input, Textarea, Select } from '../ui/Input';
import { BarChartComponent, LineChartComponent, DonutChartComponent } from '../charts/Charts';
import { useStore, Contractor } from '../../store/useStore';
import { api } from '../../services/api';

export function GovernmentDashboard() {
  const {
    complaints, contractors, projects, budgetEntries, user,
    setCurrentView, updateComplaint, approveBudget, rejectBudget,
    addBudgetEntry, addProject
  } = useStore();

  // Modals
  const [verifyModal, setVerifyModal] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [budgetModal, setBudgetModal] = useState<string | null>(null);  // budget entry id to approve/reject
  const [sanctionModal, setSanctionModal] = useState(false);   // new budget sanction
  const [rejectModal, setRejectModal] = useState<string | null>(null);

  // Sanction form
  const [sanctionProject, setSanctionProject] = useState('');
  const [sanctionContractor, setSanctionContractor] = useState('');
  const [sanctionAmount, setSanctionAmount] = useState('');
  const [sanctionNotes, setSanctionNotes] = useState('');

  // Assign form
  const [assignContractor, setAssignContractor] = useState('');
  const [assignProject, setAssignProject] = useState('');
  const [assignBudget, setAssignBudget] = useState('');
  const [assignStart, setAssignStart] = useState('');
  const [assignEnd, setAssignEnd] = useState('');

  // Reject form
  const [rejectNotes, setRejectNotes] = useState('');
  const [backendContractors, setBackendContractors] = useState<Contractor[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.getContractors(),
      api.getDashboardAnalytics(),
      api.getTrends()
    ]).then(([contractorsRes, analyticsRes, trendsRes]) => {
      if (!mounted) return;
      setBackendContractors(contractorsRes.contractors.map((contractor: any) => ({
        id: contractor._id || contractor.id,
        name: contractor.user_name || contractor.company,
        company: contractor.company,
        license: contractor.license,
        email: contractor.email || '',
        phone: contractor.phone || '',
        rating: contractor.rating || 0,
        completedProjects: contractor.completed_projects || 0,
        activeProjects: contractor.active_projects || 0,
        totalBudget: contractor.total_budget || 0,
        regions: contractor.regions || [],
        specialization: contractor.specialization || [],
        performanceScore: contractor.performance_score || 0,
        status: 'active',
        joinedAt: contractor.created_at || new Date().toISOString()
      })));
      setAnalytics(analyticsRes);
      setTrends(trendsRes.trends);
    }).catch(error => console.error('Failed to load dashboard data:', error));

    return () => { mounted = false; };
  }, []);

  const pendingComplaints = complaints.filter(c => c.status === 'pending');
  const verifiedComplaints = complaints.filter(c => c.status === 'verified');
  const criticalComplaints = complaints.filter(c => c.severity === 'critical');
  const pendingBudgets = budgetEntries.filter(e => e.status === 'pending');
  const aiPriorityQueue = [...complaints]
    .filter(c => c.status !== 'resolved' && c.status !== 'closed' && c.status !== 'rejected')
    .sort((a, b) => (b.priorityScore || b.aiAnalysis?.priority || 0) - (a.priorityScore || a.aiAnalysis?.priority || 0))
    .slice(0, 5);
  const duplicateSupportedCount = complaints.reduce((sum, c) => sum + Math.max(0, (c.supportCount || c.votes || 0) - 1), 0);

  const totalBudget = 45000000;
  const utilized = budgetEntries.filter(e => e.status === 'approved' && e.type === 'disbursement').reduce((a, e) => a + e.amount, 0) || 32500000;

  const activeContractors = backendContractors;

  // Verify a complaint
  function handleVerify(id: string) {
    updateComplaint(id, { status: 'verified' });
    setVerifyModal(null);
  }

  // Assign complaint to contractor — creates a project
  async function handleAssign(complaintId: string) {
    if (!assignContractor || !assignBudget) return;
    const complaint = complaints.find(c => c.id === complaintId);
    const contractor = activeContractors.find(c => c.id === assignContractor);
    if (!complaint || !contractor) return;
    const startDate = assignStart || new Date().toISOString().split('T')[0];
    const endDate = assignEnd || new Date(Date.now() + (complaint.estimatedDays || complaint.aiAnalysis?.estimatedDays || 7) * 86400000).toISOString().split('T')[0];
    try {
      const createdProject = await api.createProject({
        title: `Repair: ${complaint.title || 'Road Issue'}`,
        description: complaint.description || '',
        budget: parseInt(assignBudget),
        start_date: `${startDate}T00:00:00Z`,
        end_date: `${endDate}T00:00:00Z`,
        location: {
          type: 'Point',
          coordinates: [complaint.location.lng, complaint.location.lat],
          address: complaint.location.address,
          district: complaint.location.district
        },
        contractor_id: assignContractor,
        complaint_ids: [complaintId],
        milestones: [
          { title: 'Site Inspection', completed: false, date: `${startDate}T00:00:00Z` },
          { title: 'Material Procurement', completed: false, date: `${startDate}T00:00:00Z` },
          { title: 'Repair Work', completed: false, date: `${endDate}T00:00:00Z` },
          { title: 'Quality Check', completed: false, date: `${endDate}T00:00:00Z` },
        ]
      });
      addProject({
        id: createdProject._id || createdProject.id,
        title: createdProject.title,
        description: createdProject.description,
        roadType: complaint.location.address.includes('NH') ? 'NH' : 'Ward Road',
        lastRelayingDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
        responsibleAuthority: complaint.category === 'streetlight' ? 'BBMP Electrical and Road Safety Cell' : complaint.category === 'drainage' || complaint.category === 'flooding' ? 'Stormwater Drainage Authority' : 'BBMP Road Infrastructure Division',
        executiveEngineer: 'Executive Engineer - Road Works',
        budgetSource: 'Emergency Road Maintenance Contingency Fund',
        qualityScore: 65,
        contractor: assignContractor,
        contractorName: contractor.company,
        budget: parseInt(assignBudget),
        spent: 0,
        startDate,
        endDate,
        status: 'planned',
        progress: 0,
        location: complaint.location,
        complaints: [complaintId],
        milestones: [
          { title: 'Site Inspection', completed: false, date: startDate },
          { title: 'Material Procurement', completed: false, date: startDate },
          { title: 'Repair Work', completed: false, date: endDate },
          { title: 'Quality Check', completed: false, date: endDate },
        ],
        workLogs: [],
        approvedBy: user?.name,
      });
      addBudgetEntry({
        id: `B${Date.now()}`,
        projectId: createdProject._id || createdProject.id,
        projectTitle: `Repair: ${complaint.title}`,
        contractor: contractor.company,
        amount: parseInt(assignBudget),
        type: 'allocation',
        status: 'approved',
        requestedAt: new Date().toISOString().split('T')[0],
        approvedAt: new Date().toISOString().split('T')[0],
        approvedBy: user?.name,
        district: complaint.location.district,
        source: 'Emergency Road Maintenance Contingency Fund',
        sanctionReference: `RW/EMG/${String(Date.now()).slice(-5)}`,
      });
      updateComplaint(complaintId, {
        status: 'assigned',
        assignedTo: assignContractor,
        progressPercentage: 0
      });
      setAssignModal(null);
      setAssignContractor(''); setAssignBudget(''); setAssignStart(''); setAssignEnd('');
    } catch (error) {
      console.error('Backend assignment failed:', error);
      alert('Assignment failed. Use a backend contractor linked to a contractor login.');
    }
  }

  // Sanction new budget
  function handleSanction() {
    if (!sanctionProject || !sanctionAmount) return;
    const project = projects.find(p => p.id === sanctionProject);
    const contractor = contractors.find(c => c.id === sanctionContractor);
    addBudgetEntry({
      id: `B${Date.now()}`,
      projectId: sanctionProject,
      projectTitle: project?.title || sanctionProject,
      contractor: contractor?.company || sanctionContractor,
      amount: parseInt(sanctionAmount),
      type: 'allocation',
      status: 'approved',
      requestedAt: new Date().toISOString().split('T')[0],
      approvedAt: new Date().toISOString().split('T')[0],
      approvedBy: user?.name,
      notes: sanctionNotes,
      district: project?.location.district || 'Bangalore Urban',
    });
    setSanctionModal(false);
    setSanctionProject(''); setSanctionContractor(''); setSanctionAmount(''); setSanctionNotes('');
  }

  function handleApproveBudget(id: string) {
    approveBudget(id, user?.name || 'Gov Admin');
    setBudgetModal(null);
  }

  function handleRejectBudget() {
    if (!rejectModal) return;
    rejectBudget(rejectModal, rejectNotes);
    setRejectModal(null); setRejectNotes('');
  }

  const complaintsByCategory = analytics?.categories ? Object.entries(analytics.categories).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
    value: value as number
  })) : [
    { name: 'Pothole', value: 234 }, { name: 'Street Light', value: 156 },
    { name: 'Drainage', value: 89 }, { name: 'Crack', value: 67 }, { name: 'Other', value: 45 }
  ];

  const trendData = trends ? trends.map((t: any) => ({
    name: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
    complaints: t.complaints,
    resolved: t.resolved
  })).slice(-7) : [
    { name: 'Mon', complaints: 45, resolved: 38 }, { name: 'Tue', complaints: 52, resolved: 45 },
    { name: 'Wed', complaints: 48, resolved: 42 }, { name: 'Thu', complaints: 61, resolved: 50 },
    { name: 'Fri', complaints: 55, resolved: 48 }, { name: 'Sat', complaints: 32, resolved: 30 },
    { name: 'Sun', complaints: 28, resolved: 25 }
  ];

  const hotspotZones = [
    { zone: 'MG Road Junction', issues: 45, severity: 'critical', trend: 'up' },
    { zone: 'Silk Board', issues: 38, severity: 'high', trend: 'stable' },
    { zone: 'Marathahalli', issues: 32, severity: 'high', trend: 'down' },
    { zone: 'Electronic City', issues: 28, severity: 'medium', trend: 'up' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Government Admin Dashboard</h1>
          <p className="text-surface-400">{user?.district} • {user?.state} • Last updated: 2 mins ago</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" icon={<Banknote className="w-4 h-4" />} onClick={() => setSanctionModal(true)}>
            Sanction Budget
          </Button>
          <Button variant="outline" icon={<BarChart3 className="w-4 h-4" />} onClick={() => setCurrentView('analytics')}>
            Analytics
          </Button>
          <Button icon={<Eye className="w-4 h-4" />} onClick={() => setCurrentView('complaints')}>
            All Complaints
          </Button>
        </div>
      </motion.div>

      {/* Critical Banner */}
      {criticalComplaints.length > 0 && (
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          className="bg-danger-500/10 border border-danger-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-danger-400">{criticalComplaints.length} Critical Issues Require Immediate Attention</p>
              <p className="text-sm text-surface-400">Average response time exceeded. Immediate action required.</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setCurrentView('complaints')}>View All</Button>
          </div>
        </motion.div>
      )}

      {/* Pending Budget Requests Banner */}
      {pendingBudgets.length > 0 && (
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          className="bg-warning-500/10 border border-warning-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-warning-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-warning-400">{pendingBudgets.length} Budget Request{pendingBudgets.length > 1 ? 's' : ''} Awaiting Your Approval</p>
              <p className="text-sm text-surface-400">Total pending: ₹{pendingBudgets.reduce((a, e) => a + e.amount, 0).toLocaleString('en-IN')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentView('budget')}>
              Review All
            </Button>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title:'Total Complaints', value:complaints.length, change:'+12% this week', type:'negative' as const, icon:<AlertCircle className="w-5 h-5 text-white"/>, bg:'from-primary-500 to-primary-600' },
          { title:'Pending Verification', value:pendingComplaints.length, change:`${verifiedComplaints.length} verified`, type:'neutral' as const, icon:<Clock className="w-5 h-5 text-white"/>, bg:'from-warning-500 to-warning-600' },
          { title:'Resolution Rate', value:'82%', change:'+5% improvement', type:'positive' as const, icon:<CheckCircle className="w-5 h-5 text-white"/>, bg:'from-accent-500 to-accent-600' },
          { title:'Active Contractors', value:activeContractors.length, change:`${projects.filter(p=>p.status==='in_progress').length} ongoing projects`, type:'neutral' as const, icon:<Truck className="w-5 h-5 text-white"/>, bg:'from-purple-500 to-purple-600' },
          { title:'Budget Utilized', value:`${((utilized/totalBudget)*100).toFixed(0)}%`, change:`₹${(utilized/10000000).toFixed(1)}Cr spent`, type:'neutral' as const, icon:<Wallet className="w-5 h-5 text-white"/>, bg:'from-cyan-500 to-cyan-600' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1+i*0.05 }}>
            <StatCard title={s.title} value={s.value} change={s.change} changeType={s.type} icon={s.icon} iconBg={s.bg} />
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Complaints requiring action */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }} className="lg:col-span-2">
          <Card variant="gradient" padding="none">
            <div className="p-5 border-b border-surface-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-white">Complaints Requiring Action</h2>
                <span className="px-2 py-0.5 bg-warning-500/20 text-warning-400 text-xs rounded-full">
                  {pendingComplaints.length + verifiedComplaints.length} need action
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('complaints')}>View All</Button>
            </div>
            <div className="divide-y divide-surface-700/50 max-h-96 overflow-y-auto">
              {complaints.filter(c => c.status === 'pending' || c.status === 'verified').slice(0, 6).map(complaint => (
                <div key={complaint.id} className="p-4 hover:bg-surface-800/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-surface-500 font-mono">{complaint.id}</span>
                        <SeverityBadge severity={complaint.severity} />
                        <StatusBadge status={complaint.status} />
                      </div>
                      <h3 className="font-medium text-white">{complaint.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-surface-400 flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/>{complaint.location.district}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/>{new Date(complaint.reportedAt).toLocaleDateString('en-IN')}</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5"/>{complaint.votes} votes</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {complaint.status === 'pending' && (
                        <Button variant="outline" size="sm" icon={<ClipboardCheck className="w-3.5 h-3.5"/>}
                          onClick={() => setVerifyModal(complaint.id)}>Verify</Button>
                      )}
                      {(complaint.status === 'verified' || complaint.status === 'pending') && (
                        <Button size="sm" icon={<ChevronRight className="w-3.5 h-3.5"/>}
                          onClick={() => { setAssignModal(complaint.id); setAssignContractor(''); setAssignBudget(''); }}>
                          Assign
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* SLA */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}>
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">SLA Compliance</h2>
              <Shield className="w-5 h-5 text-surface-400" />
            </div>
            <div className="flex justify-center mb-4">
              <CircularProgress value={78} size={120} strokeWidth={12} variant="success" />
            </div>
            <div className="space-y-3">
              {[{ label:'Within SLA', v:78, c:'bg-accent-400' },{ label:'Approaching', v:15, c:'bg-warning-400' },{ label:'Breached', v:7, c:'bg-danger-400' }].map(m => (
                <div key={m.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${m.c}`}/><span className="text-sm text-surface-300">{m.label}</span></div>
                  <span className="font-medium text-white">{m.v}%</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-surface-800/50 rounded-lg">
              <p className="text-xs text-surface-400">Avg Resolution Time</p>
              <p className="text-lg font-bold text-white">4.2 days</p>
              <p className="text-xs text-accent-400">↓ 0.8 days from last month</p>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card variant="gradient" padding="none" className="lg:col-span-2">
          <div className="p-5 border-b border-surface-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary-400" />
              <h2 className="font-semibold text-white">AI Priority Queue</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('complaints')}>Review</Button>
          </div>
          <div className="divide-y divide-surface-700/50">
            {aiPriorityQueue.map((complaint) => (
              <div key={complaint.id} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-300">{complaint.priorityScore || complaint.aiAnalysis?.priority || 0}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <SeverityBadge severity={complaint.severity} />
                    <StatusBadge status={complaint.status} />
                    <span className="text-xs text-surface-500">{complaint.supportCount || complaint.votes} supporters</span>
                  </div>
                  <p className="font-medium text-white truncate">{complaint.title}</p>
                  <p className="text-xs text-surface-400">
                    Cost ₹{(complaint.estimatedCost || complaint.aiAnalysis?.estimatedCost || 0).toLocaleString('en-IN')} • Repair {complaint.estimatedDays || complaint.aiAnalysis?.estimatedDays || 7} days
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setAssignModal(complaint.id)}>
                  Assign
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="gradient">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-warning-400" />
            <h2 className="font-semibold text-white">Smart Signals</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Duplicate Supports', value: duplicateSupportedCount, detail: 'citizens consolidated into existing issues' },
              { label: 'Avg Repair Estimate', value: `${Math.round(complaints.reduce((sum, c) => sum + (c.estimatedDays || c.aiAnalysis?.estimatedDays || 7), 0) / Math.max(complaints.length, 1))} days`, detail: 'from AI time engine' },
              { label: 'Hotspot Analytics', value: hotspotZones.length, detail: 'priority zones visible on heatmap' },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-surface-800/50 rounded-lg">
                <p className="text-xs text-surface-400">{item.label}</p>
                <p className="text-xl font-bold text-white">{item.value}</p>
                <p className="text-xs text-surface-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── BUDGET SANCTION SECTION ─────────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}>
        <Card variant="gradient" padding="none">
          <div className="p-5 border-b border-surface-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Banknote className="w-5 h-5 text-warning-400" />
              <h2 className="font-semibold text-white">Budget Sanctions & Approvals</h2>
              {pendingBudgets.length > 0 && (
                <span className="px-2 py-0.5 bg-warning-500/20 text-warning-400 text-xs rounded-full animate-pulse">
                  {pendingBudgets.length} pending
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5"/>} onClick={() => setSanctionModal(true)}>
                New Sanction
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('budget')}>View All</Button>
            </div>
          </div>

          {/* Budget KPIs */}
          <div className="grid grid-cols-4 gap-px bg-surface-700/50">
            {[
              { label:'Total Sanctioned', value:`₹${(totalBudget/10000000).toFixed(1)}Cr`, color:'text-primary-400' },
              { label:'Disbursed', value:`₹${(utilized/10000000).toFixed(1)}Cr`, color:'text-accent-400' },
              { label:'Pending Approvals', value:pendingBudgets.length, color:'text-warning-400' },
              { label:'Pending Amount', value:`₹${(pendingBudgets.reduce((a,e)=>a+e.amount,0)/100000).toFixed(1)}L`, color:'text-danger-400' },
            ].map(k => (
              <div key={k.label} className="p-4 bg-surface-900/30">
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-surface-400 mt-1">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Budget utilization bar */}
          <div className="p-4 border-b border-surface-700/50">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-surface-400">Budget Utilization</span>
              <span className="text-white">{((utilized/totalBudget)*100).toFixed(1)}%</span>
            </div>
            <Progress value={(utilized/totalBudget)*100} size="lg" variant="default" />
          </div>

          {/* Pending budget requests */}
          <div className="divide-y divide-surface-700/50">
            {pendingBudgets.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-10 h-10 text-accent-500 mx-auto mb-2" />
                <p className="text-surface-400">All budget requests reviewed</p>
              </div>
            ) : (
              pendingBudgets.slice(0, 5).map(entry => (
                <div key={entry.id} className="p-4 hover:bg-surface-800/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white">{entry.projectTitle}</p>
                        <span className="text-xs bg-warning-500/10 text-warning-400 border border-warning-500/20 px-2 py-0.5 rounded capitalize">{entry.type}</span>
                      </div>
                      <p className="text-sm text-surface-400">{entry.contractor} • {entry.district}</p>
                      {entry.notes && <p className="text-xs text-surface-500 mt-1 italic">{entry.notes}</p>}
                      <p className="text-xs text-surface-500 mt-1">Requested: {entry.requestedAt}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-white">₹{entry.amount.toLocaleString('en-IN')}</p>
                      <div className="flex gap-1.5 mt-2">
                        <button onClick={() => handleApproveBudget(entry.id)}
                          className="flex items-center gap-1 text-xs bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 border border-accent-500/30 px-3 py-1.5 rounded-lg transition-colors font-medium">
                          <CheckCircle className="w-3.5 h-3.5"/> Approve
                        </button>
                        <button onClick={() => { setRejectModal(entry.id); setRejectNotes(''); }}
                          className="flex items-center gap-1 text-xs bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 border border-danger-500/30 px-3 py-1.5 rounded-lg transition-colors font-medium">
                          <XCircle className="w-3.5 h-3.5"/> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.7 }}>
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Weekly Complaint Trend</h2>
              <Activity className="w-5 h-5 text-surface-400" />
            </div>
            <LineChartComponent data={trendData}
              lines={[{ dataKey:'complaints', color:'#f59e0b', name:'Complaints' },{ dataKey:'resolved', color:'#10b981', name:'Resolved' }]}
              xAxisKey="name" height={200} />
          </Card>
        </motion.div>
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.8 }}>
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Complaints by Category</h2>
              <Target className="w-5 h-5 text-surface-400" />
            </div>
            <DonutChartComponent data={complaintsByCategory} dataKey="value" nameKey="name" centerValue={analytics?.summary?.total_complaints?.toString() || "591"} centerLabel="Total" height={200} />
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Contractors */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.9 }} className="lg:col-span-2">
          <Card variant="gradient">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Top Performing Contractors</h2>
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('contractors')}>View All</Button>
            </div>
            <div className="space-y-3">
              {contractors.slice(0, 4).map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-surface-800/50 rounded-xl hover:bg-surface-800/80 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${
                    i===0?'bg-gradient-to-br from-yellow-400 to-yellow-600':
                    i===1?'bg-gradient-to-br from-surface-400 to-surface-600':
                    i===2?'bg-gradient-to-br from-orange-500 to-orange-700':'bg-surface-700'}`}>
                    {i < 3 ? i+1 : <Star className="w-4 h-4"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{c.company}</p>
                    <p className="text-xs text-surface-400">{c.completedProjects} completed • {c.activeProjects} active</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent-400">{c.performanceScore}%</p>
                      <p className="text-xs text-surface-500">★ {c.rating}</p>
                    </div>
                    <Badge variant={c.status==='active'?'success':'danger'} dot>{c.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Hotspot + AI */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:1 }}>
          <Card variant="gradient">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-warning-400"/>
              <h2 className="font-semibold text-white">Hotspot Zones</h2>
            </div>
            <div className="space-y-2">
              {hotspotZones.map((z, i) => (
                <div key={i} className="p-3 bg-surface-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-white">{z.zone}</p>
                    <SeverityBadge severity={z.severity} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-surface-400">
                    <span>{z.issues} issues</span>
                    <span className="flex items-center gap-1">
                      {z.trend==='up'?<TrendingUp className="w-3 h-3 text-danger-400"/>:
                       z.trend==='down'?<TrendingDown className="w-3 h-3 text-accent-400"/>:
                       <span className="w-3 h-0.5 bg-surface-500 inline-block"/>}
                      {z.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" size="sm" onClick={() => setCurrentView('map')}>
              View Heatmap
            </Button>
          </Card>
        </motion.div>
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────── */}

      {/* Verify Modal */}
      <Modal isOpen={!!verifyModal} onClose={() => setVerifyModal(null)} title="Verify Complaint">
        {verifyModal && (() => {
          const c = complaints.find(x => x.id === verifyModal);
          return c ? (
            <div className="space-y-4">
              <div className="bg-surface-800/50 rounded-xl p-4 space-y-2">
                <div className="flex gap-2 flex-wrap"><SeverityBadge severity={c.severity}/><StatusBadge status={c.status}/></div>
                <h3 className="font-semibold text-white">{c.title}</h3>
                <p className="text-sm text-surface-400">{c.description}</p>
                <p className="text-xs text-surface-500 flex items-center gap-1"><MapPin className="w-3 h-3"/>{c.location.address}</p>
                {c.aiAnalysis && (
                  <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3 mt-2">
                    <p className="text-xs text-primary-400 mb-1">🤖 AI Assessment</p>
                    <p className="text-sm text-white">Priority: {c.aiAnalysis.priority}/100 • Est. Cost: ₹{c.aiAnalysis.estimatedCost?.toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-surface-300">Verifying this complaint confirms it is a legitimate infrastructure issue and will move it to the assignment queue.</p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setVerifyModal(null)}>Cancel</Button>
                <Button icon={<ClipboardCheck className="w-4 h-4"/>} onClick={() => handleVerify(verifyModal)}>
                  Verify Complaint
                </Button>
              </div>
            </div>
          ) : null;
        })()}
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={!!assignModal} onClose={() => setAssignModal(null)} title="Assign Complaint to Contractor" size="lg">
        {assignModal && (() => {
          const c = complaints.find(x => x.id === assignModal);
          return c ? (
            <div className="space-y-4">
              <div className="bg-surface-800/50 rounded-xl p-3">
                <p className="text-sm text-surface-400">Complaint</p>
                <p className="font-semibold text-white">{c.title}</p>
                <p className="text-xs text-surface-400">{c.location.address} • {c.severity} severity</p>
              </div>
              <Select label="Assign Contractor *" value={assignContractor} onChange={e => setAssignContractor(e.target.value)}
                options={[{ value:'', label:'Select contractor…' },
                  ...activeContractors.map(ct => ({ value:ct.id, label:`${ct.company} — ${ct.email || 'linked contractor login'} — ★${ct.rating} — Score:${ct.performanceScore}%` }))]} />
              <Input label="Repair Budget (₹) *" type="number" value={assignBudget} onChange={e => setAssignBudget(e.target.value)}
                placeholder={`${c.aiAnalysis?.estimatedCost || 50000}`}
                helperText={c.aiAnalysis ? `AI estimate: ₹${c.aiAnalysis.estimatedCost?.toLocaleString('en-IN')}` : ''} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Start Date" type="date" value={assignStart} onChange={e => setAssignStart(e.target.value)} />
                <Input label="Target End Date" type="date" value={assignEnd} onChange={e => setAssignEnd(e.target.value)} />
              </div>
              {assignContractor && (() => {
                const ct = activeContractors.find(x => x.id === assignContractor);
                return ct ? (
                  <div className="bg-accent-500/10 border border-accent-500/20 rounded-xl p-3 grid grid-cols-4 gap-3 text-center">
                    <div><p className="text-xs text-surface-400">Rating</p><p className="font-bold text-white">★ {ct.rating}</p></div>
                    <div><p className="text-xs text-surface-400">Score</p><p className="font-bold text-white">{ct.performanceScore}%</p></div>
                    <div><p className="text-xs text-surface-400">Active</p><p className="font-bold text-white">{ct.activeProjects} projects</p></div>
                    <div><p className="text-xs text-surface-400">Login</p><p className="font-bold text-white truncate">{ct.email || 'Linked'}</p></div>
                  </div>
                ) : null;
              })()}
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setAssignModal(null)}>Cancel</Button>
                <Button onClick={() => handleAssign(assignModal)} disabled={!assignContractor || !assignBudget}
                  icon={<ChevronRight className="w-4 h-4"/>}>
                  Assign & Create Project
                </Button>
              </div>
            </div>
          ) : null;
        })()}
      </Modal>

      {/* Budget Sanction Modal */}
      <Modal isOpen={sanctionModal} onClose={() => setSanctionModal(false)} title="Sanction New Budget" size="lg">
        <div className="space-y-4">
          <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3">
            <p className="text-xs text-primary-400 mb-1">ℹ️ Budget Sanction</p>
            <p className="text-sm text-surface-300">Sanctioning allocates government funds to a project. This action will be recorded in the audit log.</p>
          </div>
          <Select label="Project *" value={sanctionProject} onChange={e => setSanctionProject(e.target.value)}
            options={[{ value:'', label:'Select project…' }, ...projects.map(p => ({ value:p.id, label:`${p.id}: ${p.title}` }))]} />
          <Select label="Contractor" value={sanctionContractor} onChange={e => setSanctionContractor(e.target.value)}
            options={[{ value:'', label:'Select contractor (optional)…' }, ...activeContractors.map(c => ({ value:c.id, label:c.company }))]} />
          <Input label="Amount (₹) *" type="number" value={sanctionAmount} onChange={e => setSanctionAmount(e.target.value)} placeholder="500000" />
          <Textarea label="Sanction Notes" value={sanctionNotes} onChange={e => setSanctionNotes(e.target.value)}
            placeholder="Reason for budget sanction, project details, approval reference…" />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSanctionModal(false)}>Cancel</Button>
            <Button icon={<Banknote className="w-4 h-4"/>} onClick={handleSanction} disabled={!sanctionProject || !sanctionAmount}>
              Sanction Budget
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Budget Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Budget Request">
        <div className="space-y-4">
          {rejectModal && (() => {
            const entry = budgetEntries.find(e => e.id === rejectModal);
            return entry ? (
              <div className="bg-surface-800/50 rounded-xl p-3">
                <p className="font-medium text-white">{entry.projectTitle}</p>
                <p className="text-sm text-surface-400">{entry.contractor} • ₹{entry.amount.toLocaleString('en-IN')}</p>
              </div>
            ) : null;
          })()}
          <Textarea label="Rejection Reason *" value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
            placeholder="Explain why this request is being rejected…" />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger" icon={<XCircle className="w-4 h-4"/>} onClick={handleRejectBudget} disabled={!rejectNotes}>
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
