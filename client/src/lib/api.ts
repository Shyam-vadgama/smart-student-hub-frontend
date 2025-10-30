import { apiRequest } from "./queryClient";

// Achievement API
export const achievementApi = {
  getAll: async (status?: string, category?: string, type?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    if (type) params.append('type', type);
    
    const url = params.toString() ? `/api/achievements?${params.toString()}` : '/api/achievements';
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      // Return empty array for failed requests instead of throwing
      return [];
    }
    return res.json();
  },
  
  getById: async (id: string) => {
    const res = await fetch(`/api/achievements/${id}`, { credentials: 'include' });
    if (!res.ok) {
      throw new Error('Failed to fetch achievement');
    }
    return res.json();
  },
  
  create: async (data: FormData) => {
    const res = await fetch('/api/achievements', {
      method: 'POST',
      body: data,
      credentials: 'include'
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to create achievement');
    }
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
  },
  
  // Add form submission methods
  submit: async (formId: string, data: any) => {
    const res = await apiRequest('POST', `/api/forms/${formId}/submit`, { data });
    return res.json();
  },
  
  getSubmissions: async (formId: string) => {
    const res = await apiRequest('GET', `/api/forms/${formId}/submissions`);
    return res.json();
  }
};

// Student Forms API
export const studentFormsApi = {
  getAll: async () => {
    const res = await fetch('/api/student/forms', { credentials: 'include' });
    if (!res.ok) {
      throw new Error('Failed to fetch forms');
    }
    return res.json();
  }
};

// Analytics API
export const analyticsApi = {
  get: async () => {
    const res = await fetch('/api/analytics', { credentials: 'include' });
    if (!res.ok) {
      throw new Error('Failed to fetch analytics');
    }
    return res.json();
  }
};

// Profile API
export const profileApi = {
  get: async () => {
    const res = await fetch('/api/profile', { credentials: 'include' });
    if (!res.ok) {
      throw new Error('Failed to fetch profile');
    }
    return res.json();
  },
  
  update: async (data: any) => {
    const res = await apiRequest('PUT', '/api/profile', data);
    return res.json();
  }
};

// Resume API
export const resumeApi = {
  list: async () => {
    const res = await fetch('/api/resumes', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch resumes');
    return res.json();
  },
  save: async (payload: any) => {
    const res = await apiRequest('POST', '/api/resumes', payload);
    return res.json();
  },
  suggest: async (payload: any) => {
    const res = await apiRequest('POST', '/api/resumes/suggest', payload);
    return res.json();
  }
};

// Follow API
export const followApi = {
  followUser: async (userId: string) => {
    const res = await apiRequest('POST', `/api/follow/${userId}`);
    return res.json();
  },
  
  unfollowUser: async (userId: string) => {
    const res = await apiRequest('DELETE', `/api/follow/${userId}`);
    return res.json();
  },
  
  getFollowers: async (userId: string) => {
    const res = await fetch(`/api/followers/${userId}`, { credentials: 'include' });
    if (!res.ok) {
      throw new Error('Failed to fetch followers');
    }
    return res.json();
  },
  
  getFollowing: async (userId: string) => {
    const res = await fetch(`/api/following/${userId}`, { credentials: 'include' });
    if (!res.ok) {
      throw new Error('Failed to fetch following');
    }
    return res.json();
  },
  
  getFeed: async () => {
    const res = await fetch('/api/feed', { credentials: 'include' });
    if (!res.ok) {
      throw new Error('Failed to fetch feed');
    }
    return res.json();
  }
};