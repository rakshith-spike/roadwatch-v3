import { Smartphone, Network, Settings as SettingsIcon, Globe2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { PageHeader } from './PageHeader';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Configure notifications, accessibility, locale and prototype data behavior." />
      <div className="grid lg:grid-cols-2 gap-4">
        {[
          { icon: Smartphone, title: 'Citizen Notifications', desc: 'SMS, email and in-app updates for complaint progress.' },
          { icon: Network, title: 'Authority Routing', desc: 'Escalation rules by road type, ward and severity.' },
          { icon: SettingsIcon, title: 'Accessibility', desc: 'High contrast, readable charts and keyboard-friendly controls.' },
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
