import React, { useState } from 'react';
import { Physician, Location } from '@/types';
import { useLocations, usePhysicians, useSaveSchedule } from '@/api/hooks';
import PhysicianCard from './PhysicianCard';
import PhysicianScheduleEditor from './PhysicianScheduleEditor';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';

const PhysiciansSection: React.FC = () => {
  const { data: physicians = [], isPending } = usePhysicians();
  const { data: locations = [] } = useLocations();
  const saveSchedule = useSaveSchedule();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhysician, setSelectedPhysician] = useState<Physician | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);

  const handleEditSchedule = (physician: Physician, location: Location) => {
    setSelectedPhysician(physician);
    setSelectedLocation(location);
    setScheduleEditorOpen(true);
  };

  const handleSaveSchedule = (physicianId: string, locationId: string, ranges: { weekday: number; start: string; end: string }[]) => {
    saveSchedule.mutate({ physicianId, locationId, ranges });
  };

  const filteredPhysicians = physicians.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-w-0 flex-1 overflow-auto p-3 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Physicians</h1>
        </div>
        <p className="text-muted-foreground">
          Manage physician schedules and availability by location
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or specialty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Physicians grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPhysicians.map(physician => (
          <PhysicianCard
            key={physician.id}
            physician={physician}
            locations={locations}
            onEditSchedule={handleEditSchedule}
          />
        ))}
      </div>

      {!isPending && filteredPhysicians.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No physicians found matching your search</p>
        </div>
      )}

      {/* Schedule Editor Dialog */}
      <PhysicianScheduleEditor
        physician={selectedPhysician}
        location={selectedLocation}
        open={scheduleEditorOpen}
        onOpenChange={setScheduleEditorOpen}
        onSave={handleSaveSchedule}
      />
    </div>
  );
};

export default PhysiciansSection;
