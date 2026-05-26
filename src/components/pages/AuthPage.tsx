import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Eye, EyeOff, Mail, Lock, User, Phone, Building2,
  Shield, Truck, Users, AlertTriangle, CheckCircle, ArrowRight,
  Loader2, ChevronLeft
} from 'lucide-react';
import { useStore, UserRole } from '../../store/useStore';
import { api } from '../../services/api';

const DISTRICTS = [
  'Bangalore Urban','Bangalore Rural','Mysore','Hubli-Dharwad',
  'Mangalore','Belgaum','Shimoga','Tumkur','Gulbarga','Bellary',
  'Bijapur','Bidar','Raichur','Davanagere','Udupi','Chitradurga'
];

const STATES = [
  'Karnataka','Maharashtra','Tamil Nadu','Andhra Pradesh','Telangana',
  'Kerala','Gujarat','Rajasthan','Delhi','Uttar Pradesh','West Bengal'
];

const ROLES = [
  { id:'citizen',    label:'Citizen',        icon:Users,    desc:'Report road issues in your area',    color:'from-primary-500 to-primary-600' },
  { id:'contractor', label:'Contractor',     icon:Truck,    desc:'Manage repair projects & work logs', color:'from-accent-500 to-accent-600' },
  { id:'government', label:'Gov Admin',      icon:Building2,desc:'Oversee district infrastructure',    color:'from-warning-500 to-warning-600' },
  { id:'superadmin', label:'Super Admin',    icon:Shield,   desc:'Full platform administration',       color:'from-purple-500 to-purple-600' },
];

const DEMO_USERS: Record<string, { id: string; name: string; email: string; role: UserRole; district?: string; state?: string }> = {
  'citizen@demo.com': {
    id: 'demo-citizen',
    name: 'Amit Citizen',
    email: 'citizen@demo.com',
    role: 'citizen',
    district: 'Bangalore Urban',
    state: 'Karnataka'
  },
  'contractor@demo.com': {
    id: 'contractor1',
    name: 'Rajesh Kumar',
    email: 'contractor@demo.com',
    role: 'contractor',
    district: 'Bangalore Urban',
    state: 'Karnataka'
  },
  'admin@demo.com': {
    id: 'demo-government',
    name: 'Dr. Ananya Reddy',
    email: 'admin@demo.com',
    role: 'government',
    district: 'Bangalore Urban',
    state: 'Karnataka'
  },
  'superadmin@demo.com': {
    id: 'demo-superadmin',
    name: 'System Admin',
    email: 'superadmin@demo.com',
    role: 'superadmin',
    state: 'National'
  }
};

interface FormError { [key: string]: string }

