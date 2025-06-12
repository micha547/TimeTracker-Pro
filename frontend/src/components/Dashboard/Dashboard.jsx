import React from 'react';
import { Clock, Play, Pause, Square } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useApp } from '../../context/AppContext';
import DashboardStats from './DashboardStats';

const Dashboard = () => {
  const { state, actions } = useApp();
  const { projects, clients, timeEntries, activeTimer } = state;
  
  const [timerProjectId, setTimerProjectId] = React.useState('');
  const [timerDescription, setTimerDescription] = React.useState('');

  // Get recent time entries
  const recentEntries = timeEntries
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Get active projects
  const activeProjects = projects.filter(project => project.status === 'active');

  const handleStartTimer = () => {
    if (timerProjectId && timerDescription.trim()) {
      actions.startTimer(timerProjectId, timerDescription);
      setTimerDescription('');
    }
  };

  const handleStopTimer = () => {
    actions.stopTimer();
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getClientName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 'Unknown Client';
    const client = clients.find(c => c.id === project.clientId);
    return client ? client.name : 'Unknown Client';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Willkommen zurück! Hier ist Ihre Übersicht.</p>
        </div>
        <Badge className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600">
          {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Section */}
        <Card className="lg:col-span-2 shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>Zeit erfassen</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeTimer ? (
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-200">
                      Timer läuft
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {activeTimer.description}
                    </p>
                    <p className="text-xs text-green-500 dark:text-green-500">
                      Projekt: {getProjectName(activeTimer.projectId)}
                    </p>
                  </div>
                  <Button 
                    onClick={handleStopTimer}
                    className="bg-red-500 hover:bg-red-600 text-white space-x-2"
                  >
                    <Square className="w-4 h-4" />
                    <span>Stoppen</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select onValueChange={setTimerProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Projekt auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} - {getClientName(project.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    placeholder="Beschreibung der Arbeit..."
                    value={timerDescription}
                    onChange={(e) => setTimerDescription(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleStartTimer()}
                  />
                </div>
                
                <Button 
                  onClick={handleStartTimer}
                  disabled={!timerProjectId || !timerDescription.trim()}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white space-x-2 h-12"
                >
                  <Play className="w-5 h-5" />
                  <span>Timer starten</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Schnellaktionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start space-x-2 h-12 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950"
              onClick={() => actions.setCurrentView('clients')}
            >
              <span>Neuen Kunden anlegen</span>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start space-x-2 h-12 hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-950"
              onClick={() => actions.setCurrentView('projects')}
            >
              <span>Neues Projekt erstellen</span>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start space-x-2 h-12 hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950"
              onClick={() => actions.setCurrentView('time-tracking')}
            >
              <span>Zeit manuell eintragen</span>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start space-x-2 h-12 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950"
              onClick={() => actions.setCurrentView('invoices')}
            >
              <span>Rechnung erstellen</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Time Entries */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Letzte Zeiteinträge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEntries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Noch keine Zeiteinträge vorhanden.
              </p>
            ) : (
              recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">
                      {entry.description}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {getProjectName(entry.projectId)} • {getClientName(entry.projectId)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">
                      {formatDuration(entry.duration)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
