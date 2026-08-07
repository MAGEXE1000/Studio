import { Dialog } from '../../../shared/design-system/dialogs';
import { NavigationDispatcher } from '@workspace/studio-core';
import { useChordStore, ACCENT_COLORS, type AppKey, useT, useSettingsStore } from '@workspace/studio-core';
import React, { useState, useEffect } from 'react';
import {
  StudioLogo,
  ChordexLogo,
  DrumexLogo,
  StagexLogoIcon,
  GroovexLogo,
  VocalexLogo,
} from '../icons/ChordexLogo';
;
import { Button } from '../../../shared/design-system/StudioDesignSystem';

interface AppCard {
  key: AppKey;
  label: string;
  Logo: React.ComponentType<{ size?: number }>;
}

const APP_CARDS: AppCard[] = [
  { key: 'hub', label: 'Studio', Logo: StudioLogo },
  { key: 'chordex', label: 'Chordex', Logo: ChordexLogo },
  { key: 'drumex', label: 'Drumex', Logo: DrumexLogo },
  { key: 'stagex', label: 'Stagex', Logo: StagexLogoIcon },
  { key: 'groovex', label: 'Groovex', Logo: GroovexLogo },
  { key: 'vocalex', label: 'Vocalex', Logo: VocalexLogo },
];

interface ApplyToSheetProps {
  show: boolean;
  onApply: (apps: AppKey[]) => void;
  onClose: () => void;
}

export default function ApplyToSheet({ show, onApply, onClose }: ApplyToSheetProps) {
  const settings = useSettingsStore((s) => s.settings);
  const t = useT();
  const appKey = (NavigationDispatcher.currentApp()) as AppKey;
  const perApp = settings.perApp;
  const vis = perApp?.[appKey] ?? { accentColor: 'blue' };
  const accent = ACCENT_COLORS[vis.accentColor as keyof typeof ACCENT_COLORS];

  const [selected, setSelected] = useState<Set<AppKey>>(
    new Set(['hub', 'chordex', 'drumex', 'stagex', 'groovex', 'vocalex'])
  );

  useEffect(() => {
    if (show) {
      setSelected(new Set(['hub', 'chordex', 'drumex', 'stagex', 'groovex', 'vocalex']));
    }
  }, [show]);

  function toggle(key: AppKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handleApply() {
    onApply(Array.from(selected));
  }

  return (
    <Dialog
      open={show}
      onClose={onClose}
      title={t.applyTo.title}
      footer={
        <Button variant="primary" onClick={handleApply} style={{ width: '100%' }}>
          {t.applyTo.apply}
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p
          style={{
            textAlign: 'center',
            margin: '0 0 4px',
            fontSize: 13,
            color: 'var(--c-text-secondary)',
            fontFamily: 'Inter',
          }}
        >
          {t.applyTo.subtitle}
        </p>

        {/* App cards */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {APP_CARDS.map(({ key, label, Logo }) => {
            const active = selected.has(key);
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                className="btn-smooth"
                style={{
                  width: 'calc(33.333% - 8px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '18px 8px',
                  borderRadius: 18,
                  background: active ? `var(--c-accent-from)18` : 'var(--c-surface-high)',
                  border: `2px solid ${active ? 'var(--c-accent-from)' : 'var(--c-border)'}`,
                  transition: 'background 200ms ease, border-color 200ms ease',
                  position: 'relative',
                }}
              >
                {/* Check badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: active ? 'var(--c-accent-from)' : 'rgba(128,128,128,0.15)',
                    border: active ? 'none' : '1.5px solid rgba(128,128,128,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 200ms ease, border 200ms ease',
                  }}
                >
                  {active && (
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 13,
                        color: '#fff',
                        fontVariationSettings: "'FILL' 1, 'wght' 700",
                      }}
                    >
                      check
                    </span>
                  )}
                </div>

                {/* Logo */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: active ? `var(--c-accent-from)22` : 'rgba(128,128,128,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 200ms ease',
                  }}
                >
                  <Logo size={32} />
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: 'Manrope',
                    color: active ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
                    transition: 'color 200ms ease',
                  }}
                >
                  {label}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </Dialog>
  );
}
