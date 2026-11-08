import React, { useEffect, useState } from 'react';
import { useCreatePatient } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (patientId: string) => void;
}

const EMPTY = { name: '', email: '', phone: '', dateOfBirth: '' };

const NewPatientDialog: React.FC<NewPatientDialogProps> = ({ open, onOpenChange, onCreated }) => {
  const [form, setForm] = useState(EMPTY);
  const createPatient = useCreatePatient();

  useEffect(() => {
    if (open) setForm(EMPTY);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPatient.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth || undefined,
      },
      {
        onSuccess: (id) => {
          onCreated(id);
          onOpenChange(false);
        },
      },
    );
  };

  const field = (key: keyof typeof EMPTY) => ({
    id: `patient-${key}`,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Patient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient-name">Full name</Label>
            <Input {...field('name')} autoComplete="off" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-email">Email</Label>
            <Input {...field('email')} type="email" autoComplete="off" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-phone">Phone</Label>
            <Input {...field('phone')} type="tel" autoComplete="off" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-dateOfBirth">Date of birth (optional)</Label>
            <Input {...field('dateOfBirth')} type="date" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createPatient.isPending}>Add patient</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewPatientDialog;
