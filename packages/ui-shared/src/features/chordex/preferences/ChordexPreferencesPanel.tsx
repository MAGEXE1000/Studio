import { Capacitor } from '@capacitor/core';
import {
  useChordStore,
  ACCENT_COLORS,
  resolveAccent,
  type ActivePanel,
  useScrollHide,
  useT,
  useIsWebDesktop,
  useSettingsStore,
  INSTRUMENT_REGISTRY,
  type InstrumentConfig,
  NavigationDispatcher,
  type Instrument,
} from '@workspace/studio-core';
import React, { useRef } from 'react';
import {
  Toggle,
  SectionHeader,
  SettingRow,
  SettingSection,
} from '../../../shared/settings/SettingControls';
import { IconSongs, IconLibrary, IconSettings } from '../../hub/icons/NavIcons';
import { ThemeToggle } from '../../../components/motion/theme-toggle';
import { AnimatedIcon } from '../../../shared/icons/AnimatedIcon';
import { StudioHeader } from '../../../shared/layout/StudioHeader';
import { Button } from '../../../shared/design-system/buttons';

export default function ChordexPreferencesPanel() {
  const settings = useSettingsStore((s) => s.settings);

  const acc = resolveAccent(settings.accentColor);

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollHide(scrollRef);
  const t = useT();

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface-card-bg, var(--app-surface))',
    borderRadius: 'var(--radius-card, 16px)',
    border: '1px solid var(--track, var(--c-border))',
    boxShadow:
      'var(--surface-card-shadow, 0 8px 24px rgba(0, 0, 0, 0.16)), var(--surface-card-inset, inset 0 1px 1px rgba(255, 255, 255, 0.08))',
    overflow: 'hidden',
    position: 'relative',
    transition: 'background-color 700ms cubic-bezier(0.4,0,0.2,1)',
  };

  const standardTuning = 'Standard (EADGBE)';

  const tunings = [
    { label: t.settings.tunings.standard, value: standardTuning },
    { label: t.settings.tunings.dropD, value: 'Drop D (DADGBE)' },
    { label: t.settings.tunings.openG, value: 'Open G (DGDGBD)' },
    { label: t.settings.tunings.openD, value: 'Open D (DADF#AD)' },
    { label: 'DADGAD', value: 'DADGAD' },
  ];

  const isWebDesktop = useIsWebDesktop();
  const isSpanish = (settings.language ?? 'en') === 'es';

  if (isWebDesktop) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-[var(--app-bg)]">
        <StudioHeader title={t.settings.title} subtitle={t.settings.subtitle} />

        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar space-y-6 px-6 pb-6">
          {/* ── INSTRUMENT ── */}
          <SettingSection title={isSpanish ? 'Instrumento Global' : 'Global Instrument'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
              {Object.values(INSTRUMENT_REGISTRY).map((inst: InstrumentConfig) => {
                const currentInst = settings.instrument || 'guitar';
                const isActive = currentInst === inst.id;
                const isSoon = inst.status === 'coming_soon';
                const instName = (t.settings.instruments as any)?.[inst.id]?.label || inst.name;
                const instDesc = (t.settings.instruments as any)?.[inst.id]?.desc || inst.subtitle;
                const instBadge =
                  inst.badge === 'NEW'
                    ? isSpanish
                      ? 'NUEVO'
                      : 'NEW'
                    : inst.badge === 'SOON'
                      ? isSpanish
                        ? 'PRONTO'
                        : 'SOON'
                      : inst.badge;

                return (
                  <div
                    key={inst.id}
                    onClick={() => {
                      if (!isSoon) {
                        useSettingsStore
                          .getState()
                          .updateSettings({ instrument: inst.id as Instrument });
                        if (inst.id === 'saxophone') {
                          NavigationDispatcher.replace({
                            app: 'chordex',
                            page: 'practice' as any,
                            tab: 'practice' as any,
                          });
                        } else {
                          NavigationDispatcher.replace({
                            app: 'chordex',
                            page: 'songs' as any,
                            tab: 'songs' as any,
                          });
                        }
                      }
                    }}
                    style={{
                      background: isActive ? 'rgba(245, 158, 11, 0.12)' : 'var(--c-surface-high)',
                      borderColor: isActive ? '#f59e0b' : 'var(--c-border)',
                      cursor: isSoon ? 'not-allowed' : 'pointer',
                      opacity: isSoon ? 0.6 : 1,
                    }}
                    className="flex items-center justify-between p-3.5 rounded-xl border transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 24,
                          color: isActive ? '#f59e0b' : 'var(--c-text-muted)',
                        }}
                      >
                        {inst.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                              color: isActive ? '#f59e0b' : 'var(--c-text-primary)',
                            }}
                          >
                            {instName}
                          </span>
                          {instBadge && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background:
                                  inst.badge === 'NEW' ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                                color: inst.badge === 'NEW' ? '#000' : '#a1a1aa',
                              }}
                            >
                              {instBadge}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 2 }}>
                          {instDesc}
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <AnimatedIcon name="check" size={20} color="#f59e0b" state="success" />
                    )}
                  </div>
                );
              })}
            </div>
          </SettingSection>

          {/* ── TUNING ── */}
          <SettingSection title={t.settings.sections.tuning}>
            <SettingRow
              label={isSpanish ? 'Afinación del Instrumento' : 'Instrument Tuning'}
              desc={
                isSpanish
                  ? 'Cambia el sistema de afinación del mástil para guitarra/bajo'
                  : 'Change the guitar/bass fretboard tuning system'
              }
            >
              <select
                value={settings.tuning}
                onChange={(e) =>
                  useSettingsStore.getState().updateSettings({ tuning: e.target.value })
                }
                style={{
                  fontFamily: 'Inter',
                  background: 'var(--c-surface-high)',
                  color: 'var(--c-text-primary)',
                  borderColor: 'var(--c-border)',
                }}
                className="rounded px-2.5 py-1 text-xs outline-none cursor-pointer transition-colors border"
              >
                {tunings.map((tun) => (
                  <option key={tun.value} value={tun.value}>
                    {tun.label}
                  </option>
                ))}
              </select>
            </SettingRow>
          </SettingSection>

          {/* ── CHORD DIAGRAM ── */}
          <SettingSection title={t.settings.sections.chordDiagram}>
            <SettingRow label={t.settings.rows.leftHanded} desc={t.settings.rows.leftHandedDesc}>
              <Toggle
                value={settings.leftHanded}
                onChange={(v) => useSettingsStore.getState().updateSettings({ leftHanded: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow label={t.settings.rows.fretNumbers} desc={t.settings.rows.fretNumbersDesc}>
              <Toggle
                value={settings.showFretNumbers}
                onChange={(v) => useSettingsStore.getState().updateSettings({ showFretNumbers: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow
              label={t.settings.rows.fingerNumbers}
              desc={t.settings.rows.fingerNumbersDesc}
            >
              <Toggle
                value={settings.showFingerNumbers}
                onChange={(v) =>
                  useSettingsStore.getState().updateSettings({ showFingerNumbers: v })
                }
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow label={t.settings.rows.noteNames} desc={t.settings.rows.noteNamesDesc}>
              <Toggle
                value={settings.showNoteNames}
                onChange={(v) => useSettingsStore.getState().updateSettings({ showNoteNames: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow
              label={t.settings.rows.intervalLabels}
              desc={t.settings.rows.intervalLabelsDesc}
            >
              <Toggle
                value={settings.showIntervals}
                onChange={(v) => useSettingsStore.getState().updateSettings({ showIntervals: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow
              label={t.settings.rows.openStringMarkers}
              desc={t.settings.rows.openStringMarkersDesc}
            >
              <Toggle
                value={settings.showOpenStrings}
                onChange={(v) => useSettingsStore.getState().updateSettings({ showOpenStrings: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
          </SettingSection>

          {/* ── DISPLAY ── */}
          <SettingSection title={t.settings.sections.display}>
            <SettingRow label={t.settings.rows.chordColors} desc={t.settings.rows.chordColorsDesc}>
              <Toggle
                value={settings.showChordQualityColors}
                onChange={(v) =>
                  useSettingsStore.getState().updateSettings({ showChordQualityColors: v })
                }
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow label={t.settings.rows.defaultTab} desc={t.settings.rows.defaultTabDesc}>
              {(() => {
                const cur = settings.defaultTab ?? 'library';
                const tabs: { value: ActivePanel; Icon: React.FC<{ active: boolean }> }[] = [
                  { value: 'songs', Icon: IconSongs },
                  { value: 'library', Icon: IconLibrary },
                  { value: 'preferences', Icon: IconSettings },
                ];
                return (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {tabs.map(({ value, Icon }) => {
                      const active = cur === value;
                      return (
                        <Button
                          key={value}
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            useSettingsStore.getState().updateSettings({ defaultTab: value })
                          }
                          style={{
                            width: 36,
                            height: 36,
                            background: active ? 'var(--c-surface-high)' : 'transparent',
                            color: active ? 'var(--c-text-primary)' : 'var(--c-text-muted)',
                            borderColor: active ? 'var(--c-border-strong)' : 'var(--c-border)',
                            borderRadius: '8px',
                            borderWidth: '1.5px',
                          }}
                        >
                          <Icon active={active} />
                        </Button>
                      );
                    })}
                  </div>
                );
              })()}
            </SettingRow>
          </SettingSection>

          {/* ── INTELLIGENCE ── */}
          <SettingSection title={t.settings.sections.intelligence}>
            <SettingRow
              label={t.settings.rows.chordAssistant}
              desc={t.settings.rows.chordAssistantDesc}
            >
              <Toggle
                value={settings.chordAssistant}
                onChange={(v) => useSettingsStore.getState().updateSettings({ chordAssistant: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            {settings.chordAssistant && (
              <>
                <SettingRow
                  label={t.settings.rows.smartSuggestions}
                  desc={t.settings.rows.smartSuggestionsDesc}
                >
                  <Toggle
                    value={settings.assistantSmartSuggestions}
                    onChange={(v) =>
                      useSettingsStore.getState().updateSettings({ assistantSmartSuggestions: v })
                    }
                    accentFrom={acc.from}
                    accentTo={acc.to}
                  />
                </SettingRow>
                <SettingRow
                  label={t.settings.rows.progressionTips}
                  desc={t.settings.rows.progressionTipsDesc}
                >
                  <Toggle
                    value={settings.assistantProgressionTips}
                    onChange={(v) =>
                      useSettingsStore.getState().updateSettings({ assistantProgressionTips: v })
                    }
                    accentFrom={acc.from}
                    accentTo={acc.to}
                  />
                </SettingRow>
                <SettingRow
                  label={t.settings.rows.conflictDetection}
                  desc={t.settings.rows.conflictDetectionDesc}
                >
                  <Toggle
                    value={settings.assistantConflictDetection}
                    onChange={(v) =>
                      useSettingsStore.getState().updateSettings({ assistantConflictDetection: v })
                    }
                    accentFrom={acc.from}
                    accentTo={acc.to}
                  />
                </SettingRow>
                <SettingRow
                  label={t.settings.rows.learningMode}
                  desc={t.settings.rows.learningModeDesc}
                >
                  <Toggle
                    value={settings.assistantLearning}
                    onChange={(v) =>
                      useSettingsStore.getState().updateSettings({ assistantLearning: v })
                    }
                    accentFrom={acc.from}
                    accentTo={acc.to}
                  />
                </SettingRow>
              </>
            )}
          </SettingSection>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden app-bg">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar px-0"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)',
          paddingTop: isWebDesktop ? '20px' : '0',
        }}
      >
        <StudioHeader title={t.settings.title} subtitle={t.settings.subtitle} />

        <div className="px-6">
          {/* ── INSTRUMENT ── */}
          <SectionHeader
            icon="music_note"
            title={isSpanish ? 'Instrumento Global' : 'Global Instrument'}
          />
          <div style={cardStyle} className="mb-6">
            {Object.values(INSTRUMENT_REGISTRY).map((inst: InstrumentConfig, idx: number) => {
              const currentInst = settings.instrument || 'guitar';
              const isActive = currentInst === inst.id;
              const isSoon = inst.status === 'coming_soon';
              const instName = (t.settings.instruments as any)?.[inst.id]?.label || inst.name;
              const instDesc = (t.settings.instruments as any)?.[inst.id]?.desc || inst.subtitle;
              const instBadge =
                inst.badge === 'NEW'
                  ? isSpanish
                    ? 'NUEVO'
                    : 'NEW'
                  : inst.badge === 'SOON'
                    ? isSpanish
                      ? 'PRONTO'
                      : 'SOON'
                    : inst.badge;

              return (
                <button
                  key={inst.id}
                  onClick={() => {
                    if (!isSoon) {
                      useSettingsStore
                        .getState()
                        .updateSettings({ instrument: inst.id as Instrument });
                      if (inst.id === 'saxophone') {
                        NavigationDispatcher.replace({
                          app: 'chordex',
                          page: 'practice' as any,
                          tab: 'practice' as any,
                        });
                      } else {
                        NavigationDispatcher.replace({
                          app: 'chordex',
                          page: 'songs' as any,
                          tab: 'songs' as any,
                        });
                      }
                    }
                  }}
                  disabled={isSoon}
                  className="w-full text-left transition-colors flex items-center justify-between p-4"
                  style={{
                    borderBottom:
                      idx < Object.values(INSTRUMENT_REGISTRY).length - 1
                        ? '1px solid var(--c-border-subtle)'
                        : 'none',
                    opacity: isSoon ? 0.5 : 1,
                    background: isActive ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 22,
                        color: isActive ? '#f59e0b' : 'var(--c-text-muted)',
                      }}
                    >
                      {inst.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 'var(--font-base)',
                            color: isActive ? '#f59e0b' : 'var(--c-text-primary)',
                            fontFamily: 'var(--type-body-font, var(--studio-font-body))',
                          }}
                        >
                          {instName}
                        </span>
                        {instBadge && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background:
                                inst.badge === 'NEW' ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                              color: inst.badge === 'NEW' ? '#000' : '#a1a1aa',
                            }}
                          >
                            {instBadge}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--font-xs)',
                          color: 'var(--c-text-secondary)',
                          marginTop: 2,
                        }}
                      >
                        {instDesc}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <span
                      className="material-symbols-outlined"
                      style={{ color: '#f59e0b', fontSize: 20 }}
                    >
                      check_circle
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── TUNING ── */}
          <SectionHeader icon="tune" title={t.settings.sections.tuning} />
          <div style={cardStyle}>
            {tunings.map((tun) => {
              const isActive = settings.tuning === tun.value;
              return (
                <button
                  key={tun.value}
                  className="card-hover"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: 'var(--density-row-pad)',
                    background: isActive ? `${acc.to}15` : 'transparent',
                    borderBottom: '1px solid rgba(72,72,72,0.07)',
                    transition: 'background-color 200ms ease',
                  }}
                  onClick={() => useSettingsStore.getState().updateSettings({ tuning: tun.value })}
                >
                  <p
                    style={{
                      color: 'var(--c-text-primary)',
                      fontFamily: 'var(--type-body-font, var(--studio-font-body))',
                      fontWeight: 600,
                      fontSize: 'var(--font-base)',
                    }}
                  >
                    {tun.label}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p
                      style={{
                        color: 'var(--c-text-secondary)',
                        fontFamily: 'Inter',
                        fontSize: 'var(--font-sm)',
                      }}
                    >
                      {tun.value}
                    </p>
                    {isActive && (
                      <AnimatedIcon name="check" size={18} color={acc.from} state="success" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── CHORD DIAGRAM ── */}
          <SectionHeader icon="schema" title={t.settings.sections.chordDiagram} />
          <div style={cardStyle}>
            <SettingRow label={t.settings.rows.leftHanded} desc={t.settings.rows.leftHandedDesc}>
              <Toggle
                value={settings.leftHanded}
                onChange={(v) => useSettingsStore.getState().updateSettings({ leftHanded: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow label={t.settings.rows.fretNumbers} desc={t.settings.rows.fretNumbersDesc}>
              <Toggle
                value={settings.showFretNumbers}
                onChange={(v) => useSettingsStore.getState().updateSettings({ showFretNumbers: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow
              label={t.settings.rows.fingerNumbers}
              desc={t.settings.rows.fingerNumbersDesc}
            >
              <Toggle
                value={settings.showFingerNumbers}
                onChange={(v) =>
                  useSettingsStore.getState().updateSettings({ showFingerNumbers: v })
                }
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow label={t.settings.rows.noteNames} desc={t.settings.rows.noteNamesDesc}>
              <Toggle
                value={settings.showNoteNames}
                onChange={(v) => useSettingsStore.getState().updateSettings({ showNoteNames: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow
              label={t.settings.rows.intervalLabels}
              desc={t.settings.rows.intervalLabelsDesc}
            >
              <Toggle
                value={settings.showIntervals}
                onChange={(v) => useSettingsStore.getState().updateSettings({ showIntervals: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow
              label={t.settings.rows.openStringMarkers}
              desc={t.settings.rows.openStringMarkersDesc}
            >
              <Toggle
                value={settings.showOpenStrings}
                onChange={(v) => useSettingsStore.getState().updateSettings({ showOpenStrings: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
          </div>

          {/* ── DISPLAY ── */}
          <SectionHeader icon="dashboard" title={t.settings.sections.display} />
          <div style={cardStyle}>
            <SettingRow label={t.settings.rows.chordColors} desc={t.settings.rows.chordColorsDesc}>
              <Toggle
                value={settings.showChordQualityColors}
                onChange={(v) =>
                  useSettingsStore.getState().updateSettings({ showChordQualityColors: v })
                }
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow label={t.settings.rows.defaultTab} desc={t.settings.rows.defaultTabDesc}>
              {(() => {
                const cur = settings.defaultTab ?? 'library';
                const tabs: { value: ActivePanel; Icon: React.FC<{ active: boolean }> }[] = [
                  { value: 'songs', Icon: IconSongs },
                  { value: 'library', Icon: IconLibrary },
                  { value: 'preferences', Icon: IconSettings },
                ];
                return (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {tabs.map(({ value, Icon }) => {
                      const active = cur === value;
                      return (
                        <Button
                          key={value}
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            useSettingsStore.getState().updateSettings({ defaultTab: value })
                          }
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            border: active ? `2.5px solid ${acc.from}` : '2px solid transparent',
                            background: active
                              ? `linear-gradient(135deg, ${acc.from}22, ${acc.to}18)`
                              : 'var(--app-surface-low)',
                            color: active ? acc.from : 'var(--c-text-secondary)',
                            flexShrink: 0,
                          }}
                        >
                          <Icon active={active} />
                        </Button>
                      );
                    })}
                  </div>
                );
              })()}
            </SettingRow>
          </div>

          {/* ── INTELLIGENCE ── */}
          <SectionHeader icon="psychology" title={t.settings.sections.intelligence} />
          <div style={cardStyle}>
            <SettingRow
              label={t.settings.rows.chordAssistant}
              desc={t.settings.rows.chordAssistantDesc}
            >
              <Toggle
                value={settings.chordAssistant}
                onChange={(v) => useSettingsStore.getState().updateSettings({ chordAssistant: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            {settings.chordAssistant && (
              <div
                style={{
                  borderTop: '1px solid rgba(72,72,72,0.1)',
                  paddingTop: '4px',
                  marginTop: '4px',
                }}
              >
                <SettingRow
                  label={t.settings.rows.smartSuggestions}
                  desc={t.settings.rows.smartSuggestionsDesc}
                  indent
                >
                  <Toggle
                    value={settings.assistantSmartSuggestions}
                    onChange={(v) =>
                      useSettingsStore.getState().updateSettings({ assistantSmartSuggestions: v })
                    }
                    accentFrom={acc.from}
                    accentTo={acc.to}
                  />
                </SettingRow>
                <SettingRow
                  label={t.settings.rows.progressionTips}
                  desc={t.settings.rows.progressionTipsDesc}
                  indent
                >
                  <Toggle
                    value={settings.assistantProgressionTips}
                    onChange={(v) =>
                      useSettingsStore.getState().updateSettings({ assistantProgressionTips: v })
                    }
                    accentFrom={acc.from}
                    accentTo={acc.to}
                  />
                </SettingRow>
                <SettingRow
                  label={t.settings.rows.conflictDetection}
                  desc={t.settings.rows.conflictDetectionDesc}
                  indent
                >
                  <Toggle
                    value={settings.assistantConflictDetection}
                    onChange={(v) =>
                      useSettingsStore.getState().updateSettings({ assistantConflictDetection: v })
                    }
                    accentFrom={acc.from}
                    accentTo={acc.to}
                  />
                </SettingRow>
                <SettingRow
                  label={t.settings.rows.learningMode}
                  desc={t.settings.rows.learningModeDesc}
                  indent
                >
                  <Toggle
                    value={settings.assistantLearning}
                    onChange={(v) =>
                      useSettingsStore.getState().updateSettings({ assistantLearning: v })
                    }
                    accentFrom={acc.from}
                    accentTo={acc.to}
                  />
                </SettingRow>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
