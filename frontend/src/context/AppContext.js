import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  mockClients, 
  mockProjects, 
  mockTimeEntries, 
  mockInvoices,
  loadFromStorage,
  saveToStorage,
  generateId
} from '../data/mock';

const AppContext = createContext();

// Initial state
const initialState = {
  clients: loadFromStorage('clients', mockClients),
  projects: loadFromStorage('projects', mockProjects),
  timeEntries: loadFromStorage('timeEntries', mockTimeEntries),
  invoices: loadFromStorage('invoices', mockInvoices),
  activeTimer: loadFromStorage('activeTimer', null),
  theme: loadFromStorage('theme', 'light'),
  currentView: 'dashboard'
};

// Action types
const ActionTypes = {
  // Client actions
  ADD_CLIENT: 'ADD_CLIENT',
  UPDATE_CLIENT: 'UPDATE_CLIENT',
  DELETE_CLIENT: 'DELETE_CLIENT',
  
  // Project actions
  ADD_PROJECT: 'ADD_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  
  // Time entry actions
  ADD_TIME_ENTRY: 'ADD_TIME_ENTRY',
  UPDATE_TIME_ENTRY: 'UPDATE_TIME_ENTRY',
  DELETE_TIME_ENTRY: 'DELETE_TIME_ENTRY',
  
  // Timer actions
  START_TIMER: 'START_TIMER',
  STOP_TIMER: 'STOP_TIMER',
  UPDATE_TIMER: 'UPDATE_TIMER',
  
  // Invoice actions
  ADD_INVOICE: 'ADD_INVOICE',
  UPDATE_INVOICE: 'UPDATE_INVOICE',
  DELETE_INVOICE: 'DELETE_INVOICE',
  
  // UI actions
  SET_THEME: 'SET_THEME',
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW'
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.ADD_CLIENT:
      return {
        ...state,
        clients: [...state.clients, { ...action.payload, id: generateId('client'), createdAt: new Date().toISOString() }]
      };
      
    case ActionTypes.UPDATE_CLIENT:
      return {
        ...state,
        clients: state.clients.map(client => 
          client.id === action.payload.id ? { ...client, ...action.payload } : client
        )
      };
      
    case ActionTypes.DELETE_CLIENT:
      return {
        ...state,
        clients: state.clients.filter(client => client.id !== action.payload)
      };
      
    case ActionTypes.ADD_PROJECT:
      return {
        ...state,
        projects: [...state.projects, { ...action.payload, id: generateId('project'), createdAt: new Date().toISOString() }]
      };
      
    case ActionTypes.UPDATE_PROJECT:
      return {
        ...state,
        projects: state.projects.map(project => 
          project.id === action.payload.id ? { ...project, ...action.payload } : project
        )
      };
      
    case ActionTypes.DELETE_PROJECT:
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload)
      };
      
    case ActionTypes.ADD_TIME_ENTRY:
      return {
        ...state,
        timeEntries: [...state.timeEntries, { ...action.payload, id: generateId('time'), createdAt: new Date().toISOString() }]
      };
      
    case ActionTypes.UPDATE_TIME_ENTRY:
      return {
        ...state,
        timeEntries: state.timeEntries.map(entry => 
          entry.id === action.payload.id ? { ...entry, ...action.payload } : entry
        )
      };
      
    case ActionTypes.DELETE_TIME_ENTRY:
      return {
        ...state,
        timeEntries: state.timeEntries.filter(entry => entry.id !== action.payload)
      };
      
    case ActionTypes.START_TIMER:
      return {
        ...state,
        activeTimer: {
          projectId: action.payload.projectId,
          description: action.payload.description,
          startTime: new Date().toISOString()
        }
      };
      
    case ActionTypes.STOP_TIMER:
      const timer = state.activeTimer;
      if (timer) {
        const endTime = new Date().toISOString();
        const startTime = new Date(timer.startTime);
        const duration = Math.round((new Date(endTime) - startTime) / (1000 * 60)); // duration in minutes
        
        const newTimeEntry = {
          projectId: timer.projectId,
          description: timer.description,
          startTime: timer.startTime,
          endTime: endTime,
          duration: duration,
          isManual: false,
          date: new Date().toISOString().split('T')[0]
        };
        
        return {
          ...state,
          activeTimer: null,
          timeEntries: [...state.timeEntries, { ...newTimeEntry, id: generateId('time'), createdAt: new Date().toISOString() }]
        };
      }
      return { ...state, activeTimer: null };
      
    case ActionTypes.UPDATE_TIMER:
      return {
        ...state,
        activeTimer: { ...state.activeTimer, ...action.payload }
      };
      
    case ActionTypes.ADD_INVOICE:
      return {
        ...state,
        invoices: [...state.invoices, { ...action.payload, id: generateId('invoice'), createdAt: new Date().toISOString() }]
      };
      
    case ActionTypes.UPDATE_INVOICE:
      return {
        ...state,
        invoices: state.invoices.map(invoice => 
          invoice.id === action.payload.id ? { ...invoice, ...action.payload } : invoice
        )
      };
      
    case ActionTypes.DELETE_INVOICE:
      return {
        ...state,
        invoices: state.invoices.filter(invoice => invoice.id !== action.payload)
      };
      
    case ActionTypes.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };
      
    case ActionTypes.SET_CURRENT_VIEW:
      return {
        ...state,
        currentView: action.payload
      };
      
    default:
      return state;
  }
};

