import React from 'react';
import { CalendarDays, Users, MapPin, BarChart3, Settings, LogOut } from 'lucide-react';
import { signOut, useMembership, useSession } from '@/api/hooks';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  activeItem?: string;
  onItemClick?: (item: string) => void;
}

const navItems = [
  { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
  { id: 'physicians', icon: Users, label: 'Physicians' },
  { id: 'locations', icon: MapPin, label: 'Locations' },
  { id: 'reports', icon: BarChart3, label: 'Reports' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

const SidebarNav: React.FC<SidebarNavProps> = ({ activeItem = 'calendar', onItemClick }) => {
  const session = useSession();
  const { data: membership } = useMembership(session?.user.id);
  const email = session?.user.email ?? '';

  return (
    // Below md: bottom tab bar. md+: left rail, expanded at lg.
    <aside className="order-last flex w-full flex-shrink-0 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:order-none md:sticky md:top-0 md:h-screen md:w-16 md:flex-col md:border-r md:border-t-0 md:pb-0 lg:w-64">
      {/* Logo */}
      <div className="hidden border-b border-border p-3 md:block lg:p-6">
        <div className="flex items-center justify-center gap-3 lg:justify-start">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
            <CalendarDays className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <div className="sr-only lg:not-sr-only">
            <h1 className="text-lg font-bold text-foreground">CarePoint</h1>
            <p className="text-xs text-muted-foreground">Scheduling</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Main" className="flex-1 p-1 md:p-2 lg:p-4">
        <ul className="flex gap-1 md:block md:space-y-1">
          {navItems.map((item) => (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                title={item.label}
                aria-current={activeItem === item.id ? 'page' : undefined}
                onClick={() => onItemClick?.(item.id)}
                className={cn(
                  "flex w-full items-center justify-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:justify-start lg:px-4",
                  activeItem === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only lg:not-sr-only">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="flex items-center border-l border-border p-1 md:block md:border-l-0 md:border-t md:p-2 lg:p-4">
        <div className="flex items-center justify-center gap-3 lg:px-2">
          <div className="hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted lg:flex">
            <span className="text-sm font-medium text-muted-foreground">{email.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="truncate text-sm font-medium text-foreground">{email}</p>
            <p className="truncate text-xs capitalize text-muted-foreground">{membership?.role}</p>
          </div>
          <button
            type="button"
            aria-label="Log out"
            onClick={() => signOut()}
            className="rounded-md p-3 text-muted-foreground md:p-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SidebarNav;
