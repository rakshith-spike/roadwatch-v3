import { create } from 'zustand';

export type UserRole = 'citizen' | 'contractor' | 'government' | 'superadmin' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  district?: string;
  state?: string;
  company?: string;
  license?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: 'pothole' | 'crack' | 'flooding' | 'debris' | 'streetlight' | 'drainage' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'verified' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';
  location: {
    lat: number;
    lng: number;
    address: string;
    district: string;
    state: string;
  };
  images: string[];
  reportedBy: string;
  reportedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  aiAnalysis?: {
    category: string;
    severity: string;
    estimatedCost: number;
    priority: number;
    duplicateOf?: string;
  };
  votes: number;
  comments: number;
}

export interface Contractor {
  id: string;
  name: string;
  company: string;
  license: string;
  email: string;
  phone: string;
  rating: number;
  completedProjects: number;
  activeProjects: number;
  totalBudget: number;
  regions: string[];
  specialization: string[];
  performanceScore: number;
  status: 'active' | 'suspended' | 'pending';
  joinedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  contractor: string;
  contractorName?: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'on_hold';
  progress: number;
  location: {
    lat: number;
    lng: number;
    address: string;
    district: string;
  };
  complaints: string[];
  milestones: {
    title: string;
    completed: boolean;
    date: string;
  }[];
  workLogs?: {
    id: string;
    date: string;
    description: string;
    workersCount: number;
    materialsUsed: string[];
    photos: string[];
    addedBy: string;
  }[];
  approvedBy?: string;
  notes?: string;
}

export interface BudgetEntry {
  id: string;
  projectId: string;
  projectTitle: string;
  contractor: string;
  amount: number;
  type: 'allocation' | 'disbursement' | 'request' | 'revision';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
  district: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  district?: string;
  state?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;

  // Data
  complaints: Complaint[];
  contractors: Contractor[];
  projects: Project[];
  budgetEntries: BudgetEntry[];
  systemUsers: SystemUser[];

  // UI
  sidebarOpen: boolean;
  currentView: string;
  notifications: { id: string; title: string; message: string; type: string; read: boolean }[];

  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string, role: UserRole) => void;
  logout: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: string) => void;
  addComplaint: (complaint: Complaint) => void;
  updateComplaint: (id: string, updates: Partial<Complaint>) => void;
  markNotificationRead: (id: string) => void;

  // Project actions
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addWorkLog: (projectId: string, log: Project['workLogs'][0]) => void;
  updateMilestone: (projectId: string, milestoneIndex: number, completed: boolean) => void;

  // Contractor actions
  updateContractor: (id: string, updates: Partial<Contractor>) => void;
  suspendContractor: (id: string) => void;
  activateContractor: (id: string) => void;

  // Budget actions
  addBudgetEntry: (entry: BudgetEntry) => void;
  updateBudgetEntry: (id: string, updates: Partial<BudgetEntry>) => void;
  approveBudget: (id: string, approverName: string) => void;
  rejectBudget: (id: string, notes: string) => void;

  // User management
  updateSystemUser: (id: string, updates: Partial<SystemUser>) => void;
  toggleUserStatus: (id: string) => void;
  addSystemUser: (user: SystemUser) => void;
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

