import React, { useState } from 'react';
import SidebarNav from '@/components/SidebarNav';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarFilters from '@/components/calendar/CalendarFilters';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import AppointmentSidebar from '@/components/AppointmentSidebar';
import PhysiciansSection from '@/components/physicians/PhysiciansSection';
import SettingsSection from '@/components/settings/SettingsSection';
import { useAppointmentsRealtime } from '@/api/hooks';

const Dashboard: React.FC = () => {
  const [activeNav, setActiveNav] = useState('calendar');
  useAppointmentsRealtime();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <SidebarNav activeItem={activeNav} onItemClick={setActiveNav} />

      {activeNav === 'calendar' && (
        <>
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col overflow-auto p-3 md:p-6">
              <CalendarHeader />
              <CalendarFilters />
              <div className="min-h-[24rem] flex-1">
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

      {activeNav === 'settings' && (
        <SettingsSection />
      )}
    </div>
  );
};

export default Dashboard;
