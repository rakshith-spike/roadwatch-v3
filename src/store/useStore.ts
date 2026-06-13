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
  user_id?: string;
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

  // Fetch actions
  fetchProjects: () => Promise<void>;
  fetchContractors: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchBudgetEntries: () => Promise<void>;
  fetchSystemUsers: () => Promise<void>;
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

  addProject: async (project) => {
    try {
      const { api } = await import('../services/api');
      await api.createProject({
        title: project.title,
        description: project.description,
        budget: project.budget,
        start_date: new Date(project.startDate).toISOString(),
        end_date: new Date(project.endDate).toISOString(),
        location: {
          type: 'Point',
          coordinates: [project.location.lng, project.location.lat],
          address: project.location.address,
          district: project.location.district
        },
        contractor_id: project.contractor,
        complaint_ids: project.complaints,
        milestones: project.milestones.map(m => ({
          title: m.title,
          completed: m.completed,
          date: new Date(m.date).toISOString()
        })),
        road_type: project.roadType,
        last_relaying_date: project.lastRelayingDate,
        responsible_authority: project.responsibleAuthority,
        executive_engineer: project.executiveEngineer,
        budget_source: project.budgetSource
      });
      useStore.getState().fetchProjects();
      useStore.getState().fetchBudgetEntries();
    } catch (err) {
      console.error('Failed to add project', err);
    }
  },
  updateProject: async (id, updates) => {
    try {
      const { api } = await import('../services/api');
      const data: any = {};
      if (updates.title !== undefined) data.title = updates.title;
      if (updates.description !== undefined) data.description = updates.description;
      if (updates.budget !== undefined) data.budget = updates.budget;
      if (updates.spent !== undefined) data.spent = updates.spent;
      if (updates.endDate !== undefined) data.end_date = new Date(updates.endDate).toISOString();
      if (updates.status !== undefined) data.status = updates.status;
      if (updates.progress !== undefined) data.progress = updates.progress;

      await api.updateProject(id, data);
      useStore.getState().fetchProjects();
      useStore.getState().fetchComplaints();
    } catch (err) {
      console.error('Failed to update project', err);
    }
  },
  addWorkLog: async (projectId, log) => {
    try {
      const { api } = await import('../services/api');
      await api.addProjectWorkLog(projectId, {
        description: log.description,
        workers_count: log.workersCount,
        materials_used: log.materialsUsed
      });
      useStore.getState().fetchProjects();
    } catch (err) {
      console.error('Failed to add work log', err);
    }
  },
  updateMilestone: async (projectId, milestoneIndex, completed) => {
    try {
      const { api } = await import('../services/api');
      await api.updateMilestone(projectId, milestoneIndex, completed);
      useStore.getState().fetchProjects();
    } catch (err) {
      console.error('Failed to update milestone', err);
    }
  },

  addContractor: async (contractor) => {
    // Adding contractor is handled by backend registration/creation.
    // We just refresh the list.
    useStore.getState().fetchContractors();
  },
  updateContractor: async (id, updates) => {
    try {
      const { api } = await import('../services/api');
      const data: any = {};
      if (updates.company !== undefined) data.company = updates.company;
      if (updates.license !== undefined) data.license = updates.license;
      if (updates.regions !== undefined) data.regions = updates.regions;
      if (updates.specialization !== undefined) data.specialization = updates.specialization;

      await api.updateContractor(id, data);
      useStore.getState().fetchContractors();
    } catch (err) {
      console.error('Failed to update contractor', err);
    }
  },
  suspendContractor: async (id) => {
    try {
      const { api } = await import('../services/api');
      const contractor = useStore.getState().contractors.find(c => c.id === id);
      if (contractor && contractor.user_id) {
        await api.toggleUserStatus(contractor.user_id);
      }
      useStore.getState().fetchContractors();
      useStore.getState().fetchSystemUsers();
    } catch (err) {
      console.error('Failed to suspend contractor', err);
    }
  },
  activateContractor: async (id) => {
    try {
      const { api } = await import('../services/api');
      const contractor = useStore.getState().contractors.find(c => c.id === id);
      if (contractor && contractor.user_id) {
        await api.toggleUserStatus(contractor.user_id);
      }
      useStore.getState().fetchContractors();
      useStore.getState().fetchSystemUsers();
    } catch (err) {
      console.error('Failed to activate contractor', err);
    }
  },

  addBudgetEntry: async (entry) => {
    try {
      const { api } = await import('../services/api');
      await api.createBudgetEntry({
        project_id: entry.projectId,
        project_title: entry.projectTitle,
        contractor: entry.contractor,
        amount: entry.amount,
        type: entry.type,
        notes: entry.notes,
        district: entry.district,
        source: entry.source,
        sanction_reference: entry.sanctionReference
      });
      useStore.getState().fetchBudgetEntries();
    } catch (err) {
      console.error('Failed to add budget entry', err);
    }
  },
  updateBudgetEntry: () => {}, // Handled by approve/reject backend actions
  approveBudget: async (id, approverName) => {
    try {
      const { api } = await import('../services/api');
      await api.approveBudgetEntry(id);
      useStore.getState().fetchBudgetEntries();
      useStore.getState().fetchProjects();
    } catch (err) {
      console.error('Failed to approve budget', err);
    }
  },
  rejectBudget: async (id, notes) => {
    try {
      const { api } = await import('../services/api');
      await api.rejectBudgetEntry(id, notes);
      useStore.getState().fetchBudgetEntries();
    } catch (err) {
      console.error('Failed to reject budget', err);
    }
  },

  updateSystemUser: async (id, updates) => {
    try {
      const { api } = await import('../services/api');
      await api.updateSystemUser(id, {
        name: updates.name,
        role: updates.role,
        district: updates.district
      });
      useStore.getState().fetchSystemUsers();
    } catch (err) {
      console.error('Failed to update system user', err);
    }
  },
  toggleUserStatus: async (id) => {
    try {
      const { api } = await import('../services/api');
      await api.toggleUserStatus(id);
      useStore.getState().fetchSystemUsers();
      useStore.getState().fetchContractors();
    } catch (err) {
      console.error('Failed to toggle user status', err);
    }
  },
  addSystemUser: async (user) => {
    try {
      const { api } = await import('../services/api');
      await api.registerUserByAdmin({
        name: user.name,
        email: user.email,
        role: user.role || 'citizen',
        district: user.district,
        state: user.state
      });
      useStore.getState().fetchSystemUsers();
      if (user.role === 'contractor') {
        useStore.getState().fetchContractors();
      }
    } catch (err) {
      console.error('Failed to add system user', err);
    }
  },

  fetchProjects: async () => {
    try {
      const { api } = await import('../services/api');
      const { mapApiProject } = await import('../utils/projectMapper');
      const res = await api.getProjects();
      const mapped = res.projects.map((p: any) => mapApiProject(p));
      set({ projects: mapped });
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  },

  fetchContractors: async () => {
    try {
      const { api } = await import('../services/api');
      const res = await api.getContractors();
      const mapped = res.contractors.map((c: any) => ({
        id: c._id || c.id,
        name: c.user_name || c.company,
        company: c.company,
        license: c.license,
        email: c.email || '',
        phone: c.phone || '',
        rating: c.rating || 0,
        completedProjects: c.completed_projects || 0,
        activeProjects: c.active_projects || 0,
        totalBudget: c.total_budget || 0,
        regions: c.regions || [],
        specialization: c.specialization || [],
        performanceScore: c.performance_score || 0,
        status: c.is_active ? ('active' as const) : ('suspended' as const),
        joinedAt: c.created_at || new Date().toISOString(),
        user_id: c.user_id
      }));
      set({ contractors: mapped });
    } catch (err) {
      console.error('Failed to fetch contractors', err);
    }
  },

  fetchNotifications: async () => {
    try {
      const { api } = await import('../services/api');
      const res = await api.getAlerts();
      const mapped = res.alerts.map((a: any) => ({
        id: a._id || a.id,
        title: a.title,
        message: a.message,
        type: a.type,
        read: a.read
      }));
      set({ notifications: mapped });
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    }
  },

  fetchBudgetEntries: async () => {
    try {
      const { api } = await import('../services/api');
      const res = await api.getBudgetEntries();
      const mapped = res.entries.map((b: any) => ({
        id: b._id || b.id,
        projectId: b.project_id,
        projectTitle: b.project_title,
        contractor: b.contractor,
        amount: b.amount,
        type: b.type,
        status: b.status,
        requestedAt: b.requested_at ? b.requested_at.split('T')[0] : '',
        approvedAt: b.approved_at ? b.approved_at.split('T')[0] : undefined,
        approvedBy: b.approved_by,
        notes: b.notes,
        district: b.district,
        source: b.source,
        sanctionReference: b.sanction_reference
      }));
      set({ budgetEntries: mapped });
    } catch (err) {
      console.error('Failed to fetch budget entries', err);
    }
  },

  fetchSystemUsers: async () => {
    try {
      const { api } = await import('../services/api');
      const res = await api.getSystemUsers();
      const mapped = res.map((u: any) => ({
        id: u._id || u.id,
        name: u.name,
        email: u.email,
        role: u.role as UserRole,
        district: u.district,
        state: u.state,
        isActive: u.is_active,
        createdAt: u.created_at ? u.created_at.split('T')[0] : ''
      }));
      set({ systemUsers: mapped });
    } catch (err) {
      console.error('Failed to fetch system users', err);
    }
  },

}));
