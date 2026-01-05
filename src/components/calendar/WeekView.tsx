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
    <div className="flex h-full bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      <TimeColumn />
      <div className="flex flex-1 overflow-x-auto scrollbar-thin">
        {weekDays.map((day) => (
          <DayColumn
            key={day.toISOString()}
            date={day}
            appointments={getAppointmentsForDate(appointments, day, selectedPhysicianId)}
          />
        ))}
      </div>
    </div>
  );
};

export default WeekView;
