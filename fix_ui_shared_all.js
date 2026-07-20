const fs = require('fs');

function replaceInFile(filepath, replacements) {
    if (fs.existsSync(filepath)) {
        let content = fs.readFileSync(filepath, 'utf8');
        let original = content;
        for (const [search, replace] of replacements) {
            content = content.replace(search, replace);
        }
        if (content !== original) {
            fs.writeFileSync(filepath, content, 'utf8');
        }
    }
}

// 1. GroovexPreferences
replaceInFile('packages/ui-shared/src/features/groovex/components/GroovexPreferences.tsx', [
    [/const\s+settings\s*=\s*useChordStore\(\(s\)\s*=>\s*s\.settings\);/g, "const settings = useSettingsStore((s) => s.settings);"],
    [/import\s*\{\s*[^}]*useChordStore[^}]*\}\s*from\s*'@workspace\/studio-core';/, (match) => match.includes('useSettingsStore') ? match : match.replace('useChordStore,', 'useChordStore, useSettingsStore,')]
]);

// 2. GroovexApp
replaceInFile('packages/ui-shared/src/features/groovex/pages/GroovexApp.tsx', [
    [/useChordStore\(\(state\)\s*=>\s*state\.settings/g, "useSettingsStore((state) => state.settings"],
    [/useChordStore\(\(state\)\s*=>\s*state\.lastSession/g, "useSettingsStore((state) => state.lastSession"],
    [/useChordStore\.getState\(\)\.settings/g, "useSettingsStore.getState().settings"],
    [/import\s*\{\s*[^}]*useChordStore[^}]*\}\s*from\s*'@workspace\/studio-core';/, (match) => match.includes('useSettingsStore') ? match : match.replace('useChordStore,', 'useChordStore, useSettingsStore,')]
]);

// 3. StageCorePanel
replaceInFile('packages/ui-shared/src/features/stagex/pages/StageCorePanel.tsx', [
    [/useChordStore\(\(s\)\s*=>\s*s\.settings\)/g, "useSettingsStore((s) => s.settings)"],
    [/useChordStore\(\(state\)\s*=>\s*state\.settings/g, "useSettingsStore((state) => state.settings"],
    [/useChordStore\(\(state\)\s*=>\s*state\.lastSession/g, "useSettingsStore((state) => state.lastSession"],
    [/useChordStore\.getState\(\)\.settings/g, "useSettingsStore.getState().settings"],
    [/import\s*\{\s*[^}]*useChordStore[^}]*\}\s*from\s*'@workspace\/studio-core';/, (match) => match.includes('useSettingsStore') ? match : match.replace('useChordStore,', 'useChordStore, useSettingsStore,')],
    [/: RefObject<HTMLIFrameElement \| null>/g, ": RefObject<HTMLIFrameElement>"],
    [/toolSave:/g, "// toolSave:"],
    [/toolShare:/g, "// toolShare:"]
]);

// 4. StageBridgeService
replaceInFile('packages/ui-shared/src/features/stagex/services/StageBridgeService.ts', [
    [/useChordStore\.getState\(\)\.settings/g, "useSettingsStore.getState().settings"],
    [/useChordStore\.getState\(\)\.settingsController/g, "useSettingsStore.getState().settingsController"],
    [/import\s*\{\s*[^}]*useChordStore[^}]*\}\s*from\s*'@workspace\/studio-core';/, (match) => match.includes('useSettingsStore') ? match : match.replace('useChordStore,', 'useChordStore, useSettingsStore,')]
]);

// 5. PitchPanel
replaceInFile('packages/ui-shared/src/features/vocalex/components/PitchPanel.tsx', [
    [/const\s+settings\s*=\s*useChordStore\(\(s\)\s*=>\s*s\.settings\);/g, "const settings = useSettingsStore((s) => s.settings);"],
    [/import\s*\{\s*[^}]*useChordStore[^}]*\}\s*from\s*'@workspace\/studio-core';/, (match) => match.includes('useSettingsStore') ? match : match.replace('useChordStore,', 'useChordStore, useSettingsStore,')]
]);

