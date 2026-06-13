import { Globe2, Database } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { PageHeader } from './PageHeader';

export function NationalOverviewPage() {
  const countries = [
    { name: 'India', standard: 'NH/SH/MDR/Ward', readiness: 92 },
    { name: 'United Kingdom', standard: 'A/B/M roads', readiness: 78 },
    { name: 'United States', standard: 'Interstate/State/County', readiness: 74 },
    { name: 'Singapore', standard: 'Expressway/Arterial', readiness: 86 }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="National Overview" 
        subtitle="Prototype for global deployment: road taxonomy, currency, authority and open-data adapters." 
        action={<Button variant="outline" icon={<Globe2 className="w-4 h-4" />}>Switch Country</Button>} 
      />
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
