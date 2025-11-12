import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Resources API
export const resourcesAPI = {
  getAll: (params = {}) => apiClient.get('/api/resources', { params }),
  getOne: (id) => apiClient.get(`/api/resources/${id}`),
  create: (data) => apiClient.post('/api/resources', data),
  update: (id, data) => apiClient.put(`/api/resources/${id}`, data),
  delete: (id) => apiClient.delete(`/api/resources/${id}`),
  search: (query, params = {}) => apiClient.get('/api/search', { params: { q: query, ...params } }),
};

// Upload API
export const uploadAPI = {
  uploadFile: (file, metadata) => {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.category) formData.append('category', metadata.category);
    if (metadata.tags) formData.append('tags', metadata.tags);

    return apiClient.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Categories API
export const categoriesAPI = {
  getAll: () => apiClient.get('/api/categories'),
};

// Stats API
export const statsAPI = {
  get: () => apiClient.get('/api/stats'),
};

// Health check
export const healthCheck = () => apiClient.get('/api/health');

export default apiClient;
