import React, { useState } from 'react';
import SidebarNav from '@/components/SidebarNav';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarFilters from '@/components/calendar/CalendarFilters';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import AppointmentSidebar from '@/components/AppointmentSidebar';
import PhysiciansSection from '@/components/physicians/PhysiciansSection';

const Dashboard: React.FC = () => {
  const [activeNav, setActiveNav] = useState('calendar');

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <SidebarNav activeItem={activeNav} onItemClick={setActiveNav} />
      
      {activeNav === 'calendar' && (
        <>
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
              <CalendarHeader />
              <CalendarFilters />
              <div className="flex-1 min-h-0">
                <CalendarGrid />
              </div>
            </div>
          </main>
          <AppointmentSidebar />
        </>
      )}

      {activeNav === 'physicians' && (
        <PhysiciansSection />
      )}
    </div>
  );
};

export default Dashboard;
