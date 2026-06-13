import { Download, MapPin, Wallet, AlertCircle, Truck, CheckCircle } from 'lucide-react';
import { Card, StatCard } from '../ui/Card';
import { Badge, StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { useStore } from '../../store/useStore';
import { PageHeader } from './PageHeader';

const formatMoney = (value: number) => `₹${value.toLocaleString('en-IN')}`;

export function TransparencyPage() {
  const { projects, contractors, budgetEntries, complaints, setCurrentView } = useStore();
  const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0);
  const totalSpent = projects.reduce((sum, project) => sum + project.spent, 0);
  const openComplaints = complaints.filter((complaint) => complaint.status !== 'resolved').length;
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transparency Portal"
        subtitle="Public view of road type, contractor responsibility, budgets, sources and repair history."
        action={<Button icon={<Download className="w-4 h-4" />}>Export Public Ledger</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tracked Road Works" value={projects.length} change="All linked to location records" icon={<MapPin className="w-5 h-5 text-white" />} />
        <StatCard title="Budget Published" value={formatMoney(totalBudget)} change={totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}% spent` : '0% spent'} icon={<Wallet className="w-5 h-5 text-white" />} iconBg="from-accent-500 to-accent-600" />
        <StatCard title="Open Issues" value={openComplaints} change="Citizen reports still active" icon={<AlertCircle className="w-5 h-5 text-white" />} iconBg="from-warning-500 to-warning-600" />
        <StatCard title="Avg Work Progress" value={`${avgProgress}%`} change="Across active projects" icon={<Truck className="w-5 h-5 text-white" />} iconBg="from-danger-500 to-danger-600" />
      </div>

      <div className="grid xl:grid-cols-[1.35fr_0.65fr] gap-6">
        <Card variant="gradient" padding="none">
          <div className="p-4 border-b border-surface-700/50 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-white">Road Accountability Register</h2>
              <p className="text-sm text-surface-400">Road type, last relaying date, contractor, spend and complaint linkage.</p>
            </div>
            <Badge variant="info">Public</Badge>
          </div>
          <div className="divide-y divide-surface-700/50">
            {projects.map((project) => {
              const contractor = contractors.find((item) => item.id === project.contractor);

              return (
                <div key={project.id} className="p-4 hover:bg-surface-800/30 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-mono text-xs text-surface-500">{project.id}</span>
                        <Badge variant="outline">{project.roadType}</Badge>
                        <StatusBadge status={project.status} />
                        {project.qualityScore && <Badge variant={project.qualityScore >= 75 ? 'success' : project.qualityScore >= 60 ? 'warning' : 'danger'}>Quality {project.qualityScore}/100</Badge>}
                      </div>
                      <h3 className="font-semibold text-white">{project.title}</h3>
                      <p className="text-sm text-surface-400 mt-1">{project.location.address} • Last relayed {project.lastRelayingDate}</p>
                      <p className="text-sm text-surface-400 mt-1">Responsible contractor: {contractor?.company || project.contractorName}</p>
                      <p className="text-xs text-surface-500 mt-1">{project.responsibleAuthority} • {project.executiveEngineer}</p>
                      <p className="text-xs text-surface-500 mt-1">Budget source: {project.budgetSource}</p>
                    </div>
                    <div className="w-full lg:w-80">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-surface-300">Spend</span>
                        <span className="text-white">{formatMoney(project.spent)} / {formatMoney(project.budget)}</span>
                      </div>
                      <Progress value={project.budget > 0 ? (project.spent / project.budget) * 100 : 0} variant="success" />
                      <div className="flex justify-between text-xs text-surface-500 mt-2">
                        <span>{project.complaints.length} linked complaint(s)</span>
                        <span>{project.progress}% complete</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setCurrentView('projects')}>Inspect</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card variant="gradient">
            <h3 className="font-semibold text-white mb-4">Budget Source Trail</h3>
            <div className="space-y-3">
              {budgetEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-start justify-between gap-3 p-3 bg-surface-800/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">{entry.projectTitle}</p>
                    <p className="text-xs text-surface-400 capitalize">{entry.type} • {entry.status}</p>
                    <p className="text-xs text-surface-500">{entry.source || 'Source not listed'}</p>
                    <p className="text-xs text-surface-500">{entry.sanctionReference || 'No reference'}</p>
                  </div>
                  <p className="text-sm font-semibold text-accent-400">{formatMoney(entry.amount)}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card variant="gradient">
            <h3 className="font-semibold text-white mb-4">Complaint Routing Rule</h3>
            <div className="space-y-3 text-sm">
              {['Critical potholes: Executive Engineer + traffic cell', 'Streetlight faults: Electrical division', 'Drainage/flooding: Stormwater authority', 'Budget revisions: Finance approver queue'].map((rule) => (
                <div key={rule} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent-400 mt-0.5 flex-shrink-0" />
                  <span className="text-surface-300">{rule}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
