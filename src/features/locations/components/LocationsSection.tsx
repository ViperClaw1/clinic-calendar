import React, { useState } from 'react';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMembership, useLocations, useSession } from '@/api/hooks';
import { useDeleteLocation } from '@/features/locations/api';
import LocationFormDialog from '@/features/locations/components/LocationFormDialog';
import { Location } from '@/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const LocationsSection: React.FC = () => {
  const session = useSession();
  const { data: membership, isPending: membershipPending } = useMembership(session?.user.id);
  const { data: locations = [], isPending } = useLocations();
  const remove = useDeleteLocation();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Location | null>(null);

  const role = membership?.role;
  const userId = session?.user.id;
  const canAdd = role === 'admin' || role === 'physician';
  const visible = role === 'physician' ? locations.filter((location) => location.createdBy === userId) : locations;

  const canEdit = (location: Location) =>
    role === 'admin' || (role === 'physician' && location.createdBy === userId);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (location: Location) => {
    setEditing(location);
    setFormOpen(true);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <MapPin className="h-6 w-6 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-foreground">Locations</h1>
          </div>
          <p className="text-muted-foreground">
            {role === 'physician'
              ? 'Add, edit, and remove the places where you see patients.'
              : role === 'admin'
                ? 'Add, edit, and remove clinic locations.'
                : 'Clinic locations used on the calendar.'}
          </p>
        </div>
        {canAdd && (
          <Button onClick={openCreate} className="h-9 gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add location
          </Button>
        )}
      </div>

      {session === undefined || membershipPending || (isPending && locations.length === 0) ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <MapPin className="mx-auto mb-3 h-12 w-12 opacity-50" aria-hidden="true" />
          <p>{role === 'physician' ? 'You have not added a location yet.' : 'No locations yet.'}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((location) => (
            <li key={location.id} className="flex flex-col rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-foreground">{location.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{location.address}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{location.timezone}</p>
                </div>
                <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
              </div>
              {canEdit(location) && (
                <div className="mt-auto flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(location)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPendingDelete(location)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {userId && (
        <LocationFormDialog
          open={formOpen}
          location={editing}
          ownerId={userId}
          onOpenChange={setFormOpen}
        />
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && !remove.isPending && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Hours at this place are removed. If appointments are still booked here, deletion is blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={remove.isPending || !pendingDelete}
              onClick={() =>
                pendingDelete &&
                remove.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
              }
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LocationsSection;