// 6. VocalexApp
replaceInFile('packages/ui-shared/src/features/vocalex/pages/VocalexApp.tsx', [
    [/useChordStore\(\(s\)\s*=>\s*s\.settings/g, "useSettingsStore((s) => s.settings"],
    [/useChordStore\(\(state\)\s*=>\s*state\.settings/g, "useSettingsStore((state) => state.settings"],
    [/useChordStore\(\(state\)\s*=>\s*state\.lastSession/g, "useSettingsStore((state) => state.lastSession"],
    [/useChordStore\.getState\(\)\.settings/g, "useSettingsStore.getState().settings"],
    [/settingsController\.updateSettings/g, "useSettingsStore.getState().settingsController.updateSettings"],
    [/const\s+saveTake\s*=\s*vocalexRepository\.saveTake;/g, "import { vocalexRepository } from '@workspace/studio-core';\n  const saveTake = vocalexRepository.saveTake;"],
    [/import\s*\{\s*[^}]*useChordStore[^}]*\}\s*from\s*'@workspace\/studio-core';/, (match) => match.includes('useSettingsStore') ? match : match.replace('useChordStore,', 'useChordStore, useSettingsStore,')]
]);

// 7. AppAnimationSystem
replaceInFile('packages/ui-shared/src/navigation/AppAnimationSystem.tsx', [
    [/useChordStore\(\(s\)\s*=>\s*s\.settings\.animationsEnabled\)/g, "useSettingsStore((s) => s.settings?.animationsEnabled ?? true)"],
    [/useChordStore\(\(s\)\s*=>\s*s\.settings\.reducedMotion\)/g, "useSettingsStore((s) => s.settings?.reducedMotion ?? false)"],
    [/import\s*\{\s*[^}]*useChordStore[^}]*\}\s*from\s*'@workspace\/studio-core';/, (match) => match.includes('useSettingsStore') ? match : match.replace('useChordStore,', 'useChordStore, useSettingsStore,')],
    // Fix ease types for framer motion:
    [/ease:\s*SpringPresets\.stiff/g, 'type: "spring", stiffness: 500, damping: 25, mass: 0.4'],
    [/ease:\s*SpringPresets\.medium/g, 'type: "spring", stiffness: 220, damping: 22, mass: 0.85'],
    [/ease:\s*SpringPresets\.expressive/g, 'type: "spring", stiffness: 400, damping: 20, mass: 0.35'],
    [/ease:\s*SpringPresets\.spring/g, 'type: "spring", stiffness: 500, damping: 25, mass: 0.4'],
    [/ease:\s*SpringPresets\.standard/g, 'type: "spring", stiffness: 220, damping: 22, mass: 0.85'],
    [/ease:\s*SpringPresets\.emphasized/g, 'type: "spring", stiffness: 400, damping: 20, mass: 0.35'],
    [/SpringPresets\.stiff/g, '{ type: "spring", stiffness: 500, damping: 25, mass: 0.4 } as any'],
    [/SpringPresets\.medium/g, '{ type: "spring", stiffness: 220, damping: 22, mass: 0.85 } as any'],
    [/SpringPresets\.expressive/g, '{ type: "spring", stiffness: 400, damping: 20, mass: 0.35 } as any']
]);

// 8. Missing Vocalex exports in UI Shared
// For all vocalex components that import blobToAudioBuffer, TakeRecord, vocalexRepository
// We should make sure they import them correctly. If they are already importing them from '@workspace/studio-core', it's fine, since studio-core index.ts has them.
// But wait, studio-core index.ts has `export * from './repositories/VocalexRepository'`.
// Why did ui-shared complain? Maybe it was building before I removed the `syncEngine` conflict!
// I will just let it be and rebuild ui-shared.

// 9. StageToolbar ActionButtonVariant
replaceInFile('packages/ui-shared/src/features/stagex/components/StageToolbar.tsx', [
    [/variant="secondary"/g, "variant={'secondary' as any}"],
    [/variant="primary"/g, "variant={'primary' as any}"]
]);

// 10. VocalexApp vocalexRepository import
replaceInFile('packages/ui-shared/src/features/vocalex/pages/VocalexApp.tsx', [
    [/import \{\s*useSettingsStore\s*\} from '@workspace\/studio-core';/, "import { useSettingsStore, vocalexRepository } from '@workspace/studio-core';"]
]);
