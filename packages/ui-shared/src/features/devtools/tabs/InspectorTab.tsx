import React from 'react';
import { DeveloperInspectorPanel } from '../inspector';

interface Props {
  accent: { from: string; mid?: string; to: string };
  onBack?: () => void;
}

export const InspectorTab: React.FC<Props> = () => {
  return (
    <div className="w-full h-full p-4 overflow-y-auto">
      <DeveloperInspectorPanel />
    </div>
  );
};

export default InspectorTab;
