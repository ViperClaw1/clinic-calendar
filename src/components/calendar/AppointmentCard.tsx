import React from 'react';
import { Appointment } from '@/types';
import { useAppointmentStore } from '@/store/appointmentStore';
import { patients, physicians } from '@/data/mockData';
import { formatTime, getEndTime, getAppointmentColor } from '@/utils/calendarUtils';
import { cn } from '@/lib/utils';

interface AppointmentCardProps {
  appointment: Appointment;
  compact?: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, compact = false }) => {
  const { openSidebar } = useAppointmentStore();
  const patient = patients.find((p) => p.id === appointment.patientId);
  const physician = physicians.find((p) => p.id === appointment.physicianId);
  const colorClass = getAppointmentColor(appointment.status);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('appointmentId', appointment.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openSidebar(appointment);
  };

  if (compact) {
    return (
      <div
        className={cn(
          "px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-all hover:scale-[1.02] border-l-2",
          colorClass
        )}
        onClick={handleClick}
        draggable
        onDragStart={handleDragStart}
      >
        <div className="truncate">{patient?.name || 'Unknown'}</div>
        <div className="text-[10px] opacity-75">
          {formatTime(appointment.startTime)}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-full px-2 py-1 rounded-lg cursor-pointer transition-all hover:shadow-md border-l-4 overflow-hidden",
        colorClass
      )}
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex flex-col h-full">
        <div className="font-medium text-sm truncate">
          {patient?.name || 'Unknown Patient'}
        </div>
        <div className="text-xs opacity-80">
          {formatTime(appointment.startTime)} - {formatTime(getEndTime(appointment.startTime, appointment.duration))}
        </div>
        {appointment.duration >= 30 && (
          <div className="text-xs opacity-70 truncate mt-0.5">
            {appointment.type}
          </div>
        )}
        {appointment.duration >= 45 && physician && (
          <div className="text-xs opacity-60 truncate">
            {physician.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;