const mockComplaints: Complaint[] = [
  {
    id: 'C001', title: 'Large Pothole on MG Road',
    description: 'Dangerous pothole causing accidents near the junction',
    category: 'pothole', severity: 'critical', status: 'in_progress',
    location: { lat: 12.9716, lng: 77.5946, address: 'MG Road, Bangalore', district: 'Bangalore Urban', state: 'Karnataka' },
    images: [], reportedBy: 'user1', reportedAt: '2024-01-15T10:30:00Z', assignedTo: 'contractor1',
    aiAnalysis: { category: 'pothole', severity: 'critical', estimatedCost: 50000, priority: 95 },
    votes: 234, comments: 45
  },
  {
    id: 'C002', title: 'Street Light Not Working',
    description: 'Multiple street lights not functioning for 2 weeks',
    category: 'streetlight', severity: 'medium', status: 'assigned',
    location: { lat: 12.9352, lng: 77.6245, address: 'Koramangala 5th Block', district: 'Bangalore Urban', state: 'Karnataka' },
    images: [], reportedBy: 'user2', reportedAt: '2024-01-14T14:20:00Z', assignedTo: 'contractor2',
    aiAnalysis: { category: 'streetlight', severity: 'medium', estimatedCost: 15000, priority: 60 },
    votes: 89, comments: 12
  },
  {
    id: 'C003', title: 'Road Crack Spreading Fast',
    description: 'Major crack in road surface extending over 50 meters',
    category: 'crack', severity: 'high', status: 'verified',
    location: { lat: 12.9081, lng: 77.6476, address: 'HSR Layout Sector 2', district: 'Bangalore Urban', state: 'Karnataka' },
    images: [], reportedBy: 'user3', reportedAt: '2024-01-13T09:15:00Z',
    aiAnalysis: { category: 'crack', severity: 'high', estimatedCost: 120000, priority: 82 },
    votes: 156, comments: 28
  },
  {
    id: 'C004', title: 'Drainage Overflow Issue',
    description: 'Storm drain overflowing during rains causing flooding',
    category: 'drainage', severity: 'high', status: 'pending',
    location: { lat: 12.9698, lng: 77.7500, address: 'Whitefield Main Road', district: 'Bangalore Urban', state: 'Karnataka' },
    images: [], reportedBy: 'user4', reportedAt: '2024-01-12T16:45:00Z',
    aiAnalysis: { category: 'drainage', severity: 'high', estimatedCost: 200000, priority: 78 },
    votes: 312, comments: 67
  },
  {
    id: 'C005', title: 'Road Construction Debris',
    description: 'Construction debris blocking half the road',
    category: 'debris', severity: 'medium', status: 'resolved',
    location: { lat: 12.9279, lng: 77.6271, address: 'Indiranagar 100ft Road', district: 'Bangalore Urban', state: 'Karnataka' },
    images: [], reportedBy: 'user5', reportedAt: '2024-01-10T11:00:00Z', resolvedAt: '2024-01-11T15:30:00Z',
    aiAnalysis: { category: 'debris', severity: 'medium', estimatedCost: 25000, priority: 55 },
    votes: 78, comments: 15
  },
  {
    id: 'C006', title: 'Potholes Near Electronic City',
    description: 'Multiple potholes near tech park entrance causing traffic jams',
    category: 'pothole', severity: 'high', status: 'pending',
    location: { lat: 12.8447, lng: 77.6600, address: 'Electronic City Phase 1', district: 'Bangalore Urban', state: 'Karnataka' },
    images: [], reportedBy: 'user6', reportedAt: '2024-01-16T08:00:00Z',
    aiAnalysis: { category: 'pothole', severity: 'high', estimatedCost: 80000, priority: 75 },
    votes: 189, comments: 34
  }
];

const mockContractors: Contractor[] = [
  {
    id: 'contractor1', name: 'Rajesh Kumar', company: 'Kumar Infrastructure Pvt Ltd',
    license: 'KA-INFRA-2021-001', email: 'rajesh@kumar-infra.com', phone: '+91-9876543210',
    rating: 4.5, completedProjects: 45, activeProjects: 3, totalBudget: 25000000,
    regions: ['Bangalore Urban', 'Bangalore Rural'], specialization: ['Road Repair', 'Drainage Systems'],
    performanceScore: 87, status: 'active', joinedAt: '2021-03-15'
  },
  {
    id: 'contractor2', name: 'Priya Sharma', company: 'Sharma Constructions',
    license: 'KA-INFRA-2020-042', email: 'priya@sharma-constructions.com', phone: '+91-9876543211',
    rating: 4.8, completedProjects: 62, activeProjects: 5, totalBudget: 45000000,
    regions: ['Bangalore Urban', 'Mysore'], specialization: ['Street Lighting', 'Road Construction'],
    performanceScore: 92, status: 'active', joinedAt: '2020-06-20'
  },
  {
    id: 'contractor3', name: 'Mohammed Ali', company: 'Ali Roads & Bridges',
    license: 'KA-INFRA-2019-087', email: 'mali@ali-roads.com', phone: '+91-9876543212',
    rating: 4.2, completedProjects: 38, activeProjects: 2, totalBudget: 18000000,
    regions: ['Bangalore Urban'], specialization: ['Bridge Repair', 'Road Repair'],
    performanceScore: 78, status: 'active', joinedAt: '2019-11-10'
  },
  {
    id: 'contractor4', name: 'Sunita Rao', company: 'Rao Civil Works',
    license: 'KA-INFRA-2022-015', email: 'sunita@rao-civil.com', phone: '+91-9876543213',
    rating: 3.9, completedProjects: 22, activeProjects: 1, totalBudget: 9000000,
    regions: ['Mysore', 'Hubli'], specialization: ['Drainage Systems', 'Road Repair'],
    performanceScore: 71, status: 'suspended', joinedAt: '2022-01-08'
  }
];

