import React from 'react';
import DevToolsDashboard from './components/DevToolsDashboard';

export default function DevToolsApp() {
  const accent = { from: '#ef4444', mid: '#f87171', to: '#fca5a5' };
  
  return (
    <DevToolsDashboard
      accent={accent}
      onBack={() => {
        // Handled by the standard back mechanism inside DevToolsDashboard
      }}
    />
  );
}
