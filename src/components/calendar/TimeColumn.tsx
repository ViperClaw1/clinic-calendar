import React from 'react';
import { generateTimeSlots, formatTime } from '@/utils/calendarUtils';

interface TimeColumnProps {
  showHeader?: boolean;
}

const TimeColumn: React.FC<TimeColumnProps> = ({
  showHeader = true
}) => {
  const timeSlots = generateTimeSlots();
  
  return (
    <div className="flex flex-col w-16 flex-shrink-0 bg-muted/30">
      {/* Header spacer - matches DayColumn header height exactly */}
      {showHeader && (
        <div className="border-b border-border p-2">
          <div className="text-xs font-medium text-transparent uppercase">Day</div>
          <div className="text-lg font-semibold text-transparent">0</div>
        </div>
      )}
      
      {/* Time slots - each 15-minute slot is 48px (h-12) */}
      <div className="relative flex-1">
        {timeSlots.map((time, index) => {
          const isHourStart = index % 4 === 0;
          
          return (
            <div 
              key={time} 
              className={`h-12 relative ${isHourStart ? 'border-t border-border' : ''}`}
            >
              {/* Show time label at the start of each hour */}
              {isHourStart && (
                <span className="absolute -top-2.5 right-2 text-xs text-muted-foreground font-medium whitespace-nowrap bg-muted/30 px-0.5">
                  {formatTime(time)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeColumn;