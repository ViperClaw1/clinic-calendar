import React, { useState, useEffect } from 'react';
import { X, Clock, User, MapPin, Calendar, FileText, Ban } from 'lucide-react';
import { useAppointmentStore } from '@/store/appointmentStore';
import { useAppointments, useAppointmentTypes, useCreateAppointment, useLocations, usePatients, usePhysicians, useUpdateAppointment } from '@/api/hooks';
import { isSlotAvailable, formatTime, generateTimeSlots } from '@/utils/calendarUtils';
import { Appointment, AppointmentDuration, AppointmentStatus } from '@/types';
import NewPatientDialog from '@/components/NewPatientDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format, isValid, parseISO } from 'date-fns';

const AppointmentSidebar: React.FC = () => {
  const {
    sidebarOpen,
    sidebarAppointment,
    editingAppointmentId,
    closeSidebar
  } = useAppointmentStore();
  const { data: physicians = [] } = usePhysicians();
  const { data: patients = [] } = usePatients();
  const { data: locations = [] } = useLocations();
  const { data: appointmentTypes = [] } = useAppointmentTypes();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const saving = createAppointment.isPending || updateAppointment.isPending;

  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const isEditing = !!editingAppointmentId;

  const [formData, setFormData] = useState({
    patientId: '',
    physicianId: '',
    locationId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    duration: 30 as AppointmentDuration,
    status: 'pending' as AppointmentStatus,
    type: '',
    notes: '',
  });

  useEffect(() => {
    if (sidebarAppointment) {
      setFormData({
        patientId: sidebarAppointment.patientId || '',
        physicianId: sidebarAppointment.physicianId || '',
        locationId: sidebarAppointment.locationId || '',
        date: sidebarAppointment.date || format(new Date(), 'yyyy-MM-dd'),
        startTime: sidebarAppointment.startTime || '09:00',
        duration: sidebarAppointment.duration || 30,
        status: sidebarAppointment.status || 'pending',
        type: sidebarAppointment.type || '',
        notes: sidebarAppointment.notes || '',
      });
    } else {
      setFormData({
        patientId: '',
        physicianId: '',
        locationId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        duration: 30,
        status: 'pending',
        type: '',
        notes: '',
      });
    }
  }, [sidebarAppointment, sidebarOpen]);

  // new Date('yyyy-MM-dd') is UTC midnight, the previous day west of UTC; parseISO is local.
  const parsedDate = parseISO(formData.date);
  const formDate = isValid(parsedDate) ? parsedDate : new Date();
  const { data: appointments = [] } = useAppointments(formDate, formDate);

  const selectedPhysician = physicians.find((p) => p.id === formData.physicianId);
  const filteredLocations = selectedPhysician
    ? locations.filter((l) => selectedPhysician.locationIds.includes(l.id))
    : locations;

  const timeSlots = generateTimeSlots();
  const availableTimeSlots = selectedPhysician
    ? timeSlots.filter((time) => {
        return isSlotAvailable(
          selectedPhysician,
          formDate,
          time,
          formData.duration,
          appointments,
          editingAppointmentId || undefined,
          formData.locationId
        );
      })
    : timeSlots;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId || !formData.physicianId || !formData.locationId || !formData.type) {
      return;
    }

    if (isEditing && editingAppointmentId) {
      updateAppointment.mutate({ ...formData, id: editingAppointmentId }, { onSuccess: closeSidebar });
    } else {
      createAppointment.mutate(formData, { onSuccess: closeSidebar });
    }
  };

  // Appointments are never deleted (ADR-0001): cancelling keeps the record.
  const handleCancelAppointment = () => {
    if (editingAppointmentId) {
      updateAppointment.mutate({ ...formData, id: editingAppointmentId, status: 'cancelled' }, { onSuccess: closeSidebar });
    }
  };

  if (!sidebarOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 animate-fade-in"
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 animate-slide-in-right overflow-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          <Button variant="ghost" size="icon" onClick={closeSidebar}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Patient
            </Label>
            <Select
              value={formData.patientId}
              onValueChange={(value) => setFormData({ ...formData, patientId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => setNewPatientOpen(true)}>
              + New patient
            </Button>
          </div>

          {/* Physician Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Physician
            </Label>
            <Select
              value={formData.physicianId}
              onValueChange={(value) => setFormData({
                ...formData,
                physicianId: value,
                locationId: '' // Reset location when physician changes
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select physician" />
              </SelectTrigger>
              <SelectContent>
                {physicians.map((physician) => (
                  <SelectItem key={physician.id} value={physician.id}>
                    <div>
                      <div>{physician.name}</div>
                      <div className="text-xs text-muted-foreground">{physician.specialty}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Location
            </Label>
            <Select
              value={formData.locationId}
              onValueChange={(value) => setFormData({ ...formData, locationId: value })}
              disabled={!formData.physicianId}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.physicianId ? "Select location" : "Select physician first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    <div>
                      <div>{location.name}</div>
                      <div className="text-xs text-muted-foreground">{location.address}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Date
            </Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          {/* Time and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Start Time
              </Label>
              <Select
                value={formData.startTime}
                onValueChange={(value) => setFormData({ ...formData, startTime: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {formatTime(time)}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No available slots
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={String(formData.duration)}
                onValueChange={(value) => setFormData({ ...formData, duration: Number(value) as AppointmentDuration })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedPhysician && selectedPhysician.availability.length === 0 && (
            <p role="status" className="text-sm text-muted-foreground">
              {selectedPhysician.name} has no schedule yet. Add working hours in the Physicians section to book appointments.
            </p>
          )}

          {/* Appointment Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Appointment Type
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status (only for editing) */}
          {isEditing && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as AppointmentStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this appointment..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {isEditing && formData.status !== 'cancelled' && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancelAppointment}
                disabled={saving}
                className="gap-2"
              >
                <Ban className="h-4 w-4" />
                Cancel appointment
              </Button>
            )}
            <Button type="button" variant="outline" onClick={closeSidebar} className="flex-1">
              Close
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={saving || !formData.patientId || !formData.physicianId || !formData.locationId || !formData.type}
            >
              {isEditing ? 'Update' : 'Schedule'}
            </Button>
          </div>
        </form>
      </div>

      {/* Outside the form above: React events bubble through portals, so a nested submit would also book. */}
      <NewPatientDialog
        open={newPatientOpen}
        onOpenChange={setNewPatientOpen}
        onCreated={(patientId) => setFormData((current) => ({ ...current, patientId }))}
      />
    </>
  );
};

export default AppointmentSidebar;
