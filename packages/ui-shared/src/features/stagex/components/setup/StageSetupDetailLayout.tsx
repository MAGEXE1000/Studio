import React from 'react';
import { SharedFloatingHeader } from '../../../../shared/layout/StudioLayoutSystem';
import { useSettingsStore } from '@workspace/studio-core';

export interface StageSetupDetailLayoutProps {
  title: string;
  onBack: () => void;
  toolbarActions?: React.ReactNode;
  isLight?: boolean;
  children: React.ReactNode;
}

export const StageSetupDetailLayout: React.FC<StageSetupDetailLayoutProps> = ({
  title,
  onBack,
  toolbarActions,
  isLight: isLightProp,
  children,
}) => {
  const settings = useSettingsStore((s) => s.settings);
  const activeVis = settings.perApp?.stagex;
  const isLight =
    isLightProp !== undefined ? isLightProp : activeVis ? activeVis.theme === 'light' : false;

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col bg-transparent">
      {/* Canonical Stagex Detail Floating Topbar */}
      <SharedFloatingHeader
        title={title}
        onBack={onBack}
        hideBack={false}
        toolbarActions={toolbarActions}
      />

      {/* Continuous Scrolling Content Area with Safe-Area Insets */}
      <div
        className="flex-1 overflow-y-auto w-full h-full relative"
        style={{
          paddingTop: 'calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 80px)',
          paddingBottom:
            'calc(var(--content-bottom-pad, 88px) + env(safe-area-inset-bottom, 0px) + 32px)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">{children}</div>
      </div>
    </div>
  );
};
