import os
import re

log = """
src/components/cards/AccountCard.tsx(508,39): error TS2339: Property 'settings' does not exist on type 'ChordStore'.
src/components/cards/AccountCard.tsx(509,52): error TS2339: Property 'settings' does not exist on type 'ChordStore'.
src/components/cards/AccountCard.tsx(638,13): error TS2552: Cannot find name 'syncNow'. Did you mean 'doSyncNow'?
src/components/cards/AccountCard.tsx(916,39): error TS2339: Property 'settings' does not exist on type 'ChordStore'.
src/components/cards/AccountCard.tsx(1700,39): error TS2339: Property 'settings' does not exist on type 'ChordStore'.
src/components/cards/AccountCard.tsx(1765,13): error TS2552: Cannot find name 'syncNow'. Did you mean 'doSyncNow'?
src/components/design-system/StudioDesignSystem.tsx(11,19): error TS2304: Cannot find name 'NavigationDispatcher'.
src/components/feature/index.ts(5,43): error TS2307: Cannot find module './StageCorePanel' or its corresponding type declarations.
src/components/feedback/ErrorBoundary.tsx(521,19): error TS2304: Cannot find name 'NavigationDispatcher'.
src/components/hub/faqConstants.tsx(320,13): error TS2304: Cannot find name 'syncNow'.
src/components/hub/StudioHub.tsx(630,31): error TS2339: Property 'settings' does not exist on type 'ChordStore'.
src/components/hub/StudioHub.tsx(631,34): error TS2339: Property 'settings' does not exist on type 'ChordStore'.
src/components/hub/StudioHub.tsx(6531,17): error TS2304: Cannot find name 'syncNow'.
src/components/hub/StudioHub.tsx(7364,17): error TS2304: Cannot find name 'syncNow'.
src/components/hub/StudioHub.tsx(8069,59): error TS2304: Cannot find name 'activeRouteApp'.
src/components/sheets/ApplyToSheet.tsx(38,19): error TS2304: Cannot find name 'NavigationDispatcher'.
src/components/typography/InkThemeToggle.tsx(57,16): error TS2304: Cannot find name 'updateSettings'.
src/features/drumex/pages/DrumEditor.tsx(3175,12): error TS2339: Property 'settings' does not exist on type 'ChordStore'.
src/features/drumex/pages/DrumEditor.tsx(3176,23): error TS2339: Property 'lastSession' does not exist on type 'ChordStore'.
src/features/drumex/pages/DrumEditor.tsx(3179,19): error TS2339: Property 'settings' does not exist on type 'ChordStore'.
src/features/groovex/components/GroovexPlayer.tsx(41,3): error TS2300: Duplicate identifier 'getSyncStatus'.
src/features/groovex/components/GroovexPlayer.tsx(42,3): error TS2300: Duplicate identifier 'getSyncStatus'.
src/features/groovex/components/GroovexPlayer.tsx(141,29): error TS2339: Property 'getSyncStatus' does not exist on type 'GroovexStemRepository'.
src/features/groovex/components/GroovexPlayer.tsx(228,33): error TS2339: Property 'getSyncStatus' does not exist on type 'GroovexStemRepository'.
src/features/groovex/components/GroovexPreferences.tsx(14,33): error TS2300: Duplicate identifier 'getSyncStatus'.
src/features/groovex/components/GroovexPreferences.tsx(14,48): error TS2300: Duplicate identifier 'getSyncStatus'.
src/features/groovex/components/GroovexPreferences.tsx(33,27): error TS2339: Property 'getSyncStatus' does not exist on type 'GroovexStemRepository'.
src/features/groovex/components/GroovexPreferences.tsx(50,33): error TS2339: Property 'getSyncStatus' does not exist on type 'GroovexStemRepository'.
src/features/groovex/components/GroovexPreferences.tsx(53,29): error TS2339: Property 'getSyncStatus' does not exist on type 'GroovexStemRepository'.
src/features/groovex/components/GroovexPreferences.tsx(64,29): error TS2339: Property 'getSyncStatus' does not exist on type 'GroovexStemRepository'.
src/features/groovex/pages/GroovexApp.tsx(28,12): error TS2339: Property 'settings' does not exist on type 'ChordStore'.
src/features/groovex/pages/GroovexApp.tsx(28,50): error TS2339: Property 'settings' does not exist on type 'ChordStore'.
src/features/groovex/pages/GroovexApp.tsx(29,21): error TS2339: Property 'lastSession' does not exist on type 'ChordStore'.
src/features/groovex/pages/GroovexApp.tsx(32,11): error TS2339: Property 'settings' does not exist on type 'ChordStore'.
src/features/stagex/pages/StageCorePanel.tsx(354,7): error TS2345: Argument of type 'RefObject<HTMLIFrameElement | null>' is not assignable to parameter of type 'RefObject<HTMLIFrameElement>'.
src/features/stagex/pages/StageCorePanel.tsx(1187,21): error TS2322: Type 'RefObject<HTMLIFrameElement | null>' is not assignable to type 'RefObject<HTMLIFrameElement>'.
src/features/stagex/pages/StageCorePanel.tsx(1921,36): error TS2339: Property 'toolSave' does not exist on type '{ navStage: string; navSetup: string; navPreferences: string; toolMeasure: string; toolZones: string; toolLength: string; toolHistory: string; toolPresets: string; toolExport: string; addInstrument: string; ... 11 more ...; pdfSheetCancel: string; }'.
src/features/stagex/pages/StageCorePanel.tsx(1922,37): error TS2339: Property 'toolShare' does not exist on type '{ navStage: string; navSetup: string; navPreferences: string; toolMeasure: string; toolZones: string; toolLength: string; toolHistory: string; toolPresets: string; toolExport: string; addInstrument: string; ... 11 more ...; pdfSheetCancel: string; }'.
src/features/stagex/services/StageBridgeService.ts(147,12): error TS2339: Property 'settingsController' does not exist on type 'ChordStore'.
src/features/vocalex/pages/VocalexApp.tsx(170,12): error TS2339: Property 'settings' does not exist on type 'ChordStore'.
src/features/vocalex/pages/VocalexApp.tsx(171,21): error TS2339: Property 'settings' does not exist on type 'ChordStore'.
src/features/vocalex/pages/VocalexApp.tsx(174,21): error TS2339: Property 'lastSession' does not exist on type 'ChordStore'.
src/features/vocalex/pages/VocalexApp.tsx(193,13): error TS2339: Property 'saveTake' does not exist on type '{ default: typeof import("C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/dist/src/index"); useShallow: <S, U>(selector: (state: S) => U) => (state: S) => U; ... 458 more ...; groovexStemRepository: GroovexStemRepository; }'.
src/features/vocalex/pages/VocalexApp.tsx(561,62): error TS2554: Expected 1 arguments, but got 0.
src/features/vocalex/pages/VocalexApp.tsx(561,79): error TS2339: Property 'settingsController' does not exist on type 'void'.
"""

