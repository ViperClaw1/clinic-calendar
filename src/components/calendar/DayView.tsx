import React from 'react';
import { useAppointmentStore } from '@/store/appointmentStore';
import { getAppointmentsForDate } from '@/utils/calendarUtils';
import TimeColumn from './TimeColumn';
import DayColumn from './DayColumn';

const DayView: React.FC = () => {
  const { selectedDate, appointments, selectedPhysicianId, selectedLocationId } = useAppointmentStore();
  const dayAppointments = getAppointmentsForDate(appointments, selectedDate, selectedPhysicianId, selectedLocationId);

  return (
    <div data-calendar-scroll className="h-full bg-card rounded-lg border border-border overflow-auto scrollbar-thin">
      <div className="flex min-w-fit">
        <TimeColumn />
        <div className="flex flex-1">
          <DayColumn
            date={selectedDate}
            appointments={dayAppointments}
            showHeader={true}
          />
        </div>
      </div>
    </div>
  );
};

export default DayView;
