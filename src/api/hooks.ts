import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthError, Session } from '@supabase/supabase-js';
import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { useAppointmentStore } from '@/store/appointmentStore';
import { Appointment, Location, Patient } from '@/types';
import { supabase } from './client';
import { toAppointment, toAppointmentRow, toPhysician } from './mappers';

const must = <T>({ data, error }: { data: T | null; error: unknown }): T => {
  if (error) throw error;
  return data as T;
};

const toastSaveError = (error: unknown) => {
  const code = (error as { code?: string }).code;
  if (code === '23P01') toast.error('This time is already taken.');
  else if (code === 'CA001') toast.error('The physician is not available at this time.');
  else if (code === '42501') toast.error('You do not have permission to do this.');
  else toast.error('Could not save. Please try again.');
};

// Auth ------------------------------------------------------------------------

/** undefined while the stored session is loading, null when signed out. */
export const useSession = (): Session | null | undefined => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) queryClient.clear(); // patient data must not outlive the session
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  return session;
};

export const useMembership = (userId: string | undefined) =>
  useQuery({
    queryKey: ['membership', userId],
    enabled: !!userId,
    queryFn: async () =>
      must(await supabase.from('clinic_members').select('role, physician_id').eq('user_id', userId!).maybeSingle()),
  });

export const signIn = (email: string, password: string) => supabase.auth.signInWithPassword({ email, password });
export const signOut = () => supabase.auth.signOut();
export type SignUpProfile =
  | { role: 'receptionist' }
  | { role: 'physician'; name: string; specialty: string };

export const signUp = (email: string, password: string, profile: SignUpProfile) =>
  supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: profile } });
export const requestPasswordReset = (email: string) =>
  supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
export const updatePassword = (password: string) => supabase.auth.updateUser({ password });

export const authErrorMessage = (error: AuthError, fallback: string): string => {
  if (error.status === 429) return 'Too many attempts. Please wait and try again.';
  switch (error.code) {
    case 'invalid_credentials': return 'Wrong email or password.';
    case 'email_not_confirmed': return 'Please confirm your email first.';
    case 'user_already_exists': return 'An account with this email already exists.';
    case 'same_password': return 'The new password must differ from the old one.';
    case 'weak_password': return error.message; // names the rule the server enforces
    default: return fallback;
  }
};

// Reference data --------------------------------------------------------------

export const useLocations = () =>
  useQuery({
    queryKey: ['locations'],
    queryFn: async (): Promise<Location[]> => {
      const rows = must(await supabase.from('locations').select('*').order('name'));
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        address: row.address,
        timezone: row.timezone,
        createdBy: row.created_by,
      }));
    },
  });

export const usePhysicians = () =>
  useQuery({
    queryKey: ['physicians'],
    queryFn: async () => {
      const rows = must(
        await supabase
          .from('physicians')
          .select('*, physician_locations(location_id), physician_availability(location_id, weekday, start_time, end_time)')
          .order('name'),
      );
      return rows.map(toPhysician);
    },
  });

export const usePatients = () =>
  useQuery({
    queryKey: ['patients'],
    queryFn: async (): Promise<Patient[]> => {
      const rows = must(await supabase.from('patients').select('*').order('name'));
      return rows.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        dateOfBirth: p.date_of_birth ?? undefined,
      }));
    },
  });

export const useAppointmentTypes = () =>
  useQuery({
    queryKey: ['appointment-types'],
    queryFn: async () => must(await supabase.from('appointment_types').select('name').order('name')).map((t) => t.name),
  });

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patient: Omit<Patient, 'id'>) => {
      const row = must(
        await supabase
          .from('patients')
          .insert({
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            date_of_birth: patient.dateOfBirth ?? null,
          })
          .select('id')
          .single(),
      );
      return row.id;
    },
    onError: toastSaveError,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });
};

export const useSetPhysicianLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ physicianId, locationId, enabled }: { physicianId: string; locationId: string; enabled: boolean }) => {
      const { error } = enabled
        ? await supabase.from('physician_locations').insert({ physician_id: physicianId, location_id: locationId })
        : await supabase.from('physician_locations').delete().eq('physician_id', physicianId).eq('location_id', locationId);
      if (error) throw error;
    },
    onError: toastSaveError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['physicians'] }),
  });
};

export const useSaveSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      physicianId: string;
      locationId: string;
      ranges: { weekday: number; start: string; end: string }[];
    }) => {
      const { error } = await supabase.rpc('set_physician_availability', {
        p_physician_id: input.physicianId,
        p_location_id: input.locationId,
        p_ranges: input.ranges.map((r) => ({ weekday: r.weekday, start_time: r.start, end_time: r.end })),
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success('Schedule updated successfully'),
    onError: toastSaveError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['physicians'] }),
  });
};

// Appointments ----------------------------------------------------------------

/** Dates are in location time, so the UTC query is padded by a day on each side. */
export const useAppointments = (from: Date, to: Date) => {
  const fromKey = format(addDays(from, -1), 'yyyy-MM-dd');
  const toKey = format(addDays(to, 2), 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['appointments', fromKey, toKey],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const rows = must(
        await supabase
          .from('appointments')
          .select('*, locations(timezone)')
          .gte('starts_at', `${fromKey}T00:00:00Z`)
          .lt('starts_at', `${toKey}T00:00:00Z`),
      );
      return rows.map((row) => toAppointment(row, row.locations.timezone));
    },
  });
};

export const useVisibleAppointments = (): Appointment[] => {
  const { selectedDate, calendarView } = useAppointmentStore();
  const [from, to] =
    calendarView === 'day'
      ? [selectedDate, selectedDate]
      : calendarView === 'week'
        ? [startOfWeek(selectedDate), endOfWeek(selectedDate)]
        : [startOfWeek(startOfMonth(selectedDate)), endOfWeek(endOfMonth(selectedDate))];
  return useAppointments(from, to).data ?? [];
};

/** RLS filters the rows; payloads are ignored, any change simply refetches. */
export const useAppointmentsRealtime = () => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

const useTimeZoneOf = () => {
  const { data: locations } = useLocations();
  return (locationId: string) => {
    const location = locations?.find((l) => l.id === locationId);
    if (!location) throw new Error(`Unknown location ${locationId}`);
    return location.timezone;
  };
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  const timeZoneOf = useTimeZoneOf();
  return useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id'>) => {
      const { error } = await supabase
        .from('appointments')
        .insert(toAppointmentRow(appointment, timeZoneOf(appointment.locationId)));
      if (error) throw error;
    },
    onError: toastSaveError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

/** Optimistic, so a dragged card stays where it was dropped; a rejected move snaps back. */
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  const timeZoneOf = useTimeZoneOf();
  return useMutation({
    mutationFn: async (appointment: Appointment) => {
      const { error } = await supabase
        .from('appointments')
        .update(toAppointmentRow(appointment, timeZoneOf(appointment.locationId)))
        .eq('id', appointment.id);
      if (error) throw error;
    },
    onMutate: async (appointment) => {
      await queryClient.cancelQueries({ queryKey: ['appointments'] });
      queryClient.setQueriesData<Appointment[]>({ queryKey: ['appointments'] }, (current) =>
        current?.map((a) => (a.id === appointment.id ? appointment : a)),
      );
    },
    onError: toastSaveError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
};
