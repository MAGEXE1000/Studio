import React, { useState, useEffect } from 'react';
import { useBackHandler, useT } from '@workspace/studio-core';
import { StudioHeader } from '../../../../shared/layout/StudioHeader';
import { SharedFloatingHeader } from '../../../../shared/layout/StudioLayoutSystem';
import { StudioPageTransition } from '../../../../components/StudioPageTransition';
import { StageSetupHub } from './StageSetupHub';
import { StageRiderView } from './StageRiderView';
import { StageSetlistView } from './StageSetlistView';
import { StageGearView } from './StageGearView';
import { StageMembersView } from './StageMembersView';
import { type StagexSubView } from '../../state/useStagexStore';

export interface StageSetupContainerProps {
  initialSubView?: StagexSubView | 'hub';
  onBackToStage?: () => void;
}

export const StageSetupContainer: React.FC<StageSetupContainerProps> = ({
  initialSubView = 'hub',
  onBackToStage,
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
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-[var(--app-bg)]">
      {/* Canonical StudioHeader at the root of Setup */}
      {activeSubView === 'hub' ? (
        <div className="flex-shrink-0 px-4 sm:px-6 pt-2">
          <StudioHeader
            title={tr.stagex?.setup || 'Setup & Options'}
            subtitle={
              tr.stagex?.setupSubtitle || 'Configure stage plot equipment, setlist, and crew specs.'
            }
            disableHorizontalPadding={true}
          />
        </div>
      ) : (
        /* Drilldown floating header on subviews with back button */
        <SharedFloatingHeader
          title={subViewTitles[activeSubView] || 'Setup'}
          onBack={() => setActiveSubView('hub')}
          hideBack={false}
        />
      )}

      {/* Content Area with Canonical StudioPageTransition */}
      <div className="flex-1 overflow-y-auto relative w-full h-full">
        <StudioPageTransition
          pageKey={activeSubView}
          variant={activeSubView === 'hub' ? 'tab' : 'drilldown'}
        >
          {activeSubView === 'hub' && (
            <div className="p-4 sm:p-6 pb-28 max-w-4xl mx-auto">
              <StageSetupHub onSelectSubView={(sv) => setActiveSubView(sv)} />
            </div>
          )}

          {activeSubView === 'rider' && (
            <div className="pt-16 pb-28">
              <StageRiderView onBack={() => setActiveSubView('hub')} />
            </div>
          )}

          {activeSubView === 'setlist' && (
            <div className="pt-16 pb-28">
              <StageSetlistView onBack={() => setActiveSubView('hub')} />
            </div>
          )}

          {activeSubView === 'gear' && (
            <div className="pt-16 pb-28">
              <StageGearView onBack={() => setActiveSubView('hub')} />
            </div>
          )}

          {activeSubView === 'members' && (
            <div className="pt-16 pb-28">
              <StageMembersView onBack={() => setActiveSubView('hub')} />
            </div>
          )}
        </StudioPageTransition>
      </div>
    </div>
  );
};
