import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Clock, Play, Square, Calendar, Filter } from 'lucide-react';
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

const TimeTracking = () => {
  const { state, actions } = useApp();
  const { timeEntries, projects, clients, activeTimer } = state;
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    projectId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    duration: ''
  });
  const [timerData, setTimerData] = useState({
    projectId: '',
    description: ''
  });

  // Filter time entries
  const filteredEntries = timeEntries
    .filter(entry => {
      const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = projectFilter === 'all' || entry.projectId === projectFilter;
      const matchesDate = dateFilter === 'all' || entry.date >= dateFilter;
      return matchesSearch && matchesProject && matchesDate;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unbekanntes Projekt';
  };

  const getClientName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 'Unbekannter Kunde';
    const client = clients.find(c => c.id === project.clientId);
    return client ? client.name : 'Unbekannter Kunde';
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const resetForm = () => {
    setFormData({
      projectId: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      duration: ''
    });
    setEditingEntry(null);
  };

  const resetTimerForm = () => {
    setTimerData({
      projectId: '',
      description: ''
    });
  };

  const handleOpenDialog = (entry = null) => {
    if (entry) {
      setFormData({
        projectId: entry.projectId,
        description: entry.description,
        date: entry.date,
        startTime: entry.startTime ? formatTime(entry.startTime) : '',
        endTime: entry.endTime ? formatTime(entry.endTime) : '',
        duration: Math.round(entry.duration).toString()
      });
      setEditingEntry(entry);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleOpenTimerDialog = () => {
    resetTimerForm();
    setIsTimerDialogOpen(true);
  };

  const handleCloseTimerDialog = () => {
    setIsTimerDialogOpen(false);
    resetTimerForm();
  };

  const calculateDurationFromTimes = (startTime, endTime, date) => {
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    return Math.round((end - start) / (1000 * 60)); // duration in minutes
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.description.trim()) {
      toast({
        title: "Fehler",
        description: "Projekt und Beschreibung sind Pflichtfelder.",
        variant: "destructive"
      });
      return;
    }

    let duration;
    if (formData.startTime && formData.endTime) {
      duration = calculateDurationFromTimes(formData.startTime, formData.endTime, formData.date);
      if (duration <= 0) {
        toast({
          title: "Fehler",
          description: "Endzeit muss nach der Startzeit liegen.",
          variant: "destructive"
        });
        return;
      }
    } else if (formData.duration) {
      duration = parseInt(formData.duration);
    } else {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie entweder Start-/Endzeit oder die Dauer ein.",
        variant: "destructive"
      });
      return;
    }

    const entryData = {
      projectId: formData.projectId,
      description: formData.description,
      date: formData.date,
      duration: duration,
      isManual: true,
      startTime: formData.startTime ? new Date(`${formData.date}T${formData.startTime}`).toISOString() : null,
      endTime: formData.endTime ? new Date(`${formData.date}T${formData.endTime}`).toISOString() : null
    };

    if (editingEntry) {
      actions.updateTimeEntry({ ...editingEntry, ...entryData });
      toast({
        title: "Erfolg",
        description: "Zeiteintrag wurde erfolgreich aktualisiert."
      });
    } else {
      actions.addTimeEntry(entryData);
      toast({
        title: "Erfolg",
        description: "Zeiteintrag wurde erfolgreich hinzugefügt."
      });
    }
    
    handleCloseDialog();
  };

  const handleStartTimer = (e) => {
    e.preventDefault();
    
    if (!timerData.projectId || !timerData.description.trim()) {
      toast({
        title: "Fehler",
        description: "Projekt und Beschreibung sind Pflichtfelder.",
        variant: "destructive"
      });
      return;
    }

    actions.startTimer(timerData.projectId, timerData.description);
    toast({
      title: "Timer gestartet",
      description: "Die Zeiterfassung läuft."
    });
    handleCloseTimerDialog();
  };

  const handleStopTimer = () => {
    actions.stopTimer();
    toast({
      title: "Timer gestoppt",
      description: "Die Zeit wurde erfolgreich erfasst."
    });
  };

  const handleDelete = (entry) => {
    actions.deleteTimeEntry(entry.id);
    toast({
      title: "Erfolg",
      description: "Zeiteintrag wurde erfolgreich gelöscht."
    });
  };

  // Get date filter options
  const getDateFilterOptions = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    return [
      { value: 'all', label: 'Alle Zeiten' },
      { value: today.toISOString().split('T')[0], label: 'Heute' },
      { value: yesterday.toISOString().split('T')[0], label: 'Gestern' },
      { value: weekAgo.toISOString().split('T')[0], label: 'Letzte 7 Tage' },
      { value: monthAgo.toISOString().split('T')[0], label: 'Letzte 30 Tage' }
    ];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Zeiterfassung</h1>
          <p className="text-muted-foreground">Erfassen und verwalten Sie Ihre Arbeitszeit</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isTimerDialogOpen} onOpenChange={setIsTimerDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleOpenTimerDialog}
                disabled={!!activeTimer}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Timer starten</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Timer starten</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleStartTimer} className="space-y-4">
                <div>
                  <Label htmlFor="timerProjectId">Projekt *</Label>
                  <Select value={timerData.projectId} onValueChange={(value) => setTimerData({...timerData, projectId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Projekt auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.filter(project => project.status === 'active').map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} - {getClientName(project.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timerDescription">Beschreibung *</Label>
                  <Input
                    id="timerDescription"
                    value={timerData.description}
                    onChange={(e) => setTimerData({...timerData, description: e.target.value})}
                    placeholder="Was arbeiten Sie gerade?"
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseTimerDialog}>
                    Abbrechen
                  </Button>
                  <Button type="submit">
                    Timer starten
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => handleOpenDialog()}
                variant="outline"
                className="space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Manuell hinzufügen</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? 'Zeiteintrag bearbeiten' : 'Neuer Zeiteintrag'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="projectId">Projekt *</Label>
                    <Select value={formData.projectId} onValueChange={(value) => setFormData({...formData, projectId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Projekt auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name} - {getClientName(project.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="description">Beschreibung *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Beschreibung der geleisteten Arbeit..."
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date">Datum</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Dauer (Minuten)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      placeholder="120"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="startTime">Startzeit (optional)</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endTime">Endzeit (optional)</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  <strong>Hinweis:</strong> Sie können entweder die Dauer in Minuten eingeben ODER Start- und Endzeit. 
                  Bei Eingabe von Start- und Endzeit wird die Dauer automatisch berechnet.
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Abbrechen
                  </Button>
                  <Button type="submit">
                    {editingEntry ? 'Aktualisieren' : 'Hinzufügen'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Timer */}
      {activeTimer && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    Timer läuft - {activeTimer.description}
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Projekt: {getProjectName(activeTimer.projectId)}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleStopTimer}
                className="bg-red-500 hover:bg-red-600 text-white space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>Timer stoppen</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Zeiteinträge suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Projekt filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Projekte</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Zeitraum filtern" />
          </SelectTrigger>
          <SelectContent>
            {getDateFilterOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Zeiteinträge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Keine Zeiteinträge gefunden
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || projectFilter !== 'all' || dateFilter !== 'all'
                    ? 'Versuchen Sie einen anderen Filter oder Suchbegriff.'
                    : 'Starten Sie einen Timer oder fügen Sie manuell Zeit hinzu.'
                  }
                </p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-foreground">
                        {entry.description}
                      </h4>
                      <Badge variant={entry.isManual ? "outline" : "default"}>
                        {entry.isManual ? 'Manuell' : 'Timer'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{getProjectName(entry.projectId)}</span>
                      <span>•</span>
                      <span>{getClientName(entry.projectId)}</span>
                      <span>•</span>
                      <span>{new Date(entry.date).toLocaleDateString('de-DE')}</span>
                      {entry.startTime && entry.endTime && (
                        <>
                          <span>•</span>
                          <span>{formatTime(entry.startTime)} - {formatTime(entry.endTime)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        {formatDuration(entry.duration)}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(entry)}
                        className="hover:bg-blue-100 dark:hover:bg-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry)}
                        className="hover:bg-red-100 dark:hover:bg-red-900 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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

export default TimeTracking;
