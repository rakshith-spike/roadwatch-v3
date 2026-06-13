import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, CheckCircle, Clock, XCircle, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Filter, Search, Plus, FileText
} from 'lucide-react';
import { Card, StatCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Modal } from '../ui/Modal';
import { Input, Textarea, Select } from '../ui/Input';
import { useStore } from '../../store/useStore';

export function BudgetPage() {
  const { budgetEntries, projects, contractors, user, approveBudget, rejectBudget, addBudgetEntry } = useStore();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [requestModal, setRequestModal] = useState(false);

  // Budget request form
  const [reqProject, setReqProject] = useState('');
  const [reqAmount, setReqAmount] = useState('');
  const [reqNotes, setReqNotes] = useState('');

  const isContractor = user?.role === 'contractor';
  const isGovOrAdmin = user?.role === 'government' || user?.role === 'superadmin';

  const contractorProfile = contractors.find(c => c.id === user?.contractorId || c.user_id === user?.id);
  const myContractorCompany = contractorProfile?.company || user?.name || null;

  const filtered = budgetEntries.filter(e => {
    if (isContractor && myContractorCompany && e.contractor !== myContractorCompany) return false;
    if (filter !== 'all' && e.status !== filter && e.type !== filter) return false;
    if (search && !e.projectTitle.toLowerCase().includes(search.toLowerCase()) &&
        !e.contractor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalAllocated = budgetEntries.filter(e => e.type === 'allocation' && e.status === 'approved').reduce((a, e) => a + e.amount, 0);
  const totalDisbursed = budgetEntries.filter(e => e.type === 'disbursement' && e.status === 'approved').reduce((a, e) => a + e.amount, 0);
  const pending = budgetEntries.filter(e => e.status === 'pending').length;
  const utilization = totalAllocated > 0 ? (totalDisbursed / totalAllocated) * 100 : 0;

  function handleApprove(id: string) {
    approveBudget(id, user?.name || 'Admin');
  }

  function handleReject() {
    if (!rejectModal) return;
    rejectBudget(rejectModal, rejectNotes);
    setRejectModal(null); setRejectNotes('');
  }

  function handleRequest() {
    if (!reqProject || !reqAmount) return;
    const project = projects.find(p => p.id === reqProject);
    addBudgetEntry({
      id: `B${Date.now()}`,
      projectId: reqProject,
      projectTitle: project?.title || reqProject,
      contractor: myContractorCompany || user?.name || 'Contractor',
      amount: parseInt(reqAmount),
      type: 'request',
      status: 'pending',
      requestedAt: new Date().toISOString().split('T')[0],
      notes: reqNotes,
      district: project?.location.district || 'Bangalore Urban',
      source: project?.budgetSource || 'Contractor variation request',
      sanctionReference: 'Pending approval'
    });
    setRequestModal(false); setReqProject(''); setReqAmount(''); setReqNotes('');
  }

  function typeIcon(type: string) {
    switch (type) {
      case 'allocation': return <ArrowUpRight className="w-4 h-4 text-primary-400" />;
      case 'disbursement': return <ArrowDownRight className="w-4 h-4 text-accent-400" />;
      case 'request': return <Clock className="w-4 h-4 text-warning-400" />;
      case 'revision': return <FileText className="w-4 h-4 text-purple-400" />;
      default: return <Wallet className="w-4 h-4 text-surface-400" />;
    }
  }

  function statusBadge(status: string) {
    if (status === 'approved') return <Badge variant="success" dot>Approved</Badge>;
    if (status === 'rejected') return <Badge variant="danger" dot>Rejected</Badge>;
    return <Badge variant="warning" dot pulse>Pending</Badge>;
  }

  const contractorProjects = isContractor ? projects.filter(p => p.contractor === user?.contractorId) : projects;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Budget Management</h1>
          <p className="text-surface-400">
            {isContractor ? 'Track allocations and request additional funds' : 'Manage fund allocations and approve disbursements'}
          </p>
        </div>
        {isContractor && (
          <Button onClick={() => setRequestModal(true)} icon={<Plus className="w-4 h-4" />}>
            Request Budget
          </Button>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Allocated', value: `₹${(totalAllocated / 10000000).toFixed(2)}Cr`, icon: <Wallet className="w-5 h-5 text-white" />, bg: 'from-primary-500 to-primary-600', change: 'Approved allocations' },
          { title: 'Disbursed', value: `₹${(totalDisbursed / 100000).toFixed(1)}L`, icon: <TrendingUp className="w-5 h-5 text-white" />, bg: 'from-accent-500 to-accent-600', change: `${utilization.toFixed(1)}% utilization` },
          { title: 'Pending Requests', value: pending, icon: <Clock className="w-5 h-5 text-white" />, bg: 'from-warning-500 to-warning-600', change: 'Awaiting approval' },
          { title: 'Budget Utilization', value: `${utilization.toFixed(1)}%`, icon: <TrendingUp className="w-5 h-5 text-white" />, bg: 'from-purple-500 to-purple-600', change: utilization > 80 ? 'High utilization' : 'On track' }
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
            <StatCard {...s} changeType={s.title === 'Pending Requests' && pending > 2 ? 'negative' : 'neutral'} />
          </motion.div>
        ))}
      </div>

      {/* Utilization bar */}
      <Card variant="gradient">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Overall Budget Utilization</h3>
          <span className="text-sm text-surface-400">₹{(totalDisbursed / 100000).toFixed(1)}L of ₹{(totalAllocated / 100000).toFixed(1)}L</span>
        </div>
        <Progress value={utilization} size="lg" variant={utilization > 90 ? 'danger' : utilization > 70 ? 'warning' : 'success'} />
        <div className="flex justify-between text-xs text-surface-500 mt-2">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
        {/* Per-project breakdown */}
        <div className="mt-4 space-y-3">
          {projects.slice(0, 4).map(p => {
            const util = p.budget > 0 ? (p.spent / p.budget) * 100 : 0;
            return (
              <div key={p.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-surface-300 truncate max-w-[60%]">{p.title}</span>
                  <span className="text-surface-400">₹{(p.spent / 100000).toFixed(1)}L / ₹{(p.budget / 100000).toFixed(1)}L</span>
                </div>
                <Progress value={util} size="sm" variant={util > 90 ? 'danger' : util > 70 ? 'warning' : 'default'} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Filter */}
      <Card variant="gradient">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by project or contractor…"
              className="w-full bg-surface-800/50 border border-surface-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-surface-500 focus:outline-none focus:border-primary-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'rejected', 'allocation', 'disbursement', 'request'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === s ? 'bg-primary-500 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Budget Entries */}
      <Card variant="gradient" padding="none">
        <div className="p-4 border-b border-surface-700/50">
          <h2 className="font-semibold text-white">Budget Transactions ({filtered.length})</h2>
        </div>
        <div className="divide-y divide-surface-700/50">
          {filtered.length === 0 && (
            <div className="p-8 text-center">
              <Wallet className="w-10 h-10 text-surface-600 mx-auto mb-2" />
              <p className="text-surface-400">No budget entries found</p>
            </div>
          )}
          {filtered.map((entry, idx) => (
            <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
              className="p-4 hover:bg-surface-800/30 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-surface-800 flex items-center justify-center flex-shrink-0">
                    {typeIcon(entry.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-white">{entry.projectTitle}</p>
                      <span className="text-xs text-surface-500 capitalize bg-surface-800 px-2 py-0.5 rounded">{entry.type}</span>
                    </div>
                    <p className="text-sm text-surface-400">{entry.contractor} • {entry.district}</p>
                    <p className="text-xs text-surface-500 mt-1">Source: {entry.source || 'Not specified'} • Ref: {entry.sanctionReference || 'NA'}</p>
                    {entry.notes && <p className="text-xs text-surface-500 mt-1 italic">{entry.notes}</p>}
                    {entry.status === 'pending' && entry.amount > 150000 && (
                      <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-danger-500/10 border border-danger-500/20 text-danger-400 text-xs w-fit">
                        <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                        <span>AI Audit Flag: Exceeds standard ward limit. Review recommended</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-white text-lg">₹{entry.amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-surface-400">{entry.requestedAt}</p>
                    {entry.approvedAt && <p className="text-xs text-accent-400">Approved: {entry.approvedAt}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 min-w-[100px]">
                    {statusBadge(entry.status)}
                    {entry.status === 'pending' && isGovOrAdmin && (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleApprove(entry.id)}
                          className="text-xs bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 border border-accent-500/30 px-2 py-1 rounded transition-colors flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => { setRejectModal(entry.id); setRejectNotes(''); }}
                          className="text-xs bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 border border-danger-500/30 px-2 py-1 rounded transition-colors flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                    {entry.approvedBy && <p className="text-xs text-surface-500">by {entry.approvedBy}</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Budget Request">
        <div className="space-y-4">
          <p className="text-surface-300">Please provide a reason for rejection.</p>
          <Textarea label="Rejection Notes *" value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
            placeholder="Reason for rejection…" />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} disabled={!rejectNotes}>Reject Request</Button>
          </div>
        </div>
      </Modal>

      {/* Budget Request Modal */}
      <Modal isOpen={requestModal} onClose={() => setRequestModal(false)} title="Request Additional Budget">
        <div className="space-y-4">
          <Select label="Project *" value={reqProject} onChange={e => setReqProject(e.target.value)}
            options={[{ value: '', label: 'Select project…' }, ...contractorProjects.map(p => ({ value: p.id, label: p.title }))]} />
          <Input label="Amount (₹) *" type="number" value={reqAmount} onChange={e => setReqAmount(e.target.value)} placeholder="100000" />
          <Textarea label="Justification *" value={reqNotes} onChange={e => setReqNotes(e.target.value)}
            placeholder="Why is additional budget needed? Provide details…" />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRequestModal(false)}>Cancel</Button>
            <Button onClick={handleRequest} disabled={!reqProject || !reqAmount || !reqNotes}>Submit Request</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