const mockProjects: Project[] = [
  {
    id: 'P001', title: 'MG Road Pothole Repair',
    description: 'Emergency repair of critical potholes on MG Road stretch',
    contractor: 'contractor1', contractorName: 'Kumar Infrastructure Pvt Ltd',
    budget: 500000, spent: 320000, startDate: '2024-01-16', endDate: '2024-01-25',
    status: 'in_progress', progress: 65,
    location: { lat: 12.9716, lng: 77.5946, address: 'MG Road', district: 'Bangalore Urban' },
    complaints: ['C001'],
    milestones: [
      { title: 'Site Inspection', completed: true, date: '2024-01-16' },
      { title: 'Material Procurement', completed: true, date: '2024-01-17' },
      { title: 'Repair Work', completed: false, date: '2024-01-20' },
      { title: 'Quality Check', completed: false, date: '2024-01-24' }
    ],
    workLogs: [
      { id: 'wl1', date: '2024-01-17', description: 'Procured bitumen and aggregates. Site demarcated.', workersCount: 8, materialsUsed: ['Bitumen 500kg', 'Aggregates 2 tonnes'], photos: [], addedBy: 'Rajesh Kumar' },
      { id: 'wl2', date: '2024-01-18', description: 'Started filling first 5 potholes. Traffic diversions set up.', workersCount: 12, materialsUsed: ['Bitumen 200kg', 'Compactor 1 unit'], photos: [], addedBy: 'Rajesh Kumar' }
    ],
    approvedBy: 'Dr. Ananya Reddy', notes: 'High priority - CM office flagged'
  },
  {
    id: 'P002', title: 'Koramangala Street Light Restoration',
    description: 'Restoration of non-functional street lights in 5th Block',
    contractor: 'contractor2', contractorName: 'Sharma Constructions',
    budget: 150000, spent: 45000, startDate: '2024-01-18', endDate: '2024-01-22',
    status: 'in_progress', progress: 30,
    location: { lat: 12.9352, lng: 77.6245, address: 'Koramangala 5th Block', district: 'Bangalore Urban' },
    complaints: ['C002'],
    milestones: [
      { title: 'Assessment', completed: true, date: '2024-01-18' },
      { title: 'Equipment Setup', completed: false, date: '2024-01-19' },
      { title: 'Installation', completed: false, date: '2024-01-21' }
    ],
    workLogs: [
      { id: 'wl3', date: '2024-01-18', description: 'Assessed 12 non-functional lights. 8 need replacement, 4 need rewiring.', workersCount: 4, materialsUsed: ['LED bulbs 8 units', 'Wiring 50m'], photos: [], addedBy: 'Priya Sharma' }
    ],
    approvedBy: 'Dr. Ananya Reddy'
  },
  {
    id: 'P003', title: 'HSR Layout Road Resurfacing',
    description: 'Full road resurfacing for 2km stretch in HSR Layout',
    contractor: 'contractor3', contractorName: 'Ali Roads & Bridges',
    budget: 1200000, spent: 0, startDate: '2024-02-01', endDate: '2024-02-28',
    status: 'planned', progress: 0,
    location: { lat: 12.9081, lng: 77.6476, address: 'HSR Layout Sector 2', district: 'Bangalore Urban' },
    complaints: ['C003'],
    milestones: [
      { title: 'Design & Planning', completed: false, date: '2024-02-01' },
      { title: 'Material Procurement', completed: false, date: '2024-02-05' },
      { title: 'Resurfacing Phase 1', completed: false, date: '2024-02-15' },
      { title: 'Resurfacing Phase 2', completed: false, date: '2024-02-22' },
      { title: 'Quality Inspection', completed: false, date: '2024-02-27' }
    ],
    workLogs: [],
    approvedBy: 'Dr. Ananya Reddy'
  }
];

