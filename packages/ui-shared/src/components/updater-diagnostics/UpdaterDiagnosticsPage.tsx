import React from 'react';
import { ComingSoonPlaceholder } from '../placeholder/ComingSoonPlaceholder';

export const UpdaterDiagnosticsPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  return (
    <ComingSoonPlaceholder
      title="Updater Diagnostics"
      subtitle="Diagnostics Maintenance"
      description="Updater Diagnostics has been retired and replaced with automated background telemetry. A new diagnostic experience is coming soon."
      icon="analytics"
      onBack={onBack}
    />
  );
};

export default UpdaterDiagnosticsPage;
