import React from 'react';
import { Clock, DollarSign, Users, Briefcase, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useApp } from '../../context/AppContext';

const DashboardStats = () => {
  const { state } = useApp();
  const { clients, projects, timeEntries, invoices } = state;

  // Calculate statistics
  const activeClients = clients.filter(client => client.isActive).length;
  const activeProjects = projects.filter(project => project.status === 'active').length;
  
  // Today's time
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = timeEntries.filter(entry => entry.date === today);
  const todayMinutes = todayEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const todayHours = (todayMinutes / 60).toFixed(1);
  
  // This week's time
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const weekEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= startOfWeek && entryDate <= endOfWeek;
  });
  const weekMinutes = weekEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const weekHours = (weekMinutes / 60).toFixed(1);
  
  // Revenue calculation
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const unpaidInvoices = invoices.filter(invoice => invoice.status !== 'paid');
  const pendingRevenue = unpaidInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  const stats = [
    {
      title: 'Aktive Kunden',
      value: activeClients,
      icon: Users,
      color: 'bg-blue-500',
      change: '+2 diese Woche',
      changeType: 'positive'
    },
    {
      title: 'Laufende Projekte',
      value: activeProjects,
      icon: Briefcase,
      color: 'bg-green-500',
      change: '+1 neues Projekt',
      changeType: 'positive'
    },
    {
      title: 'Heute gearbeitet',
      value: `${todayHours}h`,
      icon: Clock,
      color: 'bg-orange-500',
      change: `${weekHours}h diese Woche`,
      changeType: 'neutral'
    },
    {
      title: 'Gesamtumsatz',
      value: `€${totalRevenue.toLocaleString('de-DE')}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      change: `€${pendingRevenue.toLocaleString('de-DE')} ausstehend`,
      changeType: pendingRevenue > 0 ? 'warning' : 'positive'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <Badge 
                  variant={stat.changeType === 'positive' ? 'default' : stat.changeType === 'warning' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {stat.change}
                </Badge>
              </div>
            </CardContent>
            
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-transparent to-primary/5 rounded-bl-3xl"></div>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
