import React from 'react';
import { generateTimeSlots, formatTime } from '@/utils/calendarUtils';
interface TimeColumnProps {
  showHeader?: boolean;
}
const TimeColumn: React.FC<TimeColumnProps> = ({
  showHeader = true
}) => {
  const timeSlots = generateTimeSlots();
  return <div className="flex flex-col w-20 flex-shrink-0 border-r border-border bg-muted/30 px-0 pt-[60px]">
      {/* Header spacer - matches DayColumn header height exactly */}
      {showHeader && <div className="sticky top-0 z-10 bg-muted/30 border-b border-border p-2">
          <div className="text-xs font-medium text-transparent uppercase">Day</div>
          <div className="text-lg font-semibold text-transparent">0</div>
        </div>}
      
      {/* Time slots - each 15-minute slot is 48px (h-12) */}
      <div className="relative flex-1">
        {timeSlots.map((time, index) => <div key={time} className="h-12 relative border-b border-border/50">
            {/* Show time label at the start of each hour */}
            {index % 4 === 0 && <span className="absolute top-0 -translate-y-1/2 right-2 text-xs text-muted-foreground font-medium whitespace-nowrap">
                {formatTime(time)}
              </span>}
          </div>)}
      </div>
    </div>;
};
export default TimeColumn;