// Context provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Save to localStorage whenever state changes
  useEffect(() => {
    saveToStorage('clients', state.clients);
  }, [state.clients]);
  
  useEffect(() => {
    saveToStorage('projects', state.projects);
  }, [state.projects]);
  
  useEffect(() => {
    saveToStorage('timeEntries', state.timeEntries);
  }, [state.timeEntries]);
  
  useEffect(() => {
    saveToStorage('invoices', state.invoices);
  }, [state.invoices]);
  
  useEffect(() => {
    saveToStorage('activeTimer', state.activeTimer);
  }, [state.activeTimer]);
  
  useEffect(() => {
    saveToStorage('theme', state.theme);
    // Apply theme to document
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);
  
  // Action creators
  const actions = {
    // Client actions
    addClient: (client) => dispatch({ type: ActionTypes.ADD_CLIENT, payload: client }),
    updateClient: (client) => dispatch({ type: ActionTypes.UPDATE_CLIENT, payload: client }),
    deleteClient: (clientId) => dispatch({ type: ActionTypes.DELETE_CLIENT, payload: clientId }),
    
    // Project actions
    addProject: (project) => dispatch({ type: ActionTypes.ADD_PROJECT, payload: project }),
    updateProject: (project) => dispatch({ type: ActionTypes.UPDATE_PROJECT, payload: project }),
    deleteProject: (projectId) => dispatch({ type: ActionTypes.DELETE_PROJECT, payload: projectId }),
    
    // Time entry actions
    addTimeEntry: (timeEntry) => dispatch({ type: ActionTypes.ADD_TIME_ENTRY, payload: timeEntry }),
    updateTimeEntry: (timeEntry) => dispatch({ type: ActionTypes.UPDATE_TIME_ENTRY, payload: timeEntry }),
    deleteTimeEntry: (timeEntryId) => dispatch({ type: ActionTypes.DELETE_TIME_ENTRY, payload: timeEntryId }),
    
    // Timer actions
    startTimer: (projectId, description) => dispatch({ type: ActionTypes.START_TIMER, payload: { projectId, description } }),
    stopTimer: () => dispatch({ type: ActionTypes.STOP_TIMER }),
    updateTimer: (updates) => dispatch({ type: ActionTypes.UPDATE_TIMER, payload: updates }),
    
    // Invoice actions
    addInvoice: (invoice) => dispatch({ type: ActionTypes.ADD_INVOICE, payload: invoice }),
    updateInvoice: (invoice) => dispatch({ type: ActionTypes.UPDATE_INVOICE, payload: invoice }),
    deleteInvoice: (invoiceId) => dispatch({ type: ActionTypes.DELETE_INVOICE, payload: invoiceId }),
    
    // UI actions
    setTheme: (theme) => dispatch({ type: ActionTypes.SET_THEME, payload: theme }),
    setCurrentView: (view) => dispatch({ type: ActionTypes.SET_CURRENT_VIEW, payload: view })
  };
  
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
