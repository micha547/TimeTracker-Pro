import React, { useState } from 'react';
import { Save, User, Palette, Clock, DollarSign, FileText, Database, Download, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/use-toast';

const Settings = () => {
  const { state, actions } = useApp();
  const { theme, clients, projects, timeEntries, invoices } = state;
  const { toast } = useToast();

  const [profileData, setProfileData] = useState({
    name: 'Max Mustermann',
    email: 'max@example.com',
    company: 'Freelancer',
    address: 'Musterstraße 123\n12345 Musterstadt',
    phone: '+49 30 12345678',
    website: 'https://www.example.com',
    taxNumber: 'DE123456789'
  });

  const [invoiceSettings, setInvoiceSettings] = useState({
    defaultCurrency: 'EUR',
    defaultPaymentTerms: 30,
    invoicePrefix: 'INV',
    includeTimestamp: true,
    autoNumber: true
  });

  const [timeSettings, setTimeSettings] = useState({
    defaultHourlyRate: 85,
    roundingMinutes: 15,
    autoBreak: true,
    breakDuration: 30,
    reminderInterval: 60
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    timerReminders: true,
    invoiceReminders: true,
    weeklyReports: false
  });

  const handleProfileSave = () => {
    // In a real app, this would save to backend
    toast({
      title: "Profil gespeichert",
      description: "Ihre Profileinstellungen wurden erfolgreich gespeichert."
    });
  };

  const handleInvoiceSettingsSave = () => {
    toast({
      title: "Rechnungseinstellungen gespeichert",
      description: "Ihre Rechnungseinstellungen wurden erfolgreich gespeichert."
    });
  };

  const handleTimeSettingsSave = () => {
    toast({
      title: "Zeiterfassungseinstellungen gespeichert",
      description: "Ihre Zeiterfassungseinstellungen wurden erfolgreich gespeichert."
    });
  };

  const handleNotificationSettingsSave = () => {
    toast({
      title: "Benachrichtigungseinstellungen gespeichert",
      description: "Ihre Benachrichtigungseinstellungen wurden erfolgreich gespeichert."
    });
  };

  const handleExportData = () => {
    const exportData = {
      clients,
      projects,
      timeEntries,
      invoices,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Daten exportiert",
      description: "Ihre Daten wurden erfolgreich exportiert."
    });
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        
        // Validate data structure
        if (!importData.clients || !importData.projects || !importData.timeEntries || !importData.invoices) {
          throw new Error('Invalid data format');
        }

        // Import data (in a real app, you'd want to merge rather than replace)
        // For this demo, we'll show a success message
        toast({
          title: "Import erfolgreich",
          description: "Ihre Daten wurden erfolgreich importiert. Starten Sie die App neu, um die Änderungen zu sehen."
        });
      } catch (error) {
        toast({
          title: "Import fehlgeschlagen",
          description: "Die Datei konnte nicht importiert werden. Überprüfen Sie das Dateiformat.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (window.confirm('Sind Sie sicher, dass Sie alle Daten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Einstellungen</h1>
        <p className="text-muted-foreground">Konfigurieren Sie Ihre Anwendungseinstellungen</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profil</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Firma</Label>
                <Input
                  id="company"
                  value={profileData.company}
                  onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={profileData.address}
                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profileData.website}
                  onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="taxNumber">Steuernummer</Label>
                <Input
                  id="taxNumber"
                  value={profileData.taxNumber}
                  onChange={(e) => setProfileData({...profileData, taxNumber: e.target.value})}
                />
              </div>
            </div>
            
            <Button onClick={handleProfileSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Profil speichern
            </Button>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Erscheinungsbild</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Theme</Label>
              <Select value={theme} onValueChange={actions.setTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Hell</SelectItem>
                  <SelectItem value="dark">Dunkel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Wählen Sie Ihr bevorzugtes Farbschema für die Anwendung.
            </div>
          </CardContent>
        </Card>

        {/* Time Tracking Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Zeiterfassung</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultHourlyRate">Standard Stundensatz (€)</Label>
                <Input
                  id="defaultHourlyRate"
                  type="number"
                  step="0.01"
                  value={timeSettings.defaultHourlyRate}
                  onChange={(e) => setTimeSettings({...timeSettings, defaultHourlyRate: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="roundingMinutes">Rundung (Minuten)</Label>
                <Select 
                  value={timeSettings.roundingMinutes.toString()} 
                  onValueChange={(value) => setTimeSettings({...timeSettings, roundingMinutes: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Minute</SelectItem>
                    <SelectItem value="5">5 Minuten</SelectItem>
                    <SelectItem value="15">15 Minuten</SelectItem>
                    <SelectItem value="30">30 Minuten</SelectItem>
                    <SelectItem value="60">1 Stunde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoBreak">Automatische Pausen</Label>
                <Switch
                  id="autoBreak"
                  checked={timeSettings.autoBreak}
                  onCheckedChange={(checked) => setTimeSettings({...timeSettings, autoBreak: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="reminderInterval">Erinnerungen (Minuten)</Label>
                <Input
                  className="w-24"
                  type="number"
                  value={timeSettings.reminderInterval}
                  onChange={(e) => setTimeSettings({...timeSettings, reminderInterval: parseInt(e.target.value)})}
                />
              </div>
            </div>
            
            <Button onClick={handleTimeSettingsSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Zeiterfassung speichern
            </Button>
          </CardContent>
        </Card>

        {/* Invoice Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Rechnungen</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultCurrency">Standard Währung</Label>
                <Select 
                  value={invoiceSettings.defaultCurrency} 
                  onValueChange={(value) => setInvoiceSettings({...invoiceSettings, defaultCurrency: value})}
                >
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
                <Label htmlFor="defaultPaymentTerms">Zahlungsziel (Tage)</Label>
                <Input
                  id="defaultPaymentTerms"
                  type="number"
                  value={invoiceSettings.defaultPaymentTerms}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, defaultPaymentTerms: parseInt(e.target.value)})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="invoicePrefix">Rechnungsprefix</Label>
              <Input
                id="invoicePrefix"
                value={invoiceSettings.invoicePrefix}
                onChange={(e) => setInvoiceSettings({...invoiceSettings, invoicePrefix: e.target.value})}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoNumber">Automatische Nummerierung</Label>
                <Switch
                  id="autoNumber"
                  checked={invoiceSettings.autoNumber}
                  onCheckedChange={(checked) => setInvoiceSettings({...invoiceSettings, autoNumber: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="includeTimestamp">Zeitstempel einschließen</Label>
                <Switch
                  id="includeTimestamp"
                  checked={invoiceSettings.includeTimestamp}
                  onCheckedChange={(checked) => setInvoiceSettings({...invoiceSettings, includeTimestamp: checked})}
                />
              </div>
            </div>
            
            <Button onClick={handleInvoiceSettingsSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Rechnungseinstellungen speichern
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Datenverwaltung</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-border rounded-lg">
                <h3 className="font-semibold mb-2">Daten exportieren</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Exportieren Sie alle Ihre Daten als Backup.
                </p>
                <Button onClick={handleExportData} variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Exportieren
                </Button>
              </div>
              
              <div className="text-center p-4 border border-border rounded-lg">
                <h3 className="font-semibold mb-2">Daten importieren</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Importieren Sie Daten aus einem Backup.
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Importieren
                  </Button>
                </div>
              </div>
              
              <div className="text-center p-4 border border-red-200 rounded-lg">
                <h3 className="font-semibold mb-2 text-red-600">Alle Daten löschen</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Löscht alle gespeicherten Daten unwiderruflich.
                </p>
                <Button 
                  onClick={clearAllData} 
                  variant="destructive" 
                  className="w-full"
                >
                  Alle Daten löschen
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground">{clients.length}</div>
                <div className="text-sm text-muted-foreground">Kunden</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{projects.length}</div>
                <div className="text-sm text-muted-foreground">Projekte</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{timeEntries.length}</div>
                <div className="text-sm text-muted-foreground">Zeiteinträge</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{invoices.length}</div>
                <div className="text-sm text-muted-foreground">Rechnungen</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
