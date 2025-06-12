import React, { useState, useMemo } from 'react';
import { BarChart3, Download, Calendar, DollarSign, Clock, TrendingUp, FileText, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/use-toast';

const Reports = () => {
  const { state } = useApp();
  const { timeEntries, projects, clients } = state;
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState('month');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Calculate date ranges
  const getDateRange = () => {
    const today = new Date();
    let start, end;

    switch (dateRange) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        break;
      case 'week':
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      case 'custom':
        start = startDate ? new Date(startDate) : new Date();
        end = endDate ? new Date(endDate) : new Date();
        break;
      default:
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    return { start, end };
  };

  // Filter time entries based on criteria
  const filteredEntries = useMemo(() => {
    const { start, end } = getDateRange();
    
    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const dateMatch = entryDate >= start && entryDate <= end;
      
      const project = projects.find(p => p.id === entry.projectId);
      const clientMatch = selectedClient === 'all' || (project && project.clientId === selectedClient);
      const projectMatch = selectedProject === 'all' || entry.projectId === selectedProject;
      
      return dateMatch && clientMatch && projectMatch;
    });
  }, [timeEntries, projects, dateRange, selectedClient, selectedProject, startDate, endDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalMinutes = filteredEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalHours = totalMinutes / 60;
    
    const projectStats = {};
    const clientStats = {};
    let totalRevenue = 0;

    filteredEntries.forEach(entry => {
      const project = projects.find(p => p.id === entry.projectId);
      if (!project) return;

      const client = clients.find(c => c.id === project.clientId);
      const entryRevenue = (entry.duration / 60) * project.hourlyRate;
      totalRevenue += entryRevenue;

      // Project statistics
      if (!projectStats[entry.projectId]) {
        projectStats[entry.projectId] = {
          name: project.name,
          clientName: client?.name || 'Unknown',
          totalMinutes: 0,
          totalRevenue: 0,
          entryCount: 0
        };
      }
      projectStats[entry.projectId].totalMinutes += entry.duration;
      projectStats[entry.projectId].totalRevenue += entryRevenue;
      projectStats[entry.projectId].entryCount += 1;

      // Client statistics
      const clientId = project.clientId;
      if (!clientStats[clientId]) {
        clientStats[clientId] = {
          name: client?.name || 'Unknown',
          totalMinutes: 0,
          totalRevenue: 0,
          projectCount: new Set()
        };
      }
      clientStats[clientId].totalMinutes += entry.duration;
      clientStats[clientId].totalRevenue += entryRevenue;
      clientStats[clientId].projectCount.add(entry.projectId);
    });

    // Convert project count sets to numbers
    Object.values(clientStats).forEach(stat => {
      stat.projectCount = stat.projectCount.size;
    });

    return {
      totalHours: totalHours.toFixed(1),
      totalRevenue: totalRevenue.toFixed(2),
      entryCount: filteredEntries.length,
      avgHoursPerDay: totalHours > 0 ? (totalHours / Math.max(1, Math.ceil((getDateRange().end - getDateRange().start) / (1000 * 60 * 60 * 24)))).toFixed(1) : '0',
      projectStats: Object.values(projectStats).sort((a, b) => b.totalMinutes - a.totalMinutes),
      clientStats: Object.values(clientStats).sort((a, b) => b.totalMinutes - a.totalMinutes)
    };
  }, [filteredEntries, projects, clients, getDateRange]);

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleExport = (format) => {
    let content = '';
    let filename = '';
    let mimeType = '';

    const { start, end } = getDateRange();
    const dateRangeStr = `${start.toLocaleDateString('de-DE')} bis ${end.toLocaleDateString('de-DE')}`;

    if (format === 'csv') {
      // CSV Export
      const headers = ['Datum', 'Projekt', 'Kunde', 'Beschreibung', 'Dauer (Minuten)', 'Dauer (Stunden)', 'Stundensatz', 'Umsatz'];
      const rows = filteredEntries.map(entry => {
        const project = projects.find(p => p.id === entry.projectId);
        const client = clients.find(c => c.id === project?.clientId);
        const revenue = ((entry.duration / 60) * (project?.hourlyRate || 0)).toFixed(2);
        
        return [
          new Date(entry.date).toLocaleDateString('de-DE'),
          project?.name || 'Unknown',
          client?.name || 'Unknown',
          entry.description.replace(/,/g, ';'), // Replace commas to avoid CSV issues
          entry.duration,
          (entry.duration / 60).toFixed(2),
          project?.hourlyRate || 0,
          revenue
        ];
      });

      content = [headers, ...rows].map(row => row.join(',')).join('\n');
      filename = `timetracker-report-${dateRangeStr.replace(/\./g, '-').replace(/ /g, '_')}.csv`;
      mimeType = 'text/csv';
    } else if (format === 'txt') {
      // Text Export
      content = `ZEITERFASSUNGS-BERICHT\n`;
      content += `======================\n\n`;
      content += `Zeitraum: ${dateRangeStr}\n`;
      content += `Erstellt am: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}\n\n`;
      
      content += `ÜBERSICHT\n`;
      content += `---------\n`;
      content += `Gesamtstunden: ${stats.totalHours}h\n`;
      content += `Gesamtumsatz: €${stats.totalRevenue}\n`;
      content += `Einträge: ${stats.entryCount}\n`;
      content += `Durchschnitt pro Tag: ${stats.avgHoursPerDay}h\n\n`;
      
      content += `DETAILLIERTE ZEITEINTRÄGE\n`;
      content += `-------------------------\n`;
      filteredEntries.forEach(entry => {
        const project = projects.find(p => p.id === entry.projectId);
        const client = clients.find(c => c.id === project?.clientId);
        const revenue = ((entry.duration / 60) * (project?.hourlyRate || 0)).toFixed(2);
        
        content += `${new Date(entry.date).toLocaleDateString('de-DE')} | ${formatDuration(entry.duration)} | €${revenue}\n`;
        content += `  Projekt: ${project?.name || 'Unknown'}\n`;
        content += `  Kunde: ${client?.name || 'Unknown'}\n`;
        content += `  Beschreibung: ${entry.description}\n\n`;
      });

      filename = `timetracker-report-${dateRangeStr.replace(/\./g, '-').replace(/ /g, '_')}.txt`;
      mimeType = 'text/plain';
    }

    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Export erfolgreich",
      description: `Bericht wurde als ${format.toUpperCase()} exportiert.`
    });
  };

  const getRangeName = () => {
    switch (dateRange) {
      case 'today': return 'Heute';
      case 'week': return 'Diese Woche';
      case 'month': return 'Dieser Monat';
      case 'year': return 'Dieses Jahr';
      case 'custom': return 'Benutzerdefiniert';
      default: return 'Dieser Monat';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Berichte</h1>
          <p className="text-muted-foreground">Analysieren Sie Ihre Arbeitszeit und Umsätze</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => handleExport('csv')}
            variant="outline"
            className="space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>CSV Export</span>
          </Button>
          <Button
            onClick={() => handleExport('txt')}
            variant="outline"
            className="space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Text Export</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filter</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Zeitraum</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Heute</SelectItem>
                  <SelectItem value="week">Diese Woche</SelectItem>
                  <SelectItem value="month">Dieser Monat</SelectItem>
                  <SelectItem value="year">Dieses Jahr</SelectItem>
                  <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Von</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Bis</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Kunde</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Kunden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kunden</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Projekt</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Projekte" />
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamtstunden</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalHours}h</p>
                <p className="text-xs text-muted-foreground mt-1">{getRangeName()}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamtumsatz</p>
                <p className="text-2xl font-bold text-foreground">€{stats.totalRevenue}</p>
                <p className="text-xs text-muted-foreground mt-1">{getRangeName()}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Zeiteinträge</p>
                <p className="text-2xl font-bold text-foreground">{stats.entryCount}</p>
                <p className="text-xs text-muted-foreground mt-1">{getRangeName()}</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ø Stunden/Tag</p>
                <p className="text-2xl font-bold text-foreground">{stats.avgHoursPerDay}h</p>
                <p className="text-xs text-muted-foreground mt-1">{getRangeName()}</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Projekte - Top Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.projectStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Keine Daten für den ausgewählten Zeitraum.
                </p>
              ) : (
                stats.projectStats.slice(0, 10).map((project, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">{project.clientName}</p>
                      <p className="text-xs text-muted-foreground">{project.entryCount} Einträge</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        {formatDuration(project.totalMinutes)}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        €{project.totalRevenue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Kunden - Top Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.clientStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Keine Daten für den ausgewählten Zeitraum.
                </p>
              ) : (
                stats.clientStats.slice(0, 10).map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{client.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {client.projectCount} Projekt{client.projectCount !== 1 ? 'e' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        {formatDuration(client.totalMinutes)}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        €{client.totalRevenue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
