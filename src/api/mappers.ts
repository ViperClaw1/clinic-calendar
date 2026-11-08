import type { Database } from '@/integrations/supabase/types';
import { Appointment, AppointmentDuration, Physician } from '@/types';
import { utcToWallClock, wallClockToUtc } from './time';

type Tables = Database['public']['Tables'];
type AppointmentRow = Tables['appointments']['Row'];
type AvailabilityRow = Pick<Tables['physician_availability']['Row'], 'location_id' | 'weekday' | 'start_time' | 'end_time'>;

export const toAppointment = (row: AppointmentRow, timeZone: string): Appointment => {
  const { date, time } = utcToWallClock(row.starts_at, timeZone);
  return {
    id: row.id,
    patientId: row.patient_id,
    physicianId: row.physician_id,
    locationId: row.location_id,
    date,
    startTime: time,
    duration: ((Date.parse(row.ends_at) - Date.parse(row.starts_at)) / 60_000) as AppointmentDuration,
    status: row.status,
    notes: row.notes ?? undefined,
    type: row.type,
  };
};

export const toAppointmentRow = (appointment: Omit<Appointment, 'id'>, timeZone: string) => {
  const start = wallClockToUtc(appointment.date, appointment.startTime, timeZone);
  return {
    patient_id: appointment.patientId,
    physician_id: appointment.physicianId,
    location_id: appointment.locationId,
    starts_at: start.toISOString(),
    ends_at: new Date(start.getTime() + appointment.duration * 60_000).toISOString(),
    status: appointment.status,
    notes: appointment.notes || null,
    type: appointment.type,
  };
};

export const toPhysician = (
  row: Tables['physicians']['Row'] & {
    physician_locations: { location_id: string }[];
    physician_availability: AvailabilityRow[];
  },
): Physician => ({
  id: row.id,
  name: row.name,
  specialty: row.specialty,
  avatar: row.avatar_url ?? undefined,
  locationIds: row.physician_locations.map((l) => l.location_id),
  availability: row.physician_availability.map((a) => ({
    locationId: a.location_id,
    weekday: a.weekday,
    start: a.start_time.slice(0, 5),
    end: a.end_time.slice(0, 5),
  })),
});
