import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { useAppointmentStore } from '@/store/appointmentStore';
import { useVisibleAppointments } from '@/api/hooks';
import { getAppointmentsForDate } from '@/utils/calendarUtils';
import AppointmentCard from './AppointmentCard';
import { cn } from '@/lib/utils';

const MAX_VISIBLE = 3;
const focusClass = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const MonthView: React.FC = () => {
  const { selectedDate, selectedPhysicianId, selectedLocationId, setSelectedDate, setCalendarView } = useAppointmentStore();
  const appointments = useVisibleAppointments();

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
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 overflow-auto scrollbar-thin">
        {days.map((day) => {
          const dayAppointments = getAppointmentsForDate(appointments, day, selectedPhysicianId, selectedLocationId);
          const hiddenCount = dayAppointments.length - MAX_VISIBLE;
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const count = dayAppointments.length;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[104px] cursor-pointer border-b border-r border-border p-1 transition-colors hover:bg-muted/50',
                !isCurrentMonth && 'bg-muted/30',
                isSelected && 'bg-primary/5'
              )}
              onClick={() => handleDayClick(day)}
            >
              <div className="mb-1 flex justify-center">
                {/* No handler of its own: the click bubbles to the cell, including from Enter/Space */}
                <button
                  type="button"
                  aria-current={isTodayDate ? 'date' : undefined}
                  aria-label={`${format(day, 'EEEE, MMMM d')}, ${count} ${count === 1 ? 'appointment' : 'appointments'}`}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                    focusClass,
                    isTodayDate && 'bg-primary text-primary-foreground',
                    !isTodayDate && !isCurrentMonth && 'text-muted-foreground',
                    !isTodayDate && isCurrentMonth && 'text-foreground'
                  )}
                >
                  {format(day, 'd')}
                </button>
              </div>

              <div className="space-y-0.5">
                {dayAppointments.slice(0, MAX_VISIBLE).map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} compact />
                ))}
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    className={cn('w-full rounded-sm text-center text-xs text-muted-foreground hover:text-foreground', focusClass)}
                  >
                    +{hiddenCount} more
                  </button>
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
