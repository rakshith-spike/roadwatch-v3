import type { ReactNode } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CheckCircle,
  Clock,
  Database,
  Download,
  FileText,
  Globe2,
  HardDrive,
  HelpCircle,
  Lock,
  MapPin,
  Network,
  Radio,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Smartphone,
  Truck,
  Users,
  Wallet,
  WifiOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, StatCard } from '../ui/Card';
import { Badge, SeverityBadge, StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { useStore } from '../../store/useStore';

const formatMoney = (value: number) => `₹${value.toLocaleString('en-IN')}`;

function PageHeader({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-surface-400">{subtitle}</p>
      </div>
      {action}
    </motion.div>
  );
}

export function TransparencyPage() {
  const { projects, contractors, budgetEntries, complaints, setCurrentView } = useStore();
  const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0);
  const totalSpent = projects.reduce((sum, project) => sum + project.spent, 0);
  const openComplaints = complaints.filter((complaint) => complaint.status !== 'resolved').length;
  const avgProgress = Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transparency Portal"
        subtitle="Public view of road type, contractor responsibility, budgets, sources and repair history."
        action={<Button icon={<Download className="w-4 h-4" />}>Export Public Ledger</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tracked Road Works" value={projects.length} change="All linked to location records" icon={<MapPin className="w-5 h-5 text-white" />} />
        <StatCard title="Budget Published" value={formatMoney(totalBudget)} change={`${Math.round((totalSpent / totalBudget) * 100)}% spent`} icon={<Wallet className="w-5 h-5 text-white" />} iconBg="from-accent-500 to-accent-600" />
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
                      <Progress value={(project.spent / project.budget) * 100} variant="success" />
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

export function ReportsPage() {
  const { projects, complaints, budgetEntries } = useStore();
  const reports = [
    { title: 'Monthly Road Quality Summary', owner: 'Public Works', status: 'Ready', rows: complaints.length + projects.length },
    { title: 'Budget Transparency Ledger', owner: 'Finance Cell', status: 'Ready', rows: budgetEntries.length },
    { title: 'Contractor Performance Pack', owner: 'Engineering Audit', status: 'Draft', rows: projects.length },
    { title: 'Citizen Complaint Resolution Log', owner: 'Grievance Desk', status: 'Ready', rows: complaints.length }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Documents" subtitle="Generate audit-ready exports for road quality, complaints, spend and contractor performance." action={<Button icon={<FileText className="w-4 h-4" />}>Generate Report</Button>} />
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {reports.map((report) => (
          <Card key={report.title} variant="gradient" hover>
            <div className="flex items-start justify-between gap-3">
              <FileText className="w-5 h-5 text-primary-400" />
              <Badge variant={report.status === 'Ready' ? 'success' : 'warning'}>{report.status}</Badge>
            </div>
            <h3 className="font-semibold text-white mt-4">{report.title}</h3>
            <p className="text-sm text-surface-400 mt-1">{report.owner}</p>
            <div className="flex items-center justify-between mt-5 text-sm">
              <span className="text-surface-400">{report.rows} records</span>
              <button className="text-primary-400 hover:text-primary-300 flex items-center gap-1">Open <ArrowUpRight className="w-3.5 h-3.5" /></button>
            </div>
          </Card>
        ))}
      </div>
      <Card variant="gradient">
        <h2 className="font-semibold text-white mb-4">Data Quality Checklist</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {['Complaint IDs mapped to roads', 'Contractor license shown', 'Budget source included', 'Last relaying date present', 'Repair history attached', 'Authority routing captured'].map((item) => (
            <div key={item} className="flex items-center gap-2 p-3 bg-surface-800/50 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-accent-400" />
              <span className="text-sm text-surface-300">{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function RegionsPage() {
  const regions = [
    { name: 'Bangalore Urban', authority: 'BBMP East / West / South', online: 96, pending: 45 },
    { name: 'Mysore', authority: 'MCC Road Division', online: 88, pending: 18 },
    { name: 'Hubli-Dharwad', authority: 'HDMC Engineering', online: 82, pending: 24 },
    { name: 'Mangalore', authority: 'MCC Works', online: 91, pending: 15 }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Region Configuration" subtitle="Map districts, road authorities and escalation queues for location-based complaint routing." />
      <div className="grid lg:grid-cols-2 gap-4">
        {regions.map((region) => (
          <Card key={region.name} variant="gradient">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{region.name}</h3>
                <p className="text-sm text-surface-400">{region.authority}</p>
              </div>
              <Badge variant={region.online > 90 ? 'success' : 'warning'}>{region.online}% online</Badge>
            </div>
            <Progress value={region.online} className="mt-4" />
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="p-2 bg-surface-800/50 rounded-lg"><p className="text-lg font-bold text-white">{region.pending}</p><p className="text-xs text-surface-400">Pending</p></div>
              <div className="p-2 bg-surface-800/50 rounded-lg"><p className="text-lg font-bold text-white">3</p><p className="text-xs text-surface-400">Queues</p></div>
              <div className="p-2 bg-surface-800/50 rounded-lg"><p className="text-lg font-bold text-white">24x7</p><p className="text-xs text-surface-400">SLA</p></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function NationalOverviewPage() {
  const countries = [
    { name: 'India', standard: 'NH/SH/MDR/Ward', readiness: 92 },
    { name: 'United Kingdom', standard: 'A/B/M roads', readiness: 78 },
    { name: 'United States', standard: 'Interstate/State/County', readiness: 74 },
    { name: 'Singapore', standard: 'Expressway/Arterial', readiness: 86 }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="National Overview" subtitle="Prototype for global deployment: road taxonomy, currency, authority and open-data adapters." action={<Button variant="outline" icon={<Globe2 className="w-4 h-4" />}>Switch Country</Button>} />
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {countries.map((country) => (
          <Card key={country.name} variant="gradient" hover>
            <Globe2 className="w-6 h-6 text-primary-400" />
            <h3 className="font-semibold text-white mt-4">{country.name}</h3>
            <p className="text-sm text-surface-400">{country.standard}</p>
            <Progress value={country.readiness} className="mt-4" />
            <p className="text-xs text-surface-500 mt-2">{country.readiness}% adapter readiness</p>
          </Card>
        ))}
      </div>
      <Card variant="gradient">
        <h2 className="font-semibold text-white mb-4">Global Data Model</h2>
        <div className="grid md:grid-cols-4 gap-3">
          {['Road classification', 'Authority directory', 'Currency + budget source', 'Repair history schema'].map((item) => (
            <div key={item} className="p-4 bg-surface-800/50 rounded-lg">
              <Database className="w-5 h-5 text-accent-400 mb-3" />
              <p className="text-sm font-medium text-white">{item}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function SystemHealthPage() {
  const services = [
    { name: 'API Gateway', status: 'Operational', value: 99 },
    { name: 'Complaint Queue', status: 'Operational', value: 94 },
    { name: 'Offline Sync', status: 'Degraded', value: 81 },
    { name: 'Map Tiles Cache', status: 'Operational', value: 97 }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="System Health Monitor" subtitle="Operational readiness, low-network behavior and offline sync visibility." />
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {services.map((service) => (
          <Card key={service.name} variant="gradient">
            <div className="flex items-center justify-between">
              <Server className="w-5 h-5 text-primary-400" />
              <Badge variant={service.status === 'Operational' ? 'success' : 'warning'}>{service.status}</Badge>
            </div>
            <h3 className="font-semibold text-white mt-4">{service.name}</h3>
            <Progress value={service.value} className="mt-4" variant={service.value > 90 ? 'success' : 'warning'} />
            <p className="text-xs text-surface-500 mt-2">{service.value}% health score</p>
          </Card>
        ))}
      </div>
      <Card variant="gradient">
        <h2 className="font-semibold text-white mb-4">Offline Robustness Plan</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { icon: WifiOff, title: 'Offline Complaint Drafts', desc: 'Reports are queued locally until network returns.' },
            { icon: HardDrive, title: 'Map Cache', desc: 'Priority ward tiles and issue lists stay available.' },
            { icon: Radio, title: 'Retry Sync', desc: 'Background retries show last sync and failure reason.' }
          ].map((item) => (
            <div key={item.title} className="p-4 bg-surface-800/50 rounded-lg">
              <item.icon className="w-5 h-5 text-accent-400 mb-3" />
              <p className="font-medium text-white">{item.title}</p>
              <p className="text-sm text-surface-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AuditLogsPage() {
  const logs = [
    ['Budget approved', 'Dr. Ananya Reddy approved B004', '2 min ago', 'success'],
    ['Complaint verified', 'C003 routed to Executive Engineer', '18 min ago', 'info'],
    ['Contractor warning', 'Delayed milestone on HSR resurfacing', '1 hr ago', 'warning'],
    ['Role updated', 'Kiran Nair moved to inactive status', 'Yesterday', 'default']
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" subtitle="Traceable activity for complaint routing, budget approval and administrative changes." />
      <Card variant="gradient" padding="none">
        <div className="p-4 border-b border-surface-700/50 flex items-center gap-3">
          <Search className="w-4 h-4 text-surface-400" />
          <input className="bg-transparent flex-1 text-sm text-white placeholder-surface-500 focus:outline-none" placeholder="Search audit events..." />
        </div>
        <div className="divide-y divide-surface-700/50">
          {logs.map(([title, desc, time, variant]) => (
            <div key={title} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-surface-400 mt-1" />
                <div>
                  <p className="font-medium text-white">{title}</p>
                  <p className="text-sm text-surface-400">{desc}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={variant as any}>{variant}</Badge>
                <p className="text-xs text-surface-500 mt-1">{time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Configure notifications, accessibility, locale and prototype data behavior." />
      <div className="grid lg:grid-cols-2 gap-4">
        {[
          { icon: Smartphone, title: 'Citizen Notifications', desc: 'SMS, email and in-app updates for complaint progress.' },
          { icon: Network, title: 'Authority Routing', desc: 'Escalation rules by road type, ward and severity.' },
          { icon: Settings, title: 'Accessibility', desc: 'High contrast, readable charts and keyboard-friendly controls.' },
          { icon: Globe2, title: 'Localization', desc: 'Country, currency, date format and road taxonomy adapters.' }
        ].map((item) => (
          <Card key={item.title} variant="gradient">
            <item.icon className="w-5 h-5 text-primary-400 mb-3" />
            <h3 className="font-semibold text-white">{item.title}</h3>
            <p className="text-sm text-surface-400 mt-1">{item.desc}</p>
            <div className="mt-4 h-9 rounded-lg bg-surface-800/50 border border-surface-700 flex items-center justify-between px-3">
              <span className="text-sm text-surface-300">Enabled</span>
              <span className="w-9 h-5 rounded-full bg-accent-500 relative"><span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" /></span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function HelpCenterPage() {
  const steps = [
    ['Report', 'Citizen submits issue with photo and location.'],
    ['Analyze', 'AI classifies category, severity, duplicate risk and cost.'],
    ['Route', 'System sends it to the correct authority or engineer.'],
    ['Repair', 'Contractor updates milestones, spend and evidence.'],
    ['Verify', 'Authority and citizen close the loop with proof.']
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Help Center" subtitle="Operational guide for citizens, contractors and government officers." />
      <Card variant="gradient">
        <h2 className="font-semibold text-white mb-4">Complaint Lifecycle</h2>
        <div className="grid md:grid-cols-5 gap-3">
          {steps.map(([title, desc], index) => (
            <div key={title} className="p-4 bg-surface-800/50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold mb-3">{index + 1}</div>
              <p className="font-medium text-white">{title}</p>
              <p className="text-sm text-surface-400 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: Users, title: 'Citizens', desc: 'Report issues, vote, track status and inspect public spend.' },
          { icon: Building2, title: 'Authorities', desc: 'Verify complaints, route to engineers and approve budgets.' },
          { icon: Truck, title: 'Contractors', desc: 'Update work progress, upload proof and request funds.' }
        ].map((item) => (
          <Card key={item.title} variant="gradient">
            <item.icon className="w-5 h-5 text-accent-400 mb-3" />
            <h3 className="font-semibold text-white">{item.title}</h3>
            <p className="text-sm text-surface-400 mt-1">{item.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
