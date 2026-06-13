import { FileText, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useStore } from '../../store/useStore';
import { PageHeader } from './PageHeader';

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
      <PageHeader 
        title="Reports & Documents" 
        subtitle="Generate audit-ready exports for road quality, complaints, spend and contractor performance." 
        action={<Button icon={<FileText className="w-4 h-4" />}>Generate Report</Button>} 
      />
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
