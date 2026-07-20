import { Capacitor } from '@capacitor/core';
import {
  useChordStore,
  ACCENT_COLORS,
  type ActivePanel,
  useScrollHide,
  useT,
  useIsWebDesktop,
  useAppUpdate,
  APP_VERSION_LABEL,
  resetNav,
  useSettingsStore,
} from '@workspace/studio-core';
import React, { useRef, useState, useEffect } from 'react';
import { AppModeMenuLogo } from '../components/AppModeMenuLogo';
import { Toggle, SectionHeader, SettingRow, SettingSection } from '../components/SettingControls';
import { IconSongs, IconLibrary, IconChords, IconSettings } from '../components/NavIcons';
import { DialogScaffold } from '../components/StudioLayoutSystem';
import InkThemeToggle from '../components/typography/InkThemeToggle';

export default function SettingsPanel() {
  const settings = useSettingsStore((s) => s.settings);

  const acc =
    ACCENT_COLORS[settings.perApp?.chords?.accentColor ?? settings.accentColor] ??
    ACCENT_COLORS.blue;

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollHide(scrollRef);
  const t = useT();

  useEffect(() => {
    resetNav();
  }, []);

  const updater = useAppUpdate();
  const [showGitHubConfirm, setShowGitHubConfirm] = useState(false);

  const cardStyle: React.CSSProperties = {
    background: 'var(--app-surface)',
    borderRadius: '1.5rem',
    overflow: 'hidden',
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

  const isLight =
    settings.theme === 'light' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);
  const isWebDesktop = useIsWebDesktop();

  if (isWebDesktop) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-[var(--app-bg)] p-6">
        {/* Page title */}
        <div className="mb-6">
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--c-text-primary)',
              fontFamily: 'Manrope',
            }}
          >
            {t.settings.title}
          </h2>
          <p
            style={{
              color: 'var(--c-text-secondary)',
              fontFamily: 'Inter',
              fontSize: '11px',
              marginTop: '2px',
            }}
          >
            {t.settings.subtitle}
          </p>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar space-y-6">
          {/* ── TUNING ── */}
          <SettingSection title={t.settings.sections.tuning}>
            <SettingRow
              label="Instrument Tuning"
              desc="Change the guitar/bass fretboard tuning system"
            >
              <select
                value={settings.tuning}
                onChange={(e) => settingsController.updateSettings({ tuning: e.target.value })}
                className={`rounded px-2 py-1 text-xs outline-none cursor-pointer transition-colors border ${
                  isLight
                    ? 'bg-zinc-200 text-zinc-800 border-zinc-300 hover:border-zinc-400'
                    : 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:border-zinc-700'
                }`}
                style={{ fontFamily: 'Inter' }}
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
                onChange={(v) => settingsController.updateSettings({ leftHanded: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow label={t.settings.rows.fretNumbers} desc={t.settings.rows.fretNumbersDesc}>
              <Toggle
                value={settings.showFretNumbers}
                onChange={(v) => settingsController.updateSettings({ showFretNumbers: v })}
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
                onChange={(v) => settingsController.updateSettings({ showFingerNumbers: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow label={t.settings.rows.noteNames} desc={t.settings.rows.noteNamesDesc}>
              <Toggle
                value={settings.showNoteNames}
                onChange={(v) => settingsController.updateSettings({ showNoteNames: v })}
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
                onChange={(v) => settingsController.updateSettings({ showIntervals: v })}
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
                onChange={(v) => settingsController.updateSettings({ showOpenStrings: v })}
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
                onChange={(v) => settingsController.updateSettings({ showChordQualityColors: v })}
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
                  { value: 'chord', Icon: IconChords },
                  { value: 'settings', Icon: IconSettings },
                ];
                return (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {tabs.map(({ value, Icon }) => {
                      const active = cur === value;
                      return (
                        <button
                          key={value}
                          onClick={() => settingsController.updateSettings({ defaultTab: value })}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg border cursor-pointer transition-all ${
                            active
                              ? isLight
                                ? 'bg-zinc-300 text-black border-zinc-400'
                                : 'bg-zinc-800 text-white border-zinc-700'
                              : isLight
                                ? 'bg-transparent text-zinc-500 border-zinc-200 hover:text-black hover:border-zinc-300'
                                : 'bg-transparent text-zinc-500 border-zinc-900 hover:text-zinc-300'
                          }`}
                        >
                          <Icon active={active} />
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </SettingRow>
          </SettingSection>

          {/* ── APPEARANCE ── */}
          <SettingSection title={t.settings.sections.appearance}>
            <SettingRow label={t.settings.rows.theme} desc="Switch between Light and Dark modes">
              <InkThemeToggle />
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
                onChange={(v) => settingsController.updateSettings({ chordAssistant: v })}
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
                      settingsController.updateSettings({ assistantSmartSuggestions: v })
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
                      settingsController.updateSettings({ assistantProgressionTips: v })
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
                      settingsController.updateSettings({ assistantConflictDetection: v })
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
                    onChange={(v) => settingsController.updateSettings({ assistantLearning: v })}
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
        className="flex-1 overflow-y-auto no-scrollbar px-5"
        style={{
          paddingBottom: 'var(--content-bottom-pad)',
          paddingTop: isWebDesktop ? '20px' : '0',
        }}
      >
        {/* Page title */}
        <div className="mt-3 mb-6 spring-in">
          <h2
            style={{
              fontSize: 'var(--font-hero)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: 'var(--c-text-primary)',
              fontFamily: 'Manrope',
            }}
          >
            {t.settings.title}
          </h2>
          <p
            style={{
              color: 'var(--c-text-secondary)',
              fontFamily: 'Inter',
              fontSize: 'var(--font-sm)',
              marginTop: '4px',
            }}
          >
            {t.settings.subtitle}
          </p>
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
                onClick={() => settingsController.updateSettings({ tuning: tun.value })}
              >
                <p
                  style={{
                    color: 'var(--c-text-primary)',
                    fontFamily: 'Manrope',
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
                    <span
                      className="material-symbols-outlined"
                      style={{ color: acc.from, fontSize: '18px' }}
                    >
                      check
                    </span>
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
              onChange={(v) => settingsController.updateSettings({ leftHanded: v })}
              accentFrom={acc.from}
              accentTo={acc.to}
            />
          </SettingRow>
          <SettingRow label={t.settings.rows.fretNumbers} desc={t.settings.rows.fretNumbersDesc}>
            <Toggle
              value={settings.showFretNumbers}
              onChange={(v) => settingsController.updateSettings({ showFretNumbers: v })}
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
              onChange={(v) => settingsController.updateSettings({ showFingerNumbers: v })}
              accentFrom={acc.from}
              accentTo={acc.to}
            />
          </SettingRow>
          <SettingRow label={t.settings.rows.noteNames} desc={t.settings.rows.noteNamesDesc}>
            <Toggle
              value={settings.showNoteNames}
              onChange={(v) => settingsController.updateSettings({ showNoteNames: v })}
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
              onChange={(v) => settingsController.updateSettings({ showIntervals: v })}
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
              onChange={(v) => settingsController.updateSettings({ showOpenStrings: v })}
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
              onChange={(v) => settingsController.updateSettings({ showChordQualityColors: v })}
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
                { value: 'chord', Icon: IconChords },
                { value: 'settings', Icon: IconSettings },
              ];
              return (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {tabs.map(({ value, Icon }) => {
                    const active = cur === value;
                    return (
                      <button
                        key={value}
                        onClick={() => settingsController.updateSettings({ defaultTab: value })}
                        style={{
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '10px',
                          border: active ? `2px solid ${acc.from}` : '2px solid transparent',
                          background: active
                            ? `linear-gradient(135deg, ${acc.from}22, ${acc.to}18)`
                            : 'var(--app-surface-low)',
                          color: active ? acc.from : 'var(--c-text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 150ms ease',
                          flexShrink: 0,
                        }}
                      >
                        <Icon active={active} />
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </SettingRow>
        </div>

        {/* ── APPEARANCE ── */}
        <SectionHeader icon="palette" title={t.settings.sections.appearance} />
        <div style={cardStyle}>
          <SettingRow label={t.settings.rows.theme} desc="Switch between Light and Dark modes">
            <InkThemeToggle />
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
              onChange={(v) => settingsController.updateSettings({ chordAssistant: v })}
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
                    settingsController.updateSettings({ assistantSmartSuggestions: v })
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
                    settingsController.updateSettings({ assistantProgressionTips: v })
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
                    settingsController.updateSettings({ assistantConflictDetection: v })
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
                  onChange={(v) => settingsController.updateSettings({ assistantLearning: v })}
                  accentFrom={acc.from}
                  accentTo={acc.to}
                />
              </SettingRow>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GithubIcon({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} style={{ flexShrink: 0 }}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
