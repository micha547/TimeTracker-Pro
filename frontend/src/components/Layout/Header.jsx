import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useApp } from '../../context/AppContext';

const Header = () => {
  const { state } = useApp();
  const { activeTimer } = state;

  const formatTime = (startTime) => {
    if (!startTime) return '00:00:00';
    
    const now = new Date();
    const start = new Date(startTime);
    const diff = now - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const [currentTime, setCurrentTime] = React.useState(
    activeTimer ? formatTime(activeTimer.startTime) : '00:00:00'
  );

  React.useEffect(() => {
    if (activeTimer) {
      const interval = setInterval(() => {
        setCurrentTime(formatTime(activeTimer.startTime));
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      setCurrentTime('00:00:00');
    }
  }, [activeTimer]);

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between shadow-sm">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Suchen..." 
            className="w-80 pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Center Section - Active Timer */}
      {activeTimer && (
        <div className="flex items-center space-x-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-6 py-2 rounded-full border border-green-200 dark:border-green-800">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-green-600 dark:text-green-400">
              {currentTime}
            </div>
            <div className="text-xs text-muted-foreground">
              {activeTimer.description || 'Timer läuft...'}
            </div>
          </div>
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="relative transition-all duration-200 hover:transform hover:scale-110">
          <Bell className="w-5 h-5" />
          <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
            3
          </Badge>
        </Button>
        
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-accent/50 hover:bg-accent transition-all duration-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm">
            <div className="font-medium text-foreground">Max Mustermann</div>
            <div className="text-muted-foreground">Freelancer</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
