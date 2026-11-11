import React, { useEffect, useRef, useState } from 'react';
import { format, isToday } from 'date-fns';
import { useAppointmentStore } from '@/store/appointmentStore';
import { usePhysicians, useUpdateAppointment } from '@/api/hooks';
import { generateTimeSlots, isPhysicianAvailableAtSlot, getSlotTop, getSlotHeight, layoutAppointments, SLOT_HEIGHT } from '@/utils/calendarUtils';
import { Appointment } from '@/types';
import { cn } from '@/lib/utils';
import AppointmentCard from './AppointmentCard';

interface DayColumnProps {
  date: Date;
  appointments: Appointment[];
  showHeader?: boolean;
}

const NowIndicator: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  const lineRef = useRef<HTMLDivElement>(null);
  const top = getSlotTop(format(now, 'HH:mm'));
  const inRange = top >= 0 && top < generateTimeSlots().length * SLOT_HEIGHT;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Open the grid at the current time rather than at the first slot.
  useEffect(() => {
    const scroller = lineRef.current?.closest('[data-calendar-scroll]');
    if (scroller) scroller.scrollTop = lineRef.current!.offsetTop - 2 * SLOT_HEIGHT;
  }, []);

  if (!inRange) return null;

  return (
    <div
      ref={lineRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 h-0.5 bg-calendar-today"
      style={{ top }}
    >
      <div className="absolute left-0 -top-1 h-2.5 w-2.5 rounded-full bg-calendar-today" />
    </div>
  );
};

const DayColumn: React.FC<DayColumnProps> = ({ date, appointments, showHeader = true }) => {
  const { selectedPhysicianId, selectedLocationId, calendarView, openSidebar, setSelectedDate, setCalendarView } = useAppointmentStore();
  const [dropTime, setDropTime] = useState<string | null>(null);
  const timeSlots = generateTimeSlots();
  const { data: physicians = [] } = usePhysicians();
  const updateAppointment = useUpdateAppointment();
  const selectedPhysician = physicians.find((p) => p.id === selectedPhysicianId);
  const isCurrentDay = isToday(date);

  const isUnavailable = (time: string) =>
    !!selectedPhysician && !isPhysicianAvailableAtSlot(selectedPhysician, date, time, selectedLocationId);

  const handleSlotClick = (time: string) => {
    if (isUnavailable(time)) return;

    openSidebar({
      date: format(date, 'yyyy-MM-dd'),
      startTime: time,
      physicianId: selectedPhysicianId || undefined,
      locationId: selectedLocationId || undefined,
    });
  };

  const handleDragOver = (e: React.DragEvent, time: string) => {
    e.preventDefault();
    if (isUnavailable(time)) {
      e.dataTransfer.dropEffect = 'none';
      setDropTime(null);
      return;
    }
    e.dataTransfer.dropEffect = 'move';
    setDropTime(time);
  };

  const handleDrop = (e: React.DragEvent, time: string) => {
    e.preventDefault();
    setDropTime(null);
    const dragged = e.dataTransfer.getData('application/json');
    if (dragged) {
      updateAppointment.mutate({ ...(JSON.parse(dragged) as Appointment), date: format(date, 'yyyy-MM-dd'), startTime: time });
    }
  };

  const dayLabel = (
    <>
      <span className={cn('block text-xs font-medium uppercase tracking-wide text-muted-foreground', isCurrentDay && 'text-primary')}>
        {format(date, 'EEE')}
      </span>
      <span
        className={cn(
          'mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
          isCurrentDay && 'bg-primary text-primary-foreground'
        )}
      >
        {format(date, 'd')}
      </span>
    </>
  );

  return (
    // No min width on phones so all 7 week columns fit down to 320px.
    <div className="flex min-w-0 flex-1 flex-col border-l border-border sm:min-w-[80px] xl:min-w-[120px]">
      {showHeader && (
        <div
          className="sticky top-0 z-10 h-16 border-b border-border bg-card text-center"
          aria-current={isCurrentDay ? 'date' : undefined}
        >
          {calendarView === 'week' ? (
            <button
              type="button"
              aria-label={`View ${format(date, 'EEEE, MMMM d')}`}
              onClick={() => {
                setSelectedDate(date);
                setCalendarView('day');
              }}
              className="h-full w-full transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              {dayLabel}
            </button>
          ) : (
            <div className="flex h-full flex-col justify-center">{dayLabel}</div>
          )}
        </div>
      )}

      <div className="relative flex-1">
        {/* Slots are mouse and drag targets. Keyboard users book through "New Appointment",
            which avoids hundreds of extra tab stops. */}
        {timeSlots.map((time, index) => (
          <div
            key={time}
            className={cn(
              'h-6 border-t',
              index % 4 === 0 ? 'border-border' : 'border-border/40',
              isUnavailable(time) ? 'calendar-slot-unavailable' : 'calendar-slot',
              dropTime === time && 'bg-primary/20'
            )}
            onClick={() => handleSlotClick(time)}
            onDragOver={(e) => handleDragOver(e, time)}
            onDragLeave={() => setDropTime(null)}
            onDrop={(e) => handleDrop(e, time)}
          />
        ))}

        {/* Rendered before the cards so the line passes behind their text */}
        {isCurrentDay && <NowIndicator />}

        <div className="pointer-events-none absolute inset-0">
          {layoutAppointments(appointments).map(({ appointment, lane, laneCount }) => (
            <div
              key={appointment.id}
              className="pointer-events-auto absolute"
              style={{
                top: getSlotTop(appointment.startTime) + 1,
                height: getSlotHeight(appointment.duration) - 2,
                left: `calc(${(lane / laneCount) * 100}% + 2px)`,
                width: `calc(${100 / laneCount}% - 4px)`,
              }}
            >
              <AppointmentCard appointment={appointment} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DayColumn;
