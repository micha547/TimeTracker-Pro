import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  clientsApi, 
  projectsApi, 
  timeEntriesApi, 
  timerApi,
  invoicesApi,
  convertApiToFrontend
} from '../services/api';
import { loadFromStorage, saveToStorage } from '../data/mock';

const AppContext = createContext();

// Initial state
const initialState = {
  clients: [],
  projects: [],
  timeEntries: [],
  invoices: [],
  activeTimer: null,
  theme: loadFromStorage('theme', 'light'),
  currentView: 'dashboard',
  loading: false,
  error: null
};

// Action types
const ActionTypes = {
  // Loading states
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Data actions
  SET_CLIENTS: 'SET_CLIENTS',
  SET_PROJECTS: 'SET_PROJECTS',
  SET_TIME_ENTRIES: 'SET_TIME_ENTRIES',
  SET_INVOICES: 'SET_INVOICES',
  SET_ACTIVE_TIMER: 'SET_ACTIVE_TIMER',
  
  // UI actions
  SET_THEME: 'SET_THEME',
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW'
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
      
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
      
    case ActionTypes.SET_CLIENTS:
      return { ...state, clients: action.payload };
      
    case ActionTypes.SET_PROJECTS:
      return { ...state, projects: action.payload };
      
    case ActionTypes.SET_TIME_ENTRIES:
      return { ...state, timeEntries: action.payload };
      
    case ActionTypes.SET_INVOICES:
      return { ...state, invoices: action.payload };
      
    case ActionTypes.SET_ACTIVE_TIMER:
      return { ...state, activeTimer: action.payload };
      
    case ActionTypes.SET_THEME:
      return { ...state, theme: action.payload };
      
    case ActionTypes.SET_CURRENT_VIEW:
      return { ...state, currentView: action.payload };
      
    default:
      return state;
  }
};

