import React from 'react';
import { Users, MapPin } from 'lucide-react';
import { useAppointmentStore } from '@/store/appointmentStore';
import { physicians, locations } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getAppointmentColor, STATUS_META } from '@/utils/calendarUtils';
import { AppointmentStatus } from '@/types';
import { cn } from '@/lib/utils';

const STATUSES = Object.keys(STATUS_META) as AppointmentStatus[];

const CalendarFilters: React.FC = () => {
  const {
    selectedPhysicianId,
    selectedLocationId,
    setSelectedPhysicianId,
    setSelectedLocationId
  } = useAppointmentStore();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pb-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Select
          value={selectedPhysicianId || 'all'}
          onValueChange={(value) => setSelectedPhysicianId(value === 'all' ? null : value)}
        >
          <SelectTrigger className="h-9 w-[200px]" aria-label="Filter by physician">
            <SelectValue placeholder="All Physicians" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Physicians</SelectItem>
            {physicians.map((physician) => (
              <SelectItem key={physician.id} value={physician.id}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
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

      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Select
          value={selectedLocationId || 'all'}
          onValueChange={(value) => setSelectedLocationId(value === 'all' ? null : value)}
        >
          <SelectTrigger className="h-9 w-[200px]" aria-label="Filter by location">
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

      <ul aria-label="Legend" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground xl:ml-auto">
        {STATUSES.map((status) => {
          const { label, icon: Icon } = STATUS_META[status];
          return (
            <li key={status} className="flex items-center gap-1.5">
              <span className={cn('flex h-4 w-4 items-center justify-center rounded-sm', getAppointmentColor(status))}>
                <Icon className="h-3 w-3" aria-hidden="true" />
              </span>
              {label}
            </li>
          );
        })}
        {selectedPhysicianId && (
          <li className="flex items-center gap-1.5">
            <span className="calendar-slot-unavailable h-4 w-4 rounded-sm border border-border" />
            Unavailable
          </li>
        )}
      </ul>
    </div>
  );
};

export default CalendarFilters;
