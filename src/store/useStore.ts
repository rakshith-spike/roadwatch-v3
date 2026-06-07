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
  contractorId?: string;
}

export interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: 'pothole' | 'crack' | 'flooding' | 'debris' | 'streetlight' | 'drainage' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'verified' | 'assigned' | 'in_progress' | 'resolved' | 'rejected' | 'validation_pending' | 'closed';
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
  assignedContractorName?: string;
  resolvedAt?: string;
  aiAnalysis?: {
    category: string;
    severity: string;
    estimatedCost: number;
    priority: number;
    duplicateOf?: string;
    issueType?: string;
    confidence?: number;
    severityScore?: number;
    boundingBoxes?: { label: string; confidence: number; box: number[]; areaRatio?: number }[];
    annotatedImage?: string;
    estimatedDays?: number;
    priorityScore?: number;
    trafficImportance?: number;
    costRange?: number[];
    costReasoning?: string;
    modelStatus?: string;
  };
  votes: number;
  supportCount?: number;
  supportedBy?: string[];
  duplicateOf?: string;
  estimatedCost?: number;
  costRange?: number[];
  costReasoning?: string;
  estimatedDays?: number;
  priorityScore?: number;
  severityScore?: number;
  trafficImportance?: number;
  annotatedImage?: string;
  progressPercentage?: number;
  beforeWorkPhotos?: string[];
  progressPhotos?: string[];
  completionPhotos?: string[];
  workNotes?: string;
  repairValidation?: {
    repairConfidence: number;
    status: 'verified' | 'needs_review';
    reasoning?: string;
  };
  citizenVerification?: {
    fixed: boolean;
    notes?: string;
    verifiedAt?: string;
  };
  comments: Comment[] | number;
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
  roadType: 'NH' | 'SH' | 'MDR' | 'ODR' | 'Urban Arterial' | 'Ward Road' | 'Expressway';
  lastRelayingDate: string;
  responsibleAuthority: string;
  executiveEngineer: string;
  budgetSource: string;
  qualityScore?: number;
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
  source?: string;
  sanctionReference?: string;
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

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info' | 'warning';
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
  toasts: Toast[];
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string, role: UserRole) => void;
  logout: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: string) => void;
  addComplaint: (complaint: Complaint) => void;
  updateComplaint: (id: string, updates: Partial<Complaint>) => void;
  markNotificationRead: (id: string) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setLoading: (loading: boolean) => void;

  // Project actions
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addWorkLog: (projectId: string, log: Project['workLogs'][0]) => void;
  updateMilestone: (projectId: string, milestoneIndex: number, completed: boolean) => void;

  // Contractor actions
  addContractor: (contractor: Contractor) => void;
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

// ── Mock Data (removed for brevity but we use localStorage merge logic)
// The mock data arrays were removed to clean up the file, but we still merge local storage.

function getStoredSystemUsers(): SystemUser[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const stored = localStorage.getItem('roadwatch_system_users') || localStorage.getItem('roadwatch_registered_users');
    if (!stored) return [];
    return JSON.parse(stored) as SystemUser[];
  } catch {
    return [];
  }
}

function readStored<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch {
    return fallback;
  }
}

