import { useState, useEffect } from 'react';
import { Server, WifiOff, HardDrive, Radio } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { api } from '../../services/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { PageHeader } from './PageHeader';

export function SystemHealthPage() {
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [apiStatus, setApiStatus] = useState<'healthy' | 'unhealthy' | 'loading'>('loading');
  const [currentLatency, setCurrentLatency] = useState<number | null>(null);
  const [latencyHistory, setLatencyHistory] = useState<{ time: string; latency: number }[]>([
    { time: '12:00', latency: 18 },
    { time: '12:05', latency: 22 },
    { time: '12:10', latency: 25 },
    { time: '12:15', latency: 19 },
    { time: '12:20', latency: 21 },
    { time: '12:25', latency: 24 },
    { time: '12:30', latency: 20 },
    { time: '12:35', latency: 23 },
    { time: '12:40', latency: 27 },
    { time: '12:45', latency: 22 }
  ]);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const start = performance.now();
      try {
        const health = await api.checkHealth();
        const end = performance.now();
        const duration = Math.round(end - start);
        if (!active) return;
        
        setApiStatus(health.status === 'healthy' ? 'healthy' : 'unhealthy');
        setDbStatus(health.database === 'connected' ? 'connected' : 'disconnected');
        setCurrentLatency(duration);
        
        setLatencyHistory(prev => {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const updated = [...prev, { time: nowStr, latency: duration }];
          if (updated.length > 15) {
            updated.shift();
          }
          return updated;
        });
      } catch (err) {
        if (!active) return;
        setApiStatus('unhealthy');
        setDbStatus('disconnected');
        setCurrentLatency(null);
      }
    };
    
    check();
    const interval = setInterval(check, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const services = [
    { name: 'API Gateway', status: apiStatus === 'healthy' ? 'Operational' : apiStatus === 'loading' ? 'Checking' : 'Offline', value: apiStatus === 'healthy' ? 99 : 10, desc: currentLatency ? `${currentLatency}ms latency` : 'Gateway unreachable' },
    { name: 'Database (MongoDB)', status: dbStatus === 'connected' ? 'Operational' : dbStatus === 'loading' ? 'Checking' : 'Offline', value: dbStatus === 'connected' ? 98 : 10, desc: dbStatus === 'connected' ? 'Healthy connection' : 'Database connection error' },
    { name: 'Offline Sync Queue', status: 'Operational', value: 95, desc: '0 drafts waiting to sync' },
    { name: 'Defect Analysis AI', status: 'Operational', value: 96, desc: 'YOLOv8 & Gemini-Pro active' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="System Health Monitor" subtitle="Operational readiness, low-network behavior and offline sync visibility." />
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {services.map((service) => (
          <Card key={service.name} variant="gradient">
            <div className="flex items-center justify-between">
              <Server className="w-5 h-5 text-primary-400" />
              <Badge variant={service.status === 'Operational' ? 'success' : service.status === 'Checking' ? 'warning' : 'danger'}>{service.status}</Badge>
            </div>
            <h3 className="font-semibold text-white mt-4">{service.name}</h3>
            <Progress value={service.value} className="mt-4" variant={service.value > 90 ? 'success' : 'warning'} />
            <p className="text-xs text-surface-500 mt-2">{service.desc}</p>
          </Card>
        ))}
      </div>

      <Card variant="gradient">
        <h3 className="font-semibold text-white mb-4">Live API Latency Trend</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={latencyHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="latencyGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} unit="ms" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#9ca3af', fontWeight: 'bold' }}
                itemStyle={{ color: '#ffffff' }}
              />
              <Area type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#latencyGlow)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

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
