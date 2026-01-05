import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { useAppointmentStore } from '@/store/appointmentStore';
import { getAppointmentsForDate } from '@/utils/calendarUtils';
import AppointmentCard from './AppointmentCard';
import { cn } from '@/lib/utils';

const MonthView: React.FC = () => {
  const { selectedDate, appointments, selectedPhysicianId, setSelectedDate, setCalendarView } = useAppointmentStore();
  
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setCalendarView('day');
  };

  return (
    <div className="h-full bg-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-medium text-muted-foreground uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const dayAppointments = getAppointmentsForDate(appointments, day, selectedPhysicianId);
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-b border-r border-border p-1 min-h-[100px] cursor-pointer transition-colors",
                !isCurrentMonth && "bg-muted/30",
                isSelected && "bg-primary/5",
                "hover:bg-muted/50"
              )}
              onClick={() => handleDayClick(day)}
            >
              <div className="flex items-center justify-center mb-1">
                <span
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium",
                    isTodayDate && "bg-primary text-primary-foreground",
                    !isTodayDate && !isCurrentMonth && "text-muted-foreground",
                    !isTodayDate && isCurrentMonth && "text-foreground"
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="space-y-0.5 overflow-hidden">
                {dayAppointments.slice(0, 3).map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    compact
                  />
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayAppointments.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
