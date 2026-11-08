import { create } from 'zustand';
import { Appointment, CalendarView } from '@/types';

// UI state only; server data lives in React Query (src/api/hooks.ts).
interface AppointmentState {
  selectedDate: Date;
  calendarView: CalendarView;
  selectedPhysicianId: string | null;
  selectedLocationId: string | null;
  sidebarOpen: boolean;
  sidebarAppointment: Partial<Appointment> | null;
  editingAppointmentId: string | null;

  setSelectedDate: (date: Date) => void;
  setCalendarView: (view: CalendarView) => void;
  setSelectedPhysicianId: (id: string | null) => void;
  setSelectedLocationId: (id: string | null) => void;
  openSidebar: (appointment?: Partial<Appointment>) => void;
  closeSidebar: () => void;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  selectedDate: new Date(),
  calendarView: 'week',
  selectedPhysicianId: null,
  selectedLocationId: null,
  sidebarOpen: false,
  sidebarAppointment: null,
  editingAppointmentId: null,

  setSelectedDate: (date) => set({ selectedDate: date }),
  setCalendarView: (view) => set({ calendarView: view }),
  setSelectedPhysicianId: (id) => set({ selectedPhysicianId: id }),
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),

  openSidebar: (appointment) => set({
    sidebarOpen: true,
    sidebarAppointment: appointment || null,
    editingAppointmentId: appointment?.id || null,
  }),

  closeSidebar: () => set({
    sidebarOpen: false,
    sidebarAppointment: null,
    editingAppointmentId: null,
  }),
}));
