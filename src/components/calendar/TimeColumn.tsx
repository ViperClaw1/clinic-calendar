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
    <div className="sticky left-0 z-20 flex w-12 flex-shrink-0 flex-col bg-card sm:w-16">
      {/* Same height as the DayColumn header */}
      {showHeader && <div className="sticky top-0 z-10 h-16 border-b border-border bg-card" />}

      <div className="relative flex-1">
        {timeSlots.map((time, index) => {
          const isHourStart = index % 4 === 0;

          return (
            <div
              key={time}
              className={`relative h-6 ${isHourStart ? 'border-t border-border' : ''}`}
            >
              {isHourStart && (
                <span className="absolute right-1 top-0.5 whitespace-nowrap text-[10px] font-medium sm:right-2 sm:text-xs text-muted-foreground">
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