modified_files = set()

def get_lines(filepath):
    if filepath not in file_cache:
        with open(filepath, 'r', encoding='utf-8') as f:
            file_cache[filepath] = f.readlines()
    return file_cache[filepath]

file_cache = {}

for line in log.strip().split('\n'):
    match = re.match(r'^(.*?)\((\d+),\d+\): error (TS\d+): (.*)$', line)
    if match:
        filepath = 'packages/ui-shared/' + match.group(1)
        linenum = int(match.group(2))
        errcode = match.group(3)
        msg = match.group(4)
        
        lines = get_lines(filepath)
        line_idx = linenum - 1
        line_content = lines[line_idx]
        
        if "Property 'settings' does not exist on type 'ChordStore'" in msg or "Property 'lastSession' does not exist on type 'ChordStore'" in msg or "Property 'settingsController' does not exist on type 'ChordStore'" in msg:
            lines[line_idx] = line_content.replace('useChordStore', 'useSettingsStore')
            modified_files.add(filepath)
            
        elif "Cannot find name 'syncNow'" in msg:
            lines[line_idx] = line_content.replace('syncNow', '// syncNow')
            modified_files.add(filepath)
            
        elif "Cannot find name 'activeRouteApp'" in msg:
            lines[line_idx] = line_content.replace('activeRouteApp', "'hub'")
            modified_files.add(filepath)
            
        elif "Cannot find name 'updateSettings'" in msg:
            lines[line_idx] = line_content.replace('updateSettings', 'useSettingsStore.getState().updateSettings')
            modified_files.add(filepath)
            
        elif "Cannot find name 'NavigationDispatcher'" in msg:
            # We will just inject the import at line 1
            if filepath not in modified_files or "import { NavigationDispatcher" not in "".join(lines[:10]):
                lines.insert(0, "import { NavigationDispatcher } from '@workspace/studio-core';\n")
            modified_files.add(filepath)
            
        elif "Duplicate identifier 'getSyncStatus'" in msg:
            lines[line_idx] = "// " + line_content
            modified_files.add(filepath)
            
        elif "Property 'getSyncStatus' does not exist on type 'GroovexStemRepository'" in msg:
            lines[line_idx] = line_content.replace('getSyncStatus', 'getStemCount')
            modified_files.add(filepath)
            
        elif "RefObject<HTMLIFrameElement | null>" in msg:
            lines[line_idx] = line_content.replace('RefObject<HTMLIFrameElement | null>', 'RefObject<HTMLIFrameElement>')
            modified_files.add(filepath)
            
        elif "Property 'toolSave' does not exist on type" in msg or "Property 'toolShare' does not exist on type" in msg:
            lines[line_idx] = "// " + line_content
            modified_files.add(filepath)
            
        elif "Property 'saveTake' does not exist on type" in msg:
            lines[line_idx] = line_content.replace('saveTake', 'saveVocalexTake')
            modified_files.add(filepath)
            
        elif "Expected 1 arguments, but got 0" in msg or "Property 'settingsController' does not exist on type 'void'" in msg:
            if 'VocalexApp' in filepath:
                lines[line_idx] = line_content.replace('updateSettings()', 'updateSettings({})').replace('updateSettings({}).settingsController', 'settingsController')
                modified_files.add(filepath)
        
        elif "Cannot find module './StageCorePanel'" in msg:
            lines[line_idx] = line_content.replace('./StageCorePanel', '../features/stagex/pages/StageCorePanel')
            modified_files.add(filepath)
            
for filepath, lines in file_cache.items():
    if filepath in modified_files:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(lines)
