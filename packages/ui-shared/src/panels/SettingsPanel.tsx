import React from 'react';
import { useNavigationStore } from '@workspace/studio-core';
import ChordexSettingsPanel from '../features/chordex/settings/ChordexSettingsPanel';
import StudioHubSettingsPanel from '../features/hub/settings/StudioHubSettingsPanel';

export default function SettingsPanel() {
  const currentRoute = useNavigationStore((s) => s.history[s.history.length - 1]);
  const currentApp = currentRoute?.app ?? 'hub';

  if (currentApp === 'hub') {
    return <StudioHubSettingsPanel />;
  }

  return <ChordexSettingsPanel />;
}
