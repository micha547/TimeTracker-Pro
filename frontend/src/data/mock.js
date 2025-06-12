// Mock data for the time tracking application

export const mockClients = [
  {
    id: 'client-1',
    name: 'TechCorp GmbH',
    email: 'contact@techcorp.de',
    address: 'Hauptstraße 123, 10115 Berlin',
    phone: '+49 30 12345678',
    createdAt: '2024-01-15T10:00:00Z',
    isActive: true
  },
  {
    id: 'client-2',
    name: 'Design Studio München',
    email: 'hello@designstudio.de',
    address: 'Maximilianstraße 45, 80539 München',
    phone: '+49 89 987654321',
    createdAt: '2024-02-20T14:30:00Z',
    isActive: true
  },
  {
    id: 'client-3',
    name: 'StartUp Innovation',
    email: 'info@startup-innovation.de',
    address: 'Unter den Linden 77, 10117 Berlin',
    phone: '+49 30 11223344',
    createdAt: '2024-03-10T09:15:00Z',
    isActive: false
  }
];

export const mockProjects = [
  {
    id: 'project-1',
    name: 'Website Redesign',
    description: 'Complete overhaul of the company website with modern UI/UX',
    clientId: 'client-1',
    hourlyRate: 85,
    currency: 'EUR',
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    status: 'active',
    createdAt: '2024-05-15T10:00:00Z'
  },
  {
    id: 'project-2',
    name: 'Mobile App Development',
    description: 'Native iOS and Android app for customer management',
    clientId: 'client-1',
    hourlyRate: 95,
    currency: 'EUR',
    startDate: '2024-07-01',
    endDate: '2024-12-31',
    status: 'active',
    createdAt: '2024-06-20T14:30:00Z'
  },
  {
    id: 'project-3',
    name: 'Brand Identity',
    description: 'Logo design and brand guidelines development',
    clientId: 'client-2',
    hourlyRate: 75,
    currency: 'EUR',
    startDate: '2024-03-01',
    endDate: '2024-05-31',
    status: 'completed',
    createdAt: '2024-02-25T09:15:00Z'
  },
  {
    id: 'project-4',
    name: 'E-Commerce Platform',
    description: 'Custom e-commerce solution with payment integration',
    clientId: 'client-3',
    hourlyRate: 90,
    currency: 'EUR',
    startDate: '2024-04-01',
    endDate: '2024-09-30',
    status: 'on-hold',
    createdAt: '2024-03-15T16:45:00Z'
  }
];

export const mockTimeEntries = [
  {
    id: 'time-1',
    projectId: 'project-1',
    description: 'Frontend development - homepage layout',
    startTime: '2024-06-15T09:00:00Z',
    endTime: '2024-06-15T12:30:00Z',
    duration: 210, // in minutes
    isManual: false,
    createdAt: '2024-06-15T09:00:00Z',
    date: '2024-06-15'
  },
  {
    id: 'time-2',
    projectId: 'project-1',
    description: 'Backend API integration',
    startTime: '2024-06-15T13:30:00Z',
    endTime: '2024-06-15T17:00:00Z',
    duration: 210, // in minutes
    isManual: false,
    createdAt: '2024-06-15T13:30:00Z',
    date: '2024-06-15'
  },
  {
    id: 'time-3',
    projectId: 'project-2',
    description: 'Project planning and architecture',
    startTime: '2024-06-16T10:00:00Z',
    endTime: '2024-06-16T12:00:00Z',
    duration: 120, // in minutes
    isManual: true,
    createdAt: '2024-06-16T10:00:00Z',
    date: '2024-06-16'
  },
  {
    id: 'time-4',
    projectId: 'project-3',
    description: 'Logo concepts and iterations',
    startTime: '2024-06-14T14:00:00Z',
    endTime: '2024-06-14T18:30:00Z',
    duration: 270, // in minutes
    isManual: false,
    createdAt: '2024-06-14T14:00:00Z',
    date: '2024-06-14'
  },
  {
    id: 'time-5',
    projectId: 'project-1',
    description: 'Testing and bug fixes',
    startTime: '2024-06-17T09:30:00Z',
    endTime: '2024-06-17T11:45:00Z',
    duration: 135, // in minutes
    isManual: false,
    createdAt: '2024-06-17T09:30:00Z',
    date: '2024-06-17'
  }
];

export const mockInvoices = [
  {
    id: 'invoice-1',
    clientId: 'client-1',
    projectId: 'project-1',
    invoiceNumber: 'INV-2024-001',
    issueDate: '2024-06-30',
    dueDate: '2024-07-30',
    totalHours: 15.5,
    totalAmount: 1317.50,
    currency: 'EUR',
    status: 'sent',
    timeEntries: ['time-1', 'time-2', 'time-5'],
    createdAt: '2024-06-30T16:00:00Z'
  },
  {
    id: 'invoice-2',
    clientId: 'client-2',
    projectId: 'project-3',
    invoiceNumber: 'INV-2024-002',
    issueDate: '2024-05-31',
    dueDate: '2024-06-30',
    totalHours: 4.5,
    totalAmount: 337.50,
    currency: 'EUR',
    status: 'paid',
    timeEntries: ['time-4'],
    createdAt: '2024-05-31T18:00:00Z'
  }
];

// Utility functions for mock data management
export const getClientById = (id) => mockClients.find(client => client.id === id);
export const getProjectById = (id) => mockProjects.find(project => project.id === id);
export const getProjectsByClientId = (clientId) => mockProjects.filter(project => project.clientId === clientId);
export const getTimeEntriesByProjectId = (projectId) => mockTimeEntries.filter(entry => entry.projectId === projectId);
export const getTimeEntriesForDateRange = (startDate, endDate) => {
  return mockTimeEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
  });
};

// Generate new IDs
export const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Local storage utilities
export const loadFromStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return defaultValue;
  }
};

export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
};