const mockBudgetEntries: BudgetEntry[] = [
  { id: 'B001', projectId: 'P001', projectTitle: 'MG Road Pothole Repair', contractor: 'Kumar Infrastructure Pvt Ltd', amount: 500000, type: 'allocation', status: 'approved', requestedAt: '2024-01-15', approvedAt: '2024-01-16', approvedBy: 'Dr. Ananya Reddy', district: 'Bangalore Urban' },
  { id: 'B002', projectId: 'P002', projectTitle: 'Koramangala Street Light Restoration', contractor: 'Sharma Constructions', amount: 150000, type: 'allocation', status: 'approved', requestedAt: '2024-01-17', approvedAt: '2024-01-18', approvedBy: 'Dr. Ananya Reddy', district: 'Bangalore Urban' },
  { id: 'B003', projectId: 'P003', projectTitle: 'HSR Layout Road Resurfacing', contractor: 'Ali Roads & Bridges', amount: 1200000, type: 'allocation', status: 'approved', requestedAt: '2024-01-25', approvedAt: '2024-01-26', approvedBy: 'Dr. Ananya Reddy', district: 'Bangalore Urban' },
  { id: 'B004', projectId: 'P001', projectTitle: 'MG Road Pothole Repair', contractor: 'Kumar Infrastructure Pvt Ltd', amount: 80000, type: 'request', status: 'pending', requestedAt: '2024-01-19', notes: 'Additional bitumen needed due to scope increase', district: 'Bangalore Urban' },
  { id: 'B005', projectId: 'P002', projectTitle: 'Koramangala Street Light Restoration', contractor: 'Sharma Constructions', amount: 45000, type: 'disbursement', status: 'approved', requestedAt: '2024-01-20', approvedAt: '2024-01-20', approvedBy: 'Dr. Ananya Reddy', district: 'Bangalore Urban' },
];

const mockSystemUsers: SystemUser[] = [
  { id: 'u1', name: 'Amit Patel', email: 'amit@example.com', role: 'citizen', district: 'Bangalore Urban', state: 'Karnataka', isActive: true, createdAt: '2023-05-10', lastLogin: '2024-01-19' },
  { id: 'u2', name: 'Rajesh Kumar', email: 'rajesh@kumar-infra.com', role: 'contractor', district: 'Bangalore Urban', state: 'Karnataka', isActive: true, createdAt: '2021-03-15', lastLogin: '2024-01-20' },
  { id: 'u3', name: 'Dr. Ananya Reddy', email: 'ananya@gov.kar.in', role: 'government', district: 'Bangalore Urban', state: 'Karnataka', isActive: true, createdAt: '2022-01-01', lastLogin: '2024-01-20' },
  { id: 'u4', name: 'System Admin', email: 'admin@roadwatch.gov.in', role: 'superadmin', state: 'National', isActive: true, createdAt: '2021-01-01', lastLogin: '2024-01-20' },
  { id: 'u5', name: 'Meena Krishnan', email: 'meena@example.com', role: 'citizen', district: 'Mysore', state: 'Karnataka', isActive: true, createdAt: '2023-08-22', lastLogin: '2024-01-18' },
  { id: 'u6', name: 'Priya Sharma', email: 'priya@sharma-constructions.com', role: 'contractor', district: 'Bangalore Urban', state: 'Karnataka', isActive: true, createdAt: '2020-06-20', lastLogin: '2024-01-19' },
  { id: 'u7', name: 'Kiran Nair', email: 'kiran@gov.kar.in', role: 'government', district: 'Mysore', state: 'Karnataka', isActive: false, createdAt: '2022-06-15', lastLogin: '2023-12-01' },
  { id: 'u8', name: 'Mohammed Ali', email: 'mali@ali-roads.com', role: 'contractor', district: 'Bangalore Urban', state: 'Karnataka', isActive: true, createdAt: '2019-11-10', lastLogin: '2024-01-15' },
];

// ── Store ──────────────────────────────────────────────────────────────────────

