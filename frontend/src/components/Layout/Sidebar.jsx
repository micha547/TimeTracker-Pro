import React from 'react';
import { 
  Home, 
  Users, 
  Briefcase, 
  Clock, 
  FileText, 
  BarChart3,
  Settings,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '../ui/button';
import { useApp } from '../../context/AppContext';

const Sidebar = () => {
  const { state, actions } = useApp();
  const { currentView, theme } = state;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'clients', label: 'Kunden', icon: Users },
    { id: 'projects', label: 'Projekte', icon: Briefcase },
    { id: 'time-tracking', label: 'Zeiterfassung', icon: Clock },
    { id: 'reports', label: 'Berichte', icon: BarChart3 },
    { id: 'invoices', label: 'Rechnungen', icon: FileText },
    { id: 'settings', label: 'Einstellungen', icon: Settings },
  ];

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">TimeTracker</h1>
            <p className="text-sm text-muted-foreground">Pro</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start space-x-3 h-12 transition-all duration-200 ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-md transform scale-105' 
                  : 'hover:bg-accent hover:text-accent-foreground hover:transform hover:scale-105'
              }`}
              onClick={() => actions.setCurrentView(item.id)}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Button>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start space-x-3 h-12 transition-all duration-200 hover:transform hover:scale-105"
          onClick={() => actions.setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
