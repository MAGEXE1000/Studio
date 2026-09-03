import React, { useState, useEffect } from 'react';
import { useBackHandler, useT } from '@workspace/studio-core';
import { StudioPageTransition } from '../../../../components/StudioPageTransition';
import { SharedFloatingHeader } from '../../../../shared/layout/StudioLayoutSystem';
import { StageSetupHub } from './StageSetupHub';
import { StageRiderView } from './StageRiderView';
import { StageSetlistView } from './StageSetlistView';
import { StageGearView } from './StageGearView';
import { StageMembersView } from './StageMembersView';
import { type StagexSubView } from '../../state/useStagexStore';

export interface StageSetupContainerProps {
  initialSubView?: StagexSubView | 'hub';
  onBackToStage?: () => void;
  isLight?: boolean;
}

export const StageSetupContainer: React.FC<StageSetupContainerProps> = ({
  initialSubView = 'hub',
  onBackToStage,
  isLight = false,
}) => {
  const [activeSubView, setActiveSubView] = useState<StagexSubView | 'hub'>(initialSubView);
  const t = useT();
  const tr = t as any;

  // Sync initialSubView changes
  useEffect(() => {
    if (initialSubView) setActiveSubView(initialSubView);
  }, [initialSubView]);

  // Handle hardware / system back navigation
  useBackHandler(
    'nested',
    () => {
      if (activeSubView !== 'hub') {
        setActiveSubView('hub');
        return true;
      }
      return false;
    },
    [activeSubView]
  );

  const subViewTitles: Record<StagexSubView | 'hub', string> = {
    hub: tr.stagex?.setup || 'Setup & Options',
    rider: tr.stagex?.techRider || 'Technical Rider',
    setlist: tr.stagex?.setlist || 'Setlist',
    gear: tr.stagex?.gearInventory || 'Gear Inventory',
    members: tr.stagex?.bandMembers || 'Band & Crew',
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-transparent">
      {/* Canonical Stagex Detail Floating Topbar at the root of Setup */}
      {activeSubView === 'hub' && (
        <SharedFloatingHeader title={tr.stagex?.setupTitle || 'Setup'} hideBack={true} />
      )}

      {/* Content Area with Canonical StudioPageTransition */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <StudioPageTransition
          pageKey={activeSubView}
          variant={activeSubView === 'hub' ? 'tab' : 'drilldown'}
        >
          {activeSubView === 'hub' && (
            <div
              className="w-full h-full overflow-y-auto"
              style={{
                paddingTop:
                  'calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 80px)',
              }}
            >
              <StageSetupHub onSelectSubView={(sv) => setActiveSubView(sv)} isLight={isLight} />
            </div>
          )}

          {activeSubView === 'rider' && (
            <div className="w-full h-full">
              <StageRiderView onBack={() => setActiveSubView('hub')} isLight={isLight} />
            </div>
          )}

          {activeSubView === 'setlist' && (
            <div className="w-full h-full">
              <StageSetlistView onBack={() => setActiveSubView('hub')} isLight={isLight} />
            </div>
          )}

          {activeSubView === 'gear' && (
            <div className="w-full h-full">
              <StageGearView onBack={() => setActiveSubView('hub')} isLight={isLight} />
            </div>
          )}

          {activeSubView === 'members' && (
            <div className="w-full h-full">
              <StageMembersView onBack={() => setActiveSubView('hub')} isLight={isLight} />
            </div>
          )}
        </StudioPageTransition>
      </div>
    </div>
  );
};