function persistStored<T>(key: string, value: T) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function mergeById<T extends { id: string }>(base: T[], stored: T[]): T[] {
  const merged = new Map<string, T>();
  base.forEach((item) => merged.set(item.id, item));
  stored.forEach((item) => merged.set(item.id, item));
  return Array.from(merged.values());
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  complaints: readStored<Complaint[]>('roadwatch_complaints', []),
  contractors: readStored<Contractor[]>('roadwatch_contractors', []),
  projects: readStored<Project[]>('roadwatch_projects', []),
  budgetEntries: readStored<BudgetEntry[]>('roadwatch_budget_entries', []),
  systemUsers: getStoredSystemUsers(),
  sidebarOpen: true,
  currentView: 'dashboard',
  notifications: [],
  toasts: [],
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

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
          contractorId: response.user.contractor_id,
        },
        isAuthenticated: true,
      });
    } catch (err) {
      throw err;
    }
  },

  logout: async () => {
    try {
      const { api } = await import('../services/api');
      api.logout();
    } catch { /* ignore */ }
    localStorage.removeItem('roadwatch_token');
    localStorage.removeItem('roadwatch_demo_session');
    set({ user: null, isAuthenticated: false, currentView: 'dashboard' });
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentView: (view) => set({ currentView: view }),

  addComplaint: (complaint) => set((state) => {
    const complaints = [complaint, ...state.complaints];
    persistStored('roadwatch_complaints', complaints);
    return { complaints };
  }),
  updateComplaint: (id, updates) => set((state) => {
    const complaints = state.complaints.map((c) => c.id === id ? { ...c, ...updates } : c);
    persistStored('roadwatch_complaints', complaints);
    return { complaints };
  }),
  
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
  })),

  addToast: (toast) => set((state) => {
    const id = Math.random().toString(36).substring(2, 9);
    return { toasts: [...state.toasts, { ...toast, id }] };
  }),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  addProject: (project) => set((state) => {
    const projects = [project, ...state.projects];
    persistStored('roadwatch_projects', projects);
    return { projects };
  }),
  updateProject: (id, updates) => set((state) => {
    const projects = state.projects.map((p) => p.id === id ? { ...p, ...updates } : p);
    persistStored('roadwatch_projects', projects);
    return { projects };
  }),
  addWorkLog: (projectId, log) => set((state) => {
    const projects = state.projects.map((p) =>
      p.id === projectId ? { ...p, workLogs: [...(p.workLogs || []), log] } : p
    );
    persistStored('roadwatch_projects', projects);
    return { projects };
  }),
  updateMilestone: (projectId, milestoneIndex, completed) => set((state) => {
    const projects = state.projects.map((p) => {
      if (p.id !== projectId) return p;
      const milestones = [...p.milestones];
      milestones[milestoneIndex] = { ...milestones[milestoneIndex], completed };
      const completedCount = milestones.filter(m => m.completed).length;
      const progress = Math.round((completedCount / milestones.length) * 100);
      return { ...p, milestones, progress };
    });
    persistStored('roadwatch_projects', projects);
    return { projects };
  }),

  addContractor: (contractor) => set((state) => {
    const exists = state.contractors.some((existing) => existing.id === contractor.id || existing.email.toLowerCase() === contractor.email.toLowerCase());
    const contractors = exists
      ? state.contractors.map((existing) => existing.id === contractor.id || existing.email.toLowerCase() === contractor.email.toLowerCase() ? { ...existing, ...contractor } : existing)
      : [contractor, ...state.contractors];
    persistStored('roadwatch_contractors', contractors);
    return { contractors };
  }),
  updateContractor: (id, updates) => set((state) => {
    const contractors = state.contractors.map((c) => c.id === id ? { ...c, ...updates } : c);
    persistStored('roadwatch_contractors', contractors);
    return { contractors };
  }),
  suspendContractor: (id) => set((state) => {
    const contractors = state.contractors.map((c) => c.id === id ? { ...c, status: 'suspended' as const } : c);
    persistStored('roadwatch_contractors', contractors);
    return { contractors };
  }),
  activateContractor: (id) => set((state) => {
    const contractors = state.contractors.map((c) => c.id === id ? { ...c, status: 'active' as const } : c);
    persistStored('roadwatch_contractors', contractors);
    return { contractors };
  }),

  addBudgetEntry: (entry) => set((state) => {
    const budgetEntries = [entry, ...state.budgetEntries];
    persistStored('roadwatch_budget_entries', budgetEntries);
    return { budgetEntries };
  }),
  updateBudgetEntry: (id, updates) => set((state) => {
    const budgetEntries = state.budgetEntries.map((b) => b.id === id ? { ...b, ...updates } : b);
    persistStored('roadwatch_budget_entries', budgetEntries);
    return { budgetEntries };
  }),
  approveBudget: (id, approverName) => set((state) => {
    const approvedAt = new Date().toISOString().split('T')[0];
    const entry = state.budgetEntries.find((b) => b.id === id);
    const budgetEntries = state.budgetEntries.map((b) =>
      b.id === id ? { ...b, status: 'approved' as const, approvedBy: approverName, approvedAt } : b
    );
    const projects = entry
      ? state.projects.map((project) => {
          if (project.id !== entry.projectId) return project;
          if (entry.type === 'request' || entry.type === 'revision') {
            return { ...project, budget: project.budget + entry.amount };
          }
          if (entry.type === 'disbursement') {
            return { ...project, spent: Math.min(project.budget, project.spent + entry.amount) };
          }
          return project;
        })
      : state.projects;
    persistStored('roadwatch_budget_entries', budgetEntries);
    persistStored('roadwatch_projects', projects);
    return { budgetEntries, projects };
  }),
  rejectBudget: (id, notes) => set((state) => {
    const budgetEntries = state.budgetEntries.map((b) =>
      b.id === id ? { ...b, status: 'rejected', notes } : b
    );
    persistStored('roadwatch_budget_entries', budgetEntries);
    return { budgetEntries };
  }),

  updateSystemUser: (id, updates) => set((state) => {
    const systemUsers = state.systemUsers.map((u) => u.id === id ? { ...u, ...updates } : u);
    persistStored('roadwatch_system_users', systemUsers);
    return { systemUsers };
  }),
  toggleUserStatus: (id) => set((state) => {
    const systemUsers = state.systemUsers.map((u) => u.id === id ? { ...u, isActive: !u.isActive } : u);
    persistStored('roadwatch_system_users', systemUsers);
    return { systemUsers };
  }),
  addSystemUser: (user) => set((state) => {
    const exists = state.systemUsers.some((existing) => existing.email.toLowerCase() === user.email.toLowerCase());
    const systemUsers = exists
      ? state.systemUsers.map((existing) => existing.email.toLowerCase() === user.email.toLowerCase() ? { ...existing, ...user } : existing)
      : [user, ...state.systemUsers];
    persistStored('roadwatch_system_users', systemUsers);
    if (typeof localStorage !== 'undefined') localStorage.removeItem('roadwatch_registered_users');
    return { systemUsers };
  }),
}));
