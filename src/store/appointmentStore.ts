import { create } from 'zustand';
import { Appointment, CalendarView, AppointmentDuration, AppointmentStatus } from '@/types';
import { appointments as initialAppointments } from '@/data/mockData';

interface AppointmentState {
  appointments: Appointment[];
  selectedDate: Date;
  calendarView: CalendarView;
  selectedPhysicianId: string | null;
  selectedLocationId: string | null;
  sidebarOpen: boolean;
  sidebarAppointment: Partial<Appointment> | null;
  editingAppointmentId: string | null;
  
  // Actions
  setSelectedDate: (date: Date) => void;
  setCalendarView: (view: CalendarView) => void;
  setSelectedPhysicianId: (id: string | null) => void;
  setSelectedLocationId: (id: string | null) => void;
  openSidebar: (appointment?: Partial<Appointment>) => void;
  closeSidebar: () => void;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  rescheduleAppointment: (id: string, date: string, startTime: string) => void;
  setEditingAppointmentId: (id: string | null) => void;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: initialAppointments,
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
  
  addAppointment: (appointment) => {
    const id = `apt-${Date.now()}`;
    set((state) => ({
      appointments: [...state.appointments, { ...appointment, id }],
      sidebarOpen: false,
      sidebarAppointment: null,
    }));
  },
  
  updateAppointment: (id, updates) => {
    set((state) => ({
      appointments: state.appointments.map((apt) =>
        apt.id === id ? { ...apt, ...updates } : apt
      ),
    }));
  },
  
  deleteAppointment: (id) => {
    set((state) => ({
      appointments: state.appointments.filter((apt) => apt.id !== id),
      sidebarOpen: false,
      sidebarAppointment: null,
      editingAppointmentId: null,
    }));
  },
  
  rescheduleAppointment: (id, date, startTime) => {
    set((state) => ({
      appointments: state.appointments.map((apt) =>
        apt.id === id ? { ...apt, date, startTime } : apt
      ),
    }));
  },

  setEditingAppointmentId: (id) => set({ editingAppointmentId: id }),
}));
