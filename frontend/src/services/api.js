import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || error.response.data?.message || 'An error occurred';
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// Client API functions
export const clientsApi = {
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', {
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    address: data.address || null,
    is_active: data.isActive !== undefined ? data.isActive : true
  }),
  update: (id, data) => api.put(`/clients/${id}`, {
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    address: data.address || null,
    is_active: data.isActive
  }),
  delete: (id) => api.delete(`/clients/${id}`)
};

// Project API functions
export const projectsApi = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', {
    name: data.name,
    description: data.description || null,
    client_id: data.clientId,
    hourly_rate: parseFloat(data.hourlyRate),
    currency: data.currency || 'EUR',
    start_date: data.startDate || null,
    end_date: data.endDate || null,
    status: data.status || 'active'
  }),
  update: (id, data) => api.put(`/projects/${id}`, {
    name: data.name,
    description: data.description || null,
    client_id: data.clientId,
    hourly_rate: data.hourlyRate ? parseFloat(data.hourlyRate) : undefined,
    currency: data.currency,
    start_date: data.startDate || null,
    end_date: data.endDate || null,
    status: data.status
  }),
  delete: (id) => api.delete(`/projects/${id}`)
};

// Time Entry API functions
export const timeEntriesApi = {
  getAll: () => api.get('/time-entries'),
  getById: (id) => api.get(`/time-entries/${id}`),
  create: (data) => api.post('/time-entries', {
    project_id: data.projectId,
    description: data.description,
    start_time: data.startTime,
    end_time: data.endTime,
    duration: parseInt(data.duration),
    date: data.date,
    is_manual: data.isManual !== undefined ? data.isManual : true
  }),
  update: (id, data) => api.put(`/time-entries/${id}`, {
    project_id: data.projectId,
    description: data.description,
    start_time: data.startTime,
    end_time: data.endTime,
    duration: data.duration ? parseInt(data.duration) : undefined,
    date: data.date,
    is_manual: data.isManual
  }),
  delete: (id) => api.delete(`/time-entries/${id}`)
};

// Timer API functions
export const timerApi = {
  getActive: () => api.get('/timer/active'),
  start: (data) => api.post('/timer/start', {
    project_id: data.projectId,
    description: data.description
  }),
  stop: () => api.post('/timer/stop')
};

// Invoice API functions
export const invoicesApi = {
  getAll: () => api.get('/invoices'),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', {
    client_id: data.clientId,
    project_id: data.projectId,
    invoice_number: data.invoiceNumber,
    issue_date: data.issueDate,
    due_date: data.dueDate,
    total_hours: parseFloat(data.totalHours),
    total_amount: parseFloat(data.totalAmount),
    currency: data.currency || 'EUR',
    status: data.status || 'draft',
    time_entries: data.timeEntries || [],
    custom_description: data.customDescription || null
  }),
  update: (id, data) => api.put(`/invoices/${id}`, {
    client_id: data.clientId,
    project_id: data.projectId,
    invoice_number: data.invoiceNumber,
    issue_date: data.issueDate,
    due_date: data.dueDate,
    total_hours: data.totalHours ? parseFloat(data.totalHours) : undefined,
    total_amount: data.totalAmount ? parseFloat(data.totalAmount) : undefined,
    currency: data.currency,
    status: data.status,
    time_entries: data.timeEntries,
    custom_description: data.customDescription || null
  }),
  delete: (id) => api.delete(`/invoices/${id}`)
};

// Utility function to convert API response format to frontend format
export const convertApiToFrontend = {
  client: (apiClient) => ({
    id: apiClient.id,
    name: apiClient.name,
    email: apiClient.email,
    phone: apiClient.phone,
    address: apiClient.address,
    isActive: apiClient.is_active,
    createdAt: apiClient.created_at
  }),
  
  project: (apiProject) => ({
    id: apiProject.id,
    name: apiProject.name,
    description: apiProject.description,
    clientId: apiProject.client_id,
    hourlyRate: apiProject.hourly_rate,
    currency: apiProject.currency,
    startDate: apiProject.start_date,
    endDate: apiProject.end_date,
    status: apiProject.status,
    createdAt: apiProject.created_at
  }),
  
  timeEntry: (apiEntry) => ({
    id: apiEntry.id,
    projectId: apiEntry.project_id,
    description: apiEntry.description,
    startTime: apiEntry.start_time,
    endTime: apiEntry.end_time,
    duration: apiEntry.duration,
    date: apiEntry.date,
    isManual: apiEntry.is_manual,
    createdAt: apiEntry.created_at
  }),
  
  invoice: (apiInvoice) => ({
    id: apiInvoice.id,
    clientId: apiInvoice.client_id,
    projectId: apiInvoice.project_id,
    invoiceNumber: apiInvoice.invoice_number,
    issueDate: apiInvoice.issue_date,
    dueDate: apiInvoice.due_date,
    totalHours: apiInvoice.total_hours,
    totalAmount: apiInvoice.total_amount,
    currency: apiInvoice.currency,
    status: apiInvoice.status,
    timeEntries: apiInvoice.time_entries,
    customDescription: apiInvoice.custom_description,
    createdAt: apiInvoice.created_at
  }),
  
  timer: (apiTimer) => ({
    id: apiTimer.id,
    projectId: apiTimer.project_id,
    description: apiTimer.description,
    startTime: apiTimer.start_time,
    createdAt: apiTimer.created_at
  })
};

export default api;
