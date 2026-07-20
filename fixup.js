const fs = require('fs');
const fixes = {
  'packages/studio-core/src/lib/syncBackends/types.ts': [
    { id: 'DirectWriteResult', kw: 'interface' },
    { id: 'ProbeResult', kw: 'interface' },
    { id: 'DeviceWriteResult', kw: 'interface' },
    { id: 'HeartbeatResult', kw: 'interface' },
  ],
  'packages/ui-shared/src/components/design-system/StudioDesignSystem.tsx': [
    { id: 'CardProps', kw: 'interface' },
    { id: 'SurfaceProps', kw: 'interface' },
    { id: 'DialogProps', kw: 'interface' },
    { id: 'ToolbarProps', kw: 'interface' },
    { id: 'SheetProps', kw: 'interface' },
    { id: 'HeaderProps', kw: 'interface' },
    { id: 'ScreenProps', kw: 'interface' },
    { id: 'ScaffoldProps', kw: 'interface' },
    { id: 'FloatingButtonProps', kw: 'interface' },
    { id: 'ProgressProps', kw: 'interface' },
    { id: 'LoadingProps', kw: 'interface' },
  ],
  'packages/ui-shared/src/components/progress/StudioProgressBar.tsx': [
    { id: 'ProgressRootProps', kw: 'type' },
    { id: 'ProgressIndicatorProps', kw: 'type' },
    { id: 'ProgressContextType', kw: 'type' },
  ],
  'packages/ui-shared/src/components/typography/StudioThemeToggler.tsx': [
    { id: 'TransitionVariant', kw: 'type' },
  ],
  'packages/ui-shared/src/components/updater-diagnostics/diagnosticsGenerator.ts': [
    { id: 'DiagnosticsData', kw: 'interface' },
    { id: 'buildDiagnosticDataObject', kw: 'function' },
    { id: 'generateFullEngineeringReport', kw: 'function' },
  ],
  'packages/ui-shared/src/features/chordex/pages/SongsPanel.tsx': [
    { id: 'ExportConfig', kw: 'interface' },
    { id: 'ChordexJsonFile', kw: 'interface' },
  ],
  'packages/ui-shared/src/features/groovex/services/songCatalog.ts': [
    { id: 'StemInfo', kw: 'interface' },
  ],
  'packages/ui-shared/src/features/groovex/state/useGroovexStore.ts': [
    { id: 'GroovexPreferences', kw: 'interface' },
  ],
  'packages/ui-shared/src/features/vocalex/services/vocalAnalysis.ts': [
    { id: 'VocalInsight', kw: 'interface' },
  ],
  'packages/ui-web/src/landing/landingData.ts': [
    { id: 'AppInfo', kw: 'interface' },
    { id: 'APPS_DATA', kw: 'const' },
  ],
  'packages/ui-shared/src/components/lottie/EmptyStateLottie.tsx': [
    { id: 'EmptyStateApp', kw: 'type' },
  ],
  'packages/ui-shared/src/components/typography/StudioTitleReveal.tsx': [
    { id: 'triggerIntroReveal', kw: 'function' },
  ],
  'packages/ui-shared/src/features/groovex/services/stemCache.ts': [
    { id: 'getCachedStem', kw: 'function' },
    { id: 'cacheStem', kw: 'function' },
    { id: 'isStemCached', kw: 'function' },
  ],
  'packages/ui-shared/src/navigation/BottomNav.tsx': [
    { id: 'IconSongs', kw: 'function' },
    { id: 'IconLibrary', kw: 'function' },
    { id: 'IconChords', kw: 'function' },
    { id: 'IconSettings', kw: 'function' },
  ],
  'packages/ui-web/src/landing/landingUtils.ts': [{ id: 'SPRING_CONFIGS', kw: 'const' }],
  'packages/ui-shared/src/components/design-system/WebDesignSystem.tsx': [
    { id: 'WebAppShell', kw: 'function' },
    { id: 'WebWorkspace', kw: 'function' },
    { id: 'WebPanel', kw: 'function' },
    { id: 'WebSectionHeader', kw: 'function' },
    { id: 'WebCard', kw: 'function' },
    { id: 'WebListRow', kw: 'function' },
    { id: 'WebToolbarButton', kw: 'function' },
    { id: 'WebAppFrame', kw: 'function' },
    { id: 'WebList', kw: 'function' },
    { id: 'WebIconButton', kw: 'function' },
  ],
};

for (const [file, items] of Object.entries(fixes)) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  for (const item of items) {
    const regex = new RegExp('^ ' + item.id + '\\\\b', 'gm');
    content = content.replace(regex, item.kw + ' ' + item.id);
  }
  fs.writeFileSync(file, content);
}
console.log('Fixed syntax errors');
