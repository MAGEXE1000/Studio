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
      <div style={{ padding: '16px 20px 0 20px' }}>
        <div style={{
          display: 'flex',
          background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
          padding: '4px',
          borderRadius: '12px',
          border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
          gap: '4px'
        }}>
          <button
            onClick={() => setSubView('pitch')}
            style={{
              flex: 1,
              height: '36px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              fontFamily: 'Manrope, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              border: 'none',
              background: subView === 'pitch' ? `linear-gradient(135deg, ${acc.from}, ${acc.to})` : 'transparent',
              color: subView === 'pitch' ? '#fff' : 'var(--c-text-secondary)',
              transition: 'all 200ms ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>query_stats</span>
            <span>{vt.tabMonitor || (settings.language === 'es' ? 'Monitor de Voz' : 'Vocal Monitor')}</span>
          </button>
          <button
            onClick={() => setSubView('practice')}
            style={{
              flex: 1,
              height: '36px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              fontFamily: 'Manrope, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              border: 'none',
              background: subView === 'practice' ? `linear-gradient(135deg, ${acc.from}, ${acc.to})` : 'transparent',
              color: subView === 'practice' ? '#fff' : 'var(--c-text-secondary)',
              transition: 'all 200ms ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>school</span>
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
