import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, DollarSign, Clock, User, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/use-toast';

const ProjectList = () => {
  const { state, actions } = useApp();
  const { projects, clients, timeEntries } = state;
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    hourlyRate: '',
    currency: 'EUR',
    startDate: '',
    endDate: '',
    status: 'active'
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unbekannter Kunde';
  };

  const getTotalHours = (projectId) => {
    const entries = timeEntries.filter(entry => entry.projectId === projectId);
    const totalMinutes = entries.reduce((sum, entry) => sum + entry.duration, 0);
    return (totalMinutes / 60).toFixed(1);
  };

  const getTotalRevenue = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 0;
    const totalHours = parseFloat(getTotalHours(projectId));
    return (totalHours * project.hourlyRate).toFixed(2);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      clientId: '',
      hourlyRate: '',
      currency: 'EUR',
      startDate: '',
      endDate: '',
      status: 'active'
    });
    setEditingProject(null);
  };

  const handleOpenDialog = (project = null) => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description,
        clientId: project.clientId,
        hourlyRate: project.hourlyRate.toString(),
        currency: project.currency,
        startDate: project.startDate,
        endDate: project.endDate || '',
        status: project.status
      });
      setEditingProject(project);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.clientId || !formData.hourlyRate) {
      toast({
        title: "Fehler",
        description: "Name, Kunde und Stundensatz sind Pflichtfelder.",
        variant: "destructive"
      });
      return;
    }

    const projectData = {
      ...formData,
      hourlyRate: parseFloat(formData.hourlyRate)
    };

    if (editingProject) {
      actions.updateProject({ ...editingProject, ...projectData });
      toast({
        title: "Erfolg",
        description: "Projekt wurde erfolgreich aktualisiert."
      });
    } else {
      actions.addProject(projectData);
      toast({
        title: "Erfolg",
        description: "Projekt wurde erfolgreich hinzugefügt."
      });
    }
    
    handleCloseDialog();
  };

  const handleDelete = (project) => {
    const entries = timeEntries.filter(entry => entry.projectId === project.id);
    if (entries.length > 0) {
      toast({
        title: "Fehler",
        description: `Projekt kann nicht gelöscht werden. Es sind noch ${entries.length} Zeiteinträge vorhanden.`,
        variant: "destructive"
      });
      return;
    }

    actions.deleteProject(project.id);
    toast({
      title: "Erfolg",
      description: "Projekt wurde erfolgreich gelöscht."
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'on-hold': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'completed': return 'Abgeschlossen';
      case 'on-hold': return 'Pausiert';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projekte</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre Projekte und verfolgen Sie den Fortschritt</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Neues Projekt</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Projekt bearbeiten' : 'Neues Projekt'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Projektname *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Website Redesign"
                    required
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Projektbeschreibung..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientId">Kunde *</Label>
                  <Select value={formData.clientId} onValueChange={(value) => setFormData({...formData, clientId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kunde auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.filter(client => client.isActive).map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="completed">Abgeschlossen</SelectItem>
                      <SelectItem value="on-hold">Pausiert</SelectItem>
                      <SelectItem value="cancelled">Abgebrochen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="hourlyRate">Stundensatz *</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                    placeholder="85.00"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="currency">Währung</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="startDate">Startdatum</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">Enddatum</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Abbrechen
                </Button>
                <Button type="submit">
                  {editingProject ? 'Aktualisieren' : 'Hinzufügen'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Projekte suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="completed">Abgeschlossen</SelectItem>
            <SelectItem value="on-hold">Pausiert</SelectItem>
            <SelectItem value="cancelled">Abgebrochen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Keine Projekte gefunden' : 'Noch keine Projekte'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Versuchen Sie einen anderen Suchbegriff oder Filter.' 
                : 'Fügen Sie Ihr erstes Projekt hinzu, um loszulegen.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Erstes Projekt hinzufügen
              </Button>
            )}
          </div>
        ) : (
          filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-foreground mb-2">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-white ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(project)}
                      className="hover:bg-blue-100 dark:hover:bg-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(project)}
                      className="hover:bg-red-100 dark:hover:bg-red-900 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{getClientName(project.clientId)}</span>
                </div>
                
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span>Stundensatz</span>
                    </div>
                    <div className="font-semibold text-foreground">
                      {project.hourlyRate} {project.currency}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span>Gearbeitet</span>
                    </div>
                    <div className="font-semibold text-foreground">
                      {getTotalHours(project.id)}h
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>Start</span>
                    </div>
                    <div className="text-sm text-foreground">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString('de-DE') : '-'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Umsatz</div>
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      {getTotalRevenue(project.id)} {project.currency}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectList;
