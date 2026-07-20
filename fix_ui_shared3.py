import os
import re

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return

    original = content

    # 1. Catch `useChordStore(useShallow((state) => state.settings))` and others
    content = re.sub(r'useChordStore\(useShallow\(\s*\(\s*([a-zA-Z]+)\s*\)\s*=>\s*\1\.settings\s*\)\)', r'useSettingsStore(useShallow((\1) => \1.settings))', content)
    content = re.sub(r'useChordStore\(useShallow\(\s*\(\s*([a-zA-Z]+)\s*\)\s*=>\s*\1\.lastSession\s*\)\)', r'useSettingsStore(useShallow((\1) => \1.lastSession))', content)

    # 2. Catch `.getState().settings` if they did `const s = useChordStore.getState(); s.settings`
    # Well, if they did that, `s` is typed as ChordStore which doesn't have settings anymore.
    # It's better to just do `useSettingsStore.getState().settings` where it is used.
    # Let's just catch `s.settings` and `s.lastSession` and `.settings`
    # Actually, a much simpler approach: 
    # Just change `useChordStore` to `useSettingsStore` for any line containing `.settings` or `.lastSession` or `.settingsController`? No, that might break actual chord store stuff.
    
    # Let's fix `const s = useChordStore.getState();` followed by `s.settings`
    # Replace `useChordStore.getState()` with `useSettingsStore.getState()` IF the file uses settings? 
    # Let's replace `const s = useChordStore.getState();` -> `const s = useChordStore.getState(); const sSettings = useSettingsStore.getState();`
    # And then change `s.settings` to `sSettings.settings`? Too complex.

    # Let's just find the exact errors in the log and fix them manually if needed.
    # Or, the regex:
    content = re.sub(r'useChordStore\(\(\s*([a-zA-Z]+)\s*\)\s*=>\s*\1\.settings\)', r'useSettingsStore((\1) => \1.settings)', content)
    content = re.sub(r'useChordStore\(\s*([a-zA-Z]+)\s*=>\s*\1\.settings\)', r'useSettingsStore((\1) => \1.settings)', content)

    content = re.sub(r'useChordStore\(\(\s*([a-zA-Z]+)\s*\)\s*=>\s*\1\.lastSession\)', r'useSettingsStore((\1) => \1.lastSession)', content)
    content = re.sub(r'useChordStore\(\s*([a-zA-Z]+)\s*=>\s*\1\.lastSession\)', r'useSettingsStore((\1) => \1.lastSession)', content)
    
    # 3. SettingsPanel.tsx `updateSettings` missing on `SettingsStore`? No, the error is:
    # `Property 'updateSettings' does not exist on type '(settings: Partial<AppSettings>) => void'`
    # This means `updateSettings` IS ALREADY A FUNCTION, but it is being called as `updateSettings.updateSettings(...)`!
    content = content.replace('updateSettings.updateSettings(', 'updateSettings(')

    # 4. In VocalexApp: `Property 'useSettingsStore' does not exist on type 'SettingsStore'`
    # Meaning `useSettingsStore.getState().useSettingsStore` is still there!
    content = content.replace('useSettingsStore.getState().useSettingsStore', 'useSettingsStore.getState()')
    content = content.replace('useSettingsStore.getState().getState', 'useSettingsStore.getState()')

    # 5. StudioHub missing `currentApp`, `syncNow`
    if 'StudioHub.tsx' in filepath:
        # these were likely in useChordStore before?
        # currentApp was in useChordStore, yes. `const currentApp = useChordStore(s => s.currentApp)`
        # syncNow was `const syncNow = useChordStore(s => s.syncNow)` ?
        pass

    # Add missing import if needed
    if content != original and 'useSettingsStore' not in original:
        content = re.sub(r"import\s*\{([^}]*)\}\s*from\s*'@workspace/studio-core';", r"import {\1, useSettingsStore} from '@workspace/studio-core';", content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

for root, dirs, files in os.walk('packages/ui-shared/src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            fix_file(os.path.join(root, file))
