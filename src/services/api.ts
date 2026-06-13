const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

type BackendSessionUser = {
  name: string;
  email: string;
  role?: string | null;
  phone?: string;
  district?: string;
  state?: string;
};

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('roadwatch_token', token);
    } else {
      localStorage.removeItem('roadwatch_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('roadwatch_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || 'Request failed');
      }

      return await response.json();
    } catch (error: any) {
      // Dynamic import to avoid circular dependency
      import('../store/useStore').then(({ useStore }) => {
        // Only show toast for non-auth GET requests or actual mutations
        if (options.method && options.method !== 'GET' && !endpoint.includes('/auth/')) {
          useStore.getState().addToast({
            title: 'Error',
            message: error.message || 'An unexpected error occurred',
            type: 'error'
          });
        }
      });
      throw error;
    }
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.request<{
      access_token: string;
      user: {
        _id: string;
        name: string;
        email: string;
        role: string;
        district?: string;
        state?: string;
        contractor_id?: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.setToken(response.access_token);
    return response;
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    district?: string;
    state?: string;
  }) {
    const response = await this.request<{
      access_token: string;
      user: any;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    this.setToken(response.access_token);
    return response;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  async ensureBackendSession(user?: BackendSessionUser | null, forceRefresh = false) {
    if (!forceRefresh && this.getToken()) {
      try {
        await this.getMe();
        return;
      } catch {
        this.setToken(null);
      }
    }

    if (!user?.email.endsWith('@demo.com')) {
      throw new Error('Please log in with a backend account before submitting complaints.');
    }

    const password = 'demo123';
    try {
      await this.login(user.email, password);
      return;
    } catch {
      await this.register({
        name: user.name,
        email: user.email,
        password,
        role: user.role || 'citizen',
        phone: user.phone,
        district: user.district || 'Bangalore Urban',
        state: user.state || 'Karnataka',
      });
    }
  }

  // Complaints
  async getComplaints(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    severity?: string;
    category?: string;
    search?: string;
    my_complaints?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    return this.request<{
      complaints: any[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    }>(`/complaints?${searchParams}`);
  }

  async getComplaint(id: string) {
    return this.request<any>(`/complaints/${id}`);
  }

  async createComplaint(data: {
    title: string;
    description: string;
    category: string;
    location: {
      type: string;
      coordinates: number[];
      address: string;
      district: string;
      state: string;
    };
    images?: string[];
    traffic_importance?: number;
  }) {
    const res = await this.request<any>('/complaints/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    import('../store/useStore').then(({ useStore }) => {
      useStore.getState().addToast({ title: 'Success', message: 'Complaint submitted successfully', type: 'success' });
    });
    return res;
  }

  async updateComplaint(id: string, data: any) {
    const res = await this.request<any>(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    import('../store/useStore').then(({ useStore }) => {
      useStore.getState().addToast({ title: 'Success', message: 'Complaint updated', type: 'success' });
    });
    return res;
  }

  async assignComplaint(id: string, contractorId: string) {
    const params = new URLSearchParams({ contractor_id: contractorId });
    const res = await this.request<any>(`/complaints/${id}/assign?${params}`, {
      method: 'POST',
    });
    import('../store/useStore').then(({ useStore }) => {
      useStore.getState().addToast({ title: 'Assigned', message: 'Complaint assigned to contractor', type: 'success' });
    });
    return res;
  }

  async voteComplaint(id: string) {
    const res = await this.request<any>(`/complaints/${id}/vote`, {
      method: 'POST',
    });
    import('../store/useStore').then(({ useStore }) => {
      useStore.getState().addToast({ title: 'Upvoted', message: 'Your vote has been recorded', type: 'success' });
    });
    return res;
  }

  async supportComplaint(id: string) {
    const res = await this.request<any>(`/complaints/${id}/support`, {
      method: 'POST',
    });
    import('../store/useStore').then(({ useStore }) => {
      useStore.getState().addToast({ title: 'Supported', message: 'You have supported this existing complaint', type: 'success' });
    });
    return res;
  }

  async getPriorityQueue(params?: { severity?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.severity) searchParams.append('severity', params.severity);
    return this.request<{ complaints: any[] }>(`/complaints/priority-queue?${searchParams}`);
  }

  async analyzeComplaintImage(imageUrl: string, context?: {
    category?: string;
    title?: string;
    description?: string;
    filename?: string;
  }) {
    const params = new URLSearchParams({ image_url: imageUrl });
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    return this.request<any>(`/complaints/analyze-image?${params}`, {
      method: 'POST',
    });
  }

  async validateRepair(id: string, afterImageUrl: string) {
    const params = new URLSearchParams({ after_image_url: afterImageUrl });
    return this.request<any>(`/complaints/${id}/repair-validation?${params}`, {
      method: 'POST',
    });
  }

  async citizenVerifyComplaint(id: string, fixed: boolean, notes?: string) {
    const params = new URLSearchParams({ fixed: String(fixed) });
    if (notes) params.append('notes', notes);
    const res = await this.request<any>(`/complaints/${id}/citizen-verification?${params}`, {
      method: 'POST',
    });
    import('../store/useStore').then(({ useStore }) => {
      useStore.getState().addToast({ title: 'Verified', message: fixed ? 'Repair confirmed' : 'Repair rejected', type: 'success' });
    });
    return res;
  }

  async analyzeComplaint(title: string, description: string, category?: string) {
    return this.request<any>('/ai/analyze-complaint', {
      method: 'POST',
      body: JSON.stringify({ title, description, category }),
    });
  }

  async uploadImage(file: File): Promise<{ url: string; filename: string }> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/complaints/upload-image`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(error.detail || 'Upload failed');
      }
      return await response.json();
    } catch (error: any) {
      import('../store/useStore').then(({ useStore }) => {
        useStore.getState().addToast({ title: 'Upload Error', message: error.message, type: 'error' });
      });
      throw error;
    }
  }

  // Projects
  async getProjects(params?: { status?: string; contractor_id?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return this.request<{ projects: any[]; total: number }>(`/projects?${searchParams}`);
  }

  async getProject(id: string) {
    return this.request<any>(`/projects/${id}`);
  }

  async createProject(data: any) {
    return this.request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: any) {
    return this.request<any>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async addProjectWorkLog(id: string, data: {
    description: string;
    workers_count: number;
    materials_used: string[];
  }) {
    const params = new URLSearchParams({
      description: data.description,
      workers_count: String(data.workers_count),
    });
    data.materials_used.forEach((material) => params.append('materials_used', material));
    return this.request<any>(`/projects/${id}/work-log?${params}`, {
      method: 'POST',
    });
  }

  // Contractors
  async getContractors() {
    return this.request<{ contractors: any[]; total: number }>('/contractors');
  }

  async getContractor(id: string) {
    return this.request<any>(`/contractors/${id}`);
  }

  async getMyContractorProfile() {
    return this.request<any>('/contractors/me');
  }

  async getContractorPerformance(id: string) {
    return this.request<any>(`/contractors/${id}/performance`);
  }

  // Analytics
  async getDashboardAnalytics(params?: { district?: string; days?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, String(value));
      });
    }
    return this.request<any>(`/analytics/dashboard?${searchParams}`);
  }

  async getTrends(params?: { days?: number; district?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, String(value));
      });
    }
    return this.request<any>(`/analytics/trends?${searchParams}`);
  }

  async getDistrictAnalytics() {
    return this.request<any>('/analytics/districts');
  }

  async getContractorAnalytics() {
    return this.request<any>('/analytics/contractors');
  }

  async getAIInsights() {
    return this.request<any>('/analytics/ai-insights');
  }

  async getHotspots() {
    return this.request<any>('/analytics/hotspots');
  }

  async getSLAMetrics() {
    return this.request<any>('/analytics/sla');
  }

  async getMapIntelligence(params?: {
    mode?: 'government' | 'citizen';
    lat?: number;
    lng?: number;
    radius_meters?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return this.request<any>(`/analytics/map-intelligence?${searchParams}`);
  }

  // Alerts
  async getAlerts(params?: { type?: string; read?: boolean; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return this.request<{ alerts: any[]; total: number; unread_count: number }>(`/alerts?${searchParams}`);
  }

  async markAlertRead(id: string) {
    return this.request<any>(`/alerts/${id}/read`, { method: 'PUT' });
  }

  async markAllAlertsRead() {
    return this.request<any>('/alerts/read-all', { method: 'PUT' });
  }

  // AI
  async aiChat(message: string, context?: any) {
    return this.request<{ response: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  async getAIRecommendations(params?: { complaint_id?: string; category?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return this.request<{ recommendations: string[] }>(`/ai/recommendations?${searchParams}`);
  }

  async getPredictiveMaintenance(district?: string) {
    const params = district ? `?district=${district}` : '';
    return this.request<any>(`/ai/predict-maintenance${params}`);
  }

  async checkDuplicate(title: string, description: string, district?: string) {
    const params = new URLSearchParams({ title, description });
    if (district) params.append('district', district);
    return this.request<any>(`/ai/duplicate-check?${params}`);
  }

  // Public stats
  async getPublicStats() {
    return this.request<{
      total_complaints: number;
      resolved_complaints: number;
      active_contractors: number;
      resolution_rate: number;
    }>('/stats');
  }

  // Budget
  async getBudgetEntries(params?: { status?: string; type?: string; project_id?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return this.request<{ entries: any[]; total: number }>(`/budget?${searchParams}`);
  }

  async createBudgetEntry(data: {
    project_id: string;
    project_title: string;
    contractor: string;
    amount: number;
    type: string;
    notes?: string;
    district: string;
    source?: string;
    sanction_reference?: string;
  }) {
    return this.request<any>('/budget/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveBudgetEntry(id: string) {
    return this.request<any>(`/budget/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectBudgetEntry(id: string, notes?: string) {
    const params = new URLSearchParams();
    if (notes) params.append('notes', notes);
    return this.request<any>(`/budget/${id}/reject?${params}`, {
      method: 'POST',
    });
  }

  // System Users
  async getSystemUsers() {
    return this.request<any[]>('/auth/users');
  }

  async updateSystemUser(id: string, data: { name?: string; role?: string; district?: string }) {
    return this.request<any>(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleUserStatus(id: string) {
    return this.request<any>(`/auth/users/${id}/toggle-status`, {
      method: 'POST',
    });
  }

  async registerUserByAdmin(data: {
    name: string;
    email: string;
    password?: string;
    role: string;
    phone?: string;
    district?: string;
    state?: string;
  }) {
    return this.request<any>('/auth/register-user', {
      method: 'POST',
      body: JSON.stringify({
        password: 'demo123',
        ...data,
      }),
    });
  }

  // Alerts extra
  async deleteAlert(id: string) {
    return this.request<any>(`/alerts/${id}`, { method: 'DELETE' });
  }

  async checkHealth(): Promise<{ status: string; database: string; version: string }> {
    const url = API_BASE_URL.replace(/\/api\/?$/, '') + '/health';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }
}

export const api = new ApiService();


