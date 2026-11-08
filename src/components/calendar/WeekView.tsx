import React from 'react';
import { startOfWeek, addDays } from 'date-fns';
import { useAppointmentStore } from '@/store/appointmentStore';
import { useVisibleAppointments } from '@/api/hooks';
import { getAppointmentsForDate } from '@/utils/calendarUtils';
import TimeColumn from './TimeColumn';
import DayColumn from './DayColumn';

const WeekView: React.FC = () => {
  const { selectedDate, selectedPhysicianId, selectedLocationId } = useAppointmentStore();
  const appointments = useVisibleAppointments();
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div data-calendar-scroll className="h-full bg-card rounded-lg border border-border overflow-auto scrollbar-thin">
      <div className="flex min-w-fit">
        <TimeColumn />
        <div className="flex flex-1">
          {weekDays.map((day) => (
            <DayColumn
              key={day.toISOString()}
              date={day}
              appointments={getAppointmentsForDate(appointments, day, selectedPhysicianId, selectedLocationId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
