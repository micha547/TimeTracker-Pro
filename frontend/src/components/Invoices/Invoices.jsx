import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, FileText, Download, Eye, DollarSign, Calendar, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/use-toast';

const Invoices = () => {
  const { state, actions } = useApp();
  const { invoices, timeEntries, projects, clients } = state;
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [formData, setFormData] = useState({
    clientId: '',
    projectId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    selectedTimeEntries: [],
    customDescription: '',
    customAmount: ''
  });

  const filteredInvoices = invoices.filter(invoice => {
    const client = clients.find(c => c.id === invoice.clientId);
    const project = projects.find(p => p.id === invoice.projectId);
    
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get available time entries for invoice creation
  const availableTimeEntries = useMemo(() => {
    if (!formData.projectId) return [];
    
    // Get entries for selected project that are not already invoiced
    const invoicedEntryIds = new Set();
    invoices.forEach(invoice => {
      if (invoice.timeEntries) {
        invoice.timeEntries.forEach(entryId => invoicedEntryIds.add(entryId));
      }
    });
    
    return timeEntries
      .filter(entry => 
        entry.projectId === formData.projectId && 
        !invoicedEntryIds.has(entry.id)
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [formData.projectId, timeEntries, invoices]);

  const resetForm = () => {
    setFormData({
      clientId: '',
      projectId: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      selectedTimeEntries: [],
      customDescription: '',
      customAmount: ''
    });
    setEditingInvoice(null);
  };

  const handleOpenDialog = (invoice = null) => {
    if (invoice) {
      const project = projects.find(p => p.id === invoice.projectId);
      setFormData({
        clientId: invoice.clientId,
        projectId: invoice.projectId,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        selectedTimeEntries: invoice.timeEntries || [],
        customDescription: '',
        customAmount: ''
      });
      setEditingInvoice(invoice);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const calculateInvoiceData = () => {
    const selectedEntries = availableTimeEntries.filter(entry => 
      formData.selectedTimeEntries.includes(entry.id)
    );
    
    const project = projects.find(p => p.id === formData.projectId);
    if (!project) return { totalHours: 0, totalAmount: 0, entries: [] };
    
    const totalMinutes = selectedEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalHours = totalMinutes / 60;
    const totalAmount = totalHours * project.hourlyRate;
    
    return {
      totalHours: totalHours.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      entries: selectedEntries
    };
  };

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const existingNumbers = invoices
      .map(inv => inv.invoiceNumber)
      .filter(num => num.startsWith(`INV-${year}-`))
      .map(num => parseInt(num.split('-')[2]))
      .filter(num => !isNaN(num));
    
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    return `INV-${year}-${nextNumber.toString().padStart(3, '0')}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.projectId) {
      toast({
        title: "Fehler",
        description: "Kunde und Projekt sind Pflichtfelder.",
        variant: "destructive"
      });
      return;
    }

    if (formData.selectedTimeEntries.length === 0 && !formData.customAmount) {
      toast({
        title: "Fehler",
        description: "Wählen Sie Zeiteinträge aus oder geben Sie einen benutzerdefinierten Betrag ein.",
        variant: "destructive"
      });
      return;
    }

    const project = projects.find(p => p.id === formData.projectId);
    const invoiceData = calculateInvoiceData();
    
    const invoice = {
      clientId: formData.clientId,
      projectId: formData.projectId,
      invoiceNumber: editingInvoice ? editingInvoice.invoiceNumber : generateInvoiceNumber(),
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      totalHours: parseFloat(invoiceData.totalHours),
      totalAmount: formData.customAmount ? parseFloat(formData.customAmount) : parseFloat(invoiceData.totalAmount),
      currency: project.currency,
      status: editingInvoice ? editingInvoice.status : 'draft',
      timeEntries: formData.selectedTimeEntries,
      customDescription: formData.customDescription
    };

    if (editingInvoice) {
      actions.updateInvoice({ ...editingInvoice, ...invoice });
      toast({
        title: "Erfolg",
        description: "Rechnung wurde erfolgreich aktualisiert."
      });
    } else {
      actions.addInvoice(invoice);
      toast({
        title: "Erfolg",
        description: "Rechnung wurde erfolgreich erstellt."
      });
    }
    
    handleCloseDialog();
  };

  const handleDelete = (invoice) => {
    actions.deleteInvoice(invoice.id);
    toast({
      title: "Erfolg",
      description: "Rechnung wurde erfolgreich gelöscht."
    });
  };

  const handleStatusChange = (invoice, newStatus) => {
    actions.updateInvoice({ ...invoice, status: newStatus });
    toast({
      title: "Status geändert",
      description: `Rechnung wurde als "${getStatusLabel(newStatus)}" markiert.`
    });
  };

  const handlePreview = (invoice) => {
    setPreviewInvoice(invoice);
    setIsPreviewOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'sent': return 'bg-blue-500';
      case 'paid': return 'bg-green-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'sent': return 'Versendet';
      case 'paid': return 'Bezahlt';
      case 'overdue': return 'Überfällig';
      default: return status;
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unbekannter Kunde';
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unbekanntes Projekt';
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleExportPDF = (invoice) => {
    // Simulate PDF generation
    const client = clients.find(c => c.id === invoice.clientId);
    const project = projects.find(p => p.id === invoice.projectId);
    
    let content = `RECHNUNG\n\n`;
    content += `Rechnungsnummer: ${invoice.invoiceNumber}\n`;
    content += `Rechnungsdatum: ${new Date(invoice.issueDate).toLocaleDateString('de-DE')}\n`;
    content += `Fälligkeitsdatum: ${new Date(invoice.dueDate).toLocaleDateString('de-DE')}\n\n`;
    content += `KUNDE:\n${client?.name || 'Unbekannt'}\n`;
    if (client?.address) content += `${client.address}\n`;
    content += `\nPROJEKT: ${project?.name || 'Unbekannt'}\n\n`;
    content += `LEISTUNGEN:\n`;
    
    if (invoice.timeEntries && invoice.timeEntries.length > 0) {
      const entries = timeEntries.filter(entry => invoice.timeEntries.includes(entry.id));
      entries.forEach(entry => {
        content += `${new Date(entry.date).toLocaleDateString('de-DE')} - ${entry.description} - ${formatDuration(entry.duration)}\n`;
      });
    }
    
    content += `\nGESAMT: ${invoice.totalHours}h\n`;
    content += `BETRAG: €${invoice.totalAmount.toFixed(2)}\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rechnung_${invoice.invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Export erfolgreich",
      description: "Rechnung wurde als Textdatei exportiert."
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rechnungen</h1>
          <p className="text-muted-foreground">Erstellen und verwalten Sie Ihre Rechnungen</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Neue Rechnung</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInvoice ? 'Rechnung bearbeiten' : 'Neue Rechnung'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId">Kunde *</Label>
                  <Select 
                    value={formData.clientId} 
                    onValueChange={(value) => {
                      setFormData({...formData, clientId: value, projectId: '', selectedTimeEntries: []});
                    }}
                  >
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
                  <Label htmlFor="projectId">Projekt *</Label>
                  <Select 
                    value={formData.projectId} 
                    onValueChange={(value) => setFormData({...formData, projectId: value, selectedTimeEntries: []})}
                    disabled={!formData.clientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Projekt auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects
                        .filter(project => project.clientId === formData.clientId)
                        .map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="issueDate">Rechnungsdatum</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>
              </div>

              {/* Time Entries Selection */}
              {formData.projectId && availableTimeEntries.length > 0 && (
                <div>
                  <Label>Zeiteinträge auswählen</Label>
                  <div className="max-h-60 overflow-y-auto border rounded p-4 space-y-2">
                    {availableTimeEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                        <Checkbox
                          id={entry.id}
                          checked={formData.selectedTimeEntries.includes(entry.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                selectedTimeEntries: [...formData.selectedTimeEntries, entry.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                selectedTimeEntries: formData.selectedTimeEntries.filter(id => id !== entry.id)
                              });
                            }
                          }}
                        />
                        <label htmlFor={entry.id} className="flex-1 text-sm cursor-pointer">
                          <div className="font-medium">{entry.description}</div>
                          <div className="text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString('de-DE')} - {formatDuration(entry.duration)}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoice Summary */}
              {formData.selectedTimeEntries.length > 0 && (
                <div className="p-4 bg-accent/30 rounded-lg">
                  <h4 className="font-medium mb-2">Rechnungsübersicht</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Gesamtstunden:</span>
                      <span>{calculateInvoiceData().totalHours}h</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Gesamtbetrag:</span>
                      <span>€{calculateInvoiceData().totalAmount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Amount */}
              <div>
                <Label htmlFor="customAmount">Benutzerdefinierter Betrag (optional)</Label>
                <Input
                  id="customAmount"
                  type="number"
                  step="0.01"
                  value={formData.customAmount}
                  onChange={(e) => setFormData({...formData, customAmount: e.target.value})}
                  placeholder="Überschreibt den berechneten Betrag"
                />
              </div>

              <div>
                <Label htmlFor="customDescription">Zusätzliche Beschreibung</Label>
                <Textarea
                  id="customDescription"
                  value={formData.customDescription}
                  onChange={(e) => setFormData({...formData, customDescription: e.target.value})}
                  placeholder="Zusätzliche Informationen für die Rechnung..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Abbrechen
                </Button>
                <Button type="submit">
                  {editingInvoice ? 'Aktualisieren' : 'Erstellen'}
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
            placeholder="Rechnungen suchen..."
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
            <SelectItem value="draft">Entwurf</SelectItem>
            <SelectItem value="sent">Versendet</SelectItem>
            <SelectItem value="paid">Bezahlt</SelectItem>
            <SelectItem value="overdue">Überfällig</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredInvoices.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Keine Rechnungen gefunden' : 'Noch keine Rechnungen'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Versuchen Sie einen anderen Suchbegriff oder Filter.'
                : 'Erstellen Sie Ihre erste Rechnung, um loszulegen.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Erste Rechnung erstellen
              </Button>
            )}
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-foreground mb-1">
                      {invoice.invoiceNumber}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-white ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(invoice)}
                      className="hover:bg-blue-100 dark:hover:bg-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(invoice)}
                      className="hover:bg-green-100 dark:hover:bg-green-900"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(invoice)}
                      className="hover:bg-red-100 dark:hover:bg-red-900 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    <strong>Kunde:</strong> {getClientName(invoice.clientId)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Projekt:</strong> {getProjectName(invoice.projectId)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>Erstellt</span>
                    </div>
                    <div className="text-sm text-foreground">
                      {new Date(invoice.issueDate).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>Fällig</span>
                    </div>
                    <div className="text-sm text-foreground">
                      {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Stunden</div>
                    <div className="font-semibold text-foreground">
                      {invoice.totalHours}h
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span>Betrag</span>
                    </div>
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      €{invoice.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-2 border-t border-border">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportPDF(invoice)}
                      className="space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export</span>
                    </Button>
                  </div>
                  
                  {invoice.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(invoice, 'sent')}
                      className="bg-blue-500 hover:bg-blue-600 text-white space-x-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Senden</span>
                    </Button>
                  )}
                  
                  {invoice.status === 'sent' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(invoice, 'paid')}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Als bezahlt markieren
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rechnungsvorschau</DialogTitle>
          </DialogHeader>
          {previewInvoice && (
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold">RECHNUNG</h2>
                <p className="text-lg font-medium">{previewInvoice.invoiceNumber}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Rechnungssteller:</h3>
                  <div className="text-sm">
                    <p>Max Mustermann</p>
                    <p>Musterstraße 123</p>
                    <p>12345 Musterstadt</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Kunde:</h3>
                  <div className="text-sm">
                    <p>{getClientName(previewInvoice.clientId)}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Rechnungsdatum:</strong>
                  <p>{new Date(previewInvoice.issueDate).toLocaleDateString('de-DE')}</p>
                </div>
                <div>
                  <strong>Fälligkeitsdatum:</strong>
                  <p>{new Date(previewInvoice.dueDate).toLocaleDateString('de-DE')}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Projekt:</h3>
                <p>{getProjectName(previewInvoice.projectId)}</p>
              </div>
              
              {previewInvoice.timeEntries && previewInvoice.timeEntries.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Geleistete Arbeiten:</h3>
                  <div className="space-y-2">
                    {timeEntries
                      .filter(entry => previewInvoice.timeEntries.includes(entry.id))
                      .map((entry) => (
                        <div key={entry.id} className="flex justify-between items-center p-2 bg-accent/30 rounded">
                          <div>
                            <div className="text-sm font-medium">{entry.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString('de-DE')}
                            </div>
                          </div>
                          <div className="text-sm">
                            {formatDuration(entry.duration)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Gesamtbetrag:</span>
                  <span>€{previewInvoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Gesamtstunden:</span>
                  <span>{previewInvoice.totalHours}h</span>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => setIsPreviewOpen(false)}>
                  Schließen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
