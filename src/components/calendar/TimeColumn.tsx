import React from 'react';
import { generateTimeSlots, formatTime } from '@/utils/calendarUtils';

const TimeColumn: React.FC = () => {
  const timeSlots = generateTimeSlots();

  return (
    <div className="flex flex-col w-20 flex-shrink-0 border-r border-border bg-muted/30">
      {/* Header spacer - matches DayColumn header, contains first time label */}
      <div className="sticky top-0 z-10 h-[52px] bg-muted/30 border-b border-border flex items-end justify-end pr-3 pb-1">
        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
          {formatTime(timeSlots[0])}
        </span>
      </div>
      
      {/* Time slots - each 15-minute slot is 48px (h-12) */}
      {timeSlots.map((time, index) => (
        <div
          key={time}
          className="h-12 relative"
        >
          {/* Show time label at the start of each hour (skip first, already in header) */}
          {index % 4 === 0 && index !== 0 && (
            <span className="absolute -top-2 right-3 text-xs text-muted-foreground font-medium whitespace-nowrap bg-muted/30">
              {formatTime(time)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default TimeColumn;