export function AuthPage() {
  const { setUser, addSystemUser } = useStore();
  const [mode, setMode] = useState<'landing'|'login'|'register'>('landing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormError>({});

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('citizen');
  const [regDistrict, setRegDistrict] = useState('');
  const [regState, setRegState] = useState('Karnataka');
  const [regStep, setRegStep] = useState(1); // 1=role, 2=details

  // Auto-login if token exists
  useEffect(() => {
    const demoEmail = localStorage.getItem('roadwatch_demo_session');
    if (demoEmail && DEMO_USERS[demoEmail]) {
      setUser(DEMO_USERS[demoEmail]);
      return;
    }

    const token = localStorage.getItem('roadwatch_token');
    if (token) {
      api.getMe().then(user => {
        setUser({
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          district: user.district,
          state: user.state,
          phone: user.phone,
        });
      }).catch(() => {
        localStorage.removeItem('roadwatch_token');
      });
    }
  }, []);

  function validateLogin() {
    const errs: FormError = {};
    if (!loginEmail) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginEmail)) errs.email = 'Invalid email format';
    if (!loginPassword) errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateRegister() {
    const errs: FormError = {};
    if (!regName.trim() || regName.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!regEmail) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(regEmail)) errs.email = 'Invalid email format';
    if (!regPassword) errs.password = 'Password is required';
    else if (regPassword.length < 6) errs.password = 'Password must be at least 6 characters';
    if (regPassword !== regConfirm) errs.confirm = 'Passwords do not match';
    if (!regDistrict) errs.district = 'District is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validateLogin()) return;
    setLoading(true);
    try {
      const res = await api.login(loginEmail, loginPassword);
      setUser({
        id: res.user._id || res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role as UserRole,
        district: res.user.district,
        state: res.user.state,
      });
    } catch (err: any) {
      const demoUser = DEMO_USERS[loginEmail.toLowerCase()];
      if (demoUser && loginPassword === 'demo123') {
        localStorage.setItem('roadwatch_demo_session', demoUser.email);
        setUser(demoUser);
        return;
      }
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validateRegister()) return;
    setLoading(true);
    try {
      let registeredUser;
      try {
        const res = await api.register({
          name: regName.trim(),
          email: regEmail,
          password: regPassword,
          role: regRole as string,
          phone: regPhone || undefined,
          district: regDistrict,
          state: regState,
        });
        registeredUser = {
          id: res.user._id || res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role as UserRole,
          district: res.user.district,
          state: res.user.state,
          phone: res.user.phone,
        };
      } catch {
        registeredUser = {
          id: `local-${Date.now()}`,
          name: regName.trim(),
          email: regEmail,
          role: regRole,
          district: regDistrict,
          state: regState,
          phone: regPhone || undefined,
        };
      }

      addSystemUser({
        id: registeredUser.id,
        name: registeredUser.name,
        email: registeredUser.email,
        role: registeredUser.role,
        district: registeredUser.district,
        state: registeredUser.state,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: new Date().toISOString().split('T')[0]
      });
      setSuccess('Account created successfully!');
      setTimeout(() => {
        setUser(registeredUser);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role: string) {
    const creds: Record<string, { e: string; p: string }> = {
      citizen:    { e: 'citizen@demo.com',    p: 'demo123' },
      contractor: { e: 'contractor@demo.com', p: 'demo123' },
      government: { e: 'admin@demo.com',      p: 'demo123' },
      superadmin: { e: 'superadmin@demo.com', p: 'demo123' },
    };
    setLoginEmail(creds[role].e);
    setLoginPassword(creds[role].p);
    setFieldErrors({});
    setError('');
  }

  const inputCls = (field?: string) =>
    `w-full bg-surface-800/60 border ${field && fieldErrors[field] ? 'border-danger-500' : 'border-surface-700'} rounded-xl px-4 py-3 text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors`;

  // ── Landing ───────────────────────────────────────────────────────────────
  if (mode === 'landing') {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-8 py-5 border-b border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">ROAD-WATCH</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setMode('login')}
              className="px-5 py-2 text-sm text-surface-300 hover:text-white border border-surface-700 hover:border-surface-500 rounded-xl transition-colors">
              Sign In
            </button>
            <button onClick={() => setMode('register')}
              className="px-5 py-2 text-sm text-white bg-primary-500 hover:bg-primary-400 rounded-xl transition-colors">
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-sm text-primary-400 mb-8">
              <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
              AI-Powered Smart Governance Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-black text-white mb-6 leading-tight">
              Fix Roads.<br />
              <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                Build India.
              </span>
            </h1>
            <p className="text-xl text-surface-400 max-w-2xl mx-auto mb-12">
              ROAD-WATCH connects citizens, contractors, and government officials on one platform to monitor, report, and resolve road infrastructure issues across India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => setMode('register')}
                className="px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 justify-center">
                Create Free Account <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => setMode('login')}
                className="px-8 py-4 border border-surface-700 text-white font-semibold rounded-xl hover:bg-surface-800 transition-colors">
                Sign In to Dashboard
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 w-full max-w-4xl">
            {[
              { label:'Complaints Resolved', value:'45,678', icon:'🛠️' },
              { label:'Roads Monitored', value:'12,450 km', icon:'🛣️' },
              { label:'Active Projects', value:'2,340', icon:'🏗️' },
              { label:'Citizens Served', value:'8.9 Lakh', icon:'👥' },
            ].map((s, i) => (
              <div key={i} className="bg-surface-900 border border-surface-800 rounded-2xl p-5 text-center">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-sm text-surface-400 mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Role Cards */}
          <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
            className="grid md:grid-cols-4 gap-4 mt-16 w-full max-w-4xl">
            {ROLES.map(r => (
              <button key={r.id} onClick={() => { setMode('login'); fillDemo(r.id); }}
                className="group p-5 bg-surface-900 border border-surface-800 hover:border-primary-500/50 rounded-2xl text-left transition-all hover:bg-surface-800/80">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center mb-3`}>
                  <r.icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-white group-hover:text-primary-300 transition-colors">{r.label}</p>
                <p className="text-xs text-surface-400 mt-1">{r.desc}</p>
                <p className="text-xs text-primary-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Try demo →</p>
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Shared card wrapper ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-surface-900 to-surface-950 border-r border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">ROAD-WATCH</span>
        </div>

        <div>
          <h2 className="text-4xl font-display font-black text-white mb-4">
            Smart Infrastructure<br />
            <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              Governance Platform
            </span>
          </h2>
          <p className="text-surface-400 text-lg mb-8">
            Join thousands of citizens, contractors, and officials building better roads across India.
          </p>
          <div className="space-y-4">
            {[
              { icon:'🤖', text:'AI-powered complaint analysis & prioritization' },
              { icon:'🗺️', text:'Real-time GIS maps with 100+ road data points' },
              { icon:'💰', text:'Transparent budget tracking & contractor ratings' },
              { icon:'📊', text:'Predictive analytics for proactive maintenance' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-surface-300">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Demo hint */}
        <div className="bg-surface-800/50 border border-surface-700 rounded-2xl p-5">
          <p className="text-sm font-semibold text-white mb-3">🔑 Demo Accounts (click to fill)</p>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(r => (
              <button key={r.id} onClick={() => { setMode('login'); fillDemo(r.id); }}
                className={`flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r ${r.color} bg-opacity-10 border border-white/10 hover:border-white/20 transition-colors`}>
                <r.icon className="w-4 h-4 text-white" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">{r.label}</p>
                  <p className="text-xs text-white/60">demo123</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Forms */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <button onClick={() => setMode('landing')}
            className="flex items-center gap-2 text-sm text-surface-400 hover:text-white mb-8 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to home
          </button>

          <AnimatePresence mode="wait">
            {/* ── LOGIN ── */}
            {mode === 'login' && (
              <motion.div key="login" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Welcome back</h2>
                <p className="text-surface-400 mb-8">Sign in to your ROAD-WATCH account</p>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-danger-500/10 border border-danger-500/30 rounded-xl mb-5 text-sm text-danger-400">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                      <input type="email" value={loginEmail} onChange={e => { setLoginEmail(e.target.value); setFieldErrors(p => ({...p, email:''})); }}
                        placeholder="you@example.com" className={`${inputCls('email')} pl-10`} autoComplete="email" />
                    </div>
                    {fieldErrors.email && <p className="text-xs text-danger-400 mt-1">{fieldErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                      <input type={showPassword?'text':'password'} value={loginPassword}
                        onChange={e => { setLoginPassword(e.target.value); setFieldErrors(p => ({...p, password:''})); }}
                        placeholder="••••••••" className={`${inputCls('password')} pl-10 pr-10`} autoComplete="current-password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="text-xs text-danger-400 mt-1">{fieldErrors.password}</p>}
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-400 hover:to-accent-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                {/* Demo quick fill — mobile only */}
                <div className="mt-6 lg:hidden">
                  <p className="text-xs text-surface-500 text-center mb-3">Quick demo access:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(r => (
                      <button key={r.id} onClick={() => fillDemo(r.id)}
                        className="py-2 px-3 text-xs bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-lg transition-colors flex items-center gap-2">
                        <r.icon className="w-3.5 h-3.5" />{r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-center text-sm text-surface-400 mt-6">
                  Don't have an account?{' '}
                  <button onClick={() => { setMode('register'); setError(''); setFieldErrors({}); setRegStep(1); }}
                    className="text-primary-400 hover:text-primary-300 font-medium">Create one</button>
                </p>
              </motion.div>
            )}

            {/* ── REGISTER ── */}
            {mode === 'register' && (
              <motion.div key="register" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Create account</h2>
                <p className="text-surface-400 mb-6">Join ROAD-WATCH to report and track road issues</p>

                {/* Step indicator */}
                <div className="flex items-center gap-3 mb-7">
                  {[1, 2].map(step => (
                    <div key={step} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        regStep > step ? 'bg-accent-500 text-white' :
                        regStep === step ? 'bg-primary-500 text-white' :
                        'bg-surface-800 text-surface-500'}`}>
                        {regStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                      </div>
                      <span className={`text-sm ${regStep >= step ? 'text-white' : 'text-surface-500'}`}>
                        {step === 1 ? 'Choose Role' : 'Your Details'}
                      </span>
                      {step < 2 && <div className={`flex-1 h-px ${regStep > step ? 'bg-accent-500' : 'bg-surface-700'} mx-2 w-8`} />}
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-danger-500/10 border border-danger-500/30 rounded-xl mb-5 text-sm text-danger-400">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 p-3 bg-accent-500/10 border border-accent-500/30 rounded-xl mb-5 text-sm text-accent-400">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />{success}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {/* Step 1 — Role Selection */}
                  {regStep === 1 && (
                    <motion.div key="step1" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }}>
                      <p className="text-sm text-surface-400 mb-4">Choose the role that best describes you:</p>
                      <div className="space-y-3">
                        {ROLES.map(r => (
                          <button key={r.id} type="button" onClick={() => setRegRole(r.id as UserRole)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                              regRole === r.id
                                ? 'border-primary-500 bg-primary-500/10'
                                : 'border-surface-700 hover:border-surface-600 bg-surface-800/50'}`}>
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center flex-shrink-0`}>
                              <r.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                              <p className={`font-semibold ${regRole === r.id ? 'text-primary-300' : 'text-white'}`}>{r.label}</p>
                              <p className="text-sm text-surface-400">{r.desc}</p>
                            </div>
                            {regRole === r.id && <CheckCircle className="w-5 h-5 text-primary-400 ml-auto" />}
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={() => setRegStep(2)}
                        className="w-full mt-6 py-3.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                        Continue <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {/* Step 2 — Details */}
                  {regStep === 2 && (
                    <motion.div key="step2" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }}>
                      <button onClick={() => setRegStep(1)}
                        className="flex items-center gap-1 text-sm text-surface-400 hover:text-white mb-4 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Back to role selection
                      </button>

                      <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-surface-300 mb-1.5">Full Name *</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                            <input value={regName} onChange={e => { setRegName(e.target.value); setFieldErrors(p => ({...p, name:''})); }}
                              placeholder="Rajesh Kumar" className={`${inputCls('name')} pl-10`} autoComplete="name" />
                          </div>
                          {fieldErrors.name && <p className="text-xs text-danger-400 mt-1">{fieldErrors.name}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-surface-300 mb-1.5">Email Address *</label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                            <input type="email" value={regEmail} onChange={e => { setRegEmail(e.target.value); setFieldErrors(p => ({...p, email:''})); }}
                              placeholder="you@example.com" className={`${inputCls('email')} pl-10`} autoComplete="email" />
                          </div>
                          {fieldErrors.email && <p className="text-xs text-danger-400 mt-1">{fieldErrors.email}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-surface-300 mb-1.5">Password *</label>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                              <input type={showPassword?'text':'password'} value={regPassword}
                                onChange={e => { setRegPassword(e.target.value); setFieldErrors(p => ({...p, password:''})); }}
                                placeholder="Min 6 chars" className={`${inputCls('password')} pl-10 pr-8`} autoComplete="new-password" />
                              <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {fieldErrors.password && <p className="text-xs text-danger-400 mt-1">{fieldErrors.password}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-surface-300 mb-1.5">Confirm *</label>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                              <input type={showConfirm?'text':'password'} value={regConfirm}
                                onChange={e => { setRegConfirm(e.target.value); setFieldErrors(p => ({...p, confirm:''})); }}
                                placeholder="Repeat" className={`${inputCls('confirm')} pl-10 pr-8`} autoComplete="new-password" />
                              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {fieldErrors.confirm && <p className="text-xs text-danger-400 mt-1">{fieldErrors.confirm}</p>}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-surface-300 mb-1.5">Phone Number</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 text-sm">📱</span>
                            <input value={regPhone} onChange={e => setRegPhone(e.target.value)}
                              placeholder="+91 98765 43210" className={`${inputCls()} pl-10`} autoComplete="tel" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-surface-300 mb-1.5">District *</label>
                            <select value={regDistrict} onChange={e => { setRegDistrict(e.target.value); setFieldErrors(p => ({...p, district:''})); }}
                              className={`${inputCls('district')} appearance-none`}>
                              <option value="">Select district</option>
                              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            {fieldErrors.district && <p className="text-xs text-danger-400 mt-1">{fieldErrors.district}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-surface-300 mb-1.5">State *</label>
                            <select value={regState} onChange={e => setRegState(e.target.value)}
                              className={`${inputCls()} appearance-none`}>
                              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Password strength */}
                        {regPassword && (
                          <div>
                            <div className="flex gap-1 mt-1">
                              {[1,2,3,4].map(i => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                                  regPassword.length >= i * 3
                                    ? i <= 1 ? 'bg-danger-500' : i <= 2 ? 'bg-warning-500' : i <= 3 ? 'bg-primary-500' : 'bg-accent-500'
                                    : 'bg-surface-700'}`} />
                              ))}
                            </div>
                            <p className="text-xs text-surface-500 mt-1">
                              {regPassword.length < 6 ? 'Too short' : regPassword.length < 9 ? 'Weak' : regPassword.length < 12 ? 'Good' : 'Strong'} password
                            </p>
                          </div>
                        )}

                        <button type="submit" disabled={loading}
                          className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-400 hover:to-accent-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-center text-sm text-surface-400 mt-6">
                  Already have an account?{' '}
                  <button onClick={() => { setMode('login'); setError(''); setFieldErrors({}); }}
                    className="text-primary-400 hover:text-primary-300 font-medium">Sign in</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
