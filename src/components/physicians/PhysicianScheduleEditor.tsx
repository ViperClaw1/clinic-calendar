import React, { useState, useCallback } from 'react';
import { Physician, Location } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/calendarUtils';
import { Plus, X, Clock } from 'lucide-react';

interface PhysicianScheduleEditorProps {
  physician: Physician | null;
  location: Location | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (physicianId: string, locationId: string, ranges: { weekday: number; start: string; end: string }[]) => void;
}

const DAYS_OF_WEEK = [
  { id: 0, name: 'Sunday', short: 'Sun' },
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

// Generate all 15-minute time slots from 8 AM to 9 PM
const generateAllTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 8; hour < 21; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

const ALL_TIME_SLOTS = generateAllTimeSlots();

interface TimeInterval {
  id: string;
  start: string;
  end: string;
}

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const addMinutes = (time: string, mins: number): string => {
  const totalMins = timeToMinutes(time) + mins;
  const hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const intervalsToSlots = (intervals: TimeInterval[]): string[] => {
  const slots: string[] = [];
  for (const interval of intervals) {
    let current = interval.start;
    while (timeToMinutes(current) < timeToMinutes(interval.end)) {
      slots.push(current);
      current = addMinutes(current, 15);
    }
  }
  return [...new Set(slots)].sort();
};

const PhysicianScheduleEditor: React.FC<PhysicianScheduleEditorProps> = ({
  physician,
  location,
  open,
  onOpenChange,
  onSave,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday by default
  const [schedule, setSchedule] = useState<Record<number, TimeInterval[]>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize schedule from physician's availability when dialog opens
  React.useEffect(() => {
    if (open && physician && !isInitialized) {
      const initialSchedule: Record<number, TimeInterval[]> = {};
      for (let day = 0; day <= 6; day++) {
        initialSchedule[day] = physician.availability
          .filter((r) => r.weekday === day && r.locationId === location?.id)
          .sort((a, b) => a.start.localeCompare(b.start))
          .map((r) => ({ id: `${r.start}-${r.end}`, start: r.start, end: r.end }));
      }
      setSchedule(initialSchedule);
      setIsInitialized(true);
    } else if (!open) {
      setIsInitialized(false);
    }
  }, [open, physician, location, isInitialized]);

  const handleAddInterval = useCallback(() => {
    setSchedule(prev => {
      const dayIntervals = prev[selectedDay] || [];
      // Find a suitable start time (after the last interval or 08:00)
      let startTime = '08:00';
      if (dayIntervals.length > 0) {
        const lastInterval = dayIntervals[dayIntervals.length - 1];
        const lastEndMinutes = timeToMinutes(lastInterval.end);
        if (lastEndMinutes < timeToMinutes('20:00')) {
          startTime = lastInterval.end;
        }
      }
      const endTime = addMinutes(startTime, 60); // Default 1 hour interval

      return {
        ...prev,
        [selectedDay]: [
          ...dayIntervals,
          { id: `${Date.now()}`, start: startTime, end: endTime },
        ],
      };
    });
  }, [selectedDay]);

  const handleRemoveInterval = useCallback((intervalId: string) => {
    setSchedule(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).filter(i => i.id !== intervalId),
    }));
  }, [selectedDay]);

  const handleUpdateInterval = useCallback((intervalId: string, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map(i =>
        i.id === intervalId ? { ...i, [field]: value } : i
      ),
    }));
  }, [selectedDay]);

  const handleSave = () => {
    if (!physician || !location) return;

    const ranges = Object.entries(schedule).flatMap(([day, intervals]) =>
      intervals.map(({ start, end }) => ({ weekday: Number(day), start, end }))
    );

    onSave(physician.id, location.id, ranges);
    onOpenChange(false);
  };

  const currentDayIntervals = schedule[selectedDay] || [];

  // Check if a time point falls within any existing interval (excluding the current one)
  const isTimeOccupied = useCallback((time: string, excludeIntervalId: string): boolean => {
    const timeMin = timeToMinutes(time);
    return currentDayIntervals.some(interval => {
      if (interval.id === excludeIntervalId) return false;
      const startMin = timeToMinutes(interval.start);
      const endMin = timeToMinutes(interval.end);
      return timeMin >= startMin && timeMin < endMin;
    });
  }, [currentDayIntervals]);

  // Get available start times for an interval (times that don't fall within other intervals)
  const getAvailableStartTimes = useCallback((intervalId: string): string[] => {
    const options: string[] = [];
    for (let hour = 8; hour < 21; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        if (!isTimeOccupied(time, intervalId)) {
          options.push(time);
        }
      }
    }
    return options;
  }, [isTimeOccupied]);

  // Get available end times for an interval given its start time
  const getAvailableEndTimes = useCallback((intervalId: string, startTime: string): string[] => {
    const options: string[] = [];
    const startMin = timeToMinutes(startTime);

    // Find the next occupied time slot after the start time
    let maxEndMin = timeToMinutes('21:00');
    for (const interval of currentDayIntervals) {
      if (interval.id === intervalId) continue;
      const intervalStartMin = timeToMinutes(interval.start);
      if (intervalStartMin > startMin && intervalStartMin < maxEndMin) {
        maxEndMin = intervalStartMin;
      }
    }

    // Generate end times from start+15min up to the max end
    for (let mins = startMin + 15; mins <= maxEndMin; mins += 15) {
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      if (hours > 21) break;
      options.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }

    return options;
  }, [currentDayIntervals]);

  const getDaySlotCount = (day: number): number => {
    const intervals = schedule[day] || [];
    return intervalsToSlots(intervals).length;
  };

  if (!physician || !location) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Edit Schedule
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {physician.name} at {location.name}
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {/* Day selector */}
          <div className="flex gap-1 flex-wrap">
            {DAYS_OF_WEEK.map(day => {
              const slotCount = getDaySlotCount(day.id);
              return (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.id)}
                  className={cn(
                    "flex flex-col items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[60px]",
                    selectedDay === day.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  )}
                >
                  <span>{day.short}</span>
                  {slotCount > 0 && (
                    <span className={cn(
                      "text-xs mt-0.5",
                      selectedDay === day.id ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {Math.round(slotCount * 15 / 60)}h
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Intervals list */}
          <ScrollArea className="flex-1 border rounded-lg">
            <div className="p-4 space-y-3">
              {currentDayIntervals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No availability set for {DAYS_OF_WEEK[selectedDay].name}</p>
                  <p className="text-xs mt-1">Click "Add Time Block" to add availability</p>
                </div>
              ) : (
                currentDayIntervals.map((interval, index) => (
                  <div
                    key={interval.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-2 sm:gap-3 sm:p-3"
                  >
                    <span className="text-sm text-muted-foreground font-medium w-6">
                      {index + 1}.
                    </span>

                    {/* Start time */}
                    <div className="flex items-center gap-2">
                      <select
                        value={interval.start}
                        onChange={(e) => handleUpdateInterval(interval.id, 'start', e.target.value)}
                        className="px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {getAvailableStartTimes(interval.id).map(time => (
                          <option key={time} value={time}>
                            {formatTime(time)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <span className="text-muted-foreground">to</span>

                    {/* End time */}
                    <div className="flex items-center gap-2">
                      <select
                        value={interval.end}
                        onChange={(e) => handleUpdateInterval(interval.id, 'end', e.target.value)}
                        className="px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {getAvailableEndTimes(interval.id, interval.start).map(time => (
                          <option key={time} value={time}>
                            {formatTime(time)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Duration badge */}
                    <Badge variant="secondary" className="ml-auto">
                      {Math.round((timeToMinutes(interval.end) - timeToMinutes(interval.start)) / 60 * 10) / 10}h
                    </Badge>

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveInterval(interval.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}

              {/* Add interval button */}
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={handleAddInterval}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Time Block
              </Button>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhysicianScheduleEditor;
