import { useT, useChordStore, ACCENT_COLORS } from '@workspace/studio-core';
import { useState } from 'react';
import PitchPanel from './PitchPanel';
import PracticePanel from './PracticePanel';

export default function CoachPanel({ active = true }: { active?: boolean }) {
  const t = useT();
  const settings = useChordStore(s => s.settings);
  const activeVis = settings.perApp?.vocalex ?? { theme: 'dark', accentColor: 'blue' };
  const acc = ACCENT_COLORS[activeVis.accentColor] ?? ACCENT_COLORS.blue;
  const isLight = activeVis.theme === 'light' || 
    (activeVis.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);

  const [subView, setSubView] = useState<'pitch' | 'practice'>('pitch');
  const vt = t.vocalex as any;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sub-tab segment selector */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 20px 8px' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          width: '330px',
          background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
          padding: '3px',
          borderRadius: '10px',
          border: '1px solid rgba(128,128,128,0.06)',
          userSelect: 'none',
        }}>
          {/* Sliding Pill Indicator */}
          <div style={{
            position: 'absolute',
            left: '3px',
            top: '3px',
            bottom: '3px',
            width: 'calc(50% - 3px)',
            transform: subView === 'pitch' ? 'translateX(0)' : 'translateX(100%)',
            background: isLight ? '#ffffff' : 'rgba(255,255,255,0.08)',
            borderRadius: '7px',
            transition: 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.25)',
            zIndex: 0,
          }} />

          <button
            onClick={() => setSubView('pitch')}
            style={{
              position: 'relative',
              zIndex: 1,
              flex: 1,
              height: '30px',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '12.5px',
              fontFamily: 'Manrope, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              color: subView === 'pitch' ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
              transition: 'color 200ms ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '17px', color: subView === 'pitch' ? acc.from : 'inherit', transition: 'color 200ms ease' }}>query_stats</span>
            <span>{vt.tabMonitor || (settings.language === 'es' ? 'Monitor de Voz' : 'Vocal Monitor')}</span>
          </button>

          <button
            onClick={() => setSubView('practice')}
            style={{
              position: 'relative',
              zIndex: 1,
              flex: 1,
              height: '30px',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '12.5px',
              fontFamily: 'Manrope, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              color: subView === 'practice' ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
              transition: 'color 200ms ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '17px', color: subView === 'practice' ? acc.from : 'inherit', transition: 'color 200ms ease' }}>school</span>
            <span>{vt.tabExercises || (settings.language === 'es' ? 'Ejercicios Vocales' : 'Vocal Exercises')}</span>
          </button>
        </div>
      </div>

      {/* View Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{
          display: subView === 'pitch' ? 'block' : 'none',
          height: '100%'
        }}>
          <PitchPanel active={active && subView === 'pitch'} />
        </div>
        <div style={{
          display: subView === 'practice' ? 'block' : 'none',
          height: '100%'
        }}>
          <PracticePanel />
        </div>
      </div>
    </div>
  );
}
