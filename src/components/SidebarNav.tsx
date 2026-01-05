import React from 'react';
import { CalendarDays, Users, MapPin, BarChart3, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  activeItem?: string;
  onItemClick?: (item: string) => void;
}

const navItems = [
  { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
  { id: 'patients', icon: Users, label: 'Patients' },
  { id: 'locations', icon: MapPin, label: 'Locations' },
  { id: 'reports', icon: BarChart3, label: 'Reports' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

const SidebarNav: React.FC<SidebarNavProps> = ({ activeItem = 'calendar', onItemClick }) => {
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">Prompt</h1>
            <p className="text-xs text-muted-foreground">Scheduling</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onItemClick?.(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  activeItem === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">AC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Admin Clinic</p>
            <p className="text-xs text-muted-foreground truncate">admin@clinic.com</p>
          </div>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SidebarNav;
