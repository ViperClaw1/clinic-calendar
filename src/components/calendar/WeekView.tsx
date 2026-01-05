import React from 'react';
import { startOfWeek, addDays } from 'date-fns';
import { useAppointmentStore } from '@/store/appointmentStore';
import { getAppointmentsForDate } from '@/utils/calendarUtils';
import TimeColumn from './TimeColumn';
import DayColumn from './DayColumn';

const WeekView: React.FC = () => {
  const { selectedDate, appointments, selectedPhysicianId } = useAppointmentStore();
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="h-full bg-card rounded-xl border border-border overflow-auto shadow-sm scrollbar-thin">
      <div className="flex min-w-fit">
        <TimeColumn />
        <div className="flex flex-1">
          {weekDays.map((day) => (
            <DayColumn
              key={day.toISOString()}
              date={day}
              appointments={getAppointmentsForDate(appointments, day, selectedPhysicianId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
