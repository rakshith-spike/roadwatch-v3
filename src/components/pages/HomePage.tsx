import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  AlertTriangle,
  TrendingUp,
  Users,
  Building2,
  Shield,
  Bot,
  ChevronRight,
  Play,
  CheckCircle2,
  ArrowRight,
  Zap,
  Globe,
  BarChart3,
  Truck,
  Eye,
  Star,
  Clock,
  Target
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useStore, UserRole } from '../../store/useStore';

// Animated counter component
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  
  return <span>{count.toLocaleString()}{suffix}</span>;
}

export function HomePage() {
  const { login } = useStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');

  const handleLogin = () => {
    login('demo@example.com', 'password', selectedRole);
  };

  const stats = [
    { icon: AlertTriangle, label: 'Complaints Resolved', value: 45678, color: 'from-primary-500 to-primary-600' },
    { icon: MapPin, label: 'Roads Monitored', value: 12450, color: 'from-accent-500 to-accent-600' },
    { icon: Truck, label: 'Active Projects', value: 2340, color: 'from-warning-500 to-warning-600' },
    { icon: Users, label: 'Active Citizens', value: 892340, color: 'from-purple-500 to-purple-600' }
  ];

  const features = [
    {
      icon: Bot,
      title: 'AI-Powered Analysis',
      description: 'Smart complaint categorization, severity prediction, and duplicate detection using advanced ML algorithms'
    },
    {
      icon: Globe,
      title: 'GIS Intelligence',
      description: 'Interactive maps with heatmaps, road overlays, and real-time issue tracking across regions'
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'Comprehensive dashboards with predictive insights and trend analysis for informed decisions'
    },
    {
      icon: Shield,
      title: 'Transparent Governance',
      description: 'Complete visibility into budgets, contractor performance, and project timelines'
    },
    {
      icon: Zap,
      title: 'Real-time Alerts',
      description: 'Instant notifications for new issues, SLA breaches, and emergency situations'
    },
    {
      icon: Eye,
      title: 'Complete Visibility',
      description: 'Track every complaint from submission to resolution with full audit trails'
    }
  ];

  const roles = [
    { id: 'citizen', label: 'Citizen', icon: Users, description: 'Report issues & track progress' },
    { id: 'contractor', label: 'Contractor', icon: Truck, description: 'Manage projects & repairs' },
    { id: 'government', label: 'Government', icon: Building2, description: 'Monitor & administrate' },
    { id: 'superadmin', label: 'Super Admin', icon: Shield, description: 'Full system access' }
  ];

  const testimonials = [
    { name: 'Dr. Raghav Sharma', role: 'District Collector, Pune', text: 'ROAD-WATCH has revolutionized how we handle infrastructure complaints. Response time reduced by 60%.' },
    { name: 'Priya Menon', role: 'Citizen, Bangalore', text: 'Finally, a platform where my complaints are actually tracked and resolved. The transparency is amazing!' },
    { name: 'Kumar Infrastructure', role: 'Contractor', text: 'The AI recommendations have helped us prioritize work more efficiently. Great tool for modern contractors.' }
  ];

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 animated-gradient opacity-50" />
        <div className="absolute inset-0 grid-pattern" />
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary-500/20 rounded-full"
              initial={{ x: Math.random() * 100 + '%', y: '100%', opacity: 0 }}
              animate={{ 
                y: '-20%', 
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: Math.random() * 10 + 10, 
                repeat: Infinity, 
                delay: Math.random() * 5 
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full">
                <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" />
                <span className="text-sm text-primary-400">AI-Powered Smart Governance Platform</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-tight">
                Transform
                <span className="gradient-text"> Infrastructure</span>
                <br />
                Monitoring
              </h1>

              <p className="text-xl text-surface-400 max-w-xl">
                ROAD-WATCH leverages AI, GIS mapping, and smart analytics to revolutionize 
                road infrastructure management, ensuring transparency and efficiency.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Play className="w-5 h-5" />
                  Try Live Demo
                </Button>
                <Button variant="outline" size="lg">
                  Learn More
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent-400" />
                  <span className="text-surface-300">Free for Citizens</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent-400" />
                  <span className="text-surface-300">24/7 AI Support</span>
                </div>
              </div>
            </motion.div>

            {/* Right - Interactive Demo Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 blur-3xl" />
              <Card variant="glass" className="relative p-8 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-white">Experience ROAD-WATCH</h3>
                  <p className="text-surface-400">Select your role to explore the platform</p>
                </div>

                <div className="grid grid-cols-2 gap-3" id="demo">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id as UserRole)}
                      className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                        selectedRole === role.id
                          ? 'bg-primary-500/20 border-primary-500 shadow-lg shadow-primary-500/20'
                          : 'bg-surface-800/50 border-surface-700 hover:border-surface-600'
                      }`}
                    >
                      <role.icon className={`w-6 h-6 mb-2 ${selectedRole === role.id ? 'text-primary-400' : 'text-surface-400'}`} />
                      <p className="font-semibold text-white text-sm">{role.label}</p>
                      <p className="text-xs text-surface-500">{role.description}</p>
                    </button>
                  ))}
                </div>

                <Button className="w-full" size="lg" onClick={handleLogin}>
                  Enter as {roles.find(r => r.id === selectedRole)?.label}
                  <ArrowRight className="w-5 h-5" />
                </Button>

                <p className="text-center text-xs text-surface-500">
                  No registration required for demo
                </p>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-surface-600 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Live Statistics */}
      <section className="relative py-20 bg-surface-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Real-time Platform Statistics
            </h2>
            <p className="text-surface-400 max-w-2xl mx-auto">
              Live data from across the nation, updated every minute
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="gradient" hover className="text-center p-6">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    <AnimatedCounter end={stat.value} />
                  </p>
                  <p className="text-surface-400 text-sm">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Insights Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-primary-950/10 to-surface-950" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-500/10 border border-accent-500/20 rounded-full">
                <Bot className="w-4 h-4 text-accent-400" />
                <span className="text-sm text-accent-400">AI-Powered Intelligence</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                Smart Analysis for
                <span className="gradient-text"> Better Decisions</span>
              </h2>

              <p className="text-surface-400 text-lg">
                Our AI engine analyzes complaints, predicts maintenance needs, 
                detects duplicates, and provides actionable recommendations in real-time.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Target, text: 'Automatic complaint categorization with 98% accuracy' },
                  { icon: TrendingUp, text: 'Predictive maintenance alerts before issues occur' },
                  { icon: Clock, text: 'Smart SLA predictions and delay warnings' },
                  { icon: Shield, text: 'Fraud detection and anomaly alerts' }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary-400" />
                    </div>
                    <span className="text-surface-300">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* AI Dashboard Preview */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 to-accent-500/20 blur-2xl" />
                <Card variant="glass" className="relative p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">AI Analysis Dashboard</h4>
                    <span className="text-xs text-accent-400 bg-accent-500/10 px-2 py-1 rounded-full">Live</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-surface-800/50 rounded-xl">
                      <p className="text-xs text-surface-400 mb-1">Road Health Index</p>
                      <p className="text-2xl font-bold text-accent-400">78.5%</p>
                      <div className="mt-2 h-2 bg-surface-700 rounded-full overflow-hidden">
                        <div className="h-full w-[78%] bg-gradient-to-r from-accent-500 to-accent-400 rounded-full" />
                      </div>
                    </div>
                    <div className="p-4 bg-surface-800/50 rounded-xl">
                      <p className="text-xs text-surface-400 mb-1">Issues Detected Today</p>
                      <p className="text-2xl font-bold text-warning-400">47</p>
                      <p className="text-xs text-surface-500 mt-1">↓ 12% from yesterday</p>
                    </div>
                  </div>

                  <div className="p-4 bg-surface-800/50 rounded-xl">
                    <p className="text-xs text-surface-400 mb-3">Severity Distribution</p>
                    <div className="flex gap-2">
                      <div className="flex-1 h-3 bg-accent-500 rounded-full" />
                      <div className="flex-[0.6] h-3 bg-warning-500 rounded-full" />
                      <div className="flex-[0.3] h-3 bg-danger-500 rounded-full" />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-surface-500">
                      <span>Low (45%)</span>
                      <span>Medium (35%)</span>
                      <span>High (20%)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Bot className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-white font-medium">AI Recommendation</p>
                        <p className="text-xs text-surface-400 mt-1">
                          Priority maintenance needed on Ring Road sector 5. 
                          Predicted 3 new potholes in next 7 days based on traffic patterns.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-surface-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Comprehensive Platform Features
            </h2>
            <p className="text-surface-400 max-w-2xl mx-auto">
              Everything you need to manage road infrastructure efficiently
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="gradient" hover className="h-full p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-surface-400 text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Trusted by Stakeholders
            </h2>
            <p className="text-surface-400 max-w-2xl mx-auto">
              See what our users say about ROAD-WATCH
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="glass" className="h-full p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-warning-400 fill-warning-400" />
                    ))}
                  </div>
                  <p className="text-surface-300 mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-surface-500">{testimonial.role}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 via-accent-600/20 to-primary-600/20" />
        <div className="absolute inset-0 grid-pattern" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-6 text-center relative z-10"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            Ready to Transform Your
            <span className="gradient-text"> Infrastructure Management?</span>
          </h2>
          <p className="text-xl text-surface-400 mb-8 max-w-2xl mx-auto">
            Join thousands of citizens, contractors, and government officials using ROAD-WATCH
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={handleLogin}>
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg">
              Schedule Demo
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-900 border-t border-surface-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-white text-lg">ROAD-WATCH</span>
              </div>
              <p className="text-surface-400 text-sm">
                AI-powered smart governance platform for road infrastructure monitoring and transparency.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-surface-400">
                <li><a href="#" className="hover:text-primary-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-surface-400">
                <li><a href="#" className="hover:text-primary-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-surface-400">
                <li><a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-surface-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-surface-500 text-sm">
              © 2024 ROAD-WATCH. All rights reserved. A Government of India Initiative.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-surface-600">Powered by</span>
              <span className="text-xs text-primary-400">AI + GIS + Blockchain</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
