export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no-show';

export type AppointmentDuration = 15 | 30 | 45 | 60 | 90;

export interface Location {
  id: string;
  name: string;
  address: string;
  timezone: string; // IANA
  createdBy: string | null;
}

export interface AvailabilityRange {
  locationId: string;
  weekday: number; // 0 = Sunday
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export interface Physician {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
  locationIds: string[];
  availability: AvailabilityRange[];
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
  date: string; // "yyyy-MM-dd" in the time of the location
  startTime: string; // "HH:MM" in the time of the location
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
