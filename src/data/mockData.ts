import { Location, Physician, Patient, Appointment } from '@/types';

export const locations: Location[] = [
  { id: 'loc-1', name: 'Downtown Medical Center', address: '123 Main St, Suite 100' },
  { id: 'loc-2', name: 'Westside Clinic', address: '456 Oak Ave' },
  { id: 'loc-3', name: 'North Health Campus', address: '789 Pine Blvd' },
];

// Generate availability slots (15-minute intervals from 8 AM to 9 PM)
const generateFullDayAvailability = (): string[] => {
  const slots: string[] = [];
  for (let hour = 8; hour < 21; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      // Skip lunch break 12:00 - 13:00
      if (hour === 12) continue;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

const generateMorningAvailability = (): string[] => {
  const slots: string[] = [];
  for (let hour = 8; hour < 13; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

const generateAfternoonAvailability = (): string[] => {
  const slots: string[] = [];
  for (let hour = 13; hour < 21; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

export const physicians: Physician[] = [
  {
    id: 'phy-1',
    name: 'Dr. Sarah Chen',
    specialty: 'Family Medicine',
    locationIds: ['loc-1', 'loc-2'],
    availability: {
      1: generateFullDayAvailability(), // Monday
      2: generateFullDayAvailability(), // Tuesday
      3: generateMorningAvailability(), // Wednesday (morning only)
      4: generateFullDayAvailability(), // Thursday
      5: generateMorningAvailability(), // Friday (morning only)
    },
  },
  {
    id: 'phy-2',
    name: 'Dr. Michael Roberts',
    specialty: 'Internal Medicine',
    locationIds: ['loc-1'],
    availability: {
      1: generateMorningAvailability(),
      2: generateAfternoonAvailability(),
      3: generateFullDayAvailability(),
      4: generateAfternoonAvailability(),
      5: generateFullDayAvailability(),
    },
  },
  {
    id: 'phy-3',
    name: 'Dr. Emily Watson',
    specialty: 'Pediatrics',
    locationIds: ['loc-2', 'loc-3'],
    availability: {
      1: generateFullDayAvailability(),
      2: generateFullDayAvailability(),
      3: generateFullDayAvailability(),
      4: generateFullDayAvailability(),
      5: generateMorningAvailability(),
    },
  },
  {
    id: 'phy-4',
    name: 'Dr. James Kim',
    specialty: 'Cardiology',
    locationIds: ['loc-1', 'loc-3'],
    availability: {
      1: generateAfternoonAvailability(),
      2: generateFullDayAvailability(),
      3: generateAfternoonAvailability(),
      4: generateFullDayAvailability(),
      5: generateAfternoonAvailability(),
    },
  },
];

export const patients: Patient[] = [
  { id: 'pat-1', name: 'John Smith', email: 'john.smith@email.com', phone: '(555) 123-4567', dateOfBirth: '1985-03-15' },
  { id: 'pat-2', name: 'Maria Garcia', email: 'maria.garcia@email.com', phone: '(555) 234-5678', dateOfBirth: '1990-07-22' },
  { id: 'pat-3', name: 'David Johnson', email: 'david.j@email.com', phone: '(555) 345-6789', dateOfBirth: '1978-11-08' },
  { id: 'pat-4', name: 'Lisa Brown', email: 'lisa.brown@email.com', phone: '(555) 456-7890', dateOfBirth: '1995-01-30' },
  { id: 'pat-5', name: 'Robert Wilson', email: 'r.wilson@email.com', phone: '(555) 567-8901', dateOfBirth: '1982-09-12' },
  { id: 'pat-6', name: 'Jennifer Davis', email: 'j.davis@email.com', phone: '(555) 678-9012', dateOfBirth: '1988-04-25' },
  { id: 'pat-7', name: 'Michael Taylor', email: 'm.taylor@email.com', phone: '(555) 789-0123', dateOfBirth: '1972-12-03' },
  { id: 'pat-8', name: 'Amanda Martinez', email: 'a.martinez@email.com', phone: '(555) 890-1234', dateOfBirth: '1993-06-18' },
];

// Generate sample appointments for the current week
const today = new Date();
const getDateString = (daysOffset: number): string => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

export const appointments: Appointment[] = [
  {
    id: 'apt-1',
    patientId: 'pat-1',
    physicianId: 'phy-1',
    locationId: 'loc-1',
    date: getDateString(0),
    startTime: '09:00',
    duration: 30,
    status: 'confirmed',
    type: 'Annual Checkup',
  },
  {
    id: 'apt-2',
    patientId: 'pat-2',
    physicianId: 'phy-1',
    locationId: 'loc-1',
    date: getDateString(0),
    startTime: '10:30',
    duration: 15,
    status: 'pending',
    type: 'Follow-up',
  },
  {
    id: 'apt-3',
    patientId: 'pat-3',
    physicianId: 'phy-2',
    locationId: 'loc-1',
    date: getDateString(0),
    startTime: '14:00',
    duration: 45,
    status: 'confirmed',
    type: 'Consultation',
  },
  {
    id: 'apt-4',
    patientId: 'pat-4',
    physicianId: 'phy-3',
    locationId: 'loc-2',
    date: getDateString(1),
    startTime: '09:30',
    duration: 30,
    status: 'confirmed',
    type: 'Wellness Visit',
  },
  {
    id: 'apt-5',
    patientId: 'pat-5',
    physicianId: 'phy-4',
    locationId: 'loc-1',
    date: getDateString(1),
    startTime: '15:00',
    duration: 60,
    status: 'pending',
    type: 'Cardiac Evaluation',
  },
  {
    id: 'apt-6',
    patientId: 'pat-6',
    physicianId: 'phy-1',
    locationId: 'loc-2',
    date: getDateString(2),
    startTime: '08:00',
    duration: 30,
    status: 'confirmed',
    type: 'Lab Results Review',
  },
  {
    id: 'apt-7',
    patientId: 'pat-7',
    physicianId: 'phy-2',
    locationId: 'loc-1',
    date: getDateString(2),
    startTime: '11:00',
    duration: 90,
    status: 'confirmed',
    type: 'Comprehensive Exam',
  },
  {
    id: 'apt-8',
    patientId: 'pat-8',
    physicianId: 'phy-3',
    locationId: 'loc-3',
    date: getDateString(-1),
    startTime: '10:00',
    duration: 30,
    status: 'completed',
    type: 'Vaccination',
  },
  {
    id: 'apt-9',
    patientId: 'pat-1',
    physicianId: 'phy-4',
    locationId: 'loc-3',
    date: getDateString(-2),
    startTime: '16:00',
    duration: 45,
    status: 'no-show',
    type: 'Follow-up',
  },
  {
    id: 'apt-10',
    patientId: 'pat-2',
    physicianId: 'phy-1',
    locationId: 'loc-1',
    date: getDateString(-3),
    startTime: '09:00',
    duration: 30,
    status: 'cancelled',
    type: 'Consultation',
  },
];

export const appointmentTypes = [
  'Annual Checkup',
  'Follow-up',
  'Consultation',
  'Wellness Visit',
  'Lab Results Review',
  'Vaccination',
  'Comprehensive Exam',
  'Cardiac Evaluation',
  'Physical Therapy',
  'Mental Health',
];
