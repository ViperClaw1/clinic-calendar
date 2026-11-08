import React, { useState } from 'react';
import { Appointment } from '@/types';
import { useAppointmentStore } from '@/store/appointmentStore';
import { patients, physicians } from '@/data/mockData';
import { formatTime, getEndTime, getAppointmentColor, STATUS_META } from '@/utils/calendarUtils';
import { cn } from '@/lib/utils';

interface AppointmentCardProps {
  appointment: Appointment;
  compact?: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, compact = false }) => {
  const { openSidebar } = useAppointmentStore();
  const [isDragging, setIsDragging] = useState(false);
  const patient = patients.find((p) => p.id === appointment.patientId);
  const physician = physicians.find((p) => p.id === appointment.physicianId);
  const { label: statusLabel, icon: StatusIcon } = STATUS_META[appointment.status];

  const patientName = patient?.name || 'Unknown patient';
  const start = formatTime(appointment.startTime);
  const timeRange = `${start} – ${formatTime(getEndTime(appointment.startTime, appointment.duration))}`;
  const description = [patientName, timeRange, appointment.type, statusLabel, physician?.name]
    .filter(Boolean)
    .join(', ');

  const interactionProps = {
    role: 'button',
    tabIndex: 0,
    'aria-label': description,
    title: description,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      openSidebar(appointment);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openSidebar(appointment);
      }
    },
  };

  const nameClass = cn('truncate font-medium', appointment.status === 'cancelled' && 'line-through');
  const focusClass = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  // Month cells have no drop targets, so the compact chip is not draggable.
  if (compact) {
    return (
      <div
        {...interactionProps}
        className={cn(
          'flex items-center gap-1 rounded border-l-2 px-1.5 py-0.5 text-xs cursor-pointer transition-[filter] hover:brightness-95',
          focusClass,
          getAppointmentColor(appointment.status)
        )}
      >
        <StatusIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className={nameClass}>{patientName}</span>
        <span className="ml-auto hidden shrink-0 opacity-80 xl:inline">{start}</span>
      </div>
    );
  }

  return (
    <div
      {...interactionProps}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('appointmentId', appointment.id);
        e.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
      className={cn(
        'h-full overflow-hidden rounded border-l-4 px-1.5 text-xs cursor-pointer transition-[filter,opacity] hover:brightness-95',
        appointment.duration === 15 ? 'flex items-center' : 'py-1',
        focusClass,
        isDragging && 'opacity-50',
        getAppointmentColor(appointment.status)
      )}
    >
      {/* Show only as many lines as the card's height can hold */}
      <div className="flex min-w-0 items-center gap-1">
        <StatusIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className={nameClass}>{patientName}</span>
        {appointment.duration === 15 && (
          <span className="ml-auto hidden shrink-0 opacity-80 2xl:inline">{start}</span>
        )}
      </div>
      {appointment.duration >= 30 && <div className="truncate opacity-80">{timeRange}</div>}
      {appointment.duration >= 45 && <div className="truncate opacity-80">{appointment.type}</div>}
      {appointment.duration >= 60 && physician && <div className="truncate opacity-80">{physician.name}</div>}
    </div>
  );
};

export default AppointmentCard;
