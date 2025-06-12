import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/use-toast';

const ClientList = () => {
  const { state, actions } = useApp();
  const { clients, projects } = state;
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    isActive: true
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProjectCount = (clientId) => {
    return projects.filter(project => project.clientId === clientId).length;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      isActive: true
    });
    setEditingClient(null);
  };

  const handleOpenDialog = (client = null) => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        address: client.address || '',
        isActive: client.isActive
      });
      setEditingClient(client);
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
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Fehler",
        description: "Name und E-Mail sind Pflichtfelder.",
        variant: "destructive"
      });
      return;
    }

    if (editingClient) {
      actions.updateClient({ ...editingClient, ...formData });
      toast({
        title: "Erfolg",
        description: "Kunde wurde erfolgreich aktualisiert."
      });
    } else {
      actions.addClient(formData);
      toast({
        title: "Erfolg",
        description: "Kunde wurde erfolgreich hinzugefügt."
      });
    }
    
    handleCloseDialog();
  };

  const handleDelete = (client) => {
    const projectCount = getProjectCount(client.id);
    if (projectCount > 0) {
      toast({
        title: "Fehler",
        description: `Kunde kann nicht gelöscht werden. Es sind noch ${projectCount} Projekte zugeordnet.`,
        variant: "destructive"
      });
      return;
    }

    actions.deleteClient(client.id);
    toast({
      title: "Erfolg",
      description: "Kunde wurde erfolgreich gelöscht."
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kunden</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre Kunden und deren Informationen</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Neuer Kunde</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Kunde bearbeiten' : 'Neuer Kunde'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Firmenname oder Name"
                    required
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="mail@example.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+49 30 12345678"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                  <Label htmlFor="isActive">Aktiver Kunde</Label>
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Straße, PLZ Stadt"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Abbrechen
                </Button>
                <Button type="submit">
                  {editingClient ? 'Aktualisieren' : 'Hinzufügen'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Kunden suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm ? 'Keine Kunden gefunden' : 'Noch keine Kunden'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Versuchen Sie einen anderen Suchbegriff.' 
                : 'Fügen Sie Ihren ersten Kunden hinzu, um loszulegen.'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Ersten Kunden hinzufügen
              </Button>
            )}
          </div>
        ) : (
          filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {client.name}
                    </CardTitle>
                    <Badge variant={client.isActive ? "default" : "secondary"} className="mt-1">
                      {client.isActive ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(client)}
                      className="hover:bg-blue-100 dark:hover:bg-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(client)}
                      className="hover:bg-red-100 dark:hover:bg-red-900 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                  
                  {client.phone && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  
                  {client.address && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-2">{client.address}</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Projekte:</span>
                    <Badge variant="outline">
                      {getProjectCount(client.id)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Seit:</span>
                    <span className="text-foreground">
                      {new Date(client.createdAt).toLocaleDateString('de-DE')}
                    </span>
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

export default ClientList;