export const useStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  complaints: mockComplaints,
  contractors: mockContractors,
  projects: mockProjects,
  budgetEntries: mockBudgetEntries,
  systemUsers: mockSystemUsers,
  sidebarOpen: true,
  currentView: 'dashboard',
  notifications: [
    { id: '1', title: 'New Complaint Assigned', message: 'Pothole repair on MG Road assigned to you', type: 'info', read: false },
    { id: '2', title: 'SLA Warning', message: 'Complaint C003 approaching deadline', type: 'warning', read: false },
    { id: '3', title: 'Project Completed', message: 'Indiranagar debris clearance completed', type: 'success', read: true },
    { id: '4', title: 'Budget Request Pending', message: 'Kumar Infrastructure requested ₹80,000 additional budget', type: 'warning', read: false },
  ],

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // login is now handled directly by AuthPage via api.login() + setUser()
  // This fallback is only used if called programmatically
  login: async (email, password, _role) => {
    try {
      const { api } = await import('../services/api');
      const response = await api.login(email, password);
      set({
        user: {
          id: response.user._id || response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role as UserRole,
          district: response.user.district,
          state: response.user.state,
        },
        isAuthenticated: true,
      });
    } catch (err) {
      throw err; // let caller handle
    }
  },

  logout: async () => {
    try {
      const { api } = await import('../services/api');
      api.logout();
    } catch { /* ignore */ }
    localStorage.removeItem('roadwatch_token');
    set({ user: null, isAuthenticated: false, currentView: 'dashboard' });
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentView: (view) => set({ currentView: view }),

  addComplaint: (complaint) => set((state) => ({ complaints: [complaint, ...state.complaints] })),
  updateComplaint: (id, updates) => set((state) => ({
    complaints: state.complaints.map((c) => c.id === id ? { ...c, ...updates } : c)
  })),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
  })),

  addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map((p) => p.id === id ? { ...p, ...updates } : p)
  })),
  addWorkLog: (projectId, log) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === projectId ? { ...p, workLogs: [...(p.workLogs || []), log] } : p
    )
  })),
  updateMilestone: (projectId, milestoneIndex, completed) => set((state) => ({
    projects: state.projects.map((p) => {
      if (p.id !== projectId) return p;
      const milestones = [...p.milestones];
      milestones[milestoneIndex] = { ...milestones[milestoneIndex], completed };
      const completedCount = milestones.filter(m => m.completed).length;
      const progress = Math.round((completedCount / milestones.length) * 100);
      return { ...p, milestones, progress };
    })
  })),

  updateContractor: (id, updates) => set((state) => ({
    contractors: state.contractors.map((c) => c.id === id ? { ...c, ...updates } : c)
  })),
  suspendContractor: (id) => set((state) => ({
    contractors: state.contractors.map((c) => c.id === id ? { ...c, status: 'suspended' } : c)
  })),
  activateContractor: (id) => set((state) => ({
    contractors: state.contractors.map((c) => c.id === id ? { ...c, status: 'active' } : c)
  })),

  addBudgetEntry: (entry) => set((state) => ({ budgetEntries: [entry, ...state.budgetEntries] })),
  updateBudgetEntry: (id, updates) => set((state) => ({
    budgetEntries: state.budgetEntries.map((b) => b.id === id ? { ...b, ...updates } : b)
  })),
  approveBudget: (id, approverName) => set((state) => ({
    budgetEntries: state.budgetEntries.map((b) =>
      b.id === id ? { ...b, status: 'approved', approvedBy: approverName, approvedAt: new Date().toISOString().split('T')[0] } : b
    )
  })),
  rejectBudget: (id, notes) => set((state) => ({
    budgetEntries: state.budgetEntries.map((b) =>
      b.id === id ? { ...b, status: 'rejected', notes } : b
    )
  })),

  updateSystemUser: (id, updates) => set((state) => ({
    systemUsers: state.systemUsers.map((u) => u.id === id ? { ...u, ...updates } : u)
  })),
  toggleUserStatus: (id) => set((state) => ({
    systemUsers: state.systemUsers.map((u) => u.id === id ? { ...u, isActive: !u.isActive } : u)
  })),
  addSystemUser: (user) => set((state) => ({ systemUsers: [user, ...state.systemUsers] })),
}));
