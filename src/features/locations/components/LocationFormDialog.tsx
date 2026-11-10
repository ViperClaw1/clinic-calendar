import React, { useEffect, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { useSaveLocation } from '@/features/locations/api';
import { GeocodeError, GeocodeHit, geocodeAddress, googleMapsKey, staticMapUrl, timezoneFor } from '@/features/locations/geocode';
import { Location } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LocationFormDialogProps {
  open: boolean;
  location: Location | null;
  ownerId: string;
  onOpenChange: (open: boolean) => void;
}

interface ResolvedPlace {
  address: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
}

const LocationFormDialog: React.FC<LocationFormDialogProps> = ({ open, location, ownerId, onOpenChange }) => {
  const save = useSaveLocation();
  const key = googleMapsKey();
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [resolved, setResolved] = useState<ResolvedPlace | null>(null);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [emptyQuery, setEmptyQuery] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(location?.name ?? '');
    setQuery(location?.address ?? '');
    setHits([]);
    setResolved(location ? { address: location.address, timezone: location.timezone } : null);
    setSearching(false);
    setResolving(false);
    setSearchError(null);
    setEmptyQuery(null);
    setMapVisible(true);
  }, [open, location]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!open || !key || trimmed.length < 3 || resolved?.address === trimmed) {
      setHits([]);
      setSearching(false);
      setEmptyQuery(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      setEmptyQuery(null);
      try {
        const next = await geocodeAddress(trimmed, key, (input, init) =>
          fetch(input, { ...init, signal: controller.signal }),
        );
        if (!controller.signal.aborted) {
          setHits(next);
          setEmptyQuery(next.length === 0 ? trimmed : null);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setHits([]);
        setSearchError(error instanceof GeocodeError ? error.message : 'Could not search that address.');
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, open, resolved, key]);

  const choose = async (hit: GeocodeHit) => {
    setQuery(hit.address);
    setHits([]);
    setResolved({ address: hit.address, timezone: '', latitude: hit.latitude, longitude: hit.longitude });
    setMapVisible(true);
    setResolving(true);
    setSearchError(null);
    setName((current) => (current.trim() ? current : hit.suggestedName));
    try {
      const timezone = await timezoneFor(hit.latitude, hit.longitude, key);
      setResolved({ address: hit.address, timezone, latitude: hit.latitude, longitude: hit.longitude });
    } catch (error) {
      setResolved(null);
      setSearchError(error instanceof GeocodeError ? error.message : 'Could not determine the time zone.');
    } finally {
      setResolving(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!resolved?.timezone) return;
    save.mutate(
      {
        id: location?.id,
        name: name.trim(),
        address: resolved.address,
        timezone: resolved.timezone,
        createdBy: ownerId,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const hasCoordinates = resolved?.latitude != null && resolved.longitude != null;
  const canSave = name.trim().length > 0 && !!resolved?.timezone && !resolving && !save.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{location ? 'Edit location' : 'New location'}</DialogTitle>
          <DialogDescription>
            Search with Google Geocoding and pick a result. The time zone is taken from that place.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location-name">Name</Label>
            <Input
              id="location-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-address">Address</Label>
            <Input
              id="location-address"
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls="location-address-results"
              aria-autocomplete="list"
              value={query}
              placeholder="Search for an address"
              autoComplete="off"
              disabled={!key}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                setResolved((current) => (current && current.address === value ? current : null));
              }}
            />
            {!key && (
              <p className="text-sm text-destructive">
                Add VITE_GOOGLE_MAPS_API_KEY to the environment to search addresses.
              </p>
            )}
            {searching && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Searching…
              </p>
            )}
            {resolving && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Checking the time zone…
              </p>
            )}
            {searchError && <p className="text-sm text-destructive">{searchError}</p>}
            {hits.length > 0 && (
              <ul id="location-address-results" role="listbox" aria-label="Address matches" className="rounded-md border border-border">
                {hits.map((hit) => (
                  <li key={hit.placeId} role="presentation">
                    <button
                      type="button"
                      role="option"
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => choose(hit)}
                    >
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span>{hit.address}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {emptyQuery === query.trim() && !searching && !searchError && (
              <p className="text-sm text-muted-foreground">No places matched that address.</p>
            )}
            {resolved?.timezone && (
              <p className="text-xs text-muted-foreground">Time zone: {resolved.timezone}</p>
            )}
            {hasCoordinates && key && mapVisible && resolved.latitude != null && resolved.longitude != null && (
              <img
                src={staticMapUrl(resolved.latitude, resolved.longitude, key)}
                alt={`Map of ${resolved.address}`}
                className="h-40 w-full rounded-md border border-border object-cover"
                onError={() => setMapVisible(false)}
              />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave}>
              {location ? 'Save' : 'Add location'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LocationFormDialog;
