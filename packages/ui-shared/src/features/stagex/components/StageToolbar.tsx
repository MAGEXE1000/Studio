import React from 'react';
import { Toolbar, ActionButton } from '../../../components/design-system/StudioDesignSystem';

interface StageToolbarProps {
  curView: string;
  isLight: boolean;
  tr: any;
  callIframe: (fn: string, arg?: string | number) => void;
  transitionToView: (view: string) => void;
  openPdfSheet: () => void;
}

export const StageToolbar: React.FC<StageToolbarProps> = ({
  curView,
  isLight,
  tr,
  callIframe,
  transitionToView,
  openPdfSheet,
}) => {
  return (
          <Toolbar
            className={`border-b ${isLight ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-900 bg-[#080808]'} h-12 flex-shrink-0 select-none`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`font-extrabold text-[10px] uppercase ${isLight ? 'text-zinc-850' : 'text-white'} tracking-widest`}
                style={{ letterSpacing: '0.08em' }}
              >
                Stagex
              </span>
              <div className={`h-4 w-[1px] ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`} />
              <span className="text-[8.5px] text-zinc-500 font-extrabold uppercase tracking-widest">
                {curView === 'Editor'
                  ? 'Stage Plot Editor'
                  : curView === 'Export'
                    ? 'Rider Export'
                    : 'Setup & Options'}
              </span>
            </div>

            {curView === 'Editor' && (
              <div className="flex gap-1.5">
                {[
                  {
                    label: tr.stagex.toolMeasure,
                    icon: 'straighten',
                    fn: () => callIframe('scActivateMeasure'),
                  },
                  {
                    label: tr.stagex.toolHistory,
                    icon: 'history',
                    fn: () => callIframe('openTimelinePanel'),
                  },
                ].map(({ label, icon, fn }) => (
                  <ActionButton
                    key={label}
                    onClick={fn}
                    variant={'secondary' as any}
                    className="h-8 !px-2.5"
                  >
                    <span className="material-symbols-outlined text-[15px]">{icon}</span>
                    {label}
                  </ActionButton>
                ))}
                <ActionButton
                  onClick={() => callIframe('openPresetsPanel')}
                  variant={'secondary' as any}
                  className="h-8 !px-2.5"
                >
                  <span className="material-symbols-outlined text-[15px]">save</span>
                  Save Preset
                </ActionButton>
                <ActionButton
                  onClick={() => transitionToView('Export')}
                  variant={'secondary' as any}
                  className="h-8 !px-2.5"
                >
                  <span className="material-symbols-outlined text-[15px]">picture_as_pdf</span>
                  Export Rider
                </ActionButton>
              </div>
            )}

            {curView === 'Export' && (
              <div className="flex gap-1.5">
                <ActionButton
                  onClick={() => transitionToView('Editor')}
                  variant={'secondary' as any}
                  className="h-8 !px-2.5"
                >
                  <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                  Editor
                </ActionButton>
                <ActionButton
                  onClick={() => callIframe('toggleExportOptions')}
                  variant={'secondary' as any}
                  className="h-8 !px-2.5"
                >
                  <span className="material-symbols-outlined text-[15px]">tune</span>
                  Sections
                </ActionButton>
                <ActionButton onClick={openPdfSheet} variant={'primary' as any} className="h-8 !px-2.5">
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  Get PDF
                </ActionButton>
              </div>
            )}
          </Toolbar>
  );
};
