import React from 'react';
import { useAppointmentStore } from '@/store/appointmentStore';
import { getAppointmentsForDate } from '@/utils/calendarUtils';
import TimeColumn from './TimeColumn';
import DayColumn from './DayColumn';

const DayView: React.FC = () => {
  const { selectedDate, appointments, selectedPhysicianId } = useAppointmentStore();
  const dayAppointments = getAppointmentsForDate(appointments, selectedDate, selectedPhysicianId);

  return (
    <div className="h-full bg-card rounded-xl border border-border overflow-auto shadow-sm scrollbar-thin">
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
