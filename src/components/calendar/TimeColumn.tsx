import React from 'react';
import { generateTimeSlots, formatTime } from '@/utils/calendarUtils';

const TimeColumn: React.FC = () => {
  const timeSlots = generateTimeSlots();

  return (
    <div className="flex flex-col w-20 flex-shrink-0 border-r border-border bg-muted/30">
      {/* Header spacer - matches DayColumn header */}
      <div className="sticky top-0 z-10 h-[52px] bg-muted/30 border-b border-border" />
      
      {/* Time slots container with relative positioning for labels */}
      <div className="relative flex-1">
        {/* Time labels positioned at hour boundaries */}
        {timeSlots.map((time, index) => (
          index % 4 === 0 && (
            <span 
              key={time}
              className="absolute right-3 text-xs text-muted-foreground font-medium whitespace-nowrap"
              style={{ top: `${index * 48 - 8}px` }}
            >
              {formatTime(time)}
            </span>
          )
        ))}
        
        {/* Invisible spacer divs to maintain height */}
        {timeSlots.map((time) => (
          <div key={time} className="h-12" />
        ))}
      </div>
    </div>
  );
};

export default TimeColumn;
