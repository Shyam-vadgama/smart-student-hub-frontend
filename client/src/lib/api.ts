import { apiRequest } from "./queryClient";

// Achievement API
export const achievementApi = {
  getAll: (status?: string) => {
    const url = status ? `/api/achievements?status=${status}` : '/api/achievements';
    return fetch(url, { credentials: 'include' }).then(res => res.json());
  },
  
  getById: (id: string) => {
    return fetch(`/api/achievements/${id}`, { credentials: 'include' }).then(res => res.json());
  },
  
  create: async (data: FormData) => {
    const res = await fetch('/api/achievements', {
      method: 'POST',
      body: data,
      credentials: 'include'
    });
    return res.json();
  },
  
  updateStatus: async (id: string, status: string, comment?: string) => {
    const res = await apiRequest('PUT', `/api/achievements/${id}/status`, { status, comment });
    return res.json();
  },
  
  addComment: async (id: string, text: string) => {
    const res = await apiRequest('POST', `/api/achievements/${id}/comments`, { text });
    return res.json();
  },
  
  toggleLike: async (id: string) => {
    const res = await apiRequest('POST', `/api/achievements/${id}/like`);
    return res.json();
  }
};

// Forms API
export const formsApi = {
  getAll: () => {
    return fetch('/api/forms', { credentials: 'include' }).then(res => res.json());
  },
  
  getById: (id: string) => {
    return fetch(`/api/forms/${id}`, { credentials: 'include' }).then(res => res.json());
  },
  
  create: async (data: any) => {
    const res = await apiRequest('POST', '/api/forms', data);
    return res.json();
  },
  
  update: async (id: string, data: any) => {
    const res = await apiRequest('PUT', `/api/forms/${id}`, data);
    return res.json();
  },
  
  delete: async (id: string) => {
    const res = await apiRequest('DELETE', `/api/forms/${id}`);
    return res.json();
  }
};

// Analytics API
export const analyticsApi = {
  get: () => {
    return fetch('/api/analytics', { credentials: 'include' }).then(res => res.json());
  }
};

// Profile API
export const profileApi = {
  get: () => {
    return fetch('/api/profile', { credentials: 'include' }).then(res => res.json());
  },
  
  update: async (data: any) => {
    const res = await apiRequest('PUT', '/api/profile', data);
    return res.json();
  }
};
