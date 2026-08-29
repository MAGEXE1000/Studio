import {
  useT,
  APP_VERSION_LABEL,
  useScrollHide,
  useIsWebDesktop,
  useChordStore,
  ACCENT_COLORS,
  resolveAccent,
  useSettingsStore,
} from '@workspace/studio-core';
import { useShallow } from 'zustand/react/shallow';
import { useState, useEffect, useCallback, useRef } from 'react';
import ElasticSlider from '../../../shared/progress/ElasticSlider';
import { useGroovexStore } from '../state/useGroovexStore';
// // import { groovexStemRepository,   type SongCacheInfo } from "@workspace/studio-core";
import { SONG_CATALOG } from '../services/songCatalog';
import { Toggle, SettingSection, SettingRow } from '../../../shared/settings/SettingControls';
import { StudioHeader } from '../../../shared/layout/StudioHeader';
import { Card, Button } from '../../../shared/design-system/StudioDesignSystem';
import { Dialog } from '../../../shared/design-system/dialogs';

export default function GroovexPreferences() {
  const t = useT();
  const { preferences, updatePreferences } = useGroovexStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollHide(scrollRef);
  const [cacheInfo, setCacheInfo] = useState({ totalBytes: 0, songCount: 0, stemCount: 0 });
  const [songCaches, setSongCaches] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const isWebDesktop = useIsWebDesktop();

  const refreshCache = useCallback(() => {
    // groovexStemRepository.getCacheSize().then(setCacheInfo);
    // groovexStemRepository.getStemCount().then(setSongCaches);
  }, []);

  useEffect(() => {
    refreshCache();
  }, [refreshCache]);

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleDeleteSong(songId: string) {
    setDeletingId(songId);
    setConfirmDeleteAll(false);
    await // groovexStemRepository.getStemCount(songId);
    await Promise.all([
      // groovexStemRepository.getCacheSize().then(setCacheInfo),
      // groovexStemRepository.getStemCount().then(setSongCaches),
    ]);
    setDeletingId(null);
  }

  async function handleClearAll() {
    setConfirmDeleteAll(false);
    setDeletingId('__all__');
    await // groovexStemRepository.clearAllCache();
    await Promise.all([
      // groovexStemRepository.getCacheSize().then(setCacheInfo),
      // groovexStemRepository.getStemCount().then(setSongCaches),
    ]);
    setDeletingId(null);
  }

  function songMeta(songId: string) {
    return SONG_CATALOG.find((s) => s.id === songId);
  }

  const settings = useSettingsStore(useShallow((s) => s.settings));

  const isLight =
    settings.theme === 'light' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  return (
    <div
      ref={scrollRef}
      className="spring-in w-full"
      style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: 'var(--app-bg)',
      }}
    >
      <div
        style={{
          maxWidth: 600,
          margin: isWebDesktop ? '0' : '0 auto',
          padding: '0 var(--page-header-inset-h, var(--page-inset-h, 24px))',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)',
        }}
      >
        <StudioHeader
          title={t.groovex.audioEngine}
          subtitle={t.groovex.audioEngineDesc}
          disableHorizontalPadding={true}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PrefCard
            title={t.groovex.defaultVolumeLevels}
            icon="equalizer"
            isWebDesktop={isWebDesktop}
          >
            <SliderRow
              label={t.groovex.masterGain}
              value={preferences.masterVolume}
              onChange={(v) => updatePreferences({ masterVolume: v })}
              displayValue={`${Math.round((preferences.masterVolume - 1) * 20)} dB`}
              isWebDesktop={isWebDesktop}
            />
            <SliderRow
              label={t.groovex.defaultStemVolume}
              value={preferences.defaultStemVolume}
              onChange={(v) => updatePreferences({ defaultStemVolume: v })}
              displayValue={`${Math.round(preferences.defaultStemVolume * 100)}%`}
              isWebDesktop={isWebDesktop}
            />
          </PrefCard>

          <PrefCard title={t.groovex.playback} icon="play_circle" isWebDesktop={isWebDesktop}>
            <ToggleRow
              label={t.groovex.autoPlayOnLoad}
              value={preferences.autoPlay}
              onChange={(v) => updatePreferences({ autoPlay: v })}
              isWebDesktop={isWebDesktop}
            />
            <ToggleRow
              label={t.groovex.infiniteLoop}
              value={preferences.loopPlayback}
              onChange={(v) => updatePreferences({ loopPlayback: v })}
              isWebDesktop={isWebDesktop}
            />
            <ToggleRow
              label={t.groovex.prerollCountIn}
              value={preferences.countIn}
              onChange={(v) => updatePreferences({ countIn: v })}
              isWebDesktop={isWebDesktop}
            />
          </PrefCard>

          <PrefCard title={t.groovex.downloadedSongs} icon="cloud_done" isWebDesktop={isWebDesktop}>
            <div style={{ padding: isWebDesktop ? '12px 16px' : '4px 0' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--c-text-secondary)',
                      margin: '0 0 4px',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {t.groovex.songUnit(cacheInfo.songCount)} • {cacheInfo.stemCount} stems
                  </p>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--c-text-primary)',
                      margin: 0,
                    }}
                  >
                    {formatBytes(cacheInfo.totalBytes)}
                  </p>
                </div>
                {cacheInfo.songCount > 0 && (
                  <>
                    <button
                      onClick={() => setConfirmDeleteAll(true)}
                      disabled={deletingId !== null}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        background: 'rgba(238,125,119,0.15)',
                        color: '#ee7d77',
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'var(--font-body)',
                        opacity: deletingId ? 0.5 : 1,
                      }}
                    >
                      {t.groovex.deleteAll}
                    </button>
                    <Dialog
                      open={confirmDeleteAll}
                      onClose={() => setConfirmDeleteAll(false)}
                      title={t.groovex.deleteAll}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <p style={{ margin: 0 }}>
                          Are you sure you want to delete all downloaded song caches?
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <Button onClick={() => setConfirmDeleteAll(false)} style={{ flex: 1 }}>
                            {t.groovex.cancel}
                          </Button>
                          <Button
                            variant="primary"
                            onClick={handleClearAll}
                            style={{ flex: 1, background: '#ee7d77', color: '#fff' }}
                          >
                            {t.groovex.confirm}
                          </Button>
                        </div>
                      </div>
                    </Dialog>
                  </>
                )}
              </div>

              {songCaches.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    marginTop: 4,
                    marginBottom: 10,
                    maxHeight: 200,
                    overflowY: 'auto',
                    borderRadius: 8,
                  }}
                  className="no-scrollbar"
                >
                  {songCaches.map((sc) => {
                    const meta = songMeta(sc.songId);
                    const isDeleting = deletingId === sc.songId || deletingId === '__all__';
                    return (
                      <div
                        key={sc.songId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '8px 10px',
                          background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                          borderRadius: 8,
                          opacity: isDeleting ? 0.4 : 1,
                          transition: 'opacity 200ms ease',
                          border: isLight
                            ? '1px solid rgba(0,0,0,0.06)'
                            : '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: 22,
                            color: 'var(--gx-accent)',
                            flexShrink: 0,
                            fontVariationSettings: "'FILL' 1",
                          }}
                        >
                          album
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'var(--c-text-primary)',
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {meta?.title ?? sc.songId}
                          </p>
                          <p
                            style={{
                              fontSize: 10,
                              color: 'var(--c-text-secondary)',
                              margin: '1px 0 0',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            {meta?.artist ?? t.groovex.unknown} • {sc.stemCount} stems •{' '}
                            {formatBytes(sc.totalBytes)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteSong(sc.songId)}
                          disabled={deletingId !== null}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            border: 'none',
                            cursor: deletingId ? 'default' : 'pointer',
                            background: 'rgba(238,125,119,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            opacity: deletingId && !isDeleting ? 0.3 : 1,
                            transition: 'opacity 150ms',
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14, color: '#ee7d77' }}
                          >
                            {isDeleting ? 'hourglass_empty' : 'delete'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <p
                style={{
                  fontSize: 10.5,
                  color: 'var(--c-text-secondary)',
                  margin: 0,
                  fontFamily: 'var(--font-body)',
                  opacity: 0.7,
                  lineHeight: 1.4,
                }}
              >
                {songCaches.length === 0
                  ? t.groovex.noSongsDownloaded
                  : t.groovex.downloadedSongsHint}
              </p>
            </div>
          </PrefCard>

          <PrefCard title={t.groovex.aboutGroovex} icon="info" isWebDesktop={isWebDesktop}>
            <div style={{ padding: isWebDesktop ? '12px 16px' : '4px 0' }}>
              <p
                style={{
                  fontSize: 12.5,
                  color: 'var(--c-text-secondary)',
                  margin: '0 0 8px',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.5,
                }}
              >
                {t.groovex.aboutDesc1}
              </p>
              <p
                style={{
                  fontSize: 12.5,
                  color: 'var(--c-text-secondary)',
                  margin: '0 0 8px',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.5,
                }}
              >
                {t.groovex.aboutDesc2}
              </p>
              <p
                style={{
                  fontSize: 10.5,
                  color: 'var(--c-text-secondary)',
                  margin: 0,
                  fontFamily: 'var(--font-body)',
                  opacity: 0.6,
                }}
              >
                {APP_VERSION_LABEL} • {t.groovex.aboutVersion}
              </p>
            </div>
          </PrefCard>

          <div
            style={{ marginTop: 16, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h4
              style={{
                color: '#ee7d77',
                fontWeight: 700,
                margin: '0 0 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '13px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                warning
              </span>
              {t.groovex.resetAllPreferences}
            </h4>
            <p
              style={{
                fontSize: 12,
                color: 'var(--c-text-secondary)',
                margin: '0 0 12px',
                maxWidth: 400,
                lineHeight: 1.4,
              }}
            >
              {t.groovex.resetDesc}
            </p>
            <button
              onClick={() =>
                updatePreferences({
                  masterVolume: 0.85,
                  loopPlayback: false,
                  autoPlay: false,
                  countIn: false,
                  defaultStemVolume: 0.85,
                })
              }
              style={{
                background: 'rgba(127,41,39,0.2)',
                border: '1px solid rgba(238,125,119,0.3)',
                color: '#ee7d77',
                fontSize: 12,
                fontWeight: 700,
                padding: '10px 20px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 150ms ease',
              }}
            >
              {t.groovex.resetToDefaults}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrefCard({
  title,
  icon,
  children,
  isWebDesktop,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  isWebDesktop?: boolean;
}) {
  if (isWebDesktop) {
    return <SettingSection title={title}>{children}</SettingSection>;
  }
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color: 'var(--gx-accent)' }}
        >
          {icon}
        </span>
        <h3
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--c-text-primary)',
            margin: 0,
            fontFamily: 'var(--font-headline)',
          }}
        >
          {title}
        </h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>{children}</div>
    </Card>
  );
}

function SliderRow({
  label,
  value,
  onChange,
  displayValue,
  isWebDesktop,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  displayValue: string;
  isWebDesktop?: boolean;
}) {
  const settings = useSettingsStore(useShallow((s) => s.settings));
  const isLight =
    settings.theme === 'light' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  if (isWebDesktop) {
    return (
      <SettingRow label={label} desc={`Current level: ${displayValue}`}>
        <div style={{ width: '180px' }}>
          <ElasticSlider
            min={0}
            max={1}
            step={0.01}
            value={value}
            onChange={onChange}
            accentColor="var(--gx-accent, #679cff)"
            trackColor={isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}
          />
        </div>
      </SettingRow>
    );
  }
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--c-text-secondary)',
            fontFamily: 'var(--font-body)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          {label}
        </label>
        <span style={{ fontSize: 13, color: 'var(--gx-accent)', fontWeight: 700 }}>
          {displayValue}
        </span>
      </div>
      <ElasticSlider
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={onChange}
        accentColor="var(--gx-accent, #679cff)"
        trackColor="var(--gx-surface-high, rgba(128,128,128,0.2))"
      />
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  isWebDesktop,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isWebDesktop?: boolean;
}) {
  const settings = useSettingsStore(useShallow((s) => s.settings));
  const isLight =
    settings.theme === 'light' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);
  const acc = resolveAccent(settings.accentColor);

  if (isWebDesktop) {
    return (
      <SettingRow label={label}>
        <button
          onClick={() => onChange(!value)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 9999,
            border: 'none',
            cursor: 'pointer',
            background: value
              ? 'rgba(103,156,255,0.25)'
              : isLight
                ? 'rgba(0,0,0,0.08)'
                : 'rgba(255,255,255,0.08)',
            position: 'relative',
            padding: 2,
            transition: 'background 150ms ease',
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 9999,
              background: value ? 'var(--gx-accent)' : 'var(--c-text-secondary)',
              position: 'absolute',
              top: 3,
              left: value ? 23 : 3,
              transition: 'left 150ms ease, background 150ms ease',
            }}
          />
        </button>
      </SettingRow>
    );
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 0',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-primary)' }}>{label}</span>
      <Toggle value={value} onChange={onChange} accentFrom={acc.from} accentTo={acc.to} />
    </div>
  );
}
