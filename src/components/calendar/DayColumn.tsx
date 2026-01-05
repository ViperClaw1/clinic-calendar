import React from 'react';
import { format, isSameDay, isToday } from 'date-fns';
import { useAppointmentStore } from '@/store/appointmentStore';
import { physicians } from '@/data/mockData';
import { generateTimeSlots, isPhysicianAvailableAtSlot, getSlotTop, getSlotHeight, formatTime } from '@/utils/calendarUtils';
import { Appointment } from '@/types';
import { cn } from '@/lib/utils';
import AppointmentCard from './AppointmentCard';

interface DayColumnProps {
  date: Date;
  appointments: Appointment[];
  showHeader?: boolean;
}

const DayColumn: React.FC<DayColumnProps> = ({ date, appointments, showHeader = true }) => {
  const { selectedPhysicianId, openSidebar } = useAppointmentStore();
  const timeSlots = generateTimeSlots();
  const selectedPhysician = physicians.find((p) => p.id === selectedPhysicianId);
  const isCurrentDay = isToday(date);

  const handleSlotClick = (time: string) => {
    if (selectedPhysician && !isPhysicianAvailableAtSlot(selectedPhysician, date, time)) {
      return;
    }
    
    openSidebar({
      date: format(date, 'yyyy-MM-dd'),
      startTime: time,
      physicianId: selectedPhysicianId || undefined,
    });
  };

  const handleDragOver = (e: React.DragEvent, time: string) => {
    e.preventDefault();
    if (selectedPhysician && !isPhysicianAvailableAtSlot(selectedPhysician, date, time)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, time: string) => {
    e.preventDefault();
    const appointmentId = e.dataTransfer.getData('appointmentId');
    if (appointmentId) {
      const { rescheduleAppointment } = useAppointmentStore.getState();
      rescheduleAppointment(appointmentId, format(date, 'yyyy-MM-dd'), time);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-w-[120px]">
      {showHeader && (
        <div 
          className={cn(
            "sticky top-0 z-10 bg-card border-b border-border p-2 text-center",
            isCurrentDay && "bg-primary/5"
          )}
        >
          <div className={cn(
            "text-xs font-medium text-muted-foreground uppercase",
            isCurrentDay && "text-primary"
          )}>
            {format(date, 'EEE')}
          </div>
          <div className={cn(
            "text-lg font-semibold",
            isCurrentDay && "text-primary"
          )}>
            {format(date, 'd')}
          </div>
        </div>
      )}
      
      <div className="relative flex-1">
        {/* Time slots background */}
        {timeSlots.map((time, index) => {
          const isUnavailable = selectedPhysician && !isPhysicianAvailableAtSlot(selectedPhysician, date, time);
          
          return (
            <div
              key={time}
              className={cn(
                "h-12 border-b border-border/50 transition-colors duration-150",
                isUnavailable 
                  ? "bg-calendar-unavailable cursor-not-allowed" 
                  : "calendar-slot hover:bg-calendar-slot-hover",
                index % 4 === 0 && "border-b-border"
              )}
              onClick={() => handleSlotClick(time)}
              onDragOver={(e) => handleDragOver(e, time)}
              onDrop={(e) => handleDrop(e, time)}
            />
          );
        })}
        
        {/* Appointments overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="absolute left-1 right-1 pointer-events-auto"
              style={{
                top: `${getSlotTop(appointment.startTime)}px`,
                height: `${getSlotHeight(appointment.duration)}px`,
              }}
            >
              <AppointmentCard appointment={appointment} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DayColumn;
