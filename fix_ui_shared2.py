import os
import re

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return

    original = content
    
    # Fix 1: settingsController is just the store itself now, or just use the store's methods
    # Change: `useSettingsStore.getState().settingsController` -> `useSettingsStore.getState()`
    content = content.replace('useSettingsStore.getState().settingsController', 'useSettingsStore.getState()')
    
    # Fix 2: `useSettingsStore.getState().updateSettings.updateSettings` -> `useSettingsStore.getState().updateSettings`
    content = content.replace('.updateSettings.updateSettings', '.updateSettings')
    content = content.replace('.updateSettings.updatePerApp', '.updatePerApp')
    content = content.replace('.updateSettings.setLastSession', '.setLastSession')

    # Fix 3: settings does not exist on ChordStore. Oh wait, my script from before used `.settings` but maybe I missed `useChordStore((state) => state.settings)`
    # Sometimes they do `const { settings } = useChordStore();`? No, the errors are:
    # `Property 'settings' does not exist on type 'ChordStore'`
    # Meaning `useChordStore(s => s)` and then `s.settings` somewhere!
    # Let's catch `state.settings` where `state` comes from `useChordStore`.
    # Actually, the error is `useChordStore((s) => s.settings)`. Wait, why didn't my regex catch it?
    # Because there might be NO PARENTHESES around `s`!
    content = re.sub(r'useChordStore\(\s*([a-zA-Z]+)\s*=>\s*\1\.settings\s*\)', r'useSettingsStore((\1) => \1.settings)', content)
    content = re.sub(r'useChordStore\(\s*([a-zA-Z]+)\s*=>\s*\1\.lastSession\s*\)', r'useSettingsStore((\1) => \1.lastSession)', content)

    # Fix 4: VocalexApp syntax and missing methods
    if 'VocalexApp.tsx' in filepath:
        content = content.replace('useSettingsStore.getState().useSettingsStore', 'useSettingsStore.getState()')
        content = content.replace('useSettingsStore.getState().vocalexRepository', 'vocalexRepository')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

for root, dirs, files in os.walk('packages/ui-shared/src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            fix_file(os.path.join(root, file))
