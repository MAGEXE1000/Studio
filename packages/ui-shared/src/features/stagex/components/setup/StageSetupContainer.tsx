import React, { useState, useEffect } from 'react';
import { useBackHandler, useT } from '@workspace/studio-core';
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
      {/* Seamless header at the root of Setup */}
      {activeSubView === 'hub' && (
        <div
          className="flex-shrink-0 px-4 sm:px-6"
          style={{
            paddingTop: 'calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 12px)',
            paddingBottom: '10px',
          }}
        >
          <div className="w-full max-w-3xl mx-auto">
            <h1
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '28px',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                color: isLight ? 'var(--c-text-primary, #09090b)' : '#ffffff',
                margin: 0,
              }}
            >
              {tr.stagex?.setupTitle || 'Setup'}
            </h1>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: isLight ? 'var(--c-text-secondary, #71717a)' : '#a1a1aa',
                margin: '2px 0 0 0',
              }}
            >
              {tr.stagex?.setupSubtitle || 'Your show documents & band info'}
            </p>
            <div
              className="w-full h-px mt-4"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.06)',
              }}
            />
          </div>
        </div>
      )}

      {/* Content Area with Canonical StudioPageTransition */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <StudioPageTransition
          pageKey={activeSubView}
          variant={activeSubView === 'hub' ? 'tab' : 'drilldown'}
        >
          {activeSubView === 'hub' && (
            <div className="w-full h-full overflow-y-auto">
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
