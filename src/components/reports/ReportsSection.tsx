import React from 'react';
import { BarChart3 } from 'lucide-react';

const ReportsSection: React.FC = () => (
  <main className="flex min-w-0 flex-1 flex-col overflow-auto p-3 md:p-6">
    <h2 className="text-2xl font-bold text-foreground">Reports</h2>
    <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <BarChart3 className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">No reports yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Reports on appointments, physicians and locations will appear here once they're available.
      </p>
    </div>
  </main>
);

export default ReportsSection;
