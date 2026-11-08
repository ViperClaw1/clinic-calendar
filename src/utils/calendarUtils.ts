import { Physician, Appointment, AppointmentDuration, AppointmentStatus } from '@/types';
import { format, addMinutes, parse, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Ban, CheckCheck, CheckCircle2, Clock, UserX, type LucideIcon } from 'lucide-react';

// Height of a 15-minute slot in px. Must match the h-6 class on slot rows.
export const SLOT_HEIGHT = 24;

export const STATUS_META: Record<AppointmentStatus, { label: string; icon: LucideIcon }> = {
  confirmed: { label: 'Confirmed', icon: CheckCircle2 },
  pending: { label: 'Pending', icon: Clock },
  cancelled: { label: 'Cancelled', icon: Ban },
  completed: { label: 'Completed', icon: CheckCheck },
  'no-show': { label: 'No-show', icon: UserX },
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const getEndTime = (startTime: string, duration: AppointmentDuration): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  const endDate = addMinutes(startDate, duration);
  return format(endDate, 'HH:mm');
};

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const generateTimeSlots = (startHour: number = 8, endHour: number = 21): string[] => {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

export const isSlotAvailable = (
  physician: Physician,
  date: Date,
  startTime: string,
  duration: AppointmentDuration,
  existingAppointments: Appointment[],
  excludeAppointmentId?: string
): boolean => {
  const dayOfWeek = date.getDay();
  const availability = physician.availability[dayOfWeek] || [];
  
  // Check if physician is available for all required slots
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + duration;
  
  for (let time = startMinutes; time < endMinutes; time += 15) {
    const slotTime = minutesToTime(time);
    if (!availability.includes(slotTime)) {
      return false;
    }
  }
  
  // Check for conflicts with existing appointments
  const dateString = format(date, 'yyyy-MM-dd');
  const physicianAppointments = existingAppointments.filter(
    (apt) => 
      apt.physicianId === physician.id && 
      apt.date === dateString &&
      apt.status !== 'cancelled' &&
      apt.id !== excludeAppointmentId
  );
  
  for (const apt of physicianAppointments) {
    const aptStart = timeToMinutes(apt.startTime);
    const aptEnd = aptStart + apt.duration;
    
    // Check for overlap
    if (startMinutes < aptEnd && endMinutes > aptStart) {
      return false;
    }
  }
  
  return true;
};

export const getPhysicianAvailability = (
  physician: Physician,
  date: Date
): string[] => {
  const dayOfWeek = date.getDay();
  return physician.availability[dayOfWeek] || [];
};

export const isPhysicianAvailableAtSlot = (
  physician: Physician,
  date: Date,
  time: string
): boolean => {
  const availability = getPhysicianAvailability(physician, date);
  return availability.includes(time);
};

export const getWeekDays = (date: Date): Date[] => {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
};

export const getMonthDays = (date: Date): Date[] => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
};

export const getAppointmentsForDate = (
  appointments: Appointment[],
  date: Date,
  physicianId?: string | null,
  locationId?: string | null
): Appointment[] => {
  const dateString = format(date, 'yyyy-MM-dd');
  return appointments.filter((apt) => {
    if (apt.date !== dateString) return false;
    if (physicianId && apt.physicianId !== physicianId) return false;
    if (locationId && apt.locationId !== locationId) return false;
    return true;
  });
};

export interface PositionedAppointment {
  appointment: Appointment;
  lane: number;
  laneCount: number;
}

// Places concurrent appointments side by side: each run of overlapping
// appointments shares one lane count, and each appointment takes the first free lane.
export const layoutAppointments = (appointments: Appointment[]): PositionedAppointment[] => {
  const sorted = [...appointments].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const result: PositionedAppointment[] = [];
  let cluster: PositionedAppointment[] = [];
  let laneEnds: number[] = [];

  const closeCluster = () => {
    cluster.forEach((item) => { item.laneCount = laneEnds.length; });
    result.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const appointment of sorted) {
    const start = timeToMinutes(appointment.startTime);
    if (laneEnds.length && start >= Math.max(...laneEnds)) closeCluster();

    const free = laneEnds.findIndex((end) => end <= start);
    const lane = free === -1 ? laneEnds.length : free;
    laneEnds[lane] = start + appointment.duration;
    cluster.push({ appointment, lane, laneCount: 1 });
  }
  closeCluster();
  return result;
};

export const getAppointmentColor = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'status-confirmed';
    case 'pending':
      return 'status-pending';
    case 'cancelled':
      return 'status-cancelled';
    case 'completed':
      return 'status-completed';
    case 'no-show':
      return 'status-no-show';
    default:
      return 'status-pending';
  }
};

export const getSlotHeight = (duration: AppointmentDuration): number => {
  return (duration / 15) * SLOT_HEIGHT;
};

export const getSlotTop = (startTime: string, startHour: number = 8): number => {
  const startMinutes = timeToMinutes(startTime);
  const offsetMinutes = startMinutes - (startHour * 60);
  return (offsetMinutes / 15) * SLOT_HEIGHT;
};
