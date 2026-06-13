import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { PageHeader } from './PageHeader';

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
