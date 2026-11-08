import React, { useState } from 'react';
import { Clock, MapPin, Settings } from 'lucide-react';
import { useLocations, useMembership, usePhysicians, useSaveSchedule, useSession, useSetPhysicianLocation } from '@/api/hooks';
import PhysicianScheduleEditor from '@/components/physicians/PhysicianScheduleEditor';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Location } from '@/types';

const SettingsSection: React.FC = () => {
  const session = useSession();
  const { data: membership } = useMembership(session?.user.id);
  const { data: physicians = [] } = usePhysicians();
  const { data: locations = [] } = useLocations();
  const setPhysicianLocation = useSetPhysicianLocation();
  const saveSchedule = useSaveSchedule();
  const [editedLocation, setEditedLocation] = useState<Location | null>(null);

  const physician = physicians.find((p) => p.id === membership?.physician_id);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>
        <p className="text-muted-foreground">Choose where you work and set your available hours at each location</p>
      </div>

      {!physician ? (
        <p className="text-muted-foreground">
          {membership?.physician_id ? 'Loading…' : 'These settings are available to physicians.'}
        </p>
      ) : (
        <section aria-labelledby="my-locations" className="max-w-2xl rounded-lg border border-border bg-card p-4">
          <h2 id="my-locations" className="mb-3 flex items-center gap-2 font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            My locations and hours
          </h2>
          {locations.length === 0 && (
            <p className="text-sm text-muted-foreground">No locations have been added to the clinic yet.</p>
          )}
          <ul className="divide-y divide-border">
            {locations.map((location) => {
              const enabled = physician.locationIds.includes(location.id);
              const checkboxId = `location-${location.id}`;
              return (
                <li key={location.id} className="flex items-center gap-3 py-3">
                  <Checkbox
                    id={checkboxId}
                    checked={enabled}
                    disabled={setPhysicianLocation.isPending}
                    onCheckedChange={(checked) =>
                      setPhysicianLocation.mutate({
                        physicianId: physician.id,
                        locationId: location.id,
                        enabled: checked === true,
                      })
                    }
                  />
                  <label htmlFor={checkboxId} className="min-w-0 flex-1 cursor-pointer">
                    <span className="block truncate text-sm font-medium text-foreground">{location.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{location.address}</span>
                  </label>
                  <Button variant="outline" size="sm" disabled={!enabled} onClick={() => setEditedLocation(location)}>
                    <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
                    Edit hours
                  </Button>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Removing a location also removes your hours there. Existing appointments are not changed.
          </p>
        </section>
      )}

      <PhysicianScheduleEditor
        physician={physician ?? null}
        location={editedLocation}
        open={!!editedLocation}
        onOpenChange={(open) => !open && setEditedLocation(null)}
        onSave={(physicianId, locationId, ranges) => saveSchedule.mutate({ physicianId, locationId, ranges })}
      />
    </div>
  );
};

export default SettingsSection;
