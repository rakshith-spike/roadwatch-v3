import { Users, Building2, Truck } from 'lucide-react';
import { Card } from '../ui/Card';
import { PageHeader } from './PageHeader';

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
