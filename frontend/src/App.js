import React from "react";
import "./App.css";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Layout/Sidebar";
import Header from "./components/Layout/Header";
import Dashboard from "./components/Dashboard/Dashboard";
import ClientList from "./components/Clients/ClientList";
import ProjectList from "./components/Projects/ProjectList";
import TimeTracking from "./components/TimeTracking/TimeTracking";
import Reports from "./components/Reports/Reports";
import Invoices from "./components/Invoices/Invoices";
import Settings from "./components/Settings/Settings";
import { Toaster } from "./components/ui/toaster";

const AppContent = () => {
  const { state } = useApp();
  const { currentView } = state;

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <ClientList />;
      case 'projects':
        return <ProjectList />;
      case 'time-tracking':
        return <TimeTracking />;
      case 'reports':
        return <Reports />;
      case 'invoices':
        return <Invoices />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-background">
          {renderCurrentView()}
        </main>
      </div>
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
