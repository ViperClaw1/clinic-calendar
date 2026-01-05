export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no-show';

export type AppointmentDuration = 15 | 30 | 45 | 60 | 90;

export interface Location {
  id: string;
  name: string;
  address: string;
}

export interface Physician {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
  locationIds: string[];
  // Availability is a map of day of week (0-6) to array of available time slots
  // Each slot is in format "HH:MM" representing 15-minute slots
  availability: Record<number, string[]>;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  physicianId: string;
  locationId: string;
  date: string; // ISO date string
  startTime: string; // "HH:MM" format
  duration: AppointmentDuration;
  status: AppointmentStatus;
  notes?: string;
  type: string;
}

export type CalendarView = 'day' | 'week' | 'month';

export interface TimeSlot {
  time: string; // "HH:MM"
  available: boolean;
}
