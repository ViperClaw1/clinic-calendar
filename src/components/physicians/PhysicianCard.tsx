import React from 'react';
import { Physician, Location } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock } from 'lucide-react';

interface PhysicianCardProps {
  physician: Physician;
  locations: Location[];
  onEditSchedule: (physician: Physician, location: Location) => void;
}

const PhysicianCard: React.FC<PhysicianCardProps> = ({ physician, locations, onEditSchedule }) => {
  const physicianLocations = locations.filter(loc => physician.locationIds.includes(loc.id));
  
  // Get initials for avatar
  const initials = physician.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary">{initials}</span>
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{physician.name}</h3>
            <p className="text-sm text-muted-foreground">{physician.specialty}</p>
            
            {/* Locations */}
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Locations & Schedules
              </p>
              <div className="flex flex-wrap gap-2">
                {physicianLocations.map(location => (
                  <button
                    key={location.id}
                    onClick={() => onEditSchedule(physician, location)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-xs font-medium text-foreground transition-colors"
                  >
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    {location.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhysicianCard;
