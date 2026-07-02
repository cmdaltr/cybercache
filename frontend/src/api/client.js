import axios from 'axios';

// Use relative URLs to leverage Vite's proxy in development
// In production, set VITE_API_URL environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
  uploadBatch: (files, autoClassify = true) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files[]', file);
    });
    formData.append('auto_classify', autoClassify.toString());

    return apiClient.post('/api/upload/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Extract/Preview API
export const extractAPI = {
  fromLink: (url) => apiClient.post('/api/extract/link', { url }),
  fromFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/extract/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  fromBatch: (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files[]', file);
    });
    return apiClient.post('/api/extract/batch', formData, {
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

// Tags API
export const tagsAPI = {
  getAll: () => apiClient.get('/api/tags'),
};

// Stats API
export const statsAPI = {
  get: () => apiClient.get('/api/stats'),
};

// Bulk Import API
export const importAPI = {
  bulkLinks: (links) => apiClient.post('/api/import/links', { links }),
  previewLinks: (links) => apiClient.post('/api/import/links/preview', { links }),
};

// Health check
export const healthCheck = () => apiClient.get('/api/health');

export default apiClient;
