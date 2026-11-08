import React from 'react';
import { useAppointmentStore } from '@/store/appointmentStore';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';

const CalendarGrid: React.FC = () => {
  const { calendarView } = useAppointmentStore();

  return (
    <div className="h-full">
      {calendarView === 'day' && <DayView />}
      {calendarView === 'week' && <WeekView />}
      {calendarView === 'month' && <MonthView />}
    </div>
  );
};

export default CalendarGrid;
