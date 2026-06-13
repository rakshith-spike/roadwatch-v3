import { Search, Lock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PageHeader } from './PageHeader';

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
