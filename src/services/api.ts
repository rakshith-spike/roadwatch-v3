const API_BASE_URL = 'http://localhost:8000/api';

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
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
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
  }) {
    return this.request<any>('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComplaint(id: string, data: any) {
    return this.request<any>(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async voteComplaint(id: string) {
    return this.request<any>(`/complaints/${id}/vote`, {
      method: 'POST',
    });
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

    const response = await fetch(`${API_BASE_URL}/complaints/upload-image`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }
    return response.json();
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

  async updateProject(id: string, data: any) {
    return this.request<any>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
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
}

export const api = new ApiService();
