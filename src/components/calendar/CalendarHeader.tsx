import React from 'react';
import { format, addDays, addWeeks, addMonths, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAppointmentStore } from '@/store/appointmentStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STEP = { day: addDays, week: addWeeks, month: addMonths };

const CalendarHeader: React.FC = () => {
  const {
    selectedDate,
    calendarView,
    setSelectedDate,
    setCalendarView,
    openSidebar
  } = useAppointmentStore();

  const navigate = (amount: number) => setSelectedDate(STEP[calendarView](selectedDate, amount));

  const getDateRangeLabel = () => {
    switch (calendarView) {
      case 'day':
        return (
          <>
            <span className="sm:hidden">{format(selectedDate, 'EEE, MMM d, yyyy')}</span>
            <span className="hidden sm:inline">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
          </>
        );
      case 'week': {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
        return `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`;
      }
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 sm:gap-3 sm:pb-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Button variant="outline" onClick={() => setSelectedDate(new Date())} className="h-9">
          Today
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
            aria-label={`Previous ${calendarView}`}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(1)}
            className="h-9 w-9"
            aria-label={`Next ${calendarView}`}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <h2 className="text-base font-semibold text-foreground sm:text-xl" aria-live="polite">
          {getDateRangeLabel()}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div role="group" aria-label="Calendar view" className="flex items-center rounded-lg bg-muted p-1">
          {(['day', 'week', 'month'] as const).map((view) => (
            <button
              key={view}
              type="button"
              aria-pressed={calendarView === view}
              onClick={() => setCalendarView(view)}
              className={cn(
                'rounded-md px-2 py-1 text-sm sm:px-3 font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                calendarView === view
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {view}
            </button>
          ))}
        </div>

        <Button onClick={() => openSidebar()} className="h-9 gap-2" aria-label="New appointment">
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">New Appointment</span>
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
