import React from 'react';
import { Users, MapPin } from 'lucide-react';
import { useAppointmentStore } from '@/store/appointmentStore';
import { physicians, locations } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const CalendarFilters: React.FC = () => {
  const { 
    selectedPhysicianId, 
    selectedLocationId,
    setSelectedPhysicianId,
    setSelectedLocationId 
  } = useAppointmentStore();

  const selectedPhysician = physicians.find((p) => p.id === selectedPhysicianId);

  return (
    <div className="flex items-center gap-4 pb-4">
      {/* Physician filter */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <Select
          value={selectedPhysicianId || 'all'}
          onValueChange={(value) => setSelectedPhysicianId(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Physicians" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Physicians</SelectItem>
            {physicians.map((physician) => (
              <SelectItem key={physician.id} value={physician.id}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {physician.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span>{physician.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location filter */}
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Select
          value={selectedLocationId || 'all'}
          onValueChange={(value) => setSelectedLocationId(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected physician availability indicator */}
      {selectedPhysician && (
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded bg-calendar-unavailable border border-border" />
            <span className="text-muted-foreground">Unavailable</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded bg-card border border-border" />
            <span className="text-muted-foreground">Available</span>
          </div>
        </div>
      )}

      {/* Status legend */}
      <div className="flex items-center gap-3 ml-4 border-l border-border pl-4">
        <span className="text-xs text-muted-foreground">Status:</span>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded bg-status-confirmed-bg border-l-2 border-status-confirmed" />
          <span className="text-muted-foreground">Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded bg-status-pending-bg border-l-2 border-status-pending" />
          <span className="text-muted-foreground">Pending</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded bg-status-cancelled-bg border-l-2 border-status-cancelled" />
          <span className="text-muted-foreground">Cancelled</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarFilters;
