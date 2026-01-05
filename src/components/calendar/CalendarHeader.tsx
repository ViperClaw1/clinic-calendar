import React from 'react';
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from 'lucide-react';
import { useAppointmentStore } from '@/store/appointmentStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CalendarHeader: React.FC = () => {
  const { 
    selectedDate, 
    calendarView, 
    setSelectedDate, 
    setCalendarView,
    openSidebar 
  } = useAppointmentStore();

  const navigatePrev = () => {
    switch (calendarView) {
      case 'day':
        setSelectedDate(subDays(selectedDate, 1));
        break;
      case 'week':
        setSelectedDate(subWeeks(selectedDate, 1));
        break;
      case 'month':
        setSelectedDate(subMonths(selectedDate, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (calendarView) {
      case 'day':
        setSelectedDate(addDays(selectedDate, 1));
        break;
      case 'week':
        setSelectedDate(addWeeks(selectedDate, 1));
        break;
      case 'month':
        setSelectedDate(addMonths(selectedDate, 1));
        break;
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getDateRangeLabel = () => {
    switch (calendarView) {
      case 'day':
        return format(selectedDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        const weekStart = format(selectedDate, 'MMM d');
        const weekEnd = format(addDays(selectedDate, 6), 'MMM d, yyyy');
        return `${weekStart} - ${weekEnd}`;
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
    }
  };

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={navigatePrev}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={navigateNext}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          variant="outline"
          onClick={goToToday}
          className="text-sm"
        >
          Today
        </Button>
        
        <h2 className="text-xl font-semibold text-foreground">
          {getDateRangeLabel()}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* View toggle */}
        <div className="flex items-center bg-muted rounded-lg p-1">
          {(['day', 'week', 'month'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCalendarView(view)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                calendarView === view
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>

        <Button onClick={() => openSidebar()} className="gap-2">
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