// Context provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Helper function to handle async operations
  const handleAsync = async (asyncFn, errorMessage = 'An error occurred') => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      return await asyncFn();
    } catch (error) {
      console.error(errorMessage, error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message || errorMessage });
      throw error;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  // Data fetching functions
  const fetchClients = async () => {
    const data = await handleAsync(
      async () => {
        const clients = await clientsApi.getAll();
        const convertedClients = clients.map(convertApiToFrontend.client);
        dispatch({ type: ActionTypes.SET_CLIENTS, payload: convertedClients });
        return convertedClients;
      },
      'Failed to fetch clients'
    );
    return data;
  };

  const fetchProjects = async () => {
    const data = await handleAsync(
      async () => {
        const projects = await projectsApi.getAll();
        const convertedProjects = projects.map(convertApiToFrontend.project);
        dispatch({ type: ActionTypes.SET_PROJECTS, payload: convertedProjects });
        return convertedProjects;
      },
      'Failed to fetch projects'
    );
    return data;
  };

  const fetchTimeEntries = async () => {
    const data = await handleAsync(
      async () => {
        const timeEntries = await timeEntriesApi.getAll();
        const convertedEntries = timeEntries.map(convertApiToFrontend.timeEntry);
        dispatch({ type: ActionTypes.SET_TIME_ENTRIES, payload: convertedEntries });
        return convertedEntries;
      },
      'Failed to fetch time entries'
    );
    return data;
  };

  const fetchInvoices = async () => {
    const data = await handleAsync(
      async () => {
        const invoices = await invoicesApi.getAll();
        const convertedInvoices = invoices.map(convertApiToFrontend.invoice);
        dispatch({ type: ActionTypes.SET_INVOICES, payload: convertedInvoices });
        return convertedInvoices;
      },
      'Failed to fetch invoices'
    );
    return data;
  };

  const fetchActiveTimer = async () => {
    try {
      const timer = await timerApi.getActive();
      const convertedTimer = timer ? convertApiToFrontend.timer(timer) : null;
      dispatch({ type: ActionTypes.SET_ACTIVE_TIMER, payload: convertedTimer });
      return convertedTimer;
    } catch (error) {
      console.error('Failed to fetch active timer:', error);
      // Don't show error for timer - it's okay if there's no active timer
      dispatch({ type: ActionTypes.SET_ACTIVE_TIMER, payload: null });
      return null;
    }
  };

  // Action creators
  const actions = {
    // Client actions
    addClient: async (client) => {
      const newClient = await handleAsync(
        async () => {
          const created = await clientsApi.create(client);
          const converted = convertApiToFrontend.client(created);
          const updatedClients = [...state.clients, converted];
          dispatch({ type: ActionTypes.SET_CLIENTS, payload: updatedClients });
          return converted;
        },
        'Failed to create client'
      );
      return newClient;
    },

    updateClient: async (client) => {
      const updatedClient = await handleAsync(
        async () => {
          const updated = await clientsApi.update(client.id, client);
          const converted = convertApiToFrontend.client(updated);
          const updatedClients = state.clients.map(c => c.id === client.id ? converted : c);
          dispatch({ type: ActionTypes.SET_CLIENTS, payload: updatedClients });
          return converted;
        },
        'Failed to update client'
      );
      return updatedClient;
    },

    deleteClient: async (clientId) => {
      await handleAsync(
        async () => {
          await clientsApi.delete(clientId);
          const updatedClients = state.clients.filter(c => c.id !== clientId);
          dispatch({ type: ActionTypes.SET_CLIENTS, payload: updatedClients });
        },
        'Failed to delete client'
      );
    },

    // Project actions
    addProject: async (project) => {
      const newProject = await handleAsync(
        async () => {
          const created = await projectsApi.create(project);
          const converted = convertApiToFrontend.project(created);
          const updatedProjects = [...state.projects, converted];
          dispatch({ type: ActionTypes.SET_PROJECTS, payload: updatedProjects });
          return converted;
        },
        'Failed to create project'
      );
      return newProject;
    },

    updateProject: async (project) => {
      const updatedProject = await handleAsync(
        async () => {
          const updated = await projectsApi.update(project.id, project);
          const converted = convertApiToFrontend.project(updated);
          const updatedProjects = state.projects.map(p => p.id === project.id ? converted : p);
          dispatch({ type: ActionTypes.SET_PROJECTS, payload: updatedProjects });
          return converted;
        },
        'Failed to update project'
      );
      return updatedProject;
    },

    deleteProject: async (projectId) => {
      await handleAsync(
        async () => {
          await projectsApi.delete(projectId);
          const updatedProjects = state.projects.filter(p => p.id !== projectId);
          dispatch({ type: ActionTypes.SET_PROJECTS, payload: updatedProjects });
        },
        'Failed to delete project'
      );
    },

    // Time entry actions
    addTimeEntry: async (timeEntry) => {
      const newEntry = await handleAsync(
        async () => {
          const created = await timeEntriesApi.create(timeEntry);
          const converted = convertApiToFrontend.timeEntry(created);
          const updatedEntries = [...state.timeEntries, converted];
          dispatch({ type: ActionTypes.SET_TIME_ENTRIES, payload: updatedEntries });
          return converted;
        },
        'Failed to create time entry'
      );
      return newEntry;
    },

    updateTimeEntry: async (timeEntry) => {
      const updatedEntry = await handleAsync(
        async () => {
          const updated = await timeEntriesApi.update(timeEntry.id, timeEntry);
          const converted = convertApiToFrontend.timeEntry(updated);
          const updatedEntries = state.timeEntries.map(e => e.id === timeEntry.id ? converted : e);
          dispatch({ type: ActionTypes.SET_TIME_ENTRIES, payload: updatedEntries });
          return converted;
        },
        'Failed to update time entry'
      );
      return updatedEntry;
    },

    deleteTimeEntry: async (timeEntryId) => {
      await handleAsync(
        async () => {
          await timeEntriesApi.delete(timeEntryId);
          const updatedEntries = state.timeEntries.filter(e => e.id !== timeEntryId);
          dispatch({ type: ActionTypes.SET_TIME_ENTRIES, payload: updatedEntries });
        },
        'Failed to delete time entry'
      );
    },

    // Timer actions
    startTimer: async (projectId, description) => {
      const timer = await handleAsync(
        async () => {
          const started = await timerApi.start({ projectId, description });
          const converted = convertApiToFrontend.timer(started);
          dispatch({ type: ActionTypes.SET_ACTIVE_TIMER, payload: converted });
          return converted;
        },
        'Failed to start timer'
      );
      return timer;
    },

    stopTimer: async () => {
      const result = await handleAsync(
        async () => {
          const response = await timerApi.stop();
          dispatch({ type: ActionTypes.SET_ACTIVE_TIMER, payload: null });
          
          // Add the new time entry to the list
          const convertedEntry = convertApiToFrontend.timeEntry(response.time_entry);
          const updatedEntries = [...state.timeEntries, convertedEntry];
          dispatch({ type: ActionTypes.SET_TIME_ENTRIES, payload: updatedEntries });
          
          return response;
        },
        'Failed to stop timer'
      );
      return result;
    },

    // Invoice actions
    addInvoice: async (invoice) => {
      const newInvoice = await handleAsync(
        async () => {
          const created = await invoicesApi.create(invoice);
          const converted = convertApiToFrontend.invoice(created);
          const updatedInvoices = [...state.invoices, converted];
          dispatch({ type: ActionTypes.SET_INVOICES, payload: updatedInvoices });
          return converted;
        },
        'Failed to create invoice'
      );
      return newInvoice;
    },

    updateInvoice: async (invoice) => {
      const updatedInvoice = await handleAsync(
        async () => {
          const updated = await invoicesApi.update(invoice.id, invoice);
          const converted = convertApiToFrontend.invoice(updated);
          const updatedInvoices = state.invoices.map(i => i.id === invoice.id ? converted : i);
          dispatch({ type: ActionTypes.SET_INVOICES, payload: updatedInvoices });
          return converted;
        },
        'Failed to update invoice'
      );
      return updatedInvoice;
    },

    deleteInvoice: async (invoiceId) => {
      await handleAsync(
        async () => {
          await invoicesApi.delete(invoiceId);
          const updatedInvoices = state.invoices.filter(i => i.id !== invoiceId);
          dispatch({ type: ActionTypes.SET_INVOICES, payload: updatedInvoices });
        },
        'Failed to delete invoice'
      );
    },

    // Data fetching actions
    fetchAllData: async () => {
      await Promise.all([
        fetchClients(),
        fetchProjects(),
        fetchTimeEntries(),
        fetchInvoices(),
        fetchActiveTimer()
      ]);
    },

    refreshData: async () => {
      await actions.fetchAllData();
    },

    // UI actions
    setTheme: (theme) => {
      dispatch({ type: ActionTypes.SET_THEME, payload: theme });
    },
    
    setCurrentView: (view) => {
      dispatch({ type: ActionTypes.SET_CURRENT_VIEW, payload: view });
    },

    clearError: () => {
      dispatch({ type: ActionTypes.CLEAR_ERROR });
    }
  };

  // Initial data fetch
  useEffect(() => {
    actions.fetchAllData().catch(error => {
      console.error('Failed to fetch initial data:', error);
    });
  }, []);

  // Timer polling - check for active timer every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.activeTimer) {
        fetchActiveTimer();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [state.activeTimer]);

  // Save theme to localStorage
  useEffect(() => {
    saveToStorage('theme', state.theme);
    // Apply theme to document
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);
  
  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
